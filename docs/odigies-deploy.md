# Οδηγίες Deploy — Πώς βγαίνουν οι αλλαγές στην παραγωγή

Γραμμένο για τον Στράτο, απλά ελληνικά. Τελευταία ενημέρωση: 24/08/2026.

## Τι έχουμε στήσει (η μεγάλη εικόνα)

```
 Εσύ ζητάς αλλαγή στο Claude (Cowork)
        │
        ▼
 Claude: κώδικας + tests + commit ──► φάκελος ~/Documents/lista-psonon (repo)
        │                                      │
        ▼                                      ▼  εσύ: git push
 Cowork artifact                        GitHub (stratinho38-gif/fitness-meal)
 lista-psonon-stratos                          │
 (ενημερώνεται από Claude)                     ▼  αυτόματα
                                        Netlify → lista-supemarket.netlify.app
```

- **Source of truth**: αυτός ο φάκελος (`~/Documents/lista-psonon`), ανεβασμένος στο GitHub.
- **Παραγωγή #1 — Netlify**: https://lista-supemarket.netlify.app — ενημερώνεται **αυτόματα** σε ~30" μετά από κάθε `git push` (σύνδεση Netlify ↔ GitHub, branch `main`, χωρίς build command).
- **Παραγωγή #2 — Cowork artifact**: `lista-psonon-stratos` — το ενημερώνει ο Claude απευθείας.
- **Δεδομένα χρηστών**: ζουν στο Firebase (project `supermarket-lista`) — ΔΕΝ επηρεάζονται από deploys. Τα deploys αλλάζουν μόνο την εφαρμογή.

## Η καθημερινή ροή (αυτό θα κάνεις 99% των περιπτώσεων)

1. Άνοιξε Cowork, σύνδεσε τον φάκελο `~/Documents/lista-psonon` και γράψε στον Claude τι αλλαγή θες.
2. Ο Claude (βάσει `CLAUDE.md`): ενημερώνει το spec → γράφει κώδικα → τρέχει tests → κάνει commit → ενημερώνει το artifact.
3. Εσύ τρέχεις στο Terminal **μία εντολή**:
   ```bash
   cd ~/Documents/lista-psonon && git push
   ```
4. Τέλος. Το Netlify ανεβάζει μόνο του τη νέα έκδοση σε ~30". Έλεγχος: άνοιξε το site και κάνε refresh.

## Χρήσιμες εντολές Terminal

| Εντολή | Τι κάνει |
|---|---|
| `cd ~/Documents/lista-psonon` | Μπαίνεις στον φάκελο του project (πάντα πρώτο βήμα) |
| `git status` | Δείχνει αν υπάρχουν αλλαγές που δεν έχουν γίνει commit |
| `git log --oneline` | Η ιστορία των εκδόσεων (κάθε γραμμή = ένα commit) |
| `git push` | Στέλνει τα commits στο GitHub → αυτόματο deploy στο Netlify |
| `node tests/test.js` | Τρέχει τα tests (πρέπει να λέει `0 failed`) |
| `git add -A && git commit -m "περιγραφή"` | Χειροκίνητο commit (σπάνια — συνήθως το κάνει ο Claude) |

## Αν κάτι πάει στραβά

- **`git push` ζητάει password**: θέλει το GitHub token (όχι το κανονικό password). Αν χάθηκε: github.com → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → τσεκάρεις μόνο `repo` → το βάζεις στο Password. ⚠️ Το token είναι μυστικό — δεν το στέλνεις πουθενά, ούτε στον Claude.
- **Το Netlify δεν ενημερώθηκε**: app.netlify.com → project `lista-supemarket` → καρτέλα **Deploys** → δες αν έτρεξε deploy και τι λάθος έβγαλε. Αν δεν τρέχει καθόλου deploys με το push, η σύνδεση με το GitHub θέλει ξανά ρύθμιση: Site configuration → Build & deploy → Link repository (branch `main`, build command κενό, publish directory κενό).
- **Χάλασε κάτι στην εφαρμογή μετά από αλλαγή**: πες στον Claude «γύρνα στην προηγούμενη έκδοση» — το git κρατάει όλη την ιστορία, τίποτα δεν χάνεται.
- **Θες να δεις τι τρέχει στην παραγωγή**: το commit που φαίνεται στο Netlify Deploys πρέπει να είναι το ίδιο με το πάνω-πάνω του `git log --oneline`.

## Τι έχει ρυθμιστεί μία φορά (δεν χρειάζεται να το ξανακάνεις)

- ✅ Git repo με ιστορία εκδόσεων + tests + spec (`docs/spec.md`) + `CLAUDE.md` (οδηγίες για τον Claude).
- ✅ GitHub private repo `stratinho38-gif/fitness-meal` + token αποθηκευμένο στο Keychain του Mac.
- ✅ Netlify site `lista-supemarket` συνδεδεμένο με το GitHub (auto-deploy στο main).
- ✅ Firebase Database Rules: μόνο συνδεδεμένοι χρήστες + έλεγχος δομής δεδομένων.
- ✅ Cowork artifact `lista-psonon-stratos` — συγχρονίζεται από τον Claude σε κάθε αλλαγή.
