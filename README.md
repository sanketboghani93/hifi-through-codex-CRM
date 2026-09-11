# Hifi Collection — Visit Desk

A polished, mobile-first in-store walk-in logger for Hifi Collection. Staff can record a guest, add multiple pieces to their style edit, create a branded follow-up card, and send it over WhatsApp.

## Run locally

Open `index.html` in a browser, or use any static server, for example:

```bash
python3 -m http.server 8080
```

## Google Sheets connection

The app works immediately using device storage. To log visits to a Google Sheet, deploy a Google Apps Script as a Web App that accepts the JSON POST body and appends it to your spreadsheet. Then open the **⚙ settings** menu in the app and paste the deployment `/exec` URL. The app sends a no-CORS POST, which is suited to an Apps Script web app endpoint.

## GitHub Pages

Push this repository to GitHub, then enable **Settings → Pages → Deploy from a branch** and choose the branch containing `index.html` (usually `main`) and the repository root.
