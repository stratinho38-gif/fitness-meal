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
  ';return {LIMITS, clampQty, cleanText, unitStep, formatQty, buildAiPrompt, themeTokens, CATEGORIES, DIET, PALETTE, CAT_EMOJI};');
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

// buildAiPrompt (AI συνταγές v6.2)
const rec = { n: 'Φακές με κατίκι', ing: ['1,5 φλ φακές', '60γρ κατίκι'], kcal: 520, p: 30 };
const prompt = m.buildAiPrompt(rec);
t('buildAiPrompt περιέχει όνομα', prompt.includes('Φακές με κατίκι'));
t('buildAiPrompt περιέχει υλικά', prompt.includes('1,5 φλ φακές'));
t('buildAiPrompt για 2 άτομα', prompt.includes('2 άτομα'));
t('buildAiPrompt περιέχει kcal', prompt.includes('520'));
t('buildAiPrompt εντός ορίου function (1200)', prompt.length > 50 && prompt.length <= 1200);
t('buildAiPrompt χωρίς kcal', m.buildAiPrompt({ n: 'Τεστ', ing: ['α'] }).includes('Τεστ'));
t('buildAiPrompt null → κενό', m.buildAiPrompt(null) === '');
t('buildAiPrompt χωρίς όνομα → κενό', m.buildAiPrompt({}) === '');

// themeTokens (Material 3 light/dark, v7)
const TOKEN_KEYS = ['primary', 'onPrimary', 'light', 'container', 'on'];
t('themeTokens light green', m.themeTokens('green', false).primary === '#15803d');
t('themeTokens light onPrimary λευκό', m.themeTokens('green', false).onPrimary === '#ffffff');
t('themeTokens dark green', m.themeTokens('green', true).primary === '#4ade80');
t('themeTokens άγνωστο χρώμα → green', m.themeTokens('nope', true).primary === '#4ade80');
t('themeTokens undefined → green light', m.themeTokens(undefined, false).primary === '#15803d');
t('PALETTE: όλα με πλήρες dark variant', Object.values(m.PALETTE).every(c =>
  c.dark && TOKEN_KEYS.every(k => typeof c.dark[k] === 'string' && /^#[0-9a-f]{6}$/i.test(c.dark[k]))));
t('themeTokens: πλήρη πεδία και στα δύο σχήματα', Object.keys(m.PALETTE).every(key =>
  TOKEN_KEYS.every(k => m.themeTokens(key, false)[k] && m.themeTokens(key, true)[k])));

// Η απάντηση του AI (untrusted) πρέπει να μπαίνει στο DOM μόνο με textContent
t('AI answer μόνο με textContent', /box\.textContent =/.test(script) && !/aiBox[^\n]*innerHTML/.test(script));

// Robustness κώδικα: κάθε db write έχει catch
const writes = [...script.matchAll(/db\.ref\([^)]*\)[\s\S]{0,200}?\.(set|update|remove)\(/g)].length;
const catches = (script.match(/\.catch\(dbErr\)/g) || []).length;
t('όλα τα db writes με .catch(dbErr) (' + catches + '/' + writes + ')', catches >= writes && writes > 0);

// Δεν υπάρχει γυμνό localStorage εκτός wrappers
const rawLs = (script.match(/localStorage\.(getItem|setItem|removeItem)/g) || []).length;
t('localStorage μόνο σε lsGet/lsSet (2 χρήσεις)', rawLs === 2);

// ---- Καρτέλα Γευμάτων: pure λογική (MEALS, MEAL_TEMPLATE, gFreshPicks) ----
const gStart = script.indexOf('const MEALS =');
const gEnd = script.indexOf('function gSwap');
t('υπάρχει το meals section', gStart > -1 && gEnd > gStart);
const gFactory = new Function('lsGet', 'lsSet', script.slice(gStart, gEnd) +
  ';return {MEALS, MEAL_TEMPLATE, mealsByCat, gFreshPicks};');
const g = gFactory(() => null, () => {});

const keys = Object.keys(g.MEALS);
t('MEALS ≥ 30 συνταγές', keys.length >= 30);
t('MEALS πλήρη πεδία', keys.every(k => {
  const r = g.MEALS[k];
  return typeof r.n === 'string' && r.n && typeof r.cat === 'string' &&
    Number.isFinite(r.kcal) && Number.isFinite(r.p) && Number.isFinite(r.c) && Number.isFinite(r.f) &&
    Array.isArray(r.ing) && r.ing.length > 0 && typeof r.steps === 'string' && r.steps;
}));
t('MEAL_TEMPLATE 7 μέρες', g.MEAL_TEMPLATE.length === 7);
t('template κατηγορίες υπαρκτές', g.MEAL_TEMPLATE.every(d =>
  (g.mealsByCat[d.lunch] || []).length > 0 && (g.mealsByCat[d.dinner] || []).length > 0));
const picks = g.gFreshPicks();
t('gFreshPicks: 14 έγκυρα picks', picks.length === 14 && picks.every(p => g.MEALS[p]));
t('gFreshPicks: σωστές κατηγορίες', picks.every((p, i) => {
  const slot = i % 2 === 0 ? 'lunch' : 'dinner';
  return g.MEALS[p].cat === g.MEAL_TEMPLATE[Math.floor(i / 2)][slot];
}));
// Τα 2 λαδερά / 3 ρεπό της εβδομάδας δεν πρέπει να είναι ίδια μεταξύ τους
for (let run = 0; run < 20; run++) {
  const pk = g.gFreshPicks();
  const laderos = pk.filter(p => g.MEALS[p].cat === 'ladero');
  if (new Set(laderos).size !== laderos.length) { t('λαδερά χωρίς επανάληψη', false); break; }
  if (run === 19) t('λαδερά χωρίς επανάληψη (20 δοκιμές)', true);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
