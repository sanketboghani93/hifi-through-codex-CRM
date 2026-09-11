# Hifi Collection — Visit Desk

A polished, mobile-first in-store walk-in logger for Hifi Collection. Staff can record a guest, add multiple pieces to their style edit, create a branded follow-up card, and send it over WhatsApp.

## Run locally

Open `index.html` in a browser, or use any static server, for example:

```bash
python3 -m http.server 8080
```

## Google Sheets connection and configurable lists

The app works immediately using device storage and temporary backup lists. To connect your live Sheet, create these tabs in a Google Sheet:

* **Visits** — this is filled automatically by the script.
* **Configuration** — put `Staff` in cell `A1` and each staff name beneath it; put `Product Categories` in cell `B1` and each category beneath it. Change either column whenever you need to update the app's drop-down lists.

Open **Extensions → Apps Script**, paste the code below, replace `PASTE_YOUR_SPREADSHEET_ID` with the ID from your Sheet URL, and deploy it as a **Web app** (execute as: *Me*; who has access: *Anyone*). Copy the resulting `/exec` URL, then open the app's **⚙ settings** and select **Save & sync lists**.

```javascript
const SHEET_ID = 'PASTE_YOUR_SPREADSHEET_ID';

function doGet(e) {
  if (e.parameter.action !== 'config') return json({ ok: true });
  const config = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Configuration');
  const values = config.getDataRange().getDisplayValues();
  return json({
    staff: values.slice(1).map(row => row[0]).filter(Boolean),
    categories: values.slice(1).map(row => row[1]).filter(Boolean),
  });
}

function doPost(e) {
  const visit = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Visits');
  if (sheet.getLastRow() === 0) sheet.appendRow(['Logged at', 'Staff', 'Guest', 'Phone', 'Email', 'Instagram', 'Event date', 'Products', 'Notes']);
  sheet.appendRow([visit.loggedAt, visit.staffName, visit.name, visit.phone, visit.email, visit.instagram, visit.eventDate, visit.products.map(p => `${p.category}: ${p.id}`).join(' | '), visit.notes]);
  return json({ ok: true });
}

function json(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
```

After deployment, the **staff member** and **product category** dropdowns load from the `Configuration` sheet each time the app opens. If the Sheet is temporarily unavailable, the app continues with its backup lists and saves a local copy of the visit.

## GitHub Pages

Push this repository to GitHub, then enable **Settings → Pages → Deploy from a branch** and choose the branch containing `index.html` (usually `main`) and the repository root.
