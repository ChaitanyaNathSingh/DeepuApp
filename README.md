# Deepu Ledger

A free family billing site that rebuilds the two-month credit-card sheet you already keep for Chinnu and everyone else.

Log a purchase once, assign it to a person, and the bill totals itself. EMIs increment `1st of 24M` → `2nd of 24M` on their own. Netflix, iCloud, and Airtel show up every month. Payments subtract from the total, in red and blue like the original sheet.

## Live site

**https://chaitanyanathsingh.github.io/DeepuApp/**

Open that on a computer or phone. On a phone: Android Chrome → Install app, or iPhone Safari → Share → Add to Home Screen.

## Phone app (free)

This is a Progressive Web App — the same ledger, installable on a phone. No Play Store / App Store fee.

1. Open the site on the phone (Safari on iPhone, Chrome on Android).
2. **Android:** tap **Install** when asked, or Chrome menu → **Install app**.
3. **iPhone / iPad:** Share → **Add to Home Screen**.
4. The Deepu icon sits with your other apps and opens full-screen. Bills stay on the phone and still sync to Google Sheets when connected.

On a small screen you see one month at a time. Tap Sep / Oct on the summary cards, or swipe the bill, to switch. The bottom bar is Bills, EMIs, Monthly, People, More.

On a computer, open `index.html` or http://127.0.0.1:8765/ — the layout uses a sidebar and both months side by side.


## Free website (GitHub Pages)

After this repo is on GitHub, enable Pages: **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**.  
The site URL will be:

`https://<your-username>.github.io/DeepuApp/`

## Connect Google Sheets (do this now)

The public site starts **empty**. To keep bills in your Google account:

1. Create a Google Sheet named **Deepu Ledger**.
2. **Extensions → Apps Script**. Delete the starter function.
3. Copy [Code.gs](https://raw.githubusercontent.com/ChaitanyaNathSingh/DeepuApp/main/gas/Code.gs) into Apps Script `Code.gs`.
4. **+ → HTML**, name it exactly `Index`. Copy [Index.html](https://raw.githubusercontent.com/ChaitanyaNathSingh/DeepuApp/main/gas/Index.html) into that file.
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (required so the website can save)
6. Authorize, copy the URL ending in `/exec`.
7. In Deepu Ledger open **More → Connect Google Sheet**, paste the URL, tap **Save & connect**.

**Write to Sheet** on Bills creates a formatted tab such as `Chinnu Sep-Oct 26`.

## Typical month

1. Pick the person on the left.
2. Add one-off swipes from the credit-card statement onto Sep or Oct (you choose the bill month).
3. EMIs and monthly charges are already there.
4. Tap the blue payment figure if they already paid something.
5. Print or write the tab into Google Sheets.

## Local Python file

`deepu_app.py` is the earlier Streamlit sketch. The website above is the complete app.
