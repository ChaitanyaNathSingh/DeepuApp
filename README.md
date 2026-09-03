# Deepu Ledger

A free family billing site that rebuilds the two-month credit-card sheet you already keep for Chinnu and everyone else.

Log a purchase once, assign it to a person, and the bill totals itself. EMIs increment `1st of 24M` → `2nd of 24M` on their own. Netflix, iCloud, and Airtel show up every month. Payments subtract from the total, in red and blue like the original sheet.

## Live site

**https://chaitanyanathsingh.github.io/DeepuApp/**

Open that on a computer or phone. The layout fits small screens; there is no app-store / install step.

## Phone layout

On a small screen you see one month at a time. Tap Sep / Oct on the summary cards, or swipe the bill, to switch. The bottom bar is Bills, EMIs, Monthly, People, More.

On a computer the layout uses a sidebar and both months side by side.


## Free website (GitHub Pages)

After this repo is on GitHub, enable Pages: **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**.  
The site URL will be:

`https://<your-username>.github.io/DeepuApp/`

## Optional Google Sheet backup

Daily add/edit stays on this device and never asks Google to sign in. Only **More → Backup now** or **Backup to Sheet** talks to Google.

1. Create a Google Sheet named **Deepu Ledger**.
2. **Extensions → Apps Script**. Delete the starter function.
3. Copy [Code.gs](https://raw.githubusercontent.com/ChaitanyaNathSingh/DeepuApp/main/gas/Code.gs) into Apps Script `Code.gs`.
4. **+ → HTML**, name it exactly `Index`. Copy [Index.html](https://raw.githubusercontent.com/ChaitanyaNathSingh/DeepuApp/main/gas/Index.html) into that file.
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (required so the website can save)
6. Google shows **“Google hasn’t verified this app.”** That is expected. Click **Advanced** → **Go to Deepu Ledger (unsafe)** → **Allow**. You are the developer (`mchaitanyanathsingh@gmail.com`); the script only opens the Sheet it is attached to.
7. Copy the URL ending in `/exec`.
8. In Deepu Ledger open **More → Connect Google Sheet**, paste the URL, tap **Save & connect**.

**Backup to Sheet** (after a backup URL is set) creates a formatted tab such as `Chinnu Sep-Oct 26`.

## Typical month

1. Pick the person on the left.
2. Add one-off swipes from the credit-card statement onto Sep or Oct (you choose the bill month).
3. EMIs and monthly charges are already there.
4. Tap the blue payment figure if they already paid something.
5. Print or write the tab into Google Sheets.

## Local Python file

`deepu_app.py` is the earlier Streamlit sketch. The website above is the complete app.
