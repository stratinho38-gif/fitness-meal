/**
 * Gym sync — Google Apps Script Web App (v8.9)
 * Δένεται στο Sheet «Gym program» και δέχεται POST από την εφαρμογή
 * για καταχώρηση κιλών/επαναλήψεων στις στήλες «Εβδ N — Κιλά / Επαν.».
 *
 * Εγκατάσταση: βλ. docs/odigies-gym-sync.md (βήμα-βήμα).
 * Το TOKEN πρέπει να είναι ΙΔΙΟ με το GYM_WRITE_TOKEN στο index.html.
 */
var TOKEN = 'lp-gym-7Qk4mR2vXw9s';
var DAYS = ['Α', 'Β', 'Γ', 'Δ', 'Ε'];

function doPost(e) {
  var out;
  try {
    out = handle(JSON.parse(e.postData.contents));
  } catch (err) {
    out = { ok: false, error: String((err && err.message) || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function handle(p) {
  if (!p || p.token !== TOKEN) return { ok: false, error: 'bad token' };

  var day = String(p.day || '').trim();
  if (DAYS.indexOf(day) === -1) return { ok: false, error: 'bad day' };

  var week = Math.floor(Number(p.week));
  if (!(week >= 1 && week <= 20)) return { ok: false, error: 'bad week' };

  var name = String(p.exercise || '').trim();
  if (!name) return { ok: false, error: 'bad exercise' };

  var kg = null;
  if (p.kg != null && String(p.kg).trim() !== '') {
    kg = Number(String(p.kg).replace(',', '.'));
    if (!isFinite(kg) || kg <= 0 || kg > 999) return { ok: false, error: 'bad kg' };
  }
  var reps = p.reps == null ? '' : String(p.reps).trim().slice(0, 40);
  if (kg == null && !reps) return { ok: false, error: 'nothing to write' };

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Ημέρα ' + day);
  if (!sh) return { ok: false, error: 'no sheet' };

  var values = sh.getDataRange().getDisplayValues();

  // Header row: το κελί «Σετ» στη στήλη B
  var hr = -1;
  for (var r = 0; r < values.length; r++) {
    if (String(values[r][1]).trim() === 'Σετ') { hr = r; break; }
  }
  if (hr === -1) return { ok: false, error: 'no header row' };

  // Στήλες «Εβδ N — Κιλά» / «Εβδ N — Επαν.»
  var reW = new RegExp('Εβδ\\s*' + week + '(\\D|$)');
  var colKg = -1, colReps = -1;
  for (var c = 0; c < values[hr].length; c++) {
    var h = String(values[hr][c]);
    if (!reW.test(h)) continue;
    if (h.indexOf('Κιλά') !== -1) colKg = c;
    else if (h.indexOf('Επαν') !== -1) colReps = c;
  }
  if (colKg === -1 && colReps === -1) return { ok: false, error: 'no columns for week ' + week };

  // Γραμμή άσκησης: ακριβές όνομα στη στήλη A, κάτω από το header
  var row = -1;
  for (var r2 = hr + 1; r2 < values.length; r2++) {
    if (String(values[r2][0]).trim() === name) { row = r2; break; }
  }
  if (row === -1) return { ok: false, error: 'exercise not found' };

  if (kg != null && colKg !== -1) {
    sh.getRange(row + 1, colKg + 1).setValue(kg);
  }
  if (reps && colReps !== -1) {
    var rg = sh.getRange(row + 1, colReps + 1);
    rg.setNumberFormat('@'); // κείμενο — αλλιώς το «12/12» γίνεται ημερομηνία
    rg.setValue(reps);
  }
  return { ok: true };
}
