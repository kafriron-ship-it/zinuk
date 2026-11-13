/**
 * זינוק – קבלת רעיונות לשיפור מהאפליקציה.
 * כל הודעה נשמרת כשורה בגיליון "זינוק – משוב" בגוגל דרייב של מי שהתקין את הסקריפט.
 *
 * התקנה (פעם אחת):
 *  1. script.google.com ← "פרויקט חדש", מדביקים את כל הקובץ הזה במקום מה שיש שם.
 *  2. בוחרים בפונקציה setup למעלה ולוחצים "הפעלה" (Run). מאשרים הרשאות לחשבון שלך.
 *  3. "פריסה" (Deploy) ← "פריסה חדשה" ← סוג: "אפליקציית אינטרנט" (Web app).
 *     להפעיל בתור: "אני". למי יש גישה: "כל אחד" (Anyone). ← "פריסה".
 *  4. מעתיקים את כתובת אפליקציית האינטרנט (מסתיימת ב-/exec).
 *
 * עדכון בעתיד: "פריסה" ← "ניהול פריסות" ← ✏️ ← גרסה חדשה. לא "פריסה חדשה" – זה משנה את הכתובת.
 */
const SHEET_NAME = 'זינוק – משוב';

function setup() {
  const sh = sheet_();
  Logger.log('הגיליון מוכן: ' + sh.getParent().getUrl());
}

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.hp) return out_({ ok: true });                       // honeypot: bots fill hidden fields
    const msg = String(d.msg || '').trim().slice(0, 2000);
    if (!msg) return out_({ ok: false, error: 'empty' });
    const lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try {
      sheet_().appendRow([
        new Date(),
        String(d.type || '').slice(0, 20),
        msg,
        String(d.name || '').slice(0, 60),
        String(d.dev || '').slice(0, 20),
        String(d.v || '').slice(0, 20),
      ]);
    } finally {
      lock.releaseLock();
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return out_({ ok: true, app: 'zinuk-feedback' });
}

function sheet_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SHEET_ID');
  let ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create(SHEET_NAME);
    props.setProperty('SHEET_ID', ss.getId());
    const sh = ss.getSheets()[0];
    sh.setName('משוב');
    sh.appendRow(['זמן', 'סוג', 'הודעה', 'שם', 'מכשיר', 'גרסה']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    sh.setColumnWidth(3, 480);
  }
  return ss.getSheets()[0];
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
