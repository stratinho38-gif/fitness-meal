# Changelog

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
