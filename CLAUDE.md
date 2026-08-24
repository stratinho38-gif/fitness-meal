# Οδηγίες για Claude — Λίστα Σούπερ Μάρκετ

Εφαρμογή: single-file HTML (`index.html`) με Firebase Realtime Database (project `supermarket-lista`, rooms με anonymous auth). Ο Στράτος δεν είναι developer — οδηγίες Terminal βήμα-βήμα, απλά ελληνικά.

## Τοποθεσίες

- **Repo (source of truth)**: αυτός ο φάκελος (`~/Documents/lista-psonon`). Remote: `https://github.com/stratinho38-gif/fitness-meal` (private).
- **Παραγωγή #1**: Netlify site `lista-supemarket` (https://lista-supemarket.netlify.app) — auto-deploy από push στο main.
- **Παραγωγή #2**: Cowork artifact `lista-psonon-stratos` — ενημέρωση με update_artifact από το index.html.

## Ροή για ΚΑΘΕ αλλαγή (με τη σειρά)

1. **Spec πρώτα**: ενημέρωσε `docs/spec.md`.
2. **Υλοποίηση** στο `index.html`. Κανόνες: όλα τα Firebase writes με `.catch(dbErr)` · user strings μόνο με `textContent` (ποτέ innerHTML) · όρια `LIMITS` (name 80, listName 60, note 120, qty 0.1–9999 μέσω `clampQty`) · localStorage μόνο μέσω `lsGet`/`lsSet`.
3. **Tests**: `node tests/test.js` — όλα πράσινα. Νέα pure λογική = νέα tests.
4. **Changelog**: εγγραφή στο `CHANGELOG.md` (semver).
5. **Commit** με περιγραφικό μήνυμα στα ελληνικά.
6. **Artifact**: update_artifact του `lista-psonon-stratos` με το νέο index.html.
7. **Push**: ο Στράτος τρέχει `cd ~/Documents/lista-psonon && git push` (credentials δικά του — ο Claude δεν χειρίζεται ποτέ tokens). Το push κάνει auto-deploy στο Netlify.

## Σημειώσεις

- Αν μείνουν `.git/HEAD.lock` / `tmp_obj_*` locks στο mount: allow_cowork_file_delete και καθάρισμα.
- Firebase Database Rules: ενεργά (auth != null + validation ίδια με LIMITS). Αλλαγή schema ⇒ ενημέρωση rules (Firebase console → Realtime Database → Rules).
- Ποσότητες πάντα για 2 άτομα (πρόγραμμα Nutrimed).
