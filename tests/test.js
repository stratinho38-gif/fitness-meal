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
  ';return {LIMITS, clampQty, cleanText, unitStep, formatQty, buildAiPrompt, themeTokens, nextScheme, resolveDark, CATEGORIES, DIET, PALETTE, CAT_ICON, dietDefaults, dietItems, mealIngItems, itemPayload, itemSnapshot, GYM_DAYS, GYM_SHEET_ID, gymParseGviz, gymHeaderParts, gymLastKg, gymFormatKg, gymDayModel};');
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
t('DIET κατηγορίες έγκυρες', m.DIET.every(d => m.CAT_ICON[d[3]] !== undefined));
t('DIET ποσότητες έγκυρες', m.DIET.every(d => Number.isFinite(d[1]) && d[1] > 0));
t('DIET ονόματα εντός ορίου', m.DIET.every(d => d[0].length <= m.LIMITS.name));
t('PALETTE 8 χρώματα', Object.keys(m.PALETTE).length === 8);

// Παραμετροποιήσιμο στάνταρ (v7.1): dietDefaults + dietItems
t('dietDefaults ίδιο μήκος με DIET', m.dietDefaults().length === m.DIET.length);
t('dietDefaults πλήρη πεδία', m.dietDefaults().every(i =>
  typeof i.name === 'string' && i.name && Number.isFinite(i.qty) && i.unit && i.cat && Number.isFinite(i.ts)));
t('dietDefaults κρατά note μόνο όταν υπάρχει', m.dietDefaults().every(i => !('note' in i) || i.note));
t('dietItems(null) → defaults', m.dietItems(null).length === m.DIET.length);
t('dietItems({}) → defaults', m.dietItems({}).length === m.DIET.length);
t('dietItems(undefined) → defaults', m.dietItems(undefined).length === m.DIET.length);
const customTpl = {
  b: { name: 'Ρύζι', qty: 2, unit: 'κιλά', cat: 'Ψωμί & Δημητριακά', ts: 5 },
  a: { name: 'Γάλα', qty: 1, unit: 'λίτρα', cat: 'Αυγά & Γαλακτοκομικά', ts: 1 },
  bad: { qty: 3 },
};
const customArr = m.dietItems(customTpl);
t('dietItems(custom) → μόνο έγκυρα entries', customArr.length === 2);
t('dietItems(custom) → ταξινόμηση κατά ts', customArr[0].name === 'Γάλα' && customArr[1].name === 'Ρύζι');
t('dietItems(custom) → κρατά τα ids', customArr[0].id === 'a' && customArr[1].id === 'b');
t('dietItems(μόνο άκυρα) → defaults', m.dietItems({ x: { qty: 1 } }).length === m.DIET.length);

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

// Υλικά γεύματος → λίστα (v8.2): mealIngItems
const ingRes = m.mealIngItems(['400γρ στήθος κοτόπουλο', '1 φλ ρύζι'], [], 'Κοτόπουλο σχάρας');
t('mealIngItems: όλα τα υλικά', ingRes.length === 2);
t('mealIngItems: πλήρη πεδία item', ingRes.every(i =>
  i.name && i.qty === 1 && i.unit === 'τεμ' && i.cat === 'Άλλα' && i.done === false));
t('mealIngItems: note με όνομα γεύματος', ingRes.every(i => i.note === 'Για: Κοτόπουλο σχάρας'));
t('mealIngItems: χωρίς mealName → χωρίς note', m.mealIngItems(['α'], []).every(i => !('note' in i)));
t('mealIngItems: dedupe με υπάρχοντα (case-insensitive)',
  m.mealIngItems(['1 φλ ρύζι', 'Σαλάτα'], ['1 ΦΛ ΡΥΖΙ']).length === 1);
t('mealIngItems: dedupe μέσα στη συνταγή',
  m.mealIngItems(['Σαλάτα', 'σαλάτα'], []).length === 1);
t('mealIngItems: όνομα εντός ορίου 80', m.mealIngItems(['Α'.repeat(200)], [])[0].name.length === m.LIMITS.name);
t('mealIngItems: κενά/null υλικά αγνοούνται', m.mealIngItems(['', '  ', null, 'Ρύζι'], []).length === 1);
t('mealIngItems: null inputs → []', m.mealIngItems(null, null).length === 0);
t('mealIngItems: χωρίς ts (το βάζει ο caller)', ingRes.every(i => !('ts' in i)));

// Επεξεργασία προϊόντος & undo (v8.3): itemPayload / itemSnapshot
const pl = m.itemPayload('  Γάλα  ', '2.345', 'λίτρα', 'Αυγά & Γαλακτοκομικά', ' Για καφέ ');
t('itemPayload: καθαρισμένα πεδία', pl.name === 'Γάλα' && pl.qty === 2.35 && pl.unit === 'λίτρα' && pl.cat === 'Αυγά & Γαλακτοκομικά');
t('itemPayload: note καθαρισμένο', pl.note === 'Για καφέ');
t('itemPayload: χωρίς note όταν κενό', !('note' in m.itemPayload('Ψωμί', 1, 'τεμ', 'Άλλα', '   ')));
t('itemPayload: κενό όνομα → null', m.itemPayload('   ', 1, 'τεμ', 'Άλλα') === null);
t('itemPayload: όνομα εντός ορίου 80', m.itemPayload('Α'.repeat(200), 1, 'τεμ', 'Άλλα').name.length === m.LIMITS.name);
t('itemPayload: note εντός ορίου 120', m.itemPayload('Ψωμί', 1, 'τεμ', 'Άλλα', 'Β'.repeat(300)).note.length === m.LIMITS.note);
t('itemPayload: default unit/cat', m.itemPayload('Ψωμί', 1, '', '').unit === 'τεμ' && m.itemPayload('Ψωμί', 1, '', '').cat === 'Άλλα');
t('itemPayload: qty clamp', m.itemPayload('Ψωμί', -3, 'τεμ', 'Άλλα').qty === 0.1);
const snapSrc = { id: 'x1', name: 'Ρύζι', qty: 2, unit: 'κιλά', cat: 'Ψωμί & Δημητριακά', note: 'Basmati', done: 1, ts: 42 };
const snap = m.itemSnapshot(snapSrc);
t('itemSnapshot: κρατά τα πεδία', snap.name === 'Ρύζι' && snap.qty === 2 && snap.unit === 'κιλά' && snap.cat === 'Ψωμί & Δημητριακά' && snap.note === 'Basmati' && snap.ts === 42);
t('itemSnapshot: done → boolean', snap.done === true);
t('itemSnapshot: χωρίς id', !('id' in snap));
t('itemSnapshot: χωρίς note όταν λείπει', !('note' in m.itemSnapshot({ name: 'Ψωμί' })));
t('itemSnapshot: defaults σε ελλιπές item', (() => { const s = m.itemSnapshot({}); return s.qty === 1 && s.unit === 'τεμ' && s.cat === 'Άλλα' && s.done === false && s.ts === 0; })());

// Επιλογή υλικών γεύματος (v8.4) — δομικοί έλεγχοι στο script
t('v8.4: checkbox ανά υλικό στο modal', /class="ing-chk" data-i=/.test(script));
t('v8.4: προστίθενται μόνο τα τσεκαρισμένα', /mealIngItems\(picked/.test(script) && !/mealIngItems\(r\.ing/.test(script));
t('v8.4: toast όταν κανένα τσεκαρισμένο', script.includes('Διάλεξε τουλάχιστον ένα υλικό'));

// Ρύθμιση θέματος (v7.2): nextScheme / resolveDark / CAT_ICON
t('nextScheme auto→light', m.nextScheme('auto') === 'light');
t('nextScheme light→dark', m.nextScheme('light') === 'dark');
t('nextScheme dark→auto', m.nextScheme('dark') === 'auto');
t('nextScheme άγνωστο→auto', m.nextScheme('whatever') === 'auto');
t('resolveDark ρητό dark', m.resolveDark('dark', false) === true);
t('resolveDark ρητό light αγνοεί σύστημα', m.resolveDark('light', true) === false);
t('resolveDark auto + σύστημα dark', m.resolveDark('auto', true) === true);
t('resolveDark auto + σύστημα light', m.resolveDark('auto', false) === false);
t('CATEGORIES: έγκυρα Material Symbols ligatures', m.CATEGORIES.every(c => /^[a-z0-9_]+$/.test(c[0])));

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
t('MEALS = 150 συνταγές', keys.length === 150);
// v8: 15 συνταγές σε κάθε κατηγορία
t('15 συνταγές ανά κατηγορία', Object.values(g.mealsByCat).every(a => a.length === 15) && Object.keys(g.mealsByCat).length === 10);
t('MEALS πλήρη πεδία', keys.every(k => {
  const r = g.MEALS[k];
  return typeof r.n === 'string' && r.n && typeof r.cat === 'string' &&
    Number.isFinite(r.kcal) && Number.isFinite(r.p) && Number.isFinite(r.c) && Number.isFinite(r.f) &&
    Array.isArray(r.ing) && r.ing.length > 0 &&
    Array.isArray(r.steps) && r.steps.length >= 3 && r.steps.every(s => typeof s === 'string' && s.length > 10);
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

// Γυμναστήριο (v7.3): parsing gviz JSON από Google Sheet
const gvizSample = '/*O_o*/\ngoogle.visualization.Query.setResponse(' + JSON.stringify({
  version: '0.6', status: 'ok',
  table: {
    cols: [
      { label: 'Ημέρα Α — ΣΤΗΘΟΣ + ΠΛΑΤΗ ΣΕ ΕΛΛΕΙΜΜΑ: κράτα τα ίδια κιλά. Άσκηση' },
      { label: 'Σετ' }, { label: 'Επαναλήψεις' }, { label: 'RIR' }, { label: 'Ξεκούραση' }, { label: 'Εκτέλεση' },
      { label: 'Εβδ 1 — Κιλά' }, { label: 'Εβδ 1 — Επαν.' }, { label: 'Εβδ 2 — Κιλά' }, { label: 'Εβδ 2 — Επαν.' }
    ],
    rows: [
      { c: [{ v: 'Πιέσεις πάγκου' }, { v: 4 }, { v: '6-8' }, { v: '2 → 1' }, { v: '150 δευτ.' }, { v: 'Το βασικό lift' }, { v: 80 }, null, { v: '82,5' }, { v: '8' }] },
      { c: [{ v: 'Κωπηλατική' }, { v: 4 }, { v: '8-10' }, { v: '2' }, { v: '150 δευτ.' }, { v: '' }, null, null, null, null] },
      { c: [{ v: 'ΣΥΝΟΛΟ ΣΕΤ ΠΡΟΠΟΝΗΣΗΣ' }, { v: 23 }, null, null, null, null, null, null, null, null] },
      { c: [{ v: 'Σημείωση footer χωρίς σετ' }, null, null, null, null, null, null, null, null, null] },
      { c: [null, { v: 5 }] }
    ]
  }
}) + ');';
const gymTable = m.gymParseGviz(gvizSample);
t('gymParseGviz: έγκυρο δείγμα', gymTable !== null && Array.isArray(gymTable.rows));
t('gymParseGviz: σκουπίδια → null', m.gymParseGviz('<html>login</html>') === null);
t('gymParseGviz: κενό → null', m.gymParseGviz('') === null);
t('gymParseGviz: status error → null', m.gymParseGviz('setResponse({"status":"error"});') === null);
const gymModel = m.gymDayModel(gymTable);
t('gymDayModel: 2 ασκήσεις (φιλτράρει ΣΥΝΟΛΟ/σημειώσεις)', gymModel.exercises.length === 2);
t('gymDayModel: σύνολο σετ', gymModel.total === 23);
t('gymDayModel: τίτλος ημέρας', gymModel.title === 'Ημέρα Α — ΣΤΗΘΟΣ + ΠΛΑΤΗ');
t('gymDayModel: σημείωση ημέρας', gymModel.note.startsWith('ΣΕ ΕΛΛΕΙΜΜΑ'));
t('gymDayModel: πεδία άσκησης', gymModel.exercises[0].sets === 4 && gymModel.exercises[0].reps === '6-8' && gymModel.exercises[0].rir === '2 → 1');
t('gymLastKg: τελευταία εβδομάδα με τιμή', gymModel.exercises[0].last.kg === 82.5 && gymModel.exercises[0].last.week === 2);
t('gymLastKg: χωρίς καταχώρηση → null', gymModel.exercises[1].last === null);
t('gymDayModel: null → null', m.gymDayModel(null) === null);
t('gymDayModel: χωρίς ασκήσεις → null', m.gymDayModel({ cols: [], rows: [] }) === null);
t('gymHeaderParts: χωρίς σημείωση', m.gymHeaderParts('Ημέρα Β — ΠΟΔΙΑ Άσκηση').title === 'Ημέρα Β — ΠΟΔΙΑ');
t('gymFormatKg: δεκαδικά με κόμμα', m.gymFormatKg(82.5) === '82,5');
t('gymFormatKg: ακέραιο', m.gymFormatKg(80) === '80');
t('GYM_DAYS: 5 ημέρες', m.GYM_DAYS.length === 5);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
