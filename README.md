# Úverový dotazník – Jozef Gergo

Samostatná stránka pre klientov (GitHub Pages). Rovnaká architektúra ako zdravotný dotazník:
- `index.html` – celý dotazník, bez závislostí (len Google Fonts). Koncept sa ukladá v prehliadači klienta.
- Odoslanie: POST (JSON) na Google Apps Script URL v `KONZULTANT.url`. Ak je URL prázdna, tlačidlo Odoslať stiahne `odpovede.json`, ktorý klient pošle e-mailom.
- `Code.gs` – prijímač pre Apps Script (Disk + tabuľka + e-mail). Funguje aj so zdravotným dotazníkom.
- Režim pre konzultanta: odkaz „Pre konzultanta“ v pätičke alebo `…/#konzultant` – načítanie `odpovede.json`, textový súhrn, tlač do PDF.

Nasadenie: repozitár `uverovy-dotaznik` → nahrať `index.html` → Settings → Pages → Branch `main` / root.
