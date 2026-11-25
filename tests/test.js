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
  ';return {LIMITS, clampQty, cleanText, unitStep, formatQty, buildAiPrompt, themeTokens, nextScheme, resolveDark, CATEGORIES, DIET, PALETTE, CAT_ICON, dietDefaults, dietItems, ING_DICT, ingNorm, ingSplit, ingStripParens, ingMatch, ingParseQty, ingLineMinor, mergeQty, ingPlan, ingPlanPairs, weekPlan, itemPayload, itemSnapshot, validRoomCode, GYM_DAYS, GYM_SHEET_ID, gymParseGviz, gymHeaderParts, gymLastKg, gymFormatKg, gymDayModel, GYM_WEEKS, GYM_WRITE_TOKEN, gymCellText, gymWeeks, gymLogPayload, gymHistory, gymEntryText, gymRestLabel, gymActiveWeek, gymDaySummary, GYM_GUIDE, gymGuideFor, gymNoteParts, gymRestSeconds, gymClock, gymTimerNext};');
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

// Έξυπνη προσθήκη υλικών (v8.7): parsing / λεξικό / aggregate
t('ING_DICT: έγκυρη δομή', m.ING_DICT.length > 60 && m.ING_DICT.every(e =>
  Array.isArray(e.k) && e.k.length && typeof e.n === 'string' && e.n && m.CAT_ICON[e.c] !== undefined));
t('ING_DICT: ονόματα εντός ορίου', m.ING_DICT.every(e => e.n.length <= m.LIMITS.name));

// ingSplit: κόμμα/+ εκτός παρενθέσεων, δεκαδικό κόμμα δεν κόβει
t('ingSplit: κόμμα και +', m.ingSplit('1 αυγό + χυμός 1 λεμονιού, ρίγανη').length === 3);
t('ingSplit: δεκαδικό κόμμα δεν κόβει', m.ingSplit('1,5 κ.σ. ελαιόλαδο, λεμόνι').join('|') === '1,5 κ.σ. ελαιόλαδο|λεμόνι');
t('ingSplit: κόμμα μέσα σε παρένθεση δεν κόβει', m.ingSplit('ντομάτες (ή 400γρ, κονσέρβα)').length === 1);
t('ingSplit: null → []', m.ingSplit(null).length === 0);

// ingParseQty
t('ingParseQty: 400γρ', JSON.stringify(m.ingParseQty('400γρ στήθος κοτόπουλο')) === '{"qty":400,"unit":"γρ"}');
t('ingParseQty: 1,5 κιλό', JSON.stringify(m.ingParseQty('1,5 κιλό μοσχάρι')) === '{"qty":1.5,"unit":"κιλά"}');
t('ingParseQty: 2 πατάτες → τεμ', JSON.stringify(m.ingParseQty('2 μέτριες πατάτες')) === '{"qty":2,"unit":"τεμ"}');
t('ingParseQty: 1/2 → 0.5 τεμ', m.ingParseQty('1/2 κουνουπίδι τριμμένο').qty === 0.5);
t('ingParseQty: κονσέρβες', JSON.stringify(m.ingParseQty('1,5 κονσέρβα τόνος')) === '{"qty":1.5,"unit":"κονσέρβες"}');
t('ingParseQty: εύρος 5-6 → 5', m.ingParseQty('5-6 ελιές').qty === 5);
t('ingParseQty: φλ → null', m.ingParseQty('1 φλ ρύζι (άβραστο)') === null);
t('ingParseQty: κ.σ. → null', m.ingParseQty('2 κ.σ. γιαούρτι') === null);
t('ingParseQty: φέτες → null', m.ingParseQty('2 φέτες ψωμί ολικής') === null);
t('ingParseQty: σκέτο όνομα → 1 τεμ', JSON.stringify(m.ingParseQty('Κρεμμύδι')) === '{"qty":1,"unit":"τεμ"}');
t('ingParseQty: αγνοεί παρενθέσεις', m.ingParseQty('2 μπριζόλες λαιμού (400γρ)').unit === 'τεμ');

// ingMatch: λεξικό — ειδικά πριν από γενικά
t('ingMatch: στήθος κοτόπουλο → Κοτόπουλο', m.ingMatch('400γρ στήθος κοτόπουλο').n === 'Κοτόπουλο (στήθος/φιλέτο)');
t('ingMatch: κιμάς κοτόπουλο ≠ Κοτόπουλο', m.ingMatch('400γρ κιμάς κοτόπουλο (στήθος)').n === 'Κιμάς κοτόπουλο');
t('ingMatch: πιπεριά ≠ πιπέρι', m.ingMatch('1 πιπεριά').n === 'Πιπεριές' && m.ingMatch('Πιπέρι').n === 'Πιπέρι');
t('ingMatch: μελιτζάνες ≠ μέλι', m.ingMatch('3 μελιτζάνες').n === 'Μελιτζάνες' && m.ingMatch('1 κ.γλ. μέλι').n === 'Μέλι');
t('ingMatch: φέτα ≠ 2 φέτες ψωμί', m.ingMatch('80γρ φέτα').n === 'Φέτα' && m.ingMatch('2 φέτες ψωμί ολικής').n === 'Ψωμί ολικής');
t('ingMatch: φέτα τυρί → Τυρί light', m.ingMatch('1 φέτα τυρί light').n === 'Τυρί light');
t('ingMatch: γλυκοπατάτα ≠ πατάτα', m.ingMatch('2 γλυκοπατάτες').n === 'Γλυκοπατάτες' && m.ingMatch('2 πατάτες').n === 'Πατάτες');
t('ingMatch: χυμός λεμονιού → Λεμόνια (minor)', m.ingMatch('Χυμός 1 λεμονιού').n === 'Λεμόνια' && m.ingMatch('Χυμός 1 λεμονιού').m === true);
t('ingMatch: παρένθεση δεν επηρεάζει', m.ingMatch('1 αυγό + χυμός λεμονιού (αυγολέμονο)'.split('+')[1]).n === 'Λεμόνια');
t('ingMatch: άγνωστο → null', m.ingMatch('κάτι εντελώς άγνωστο') === null);
t('ingMatch: κάλυψη — όλα τα μέρη των 165 συνταγών', (() => {
  const gS = script.indexOf('const MEALS ='), gE = script.indexOf('function gSwap');
  const g = new Function('lsGet', 'lsSet', script.slice(gS, gE) + ';return {MEALS};')(() => null, () => {});
  return Object.values(g.MEALS).every(r => r.ing.every(line => m.ingSplit(line).every(p => m.ingMatch(p) !== null)));
})());

// ingLineMinor: μικρο-υλικά ξετσεκαρισμένα
t('ingLineMinor: καρυκεύματα → true', m.ingLineMinor('Λεμόνι, ρίγανη') && m.ingLineMinor('1 κ.σ. ελαιόλαδο') && m.ingLineMinor('Αλάτι, πιπέρι'));
t('ingLineMinor: κανονικά υλικά → false', !m.ingLineMinor('400γρ στήθος κοτόπουλο') && !m.ingLineMinor('Κρεμμύδι, σκόρδο') && !m.ingLineMinor('Σαλάτα εποχής'));

// mergeQty
t('mergeQty: γρ + κιλά αθροίζονται', JSON.stringify(m.mergeQty(2, 'κιλά', 400, 'γρ')) === '{"qty":2.4,"unit":"κιλά"}');
t('mergeQty: κιλά σε γρ', JSON.stringify(m.mergeQty(500, 'γρ', 1, 'κιλά')) === '{"qty":1500,"unit":"γρ"}');
t('mergeQty: ίδια μονάδα', m.mergeQty(2, 'τεμ', 3, 'τεμ').qty === 5 && m.mergeQty(4, 'κονσέρβες', 1.5, 'κονσέρβες').qty === 5.5);
t('mergeQty: άγνωστη ποσότητα → +1', m.mergeQty(2, 'κιλά', null, null).qty === 3);
t('mergeQty: ασύμβατες μονάδες → +1', m.mergeQty(2, 'κιλά', 3, 'τεμ').qty === 3);

// ingPlan: το βασικό σενάριο aggregate
const exChicken = [{ id: 'a', name: 'Κοτόπουλο (στήθος/μπούτι φιλέτο)', qty: 2, unit: 'κιλά', cat: 'Κρέας & Ψάρι', done: true, ts: 1 }];
const plan1 = m.ingPlan(['400γρ στήθος κοτόπουλο'], exChicken, 'Κοτόπουλο σχάρας');
t('ingPlan: 400γρ + 2 κιλά = 2,4 κιλά στο υπάρχον', plan1.adds.length === 0 && plan1.updates.length === 1 &&
  plan1.updates[0].id === 'a' && plan1.updates[0].qty === 2.4);
t('ingPlan: το done ξετσεκάρεται', plan1.updates[0].done === false);
t('ingPlan: note «Για: <γεύμα>» στο υπάρχον', plan1.updates[0].note === 'Για: Κοτόπουλο σχάρας');
t('ingPlan: δεν ξαναγράφει note με ίδιο γεύμα', !('note' in m.ingPlan(['400γρ στήθος'],
  [{ id: 'a', name: 'Κοτόπουλο', qty: 2, unit: 'κιλά', cat: 'Κρέας & Ψάρι', note: 'Για: Κοτόπουλο σχάρας', ts: 1 }], 'Κοτόπουλο σχάρας').updates[0]));
const plan2 = m.ingPlan(['400γρ κιμάς μοσχαρίσιος άπαχος'], [], 'Μπιφτέκια');
t('ingPlan: νέο item με parsing (όνομα/ποσότητα/κατηγορία)', plan2.adds.length === 1 &&
  plan2.adds[0].name === 'Κιμάς μοσχαρίσιος άπαχος' && plan2.adds[0].qty === 400 &&
  plan2.adds[0].unit === 'γρ' && plan2.adds[0].cat === 'Κρέας & Ψάρι' && plan2.adds[0].note === 'Για: Μπιφτέκια');
t('ingPlan: γραμμή σπάει σε πολλά προϊόντα', m.ingPlan(['Κρεμμύδι, σκόρδο, δάφνη'], [], null).adds.length === 3);
t('ingPlan: aggregate μέσα στην ίδια συνταγή', (() => {
  const p = m.ingPlan(['600γρ σπανάκι', '500γρ σπανάκι'], [], 'Χ');
  return p.adds.length === 1 && p.adds[0].qty === 1.1 && p.adds[0].unit === 'κιλά';
})());
t('ingPlan: μη μετατρέψιμη μονάδα → +1 στο υπάρχον', m.ingPlan(['1 φλ ρύζι (άβραστο)'],
  [{ id: 'r', name: 'Ρύζι', qty: 2, unit: 'κιλά', cat: 'Ψωμί & Δημητριακά', ts: 1 }], 'Χ').updates[0].qty === 3);
t('ingPlan: χωρίς ts στα adds', plan2.adds.every(i => !('ts' in i)));
t('ingPlan: null inputs → κενό πλάνο', (() => {
  const p = m.ingPlan(null, null, null);
  return p.adds.length === 0 && p.updates.length === 0;
})());

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

// Ψώνια εβδομάδας (v8.6, έξυπνο aggregate v8.7): weekPlan
const wkMeals = { m1: { n: 'Γεύμα 1', ing: ['1/2 φλ ρύζι (άβραστο)', '400γρ στήθος κοτόπουλο', 'Λεμόνι, ρίγανη'] },
                  m2: { n: 'Γεύμα 2', ing: ['1/2 φλ ρύζι', '2 ντομάτες'] } };
const wk = m.weekPlan(['m1', 'm2'], wkMeals, []);
t('weekPlan: aggregate μεταξύ γευμάτων (1 Ρύζι, όχι 2)', wk.adds.filter(i => i.name === 'Ρύζι').length === 1);
t('weekPlan: note και από τα δύο γεύματα', wk.adds.find(i => i.name === 'Ρύζι').note === 'Για: Γεύμα 1, Γεύμα 2');
t('weekPlan: μικρο-υλικά (λεμόνι/ρίγανη) εκτός', !wk.adds.some(i => i.name === 'Λεμόνια' || i.name === 'Ρίγανη'));
t('weekPlan: aggregate με υπάρχον (400γρ σε 2 κιλά → 2,4)', (() => {
  const p = m.weekPlan(['m1'], wkMeals, [{ id: 'a', name: 'Κοτόπουλο (στήθος)', qty: 2, unit: 'κιλά', cat: 'Κρέας & Ψάρι', ts: 1 }]);
  return p.updates.length === 1 && p.updates[0].qty === 2.4;
})());
t('weekPlan: άγνωστα ids / null → κενό πλάνο', m.weekPlan(['nope'], wkMeals, []).adds.length === 0 &&
  m.weekPlan(null, null, null).adds.length === 0);
t('v8.6: κουμπί «Ψώνια εβδομάδας» υπάρχει', html.includes('gWeekShopBtn') && /weekPlan\(gState\.picks/.test(script));

// Δωμάτιο (v8.5): validRoomCode — ίδιο pattern με Database Rules
t('validRoomCode: έγκυρος', m.validRoomCode('abc123XYZ') === true);
t('validRoomCode: trim', m.validRoomCode('  abcd  ') === true);
t('validRoomCode: με - και _', m.validRoomCode('a-b_c-d') === true);
t('validRoomCode: 4 chars min ok', m.validRoomCode('abcd') === true);
t('validRoomCode: 3 chars → όχι', m.validRoomCode('abc') === false);
t('validRoomCode: 20 chars ok', m.validRoomCode('a'.repeat(20)) === true);
t('validRoomCode: 21 chars → όχι', m.validRoomCode('a'.repeat(21)) === false);
t('validRoomCode: ελληνικά → όχι', m.validRoomCode('αβγδε') === false);
t('validRoomCode: κενό/null → όχι', m.validRoomCode('') === false && m.validRoomCode(null) === false);
t('validRoomCode: με κενό στη μέση → όχι', m.validRoomCode('ab cd') === false);

// Προσβασιμότητα & τυπογραφία (v8.5) — δομικοί έλεγχοι
t('v8.5: focus-visible στο CSS', html.includes(':focus-visible'));
t('v8.5: prefers-reduced-motion', html.includes('prefers-reduced-motion'));
t('v8.5: role=dialog στα sheets/dialogs', (html.match(/role="dialog"/g) || []).length >= 5);
t('v8.5: aria-hidden pass για ligature icons', script.includes("setAttribute('aria-hidden'"));
t('v8.5: line-height στο body', /body\s*{[^}]*line-height/.test(html));
t('v8.5: κανένα font-size κάτω από 12px στο CSS', !/font-size:\s*(?:[0-9]|10|11)(?:\.\d+)?px/.test(html.slice(0, html.indexOf('</style>'))));

// Επιλογή υλικών γεύματος (v8.4) — δομικοί έλεγχοι στο script
t('v8.4: checkbox ανά υλικό στο modal', /class="ing-chk" data-i=/.test(script));
const gAddBody = script.slice(script.indexOf('function gAddIngredients'), script.indexOf('function gAskAi'));
t('v8.4: προστίθενται μόνο τα τσεκαρισμένα', /ingPlan\(picked/.test(gAddBody) && !/ingPlan\(r\.ing/.test(gAddBody));
t('v8.4: toast όταν κανένα τσεκαρισμένο', script.includes('Διάλεξε τουλάχιστον ένα υλικό'));
t('v8.7: μικρο-υλικά ξετσεκαρισμένα στο modal', script.includes("ingLineMinor(x) ? '' : ' checked'"));
t('v8.7: updates με done:false και note μέσω applyIngPlan', /u\.id \+ '\/done'\] = false/.test(script) && /u\.id \+ '\/qty'\] = u\.qty/.test(script));

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
t('MEALS = 165 συνταγές (150 προγράμματος + 15 Ελένη)', keys.length === 165);
// v8: 15 συνταγές σε κάθε κατηγορία
t('15 συνταγές ανά κατηγορία', Object.values(g.mealsByCat).every(a => a.length === 15) && Object.keys(g.mealsByCat).length === 11);
t('Ελένη: 15 συνταγές, καμία στο εβδομαδιαίο πρόγραμμα', g.mealsByCat.eleni.length === 15 && g.MEAL_TEMPLATE.every(d => d.lunch !== 'eleni' && d.dinner !== 'eleni'));
t('Ελένη: χωρίς αυγολέμονο/ωμά στα υλικά', g.mealsByCat.eleni.every(k => !/αυγολέμονο|ωμ[όά] /i.test(g.MEALS[k].ing.join(' '))));
t('buildAiPrompt: εκδοχή εγκυμοσύνης για κατηγορία eleni', m.buildAiPrompt(g.MEALS.elFakes).includes('έγκυος') && !m.buildAiPrompt(g.MEALS.elFakes).includes('cut'));
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

// Καταχώρηση κιλών/επαναλήψεων (v8.9): gymCellText, gymWeeks, gymLogPayload
t('gymCellText: προτιμά formatted f', m.gymCellText({ v: 'Date(2026,11,12)', f: '12/12' }) === '12/12');
t('gymCellText: αριθμός χωρίς f', m.gymCellText({ v: 8 }) === '8');
t('gymCellText: null → κενό', m.gymCellText(null) === '' && m.gymCellText({ v: null }) === '');
const wk0 = gymModel.exercises[0].weeks;
t('gymWeeks: εβδ 1 μόνο κιλά', wk0[1].kg === 80 && wk0[1].reps === '');
t('gymWeeks: εβδ 2 κιλά με κόμμα + reps', wk0[2].kg === 82.5 && wk0[2].reps === '8');
t('gymWeeks: χωρίς καταχωρήσεις → κενό map', Object.keys(gymModel.exercises[1].weeks).length === 0);
const gpl = m.gymLogPayload('Α', ' Πιέσεις πάγκου ', '3', '82,5', ' 8-8-7 ');
t('gymLogPayload: έγκυρο', gpl !== null && gpl.day === 'Α' && gpl.week === 3 && gpl.kg === 82.5 && gpl.reps === '8-8-7' && gpl.exercise === 'Πιέσεις πάγκου' && gpl.token === m.GYM_WRITE_TOKEN);
t('gymLogPayload: μόνο reps (κενά κιλά)', m.gymLogPayload('Β', 'Άρσεις', 1, '', '10-10').kg === null);
t('gymLogPayload: μόνο κιλά (τελεία)', m.gymLogPayload('Ε', 'Σκουώτ', m.GYM_WEEKS, '102.5', '').kg === 102.5);
t('gymLogPayload: τίποτα από τα δύο → null', m.gymLogPayload('Α', 'Χ', 1, '', '') === null);
t('gymLogPayload: άκυρη ημέρα → null', m.gymLogPayload('Ζ', 'Χ', 1, '80', '') === null);
t('gymLogPayload: άκυρη εβδομάδα → null', m.gymLogPayload('Α', 'Χ', 0, '80', '') === null && m.gymLogPayload('Α', 'Χ', m.GYM_WEEKS + 1, '80', '') === null);
t('gymLogPayload: άκυρα κιλά → null', m.gymLogPayload('Α', 'Χ', 1, 'abc', '') === null && m.gymLogPayload('Α', 'Χ', 1, '-5', '') === null && m.gymLogPayload('Α', 'Χ', 1, '1000', '') === null);
t('gymLogPayload: κενό όνομα → null', m.gymLogPayload('Α', '  ', 1, '80', '') === null);
t('gymLogPayload: reps κόβονται στα 40', m.gymLogPayload('Α', 'Χ', 1, '', 'x'.repeat(100)).reps.length === 40);

// Κάρτες ασκήσεων (v8.10): gymHistory, gymEntryText, gymRestLabel, gymActiveWeek, gymDaySummary
const gw = { 3: { kg: 80, reps: '6' }, 1: { kg: 80, reps: '' }, 7: { kg: null, reps: '12' }, 5: { kg: 82.5, reps: '8-8-7' } };
const gh = m.gymHistory(gw, 3);
t('gymHistory: ταξινόμηση αύξουσα + τελευταίες n', gh.length === 3 && gh[0].week === 3 && gh[1].week === 5 && gh[2].week === 7);
t('gymHistory: όλες όταν n=0', m.gymHistory(gw, 0).length === 4 && m.gymHistory(gw, 0)[0].week === 1);
t('gymHistory: κενό/undefined → []', m.gymHistory(undefined, 4).length === 0 && m.gymHistory({}, 4).length === 0);
t('gymEntryText: κιλά × reps', m.gymEntryText({ kg: 82.5, reps: '8-8-7' }) === '82,5 kg × 8-8-7');
t('gymEntryText: μόνο κιλά', m.gymEntryText({ kg: 80, reps: '' }) === '80 kg');
t('gymEntryText: μόνο reps', m.gymEntryText({ kg: null, reps: '12' }) === '12 επαν.');
t('gymEntryText: τίποτα → κενό', m.gymEntryText(null) === '' && m.gymEntryText({ kg: null, reps: '' }) === '');
t('gymRestLabel: 150 δευτ. → 2:30', m.gymRestLabel('150 δευτ.') === '2:30');
t('gymRestLabel: 60 → 1:00, 45 → 0:45', m.gymRestLabel('60 δευτ.') === '1:00' && m.gymRestLabel('45 δευτ.') === '0:45');
t('gymRestLabel: χωρίς αριθμό μένει ίδιο', m.gymRestLabel('όσο χρειάζεται') === 'όσο χρειάζεται' && m.gymRestLabel('') === '');
t('gymRestLabel: «2-3 λεπτά» μένει ίδιο', m.gymRestLabel('2-3 λεπτά') === '2-3 λεπτά');
const gex = [{ sets: 4, weeks: { 1: { kg: 80, reps: '' }, 6: { kg: 80, reps: '6' } } }, { sets: 3, weeks: { 2: { kg: 40, reps: '8' } } }, { sets: 3, weeks: {} }];
t('gymActiveWeek: έγκυρη προτίμηση κερδίζει', m.gymActiveWeek(gex, '3') === 3);
t('gymActiveWeek: χωρίς προτίμηση → τελευταία με καταχώρηση', m.gymActiveWeek(gex, null) === 6);
t('gymActiveWeek: άκυρη προτίμηση αγνοείται', m.gymActiveWeek(gex, '99') === 6 && m.gymActiveWeek(gex, 'abc') === 6);
t('gymActiveWeek: καμία καταχώρηση → 1', m.gymActiveWeek([{ weeks: {} }], null) === 1 && m.gymActiveWeek([], null) === 1);
const gs = m.gymDaySummary({ total: 23, exercises: gex }, 6);
t('gymDaySummary: ασκήσεις/σετ από total/logged', gs.count === 3 && gs.sets === 23 && gs.logged === 1);
t('gymDaySummary: χωρίς total → άθροισμα σετ', m.gymDaySummary({ total: null, exercises: gex }, 2).sets === 10 && m.gymDaySummary({ total: null, exercises: gex }, 2).logged === 1);
t('gymDaySummary: κενό μοντέλο', m.gymDaySummary(null, 1).count === 0 && m.gymDaySummary(null, 1).sets === 0);

// v8.11: 12 εβδομάδες + νέος δείκτης σημείωσης «ΟΔΗΓΙΕΣ:»
t('GYM_WEEKS = 12', m.GYM_WEEKS === 12);
const ghp = m.gymHeaderParts('Ημέρα Γ — ΩΜΟΙ + ΧΕΡΙΑ ΟΔΗΓΙΕΣ: Πρόγραμμα υπερτροφίας. Άσκηση');
t('gymHeaderParts: δείκτης ΟΔΗΓΙΕΣ → τίτλος', ghp.title === 'Ημέρα Γ — ΩΜΟΙ + ΧΕΡΙΑ');
t('gymHeaderParts: δείκτης ΟΔΗΓΙΕΣ → σημείωση χωρίς το πρόθεμα', ghp.note === 'Πρόγραμμα υπερτροφίας.');
t('gymHeaderParts: παλιός δείκτης ΣΕ ΕΛΛΕΙΜΜΑ ακόμα δουλεύει', m.gymHeaderParts('Ημέρα Α — ΣΤΗΘΟΣ ΣΕ ΕΛΛΕΙΜΜΑ: κράτα. Άσκηση').note === 'ΣΕ ΕΛΛΕΙΜΜΑ: κράτα.');
t('gymLogPayload: εβδομάδα 12 έγκυρη, 13 όχι', m.gymLogPayload('Α', 'Χ', 12, '80', '') !== null && m.gymLogPayload('Α', 'Χ', 13, '80', '') === null);

// v8.13: οδηγίες εκτέλεσης + χρονόμετρο
const progNames = {
  'Πιέσεις με μπάρα σε επικλινή πάγκο (30°)': 'inclineBB', 'Κωπηλατική με μπάρα (γωνία ~45°)': 'bbRow',
  'Πιέσεις με αλτήρες σε οριζόντιο πάγκο': 'flatDB', 'Κωπηλατική με στήριξη στήθους (μηχάνημα)': 'chestSupRow',
  'Πεταλούδα σε μηχάνημα (pec deck)': 'pecDeck', 'Εκτάσεις τρικεφάλων με σχοινί (rope pushdown)': 'ropePushdown',
  'Hack squat (ή βαθύ squat με μπάρα)': 'hack', 'Bulgarian split squat με αλτήρες': 'bulgarian',
  'Κάμψεις μηριαίων καθιστός (seated leg curl)': 'seatedLegCurl', 'Άρσεις γάμπας όρθιος': 'standCalf',
  'Κάμψεις δικεφάλων «σφυρί» με αλτήρες (hammer curl)': 'hammer', 'Κοιλιακοί σε τροχαλία (cable crunch)': 'cableCrunch',
  'Πιέσεις ώμων με αλτήρες, καθιστός': 'dbShoulderPress', 'Πλάγιες άρσεις με αλτήρες': 'lateral',
  'Οπίσθιοι δελτοειδείς σε μηχάνημα (reverse pec deck)': 'reversePec', 'Κάμψεις δικεφάλων με μπάρα EZ, όρθιος': 'ezCurl',
  'Εκτάσεις τρικεφάλων υπερκεφαλής σε τροχαλία': 'overheadTri', 'Κάμψεις δικεφάλων σε επικλινή πάγκο (incline DB curl)': 'inclineCurl',
  'Έλξεις σε μονόζυγο με πρόσθετο βάρος': 'pullup', 'Πιέσεις με αλτήρες σε επικλινή πάγκο (30-45°)': 'inclineDB',
  'Έλξεις τροχαλίας με ουδέτερη λαβή (lat pulldown)': 'latPulldown', 'Κωπηλατική με έναν αλτήρα (single-arm DB row)': 'sgArmRow',
  'Διασταυρώσεις σε τροχαλία, από κάτω προς τα πάνω': 'lowHighFly', 'Face pull σε τροχαλία': 'facePull',
  'Κάμψεις δικεφάλων σε τροχαλία, χέρια πίσω από το σώμα': 'bayesian', 'Hip thrust με μπάρα': 'hipThrust',
  'Κάμψεις μηριαίων ξαπλωτός (lying leg curl)': 'lyingLegCurl', 'Κάμψεις δικεφάλων σε πάγκο ιερέα (preacher curl)': 'preacher',
  'Εκτάσεις τρικεφάλων ξαπλωτός (skull crushers)': 'skull', 'Κάμψεις με μπάρα EZ, ανάποδη λαβή (reverse curl)': 'reverseCurl',
  'Άρσεις γάμπας καθιστός': 'seatedCalf', 'Τροχός κοιλιακών (ab wheel rollout)': 'abWheel', 'Pallof press σε τροχαλία': 'pallof'
};
const guideMiss = Object.keys(progNames).filter(n => { const g = m.gymGuideFor(n); return !g || g.id !== progNames[n]; });
t('gymGuideFor: και οι 33 ασκήσεις του προγράμματος → σωστός οδηγός' + (guideMiss.length ? ' (λάθος: ' + guideMiss.join(' | ') + ')' : ''), guideMiss.length === 0);
t('gymGuideFor: άγνωστη άσκηση → null', m.gymGuideFor('Κάτι εντελώς άγνωστο') === null && m.gymGuideFor('') === null);
t('GYM_GUIDE: πλήρη πεδία, μοναδικά id', m.GYM_GUIDE.every(g => g.id && g.k.length && g.en && g.mu && g.st.length >= 3 && g.er.length >= 2) &&
  new Set(m.GYM_GUIDE.map(g => g.id)).size === m.GYM_GUIDE.length);
t('gymNoteParts: πρόθεμα ΧΕΡΙΑ', JSON.stringify(m.gymNoteParts('ΧΕΡΙΑ. Από εβδ. 5: 4 σετ.')) === '{"arms":true,"text":"Από εβδ. 5: 4 σετ."}');
t('gymNoteParts: χωρίς πρόθεμα / κενό', m.gymNoteParts('Έναρξη: 80 kg.').arms === false && m.gymNoteParts(null).text === '');
t('gymRestSeconds: δευτ./λεπτά/άκυρο/όρια', m.gymRestSeconds('150 δευτ.') === 150 && m.gymRestSeconds('2 λεπτά') === 120 &&
  m.gymRestSeconds('') === 90 && m.gymRestSeconds('5 δευτ.') === 15 && m.gymRestSeconds('900 δευτ.') === 600);
t('gymClock', m.gymClock(84) === '1:24' && m.gymClock(0) === '0:00' && m.gymClock(-3) === '0:00' && m.gymClock(600) === '10:00');
const tex = [{ sets: 2 }, { sets: 1 }];
t('gymTimerNext: επόμενο σετ → επόμενη άσκηση → τέλος',
  JSON.stringify(m.gymTimerNext(tex, 0, 1)) === '{"ex":0,"set":2}' && JSON.stringify(m.gymTimerNext(tex, 0, 2)) === '{"ex":1,"set":1}' &&
  m.gymTimerNext(tex, 1, 1) === null && m.gymTimerNext(tex, 5, 1) === null);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
