# Spec — Λίστα Σούπερ Μάρκετ (source of truth)

Έκδοση: **v7.0 (Material 3 UI)** · Αρχείο εφαρμογής: `index.html` · Deployed: Netlify `lista-supemarket` + Cowork artifact `lista-psonon-stratos`

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

- 33 συνταγές cut (`MEALS`) με χρόνο, kcal/πρωτ./υδατ./λίπη, υλικά (για 2 άτομα), εκτέλεση.
- Εβδομαδιαία δομή Nutrimed (`MEAL_TEMPLATE`): μεσημέρι 1×όσπρια, 1×κοτ. ψητό, 2×λαδερό, 1×ψάρι, 1×κοτ. μαγειρεμένο, 1×κρέας · βράδυ 2×μετά προπόνηση, 1×ομελέτα, 1×τόνος, 3×ρεπό.
- 🎲 Νέα εβδομάδα (τυχαία, χωρίς επανάληψη μέσα στην ίδια κατηγορία), 🔄 swap ανά γεύμα, τικ ολοκλήρωσης με μπάρα, modal συνταγής.
- Τα δεδομένα συνταγών είναι στατικά (hardcoded) — όχι user input.

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

### Schema (Firebase)
```
rooms/<ROOM>/lists/<listId> = {
  name: string, ts: number, color?: string(PALETTE key),
  items: { <itemId>: { name, qty:number, unit, cat, note?, done:boolean, ts:number } }
}
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

## 6. Παραδοχές ποσοτήτων DIET

Κοινά τρόφιμα ~×2, πρωτεΐνες κλιμακωμένες συγκρατημένα (η κοπέλα κανονικές μερίδες, όχι cut). Αν κάνει κι εκείνη cut → διπλασιασμός πρωτεϊνών.

## 7. Ιστορικό αρχιτεκτονικής

- v3: localStorage-only, 1 λίστα (3 κλειδιά).
- v4: localStorage versioned schema + backup/import + κόστος (βλ. git history — αποσύρθηκε υπέρ Firebase).
- v5: Firebase realtime multi-list (τρέχουσα).
