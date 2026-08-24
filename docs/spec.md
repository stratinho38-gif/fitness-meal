# Spec — Λίστα Σούπερ Μάρκετ (source of truth)

Έκδοση: **v8.6 (Ψώνια εβδομάδας, σερί προσθήκη)** · Αρχείο εφαρμογής: `index.html` · Deployed: Netlify `lista-supemarket` + Cowork artifact `lista-psonon-stratos`

## 1. Σκοπός

Εφαρμογή 3 καρτελών για **2 άτομα** (Στράτος + κοπέλα): 🏠 Αρχική + 🛒 κοινή realtime λίστα ψώνων + 🍽️ εβδομαδιαίο πρόγραμμα γευμάτων. Βασισμένη στο πρόγραμμα διατροφής Nutrimed + είδη σπιτιού.

## 2. Αρχιτεκτονική

- Single-file HTML app, χωρίς build step. **Bottom navigation** (mobile-style, fixed): `viewHome` / `viewShop` / `viewMeals`. Προεπιλογή: Αρχική· η τελευταία καρτέλα θυμάται (`sm-tab`).
- **Αρχική**: σημερινά γεύματα (βάσει ημέρας εβδομάδας, κλικ → modal συνταγής) + πρόοδος ενεργής λίστας ψώνων + συντομεύσεις. Ανανεώνεται σε κάθε αλλαγή δεδομένων (Firebase update ή τικ γεύματος). Το όνομα λίστας (user input) περνά από escaping πριν μπει σε innerHTML.
- Το FAB (+ προϊόν) εμφανίζεται μόνο στην καρτέλα Λίστα. Το modal συνταγής (gOverlay) ζει εκτός καρτελών ώστε να ανοίγει και από την Αρχική.
- **Backend (λίστα)**: Firebase Realtime Database (project `supermarket-lista`, EU-west1), anonymous auth.
- **Κοινή χρήση**: room code στο URL hash (`#r=<code>`). Όποιος έχει το link βλέπει/επεξεργάζεται τις ίδιες λίστες realtime.
- **localStorage** (UI preferences + γεύματα): `sm-room`, `sm-active-<room>`, `sm-collapsed-<room>`, `sm-tab`, `programma-gevmaton-stratos` (picks/done γευμάτων, ανά συσκευή). Όλα τα δεδομένα λιστών ψώνων ζουν στο Firebase.

### Καρτέλα Γεύματα (v6)

- **150 συνταγές cut** (`MEALS`, v8): **15 ανά κατηγορία** (10 κατηγορίες), με χρόνο, kcal/πρωτ./υδατ./λίπη, υλικά (για 2 άτομα). Ίδιο προφίλ μάκρος μέσα σε κάθε κατηγορία, ποικιλία πιάτων (π.χ. στον τόνο: τονοκεφτέδες, μακαρονοσαλάτα, poke bowl — όχι μόνο σαλάτες).
- **Αναλυτικές οδηγίες (v8)**: το πεδίο `steps` είναι πλέον **array** από 3-6 αναλυτικά βήματα· στο modal συνταγής εμφανίζονται ως αριθμημένη λίστα (`ol.m-steps`). Το shuffle (🎲/🔄) διαλέγει πλέον από 15 επιλογές ανά κατηγορία.
- Εβδομαδιαία δομή Nutrimed (`MEAL_TEMPLATE`): μεσημέρι 1×όσπρια, 1×κοτ. ψητό, 2×λαδερό, 1×ψάρι, 1×κοτ. μαγειρεμένο, 1×κρέας · βράδυ 2×μετά προπόνηση, 1×ομελέτα, 1×τόνος, 3×ρεπό.
- 🎲 Νέα εβδομάδα (τυχαία, χωρίς επανάληψη μέσα στην ίδια κατηγορία), 🔄 swap ανά γεύμα, τικ ολοκλήρωσης με μπάρα, modal συνταγής.
- Τα δεδομένα συνταγών είναι στατικά (hardcoded) — όχι user input.

### Υλικά γεύματος → λίστα ψώνων (v8.2, επιλογή υλικών v8.4)

- Στο modal συνταγής, τα «Υλικά» εμφανίζονται με **checkbox ανά υλικό** (όλα προεπιλεγμένα — `.ing-chk` με `data-i` = index στο `r.ing`). Από κάτω: επιλογέας λίστας (default η ενεργή) + κουμπί **«Στη λίστα (N)»**, όπου N = πόσα υλικά είναι τσεκαρισμένα (live update σε κάθε change). Προστίθενται **μόνο τα τσεκαρισμένα**.
- Κανένα τσεκαρισμένο → toast «Διάλεξε τουλάχιστον ένα υλικό», κανένα write.
- Κάθε υλικό γίνεται item με `qty:1, unit:'τεμ', cat:'Άλλα'` (η ποσότητα είναι ήδη μέσα στο όνομα, π.χ. «400γρ στήθος κοτόπουλο») και `note: "Για: <όνομα γεύματος>"`.
- **Dedupe**: υλικά που υπάρχουν ήδη στη λίστα (ίδιο όνομα, case-insensitive) ή διπλά μέσα στην ίδια συνταγή παραλείπονται· toast με πόσα μπήκαν.
- Αν δεν υπάρχει καμία λίστα, δημιουργείται νέα λίστα **«Ψώνια»** με τα επιλεγμένα υλικά και γίνεται ενεργή.
- Pure function `mealIngItems(ing, existingNames, mealName)` (πριν το Room block, testable): καθαρίζει με `cleanText`/LIMITS, κάνει το dedupe, επιστρέφει τα items χωρίς `ts` (το βάζει ο caller). Ονόματα λιστών στον επιλογέα μπαίνουν μόνο με `textContent` (user input).

### AI συνταγές (v6.2)

- Στο modal συνταγής, ενότητα **«Θες κάτι διαφορετικό;»** με 3 επιλογές:
  1. **🤖 Ρώτα το AI εδώ** — καλεί τη Netlify function `/.netlify/functions/recipe-ai` (POST `{q}`) και δείχνει την απάντηση μέσα στο modal. Δουλεύει **μόνο** στο Netlify deploy· στο Cowork artifact/αλλού η κλήση αποτυγχάνει και εμφανίζεται φιλικό μήνυμα που παραπέμπει στα εξωτερικά κουμπιά.
  2. **ChatGPT ↗** / **Claude ↗** — ανοίγουν νέα καρτέλα με **έτοιμο prompt** (prefill μέσω `?q=`), χωρίς κανένα κλειδί.
- Pure function `buildAiPrompt(r)`: φτιάχνει το ελληνικό prompt από τα στατικά δεδομένα της συνταγής (όνομα, υλικά, kcal, πρωτεΐνη) — ζητά παραλλαγή/παρόμοια συνταγή cut κατά Nutrimed για 2 άτομα. Testable (πριν το Room block).
- **Netlify function** `netlify/functions/recipe-ai.js`: κλειδί ΜΟΝΟ από env var `ANTHROPIC_API_KEY` (Netlify → Environment variables, ποτέ στον κώδικα/repo). POST only, όριο input 1200 chars, `max_tokens` περιορισμένο (κόστος), δεν κάνει log το περιεχόμενο. Μοντέλο: Claude Haiku.
- **Ασφάλεια**: η απάντηση του AI είναι untrusted εξωτερικό περιεχόμενο → μπαίνει στο DOM ΜΟΝΟ με `textContent`, ποτέ innerHTML.

### Material 3 UI (v7)

- Όλο το UI ακολουθεί **Material Design 3** (Material You): design tokens σε CSS variables, χρωματική παλέτα ίδια με πριν (πράσινο default + 8 χρώματα λίστας PALETTE).
- **Dark mode αυτόματο** μέσω `prefers-color-scheme`: πλήρες σετ dark tokens στο CSS (`@media (prefers-color-scheme: dark)`) + `color-scheme: light dark`.
- Κάθε χρώμα του PALETTE έχει **light και dark variant** (`dark: {primary, onPrimary, light, container, on}`). Pure function `themeTokens(colorKey, isDark)` επιστρέφει το σωστό σετ — testable (πριν το Room block).
- `applyTheme(colorKey)` γράφει τα primary tokens inline στο `:root` βάσει σχήματος· listener σε `matchMedia('(prefers-color-scheme: dark)')` κάνει re-apply όταν αλλάζει το σύστημα (runtime/Init section, όχι στο pure block).
- M3 components: top hero card (radius 24), filter chips (radius 8, selected = primary-container), FAB 56px radius 16 σε primary-container, navigation bar με pill indicator στο ενεργό tab, bottom sheets radius 28 (surface-container-high), dialogs radius 28, filled/outlined/text buttons (pill), snackbar σε inverse-surface, outlined text fields.
- Γραμματοσειρά **Roboto** από Google Fonts (400/500/700, `display=swap`) με system fallback.
- Σκληροκωδικοποιημένα χρώματα (banner, tips, lunch/dinner tags, toast, modals) αντικαταστάθηκαν από tokens με dark variants (`--warn-*`, `--lunch*`, `--dinner*`, `--inverse-surface` κ.λπ.).

### Παραμετροποιήσιμο στάνταρ πρόγραμμα (v7.1)

- Το «πρόγραμμα διατροφής» (import) δεν είναι πλέον κλειδωμένο στο hardcoded `DIET`: υπάρχει **custom template** στο Firebase (`rooms/<ROOM>/dietTemplate`), **κοινό για το ζευγάρι** (realtime).
- Pure functions (testable, πριν το Room block): `dietDefaults()` (το DIET ως αντικείμενα) και `dietItems(custom)` (custom αν υπάρχει και είναι έγκυρο/μη κενό, αλλιώς defaults).
- Κάθε import (`startWithDiet`, `addDietItems`) περνά από `dietItems(dietTemplate)` — άρα σέβεται τις αλλαγές.
- **Οθόνη επεξεργασίας** (bottom sheet `tplSheet`, από το μενού λίστας «⚙️ Επεξεργασία στάνταρ λίστας»):
  - Στο πρώτο άνοιγμα, αν δεν υπάρχει custom template, το default υλοποιείται (materialize) στο Firebase ώστε κάθε γραμμή να έχει id για edits.
  - Ανά προϊόν: +/− ποσότητας (βήμα `unitStep`, clamp), διαγραφή. Προσθήκη νέου προϊόντος μέσω του υπάρχοντος addSheet σε **template mode** (`openAddSheet('template')`) — με συγχώνευση διπλοτύπων.
  - «↺ Επαναφορά στο αρχικό πρόγραμμα» (με confirm): διαγράφει το `dietTemplate` → ισχύει ξανά το hardcoded DIET.
- Όλα τα user strings στο sheet με `textContent`. Όλα τα writes με `.catch(dbErr)`.

### Ρύθμιση θέματος, Αρχική snapshot, Material Symbols (v7.2)

- **Ρύθμιση dark/light**: κουμπί στο hero (Αρχική + Λίστα) κάνει κύκλο Αυτόματο → Φωτεινό → Σκούρο. Προτίμηση σε localStorage `sm-scheme` (per device). Manual override μέσω `:root[data-scheme="light|dark"]`· το auto μένει στο media query (`:root:not([data-scheme="light"])`). Pure functions (testable): `nextScheme(cur)` και `resolveDark(pref, systemDark)`.
- **Αρχική — snapshot όλων των λιστών**: η κάρτα ψώνων δείχνει πλέον ΟΛΕΣ τις λίστες (χρωματική κουκκίδα, όνομα, mini μπάρα προόδου, done/total)· tap σε λίστα → την ενεργοποιεί και ανοίγει την καρτέλα Λίστα. Χτίζεται με DOM APIs/`textContent` (ονόματα = user input), όχι innerHTML.
- **Εικονίδια**: **Material Symbols Rounded** (Google Fonts, δωρεάν/Apache 2.0, `FILL@1`, `display=block`) αντί για emojis σε όλο το UI chrome — nav, FAB, chips, bulk, μενού, κατηγορίες (`CAT_ICON`, πρώην CAT_EMOJI), chevrons, +/−/✕, swap, AI, empty states, tips. Χρήση με ligatures σε `<span class="msr">name</span>`. Στα `<option>` (text-only) μόνο το όνομα κατηγορίας. Emojis αφαιρέθηκαν και από toasts/τίτλους.

### Πρόγραμμα γυμναστηρίου — read-only από Google Sheet (v8.1)

- **Δύο «λειτουργίες» εφαρμογής** με εναλλαγή από διακριτό στρογγυλό κουμπί δεξιά στο bottom nav (στυλ Stoiximan):
  - **Διατροφή** (default): nav Αρχική/Λίστα/Γεύματα, κουμπί = `fitness_center` → πάει σε λειτουργία γυμναστηρίου.
  - **Γυμναστήριο**: το nav αλλάζει τελείως — 5 κουμπιά ημερών (Α Στήθος, Β Πόδια, Γ Ώμοι, Δ Πλάτη, Ε Οπίσθιοι), κουμπί = `restaurant` → επιστροφή στη διατροφή (στην τελευταία καρτέλα).
  - Εναλλαγή μέσω `body.gym` class + `setMode(gym)`. Προτιμήσεις σε localStorage: `sm-mode`, `sm-gym-day`.
- **Δεδομένα**: Google Sheet «Gym program» (id `1VPNVq0KLeHfqGDNjyntgXQPbLXtAP4qN462kl20Hmog`), φύλλα «Ημέρα Α»…«Ημέρα Ε», μέσω public **gviz JSON** endpoint (`/gviz/tq?tqx=out:json&sheet=Ημέρα X`). Καμία αλλαγή στο sheet από την εφαρμογή — **μόνο ανάγνωση**· τα κιλά καταχωρούνται στο ίδιο το Sheet.
- **Pure functions** (testable, πριν το Room block): `gymParseGviz(text)` (εξαγωγή/έλεγχος JSON από το gviz wrapper), `gymHeaderParts(label)` (τίτλος + σημείωση ημέρας από το merged header), `gymLastKg(row, cols)` (τελευταία καταχωρημένα κιλά + εβδομάδα από τις στήλες Εβδ N), `gymDayModel(table)` (μοντέλο ημέρας: ασκήσεις {name, sets, reps, rir, rest, notes, last}, σύνολο σετ).
- **Render**: κάρτες ασκήσεων ανά ημέρα (σετ/επαναλήψεις/RIR/ξεκούραση chips, σημείωση εκτέλεσης, badge «Εβδ N: X kg»), σημείωση ημέρας σε details, σύνολο σετ, ώρα τελευταίας ενημέρωσης, κουμπί ανανέωσης, link «Άνοιγμα στο Google Sheets».
- **Cache offline**: τελευταίο επιτυχές μοντέλο ανά ημέρα σε localStorage `sm-gym-<Χ>` (stale-while-revalidate: δείχνει cache αμέσως, φέρνει φρέσκα στο background). Αποτυχία fetch χωρίς cache → μήνυμα σφάλματος με retry.
- **Ασφάλεια**: το περιεχόμενο του Sheet είναι **εξωτερικό/untrusted** → μπαίνει στο DOM ΜΟΝΟ με `textContent`/DOM APIs, ποτέ innerHTML. Το FAB κρύβεται σε λειτουργία γυμναστηρίου. Το Sheet πρέπει να είναι «Anyone with the link → Viewer» για να διαβάζεται.

### Επεξεργασία προϊόντος, undo διαγραφής, touch targets (v8.3)

- **Επεξεργασία προϊόντος**: tap στο σώμα (όνομα/σημείωση) ενός προϊόντος της λίστας → ανοίγει το addSheet σε **edit mode** (`openEditSheet`): τίτλος «Επεξεργασία προϊόντος», κουμπί «Αποθήκευση», προσυμπληρωμένα όνομα/ποσότητα/μονάδα/κατηγορία/σημείωση. Το submit κάνει `update` στο υπάρχον item (κρατά `done`/`ts`)· σημείωση που αδειάζει αφαιρείται (`note: null`).
- **Πεδίο σημείωσης** στο addSheet (προαιρετικό, όριο `LIMITS.note` 120): μπαίνει και στα νέα προϊόντα (λίστα + template mode).
- **Undo διαγραφής**: το ✕ διαγράφει και δείχνει snackbar **«Διαγράφηκε» με κουμπί «Αναίρεση»** (5"): επαναφέρει το item στο ίδιο path με τα ίδια δεδομένα. Το snackbar απέκτησε προαιρετικό action (`showToast(msg, {label, fn})`, pointer-events μόνο όταν έχει action)· χρώμα action από νέο token `--inverse-primary` (light+dark).
- **Pure functions** (testable, πριν το Room block): `itemPayload(name, qty, unit, cat, note)` — καθαρισμένο αντικείμενο item για create/edit (null αν δεν έχει όνομα) · `itemSnapshot(item)` — αντίγραφο item χωρίς `id` για την επαναφορά undo.
- **Touch targets**: αόρατη επέκταση hit area (::before, inset −6px) στα κουμπιά +/−/✕ των γραμμών και στο 🔄 swap των γευμάτων (~42px). Checkbox λίστας 24px τυλιγμένο σε `<label class="cbwrap">` 40×40. `.app` padding-bottom 176px ώστε το τέλος της λίστας να καθαρίζει το FAB.

### Τυπογραφία, προσβασιμότητα, δωμάτιο στο μενού (v8.5)

- **Τυπογραφική κλίμακα**: τίποτα κάτω από 12px — tags «Μεσημέρι/Βράδυ» 12px (min-width 76), σημειώσεις items 13px, meta/counters 12.5px, macros labels 12px. `body { line-height: 1.45 }`. Hero τίτλος 22px/700. Safe area top στο `.app` (`env(safe-area-inset-top)`).
- **Προσβασιμότητα**: καθολικό `:focus-visible` outline · `prefers-reduced-motion: reduce` κόβει transitions/animations · sheets & dialogs με `role="dialog"`, `aria-modal`, `aria-labelledby` (το modal συνταγής παίρνει `aria-label` το όνομα της συνταγής) · όλα τα ligature icons (`.msr`) με `aria-hidden` (στατικά μέσω init pass, δυναμικά στο σημείο δημιουργίας) · icon-only κουμπιά με `aria-label` (FAB, +/−/✕, swap, ⋮, chip «✓», scheme, navSwitch, swatches) · `--lunch` (light) σκούρυνε σε `#8a5719` για αντίθεση AA.
- **Δωμάτιο στο μενού λίστας**: εμφάνιση του room code + κουμπί **«Σύνδεση σε άλλο δωμάτιο»** → modal εισαγωγής κωδικού· έγκυρος = `[A-Za-z0-9_-]{4,20}` (pure `validRoomCode`, testable)· θέτει το URL hash και το υπάρχον hashchange listener αποθηκεύει & κάνει reload. Άκυρος κωδικός ή ίδιο δωμάτιο → toast, καμία αλλαγή.
- **Επιβεβαίωση στο 🎲 «Νέα εβδομάδα»** (confirm dialog): προστασία από κατά λάθος αντικατάσταση του εβδομαδιαίου προγράμματος.

### Ψώνια εβδομάδας & σερί προσθήκη (v8.6)

- **«Ψώνια εβδομάδας»** (κουμπί στο toolbar των Γευμάτων): μαζεύει τα υλικά και των **14 γευμάτων** της εβδομάδας στην ενεργή λίστα, με confirm πρώτα («…στη λίστα "Χ";»). Dedupe παντού: μέσα στην ίδια συνταγή, μεταξύ γευμάτων, και με ό,τι υπάρχει ήδη στη λίστα. Κάθε υλικό παίρνει note «Για: <πρώτο γεύμα που το χρειάζεται>». Αν δεν υπάρχει λίστα → νέα «Ψώνια» (ενεργή). Όλα ήδη μέσα → toast, κανένα write.
- Pure function `weekIngItems(picks, mealsMap, existingNames)` (πριν το Room block, testable): επαναχρησιμοποιεί τη `mealIngItems` ανά γεύμα με σωρευτικό seen set· επιστρέφει items χωρίς `ts`.
- **Σερί προσθήκη**: στο addSheet (λειτουργία λίστας) το sheet **μένει ανοιχτό** μετά από κάθε προσθήκη — καθαρίζει όνομα/σημείωση, μηδενίζει ποσότητα, ξαναδίνει focus στο «Προϊόν». Κλείσιμο με tap στο φόντο/Escape (όπως πριν). Το edit mode κλείνει κανονικά μετά την αποθήκευση.

### Schema (Firebase)
```
rooms/<ROOM>/lists/<listId> = {
  name: string, ts: number, color?: string(PALETTE key),
  items: { <itemId>: { name, qty:number, unit, cat, note?, done:boolean, ts:number } }
}
rooms/<ROOM>/dietTemplate/<itemId> = { name, qty:number, unit, cat, note?, ts:number }   // v7.1, προαιρετικό
```

## 3. Κανόνες robustness (v5)

- **Όρια** (`LIMITS`): όνομα προϊόντος 80 chars, όνομα λίστας 60, qty 0.1–9999 (2 δεκαδικά, `clampQty`).
- **Κάθε Firebase write** έχει `.catch(dbErr)` → toast «Δεν αποθηκεύτηκε», όχι σιωπηλή απώλεια.
- **localStorage** πάντα μέσω `lsGet`/`lsSet` (try/catch — private mode δεν κρασάρει).
- **XSS**: user data μπαίνουν στο DOM μόνο με `textContent`, ποτέ innerHTML.
- **Σύνδεση**: status dot από `.info/connected`, banner σε auth/db errors.
- Διπλότυπο προϊόν (ίδιο όνομα/κατηγορία/μονάδα) → συγχώνευση ποσοτήτων αντί για δεύτερη εγγραφή.

## 4. Λειτουργίες UI

1. Πολλαπλές λίστες (tabs) με χρώμα (PALETTE), μετονομασία, αντίγραφο, διαγραφή (με confirm).
2. Checkbox → πρόοδος στο hero· φίλτρα Όλα/Μένουν/✓· bulk ξετσεκάρισμα/καθαρισμός.
3. Προσθήκη προϊόντος (FAB → bottom sheet): όνομα, ποσότητα+μονάδα (τεμ/κιλά/γρ/λίτρα/πακέτα/κονσέρβες/δωδεκάδες), κατηγορία.
4. +/− ποσότητας ανά προϊόν με βήμα ανά μονάδα (`unitStep`: κιλά/λίτρα 0.5, γρ 100, αλλιώς 1).
5. Import προγράμματος διατροφής (`DIET`, 51 προϊόντα Nutrimed) — νέα λίστα ή προσθήκη χωρίς διπλότυπα.
6. Κοινοποίηση λίστας: share/clipboard του URL με room code.
7. Κατηγορίες με collapse (θυμάται ανά room).

## 5. Ασφάλεια — σημειώσεις

- Το Firebase `apiKey` είναι public identifier (by design), ΔΕΝ είναι μυστικό.
- Το room code είναι το μόνο access control: 9 χαρακτήρες από αλφάβητο 55 → ~2⁵² συνδυασμοί.
- **Database Rules (ενεργά από 24/08/2026)**: `auth != null` για read/write στα rooms, room code pattern `[A-Za-z0-9_-]{4,20}`, validation δομής με τα ίδια όρια του κώδικα (name≤80, listName≤60, note≤120, qty 0.1–9999, `$other: false` σε άγνωστα πεδία).
- **v7.1**: τα rules πρέπει να επιτρέπουν και το node `dietTemplate` κάτω από κάθε room (ίδια validation με τα items, χωρίς `done`). Χωρίς αυτό, η επεξεργασία στάνταρ αποτυγχάνει με toast «Δεν αποθηκεύτηκε».

## 6. Παραδοχές ποσοτήτων DIET

Κοινά τρόφιμα ~×2, πρωτεΐνες κλιμακωμένες συγκρατημένα (η κοπέλα κανονικές μερίδες, όχι cut). Αν κάνει κι εκείνη cut → διπλασιασμός πρωτεϊνών.

## 7. Ιστορικό αρχιτεκτονικής

- v3: localStorage-only, 1 λίστα (3 κλειδιά).
- v4: localStorage versioned schema + backup/import + κόστος (βλ. git history — αποσύρθηκε υπέρ Firebase).
- v5: Firebase realtime multi-list (τρέχουσα).
