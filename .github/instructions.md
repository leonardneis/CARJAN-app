# Copilot Agent Instructions

## Ziele

1. Schreibe sauberen, modularen Code nach Best Practices in Vue 3 + Electron + Vite.
2. Manage die Startapplikationen:
   - Statt `startAll.bat`, nutze `startTriplestore.bat` und `startAJAN.bat`
   - Beachte Plattformunterschiede (`.bat` für Windows, `.sh` für Linux/Mac)
   - Prüfe, ob Prozesse korrekt gestartet wurden (z. B. über stdout).
   - Beende Services sauber bei App-Ende (`app.on("before-quit")`).
3. Setze einen Ladebildschirm mit Anime.js (v4) um:
   - Verwende bestehende SVGs (`Strase`, `Marker`, `Gitter`, `CARJAN`)
   - Zeichne Straße von unten nach oben mit Fade
   - Skaliere Marker weich rein
   - Zeichne Gitter von links ein
   - Blende Text am Ende ein
4. Schreibe große Änderungen automatisch in `changelog.md` (per Hook oder direkt im Code kommentiert).
5. Implementiere Selbsttests:
   - Unit-Tests für UI-Komponenten wie `Splash.vue`, `LandingPage.vue`
   - Tests für `services.js`: überprüfe Start und Stop der Child-Prozesse
6. Wechsle nach der Splash-Animation automatisch zur `LandingPage.vue`.

---

## Build & Run

- Nutze Hot Module Reloading (HMR) – Änderungen sollen sofort sichtbar sein.
- **Build & run nach jeder Codeänderung durchführen.**
- Wenn möglich, führe `npm run dev` oder `npm run electron:dev` automatisch aus.
- **To build the renderer (Vue):**
  ```bash
  npm run build
  ```
