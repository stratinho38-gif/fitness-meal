# Changelog

## v4.0.0 — 2026-08-24

### Robustness
- Ενιαίο versioned state schema (`lista_psonon_v4`) με αυτόματο migration από v3.
- `sanitizeState()` σε κάθε load/import: type checks, όρια μήκους, clamp κατηγορίας.
- Try/catch σε κάθε αποθήκευση με toast ειδοποίηση αποτυχίας.
- Backup (export JSON) / Import με validation και confirm.
- Escaping όλων των interpolations σε innerHTML (και ids/emoji).
- Validation προσθήκης: inline errors, έλεγχος διπλότυπων, όριο 300 custom.

### Νέες λειτουργίες
- ✎ inline επεξεργασία: ποσότητα, σημείωση, κόστος (+ όνομα για custom προϊόντα).
- Εκτίμηση κόστους: σύνολο + υπόλοιπο στη μπάρα προόδου.
- Καρτέλα «Γεύματα» με το ημερήσιο πλάνο Nutrimed.

## v3 — Αύγουστος 2026 (αρχική έκδοση ως Cowork artifact)
- Λίστα με κατηγορίες, checkboxes, πρόοδος, φίλτρο «Μένουν».
- Προσθήκη/διαγραφή προϊόντων, επαναφορά διαγραμμένων.
- Αποθήκευση σε 3 ξεχωριστά localStorage κλειδιά.
