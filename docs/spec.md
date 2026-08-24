# Spec — Λίστα Σούπερ Μάρκετ (source of truth)

Έκδοση: **v6.1 (bottom nav + Αρχική)** · Αρχείο εφαρμογής: `index.html` · Deployed: Netlify `lista-supemarket` + Cowork artifact `lista-psonon-stratos`

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
