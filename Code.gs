/**
 * Prijímač dotazníkov (zdravotný aj úverový) – Google Apps Script.
 * Nasadenie: Rozšírenia → Apps Script → vlož tento kód → Nasadiť → Nová nasadenie
 *   typ: Webová aplikácia, Spustiť ako: ja, Prístup: ktokoľvek → skopíruj URL do KONZULTANT.url v index.html.
 *
 * Čo robí pri každom odoslaní:
 *  1. uloží odpovede.json + prílohy do Google Disku (priečinok Dotazníky/<typ>/<dátum meno>)
 *  2. zapíše riadok do tabuľky (ID v SHEET_ID; ak prázdne, tabuľku vytvorí a ID vypíše do logu)
 *  3. pošle e-mail so súhrnom a prílohami na EMAIL
 */
var EMAIL = 'jozef.gergo@mylife.sk';
var SHEET_ID = '';          // nechaj prázdne pri prvom spustení, skript tabuľku vytvorí
var ROOT_FOLDER = 'Dotazníky';

function doPost(e) {
  try {
    var p = JSON.parse(e.postData.contents);
    var typ = p.typ === 'uverovy' ? 'Úverový dotazník' : 'Zdravotný dotazník';
    var meno = (p.meno || 'klient').trim();
    var kedy = Utilities.formatDate(new Date(), 'Europe/Bratislava', 'yyyy-MM-dd HH:mm');
    var nazov = kedy.replace(':', '-') + ' ' + meno;

    // 1. Disk
    var root = findOrCreate(DriveApp.getRootFolder(), ROOT_FOLDER);
    var typF = findOrCreate(root, typ);
    var f = typF.createFolder(nazov);
    f.createFile('odpovede.json', JSON.stringify(p, null, 1), 'application/json');
    f.createFile('suhrn.txt', p.suhrn || '', 'text/plain');
    var blobs = [];
    (p.prilohy || []).forEach(function (a, i) {
      var b = Utilities.newBlob(Utilities.base64Decode(a.b64), a.type, a.name || ('priloha' + (i + 1)));
      f.createFile(b); blobs.push(b);
    });

    // 2. Tabuľka
    var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.create('Dotazníky – prehľad');
    if (!SHEET_ID) Logger.log('Vytvorená tabuľka, doplň SHEET_ID = ' + ss.getId());
    var sh = ss.getSheets()[0];
    if (sh.getLastRow() === 0) sh.appendRow(['Dátum', 'Typ', 'Klient', 'Telefón', 'E-mail', 'Účel', 'Výška úveru', 'Prílohy', 'Priečinok']);
    sh.appendRow([kedy, typ, meno, p.tel || '', p.email || '', p.ucel || '', p.vyska || '', (p.prilohy || []).length, f.getUrl()]);

    // 3. E-mail (prílohy do 20 MB, zvyšok je na Disku)
    var total = 0, att = [];
    blobs.forEach(function (b) { total += b.getBytes().length; if (total < 20 * 1024 * 1024) att.push(b); });
    MailApp.sendEmail({
      to: EMAIL,
      subject: typ + ' – ' + meno + (p.ucel ? ' – ' + p.ucel : ''),
      body: 'Priečinok na Disku: ' + f.getUrl() + '\n\n' + (p.suhrn || ''),
      attachments: att
    });

    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function doGet() { return out({ ok: true, info: 'Prijímač dotazníkov beží.' }); }

function findOrCreate(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}
function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
