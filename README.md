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

## Google Sheets (your Google account) — this is the free hosted website

Google will give you a URL like `https://script.google.com/macros/s/…/exec`. No paid server.

1. Create a Google Sheet named **Deepu Ledger** (while signed into the account you want to keep the bills in).
2. **Extensions → Apps Script**. Delete the default `myFunction`.
3. Paste `gas/Code.gs` into `Code.gs`.
4. Click **+** next to Files → **HTML** → name it exactly `Index`.
5. On your computer run `python3 tools/build_gas.py`, then paste `gas/Index.html` into that file (or copy `gas/Index.html` if it is already there).
6. **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Only myself** (phone: use **Anyone with the link**)
7. Click **Authorize access**, pick the same Google account, allow the Sheet permission.
8. Open the web-app URL. Bookmark it — that is the website.

**Write to Sheet** on the Bills screen creates a formatted tab such as `Chinnu Sep-Oct 26` with Date / Description / amount, Purchases, Payments, and Total Bill.

To also use the GitHub Pages copy of the site with the same Sheet, paste that web-app URL under **Settings → Google Sheet** and set the deployment access to **Anyone**.

## Typical month

1. Pick the person on the left.
2. Add one-off swipes from the credit-card statement onto Sep or Oct (you choose the bill month).
3. EMIs and monthly charges are already there.
4. Tap the blue payment figure if they already paid something.
5. Print or write the tab into Google Sheets.

## Local Python file

`deepu_app.py` is the earlier Streamlit sketch. The website above is the complete app.
