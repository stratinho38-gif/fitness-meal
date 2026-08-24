# Changelog

## v8.1.0 — 2026-08-24 (Λειτουργία Γυμναστηρίου — read-only από Google Sheet)

- **Νέο διακριτό στρογγυλό κουμπί** δεξιά στο bottom nav (στυλ Stoiximan): εναλλάσσει την εφαρμογή σε **λειτουργία γυμναστηρίου** — το μενού αλλάζει τελείως σε 5 κουμπιά ημερών (Α Στήθος, Β Πόδια, Γ Ώμοι, Δ Πλάτη, Ε Οπίσθιοι) και στη θέση του κουμπιού μπαίνει το εικονίδιο διατροφής για επιστροφή.
- **Πρόγραμμα read-only από το Google Sheet «Gym program»** (φύλλα «Ημέρα Α»–«Ημέρα Ε») μέσω του δημόσιου gviz JSON endpoint — χωρίς κανένα κλειδί. Κάρτες ασκήσεων με σετ/επαναλήψεις/RIR/ξεκούραση, σημειώσεις εκτέλεσης, «Οδηγίες ημέρας», σύνολο σετ και badge με τα **τελευταία καταχωρημένα κιλά** ανά άσκηση.
- **Cache offline** ανά ημέρα (localStorage, stale-while-revalidate) + κουμπί «Ανανέωση» + link «Άνοιγμα στο Google Sheets» (εκεί γίνονται οι καταχωρήσεις — η εφαρμογή δεν γράφει ποτέ στο Sheet).
- Νέες pure functions `gymParseGviz` / `gymHeaderParts` / `gymLastKg` / `gymFormatKg` / `gymDayModel` + 18 νέα tests (88/88). Το περιεχόμενο του Sheet μπαίνει στο DOM μόνο με `textContent` (untrusted).
- Θυμάται λειτουργία και ημέρα (`sm-mode`, `sm-gym-day`). Το Sheet πρέπει να είναι κοινοποιημένο ως «Anyone with the link → Viewer».

## v8.0.0 — 2026-08-24 (150 συνταγές, αναλυτικά βήματα)

- **15 συνταγές ανά κατηγορία** (150 σύνολο, από 33): ίδιο προφίλ μάκρος μέσα σε κάθε κατηγορία Nutrimed, ποικιλία πιάτων (π.χ. τόνος: τονοκεφτέδες, μακαρονοσαλάτα, poke bowl, wrap — όχι μόνο σαλάτες). Το 🎲/🔄 shuffle διαλέγει πλέον από 15 επιλογές.
- **Αναλυτικές οδηγίες**: το `steps` κάθε συνταγής έγινε array 3-6 βημάτων με θερμοκρασίες, χρόνους και tips· στο modal εμφανίζονται ως αριθμημένη λίστα.
- Tests: 150 συνταγές, 15/κατηγορία, steps ως έγκυρο array — 71 tests πράσινα.

## v7.2.0 — 2026-08-24 (Ρύθμιση θέματος, Αρχική με όλες τις λίστες, Material Symbols)

- **Ρύθμιση dark/light**: νέο κουμπί στο hero (Αρχική + Λίστα) — κύκλος Αυτόματο → Φωτεινό → Σκούρο, αποθηκεύεται ανά συσκευή (`sm-scheme`). Το «Αυτόματο» ακολουθεί το σύστημα όπως πριν.
- **Αρχική**: η κάρτα ψώνων δείχνει πλέον **όλες τις λίστες** (χρωματική κουκκίδα, όνομα, μίνι μπάρα προόδου, done/total) — tap σε λίστα την ανοίγει κατευθείαν. Χτίζεται με ασφαλή DOM APIs (ονόματα = user input).
- **Εικονίδια Material Symbols Rounded** (Google Fonts, δωρεάν) αντί για emojis σε όλο το UI: navigation, FAB, chips, μενού, κατηγορίες, κουμπιά +/−/✕, swap, AI, empty states, tips. Emojis αφαιρέθηκαν και από toasts/τίτλους.
- Νέες pure functions `nextScheme` / `resolveDark`, `CAT_EMOJI` → `CAT_ICON`. 9 νέα tests (70/70).

## v7.1.0 — 2026-08-24 (Παραμετροποιήσιμο στάνταρ πρόγραμμα)

- Το στάνταρ πρόγραμμα διατροφής (import) είναι πλέον **επεξεργάσιμο**: νέο node `rooms/<ROOM>/dietTemplate` στο Firebase, **κοινό για το ζευγάρι** (realtime).
- Νέα οθόνη «⚙️ Επεξεργασία στάνταρ λίστας» (μενού λίστας): +/− ποσότητες, αφαίρεση προϊόντων, προσθήκη νέων (μέσω του addSheet σε template mode, με συγχώνευση διπλοτύπων), «↺ Επαναφορά στο αρχικό πρόγραμμα» με confirm.
- Στο πρώτο άνοιγμα της επεξεργασίας το default DIET υλοποιείται στο Firebase· η επαναφορά το διαγράφει και ισχύει ξανά το hardcoded.
- Κάθε import (νέα λίστα ή προσθήκη σε υπάρχουσα) χρησιμοποιεί πλέον το custom στάνταρ αν υπάρχει.
- Νέες pure functions `dietDefaults()` / `dietItems(custom)` + 10 νέα tests (61/61).
- ⚠️ Απαιτεί ενημέρωση Firebase Database Rules για το `dietTemplate` (βλ. spec §5).

## v7.0.0 — 2026-08-24 (Material 3 UI)

- Όλο το UI σε **Material Design 3**: design tokens σε CSS variables, M3 components (hero card, filter chips, FAB, navigation bar με pill indicator, bottom sheets/dialogs radius 28, snackbar, outlined text fields).
- **Αυτόματο dark mode** μέσω `prefers-color-scheme` — κάθε χρώμα του PALETTE έχει light & dark variant.
- Νέα pure function `themeTokens(colorKey, isDark)` + 7 νέα tests (51/51) + listener που κάνει re-apply το θέμα όταν αλλάζει το σχήμα του συστήματος.
- Γραμματοσειρά Roboto (Google Fonts) με system fallback.
- Τα σκληροκωδικοποιημένα χρώματα αντικαταστάθηκαν από tokens με dark variants.

## v6.2.0 — 2026-08-24 (AI συνταγές)

- Στο modal συνταγής: ενότητα **«Θες κάτι διαφορετικό;»** με 3 επιλογές:
  - **🤖 Ρώτα το AI εδώ** — απάντηση μέσα στην εφαρμογή μέσω Netlify function (μόνο στο Netlify site, χρειάζεται κλειδί `ANTHROPIC_API_KEY` στα env vars).
  - **ChatGPT ↗ / Claude ↗** — ανοίγουν με έτοιμη ερώτηση βασισμένη στη συνταγή (υλικά, kcal, πρωτεΐνη, 2 άτομα, cut Nutrimed). Δουλεύουν παντού, χωρίς κλειδιά.
- Νέα pure function `buildAiPrompt` + 9 νέα tests (44/44).
- Νέο αρχείο `netlify/functions/recipe-ai.js`: POST only, όριο input 1200 chars, κλειδί μόνο από env var, χωρίς logging περιεχομένου.
- Ασφάλεια: η απάντηση του AI μπαίνει στο DOM μόνο με `textContent` (untrusted περιεχόμενο).

## v6.1.0 — 2026-08-24 (bottom nav + Αρχική)

- **Bottom navigation** 3 καρτελών (🏠 Αρχική / 🛒 Λίστα / 🍽️ Γεύματα) αντί για top tabs — mobile app αίσθηση, με safe-area για iPhone.
- Νέα καρτέλα **Αρχική**: σημερινά γεύματα (μεσημέρι/βράδυ με κλικ → συνταγή) + πρόοδος λίστας ψώνων + συντομεύσεις. Προεπιλεγμένη καρτέλα.
- Το FAB εμφανίζεται μόνο στη Λίστα· το modal συνταγής ανοίγει πλέον κι από την Αρχική.
- Escaping στο όνομα λίστας στην Αρχική (user input σε innerHTML).

## v6.0.0 — 2026-08-24 (καρτέλα Γευμάτων)

- Νέα καρτέλα 🍽️ **Γεύματα** (top tabs Λίστα/Γεύματα): εβδομαδιαίο πρόγραμμα από το artifact `programma-gevmaton-stratos` ενσωματωμένο στην ίδια εφαρμογή.
- 33 συνταγές cut με modal (υλικά για 2 άτομα, εκτέλεση, μακροθρεπτικά), 🔄 swap ίδιας κατηγορίας, 🎲 νέα εβδομάδα, τικ με μπάρα προόδου.
- **Bugfix**: τα 2 λαδερά / 3 ρεπό της εβδομάδας δεν βγαίνουν πια ποτέ ίδια (τυχαία αφετηρία μία φορά ανά κατηγορία).
- State γευμάτων σε localStorage μέσω lsGet/lsSet, ίδιο κλειδί με το παλιό artifact (τα τικ σου μεταφέρονται).
- Νέα tests γευμάτων (35/35 συνολικά).

## v5.1.0 — 2026-08-24 (hardening)

- `.catch(dbErr)` σε **όλα** τα Firebase writes → toast αντί για σιωπηλή αποτυχία.
- `clampQty`: ποσότητες πάντα 0.1–9999, 2 δεκαδικά (και στο +/−, και στη συγχώνευση διπλοτύπων).
- `cleanText` + όρια: όνομα προϊόντος 80, όνομα λίστας 60 chars (και maxlength στα inputs).
- `lsGet`/`lsSet` wrappers: localStorage σε try/catch (private mode safe).
- Διόρθωση stale artifact description (ανέφερε παλιά 2-tab έκδοση).

## v5.0.0 — 2026-08-24 (Firebase realtime — έγινε σε προηγούμενο session)

- Πλήρης μετάβαση σε Firebase RTDB + anonymous auth, room codes στο URL.
- Πολλαπλές λίστες με χρώματα, μετονομασία, αντίγραφο, διαγραφή.
- +/− ποσότητες με μονάδες, συγχώνευση διπλοτύπων.
- Import προγράμματος διατροφής Nutrimed (51 προϊόντα).
- Κοινοποίηση λίστας με link, realtime sync, status indicator.

## v4.0.0 — 2026-08-24 (localStorage — αποσύρθηκε, βλ. git history)

- Versioned localStorage schema + migration, sanitization, backup/import JSON, inline edit, κόστος, καρτέλα γευμάτων. Αντικαταστάθηκε από τη v5 (Firebase) που είχε γίνει παράλληλα.

## v3 — Αύγουστος 2026 (αρχική έκδοση)

- Μία λίστα, checkboxes, πρόοδος, φίλτρο, προσθήκη/διαγραφή, 3 localStorage κλειδιά.
