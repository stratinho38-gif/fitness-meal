# Spec — Λίστα Σούπερ Μάρκετ (source of truth)

Έκδοση: **v5 (Firebase realtime)** · Αρχείο εφαρμογής: `index.html` · Deployed: Cowork artifact `lista-psonon-stratos`

## 1. Σκοπός

Κοινή realtime λίστα ψώνων για **2 άτομα** (Στράτος + κοπέλα). Πολλαπλές λίστες, βασισμένη στο πρόγραμμα διατροφής Nutrimed + είδη σπιτιού.

## 2. Αρχιτεκτονική

- Single-file HTML app, χωρίς build step.
- **Backend**: Firebase Realtime Database (project `supermarket-lista`, EU-west1), anonymous auth.
- **Κοινή χρήση**: room code στο URL hash (`#r=<code>`). Όποιος έχει το link βλέπει/επεξεργάζεται τις ίδιες λίστες realtime.
- **localStorage** (μόνο UI preferences): `sm-room`, `sm-active-<room>`, `sm-collapsed-<room>`. Όλα τα δεδομένα λιστών ζουν στο Firebase.

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
- **Εκκρεμότητα**: Database Rules στο Firebase console να επιβάλλουν `auth != null` + validation δομής (μήκη strings, τύποι). Χωρίς rules, οποιοσδήποτε authenticated μπορεί να γράψει σε οποιοδήποτε room αν μαντέψει το code.

## 6. Παραδοχές ποσοτήτων DIET

Κοινά τρόφιμα ~×2, πρωτεΐνες κλιμακωμένες συγκρατημένα (η κοπέλα κανονικές μερίδες, όχι cut). Αν κάνει κι εκείνη cut → διπλασιασμός πρωτεϊνών.

## 7. Ιστορικό αρχιτεκτονικής

- v3: localStorage-only, 1 λίστα (3 κλειδιά).
- v4: localStorage versioned schema + backup/import + κόστος (βλ. git history — αποσύρθηκε υπέρ Firebase).
- v5: Firebase realtime multi-list (τρέχουσα).
