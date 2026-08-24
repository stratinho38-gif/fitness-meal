// Tests pure λογικής της εφαρμογής (v5 Firebase). Τρέξιμο: node tests/test.js
'use strict';
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Παίρνουμε το τελευταίο (inline) script block
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const script = blocks[blocks.length - 1][1];

// Κρατάμε μόνο το κομμάτι pure λογικής (πριν το Room/Firebase runtime)
const cut = script.indexOf('/* ---------- Room');
const logic = script
  .slice(0, cut)
  .replace(/'use strict';/, '')
  .replace(/firebase\.initializeApp[\s\S]*?const db = firebase\.database\(\);/, '');

const factory = new Function(logic +
  ';return {LIMITS, clampQty, cleanText, unitStep, formatQty, CATEGORIES, DIET, PALETTE, CAT_EMOJI};');
const m = factory();

let pass = 0, fail = 0;
function t(name, cond) { if (cond) pass++; else { fail++; console.log('FAIL: ' + name); } }

// clampQty
t('clampQty κανονικό', m.clampQty(2.345) === 2.35);
t('clampQty min', m.clampQty(0) === 0.1);
t('clampQty αρνητικό', m.clampQty(-5) === 0.1);
t('clampQty max', m.clampQty(1e9) === 9999);
t('clampQty NaN→1', m.clampQty('abc') === 1);
t('clampQty string αριθμός', m.clampQty('3.5') === 3.5);

// cleanText
t('cleanText trim', m.cleanText('  Γάλα  ', 80) === 'Γάλα');
t('cleanText όριο', m.cleanText('A'.repeat(500), 80).length === 80);
t('cleanText null', m.cleanText(null, 80) === '');
t('cleanText undefined', m.cleanText(undefined, 80) === '');

// unitStep
t('unitStep κιλά', m.unitStep('κιλά') === 0.5);
t('unitStep λίτρα', m.unitStep('λίτρα') === 0.5);
t('unitStep γρ', m.unitStep('γρ') === 100);
t('unitStep τεμ', m.unitStep('τεμ') === 1);
t('unitStep άγνωστο', m.unitStep('κάτι') === 1);

// formatQty
t('formatQty τεμ×1 κρύβεται', m.formatQty(1, 'τεμ') === '');
t('formatQty τεμ×3', m.formatQty(3, 'τεμ') === '×3');
t('formatQty κιλά κόμμα', m.formatQty(1.5, 'κιλά') === '1,5 κιλά');
t('formatQty γρ', m.formatQty(400, 'γρ') === '400 γρ');

// Δομή δεδομένων
t('11 κατηγορίες', m.CATEGORIES.length === 11);
t('DIET μη κενό', m.DIET.length >= 50);
t('DIET κατηγορίες έγκυρες', m.DIET.every(d => m.CAT_EMOJI[d[3]] !== undefined));
t('DIET ποσότητες έγκυρες', m.DIET.every(d => Number.isFinite(d[1]) && d[1] > 0));
t('DIET ονόματα εντός ορίου', m.DIET.every(d => d[0].length <= m.LIMITS.name));
t('PALETTE 8 χρώματα', Object.keys(m.PALETTE).length === 8);

// Robustness κώδικα: κάθε db write έχει catch
const writes = [...script.matchAll(/db\.ref\([^)]*\)[\s\S]{0,200}?\.(set|update|remove)\(/g)].length;
const catches = (script.match(/\.catch\(dbErr\)/g) || []).length;
t('όλα τα db writes με .catch(dbErr) (' + catches + '/' + writes + ')', catches >= writes && writes > 0);

// Δεν υπάρχει γυμνό localStorage εκτός wrappers
const rawLs = (script.match(/localStorage\./g) || []).length;
t('localStorage μόνο σε lsGet/lsSet (2 χρήσεις)', rawLs === 2);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
