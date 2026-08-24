# 🛒 Λίστα Σούπερ Μάρκετ

Κοινή realtime λίστα ψώνων για 2 άτομα (Firebase), βασισμένη στο πρόγραμμα διατροφής Nutrimed. Single-file HTML app — χωρίς build step.

## Χρήση

Άνοιξε το `index.html` σε browser ή ως Cowork artifact `lista-psonon-stratos`. Το URL περιέχει room code (`#r=...`) — μοιράσου το link για κοινή λίστα realtime.

## Λειτουργίες

Πολλαπλές λίστες με χρώματα, +/− ποσότητες με μονάδες, φίλτρα, bulk καθαρισμός, import προγράμματος διατροφής (51 προϊόντα Nutrimed), κοινοποίηση με link, realtime sync μεταξύ συσκευών.

## Δομή repo

| Αρχείο | Ρόλος |
|---|---|
| `index.html` | Η εφαρμογή (μοναδικό αρχείο κώδικα) |
| `docs/spec.md` | **Source of truth** — αρχιτεκτονική, schema, κανόνες robustness |
| `CHANGELOG.md` | Ιστορικό εκδόσεων |
| `tests/test.js` | Tests pure λογικής — `node tests/test.js` |

## Κανόνας συντήρησης

Κάθε αλλαγή: 1) ενημερώνεται το `docs/spec.md`, 2) υλοποιείται στο `index.html`, 3) τρέχουν τα tests, 4) γράφεται στο `CHANGELOG.md`, 5) commit, 6) συγχρονίζεται το artifact από το repo — ποτέ το αντίστροφο.

## Ασφάλεια

Firebase Database Rules ενεργά (auth != null + validation δομής) — βλ. `docs/spec.md` §5.
