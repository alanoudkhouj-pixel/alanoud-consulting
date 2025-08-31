# Alanoud Consulting Site (Static)
This folder is deploy-ready. Files:
- index.html (public site / booking)
- admin.html (admin to add slots)
- script.js (front-end logic using localStorage)
- admin_script.js (admin logic using localStorage)

## How to deploy without any local tools
### Option A — GitHub Pages
1) Create a new public repo on GitHub (via the website).
2) Upload these 4 files to the repo root.
3) Settings → Pages → Set Source = `Deploy from a branch`, branch = `main` (or `master`), folder = `/ (root)` → Save.
4) Your site will be live at `https://<username>.github.io/<repo>/`
   - Public page: `index.html`
   - Admin page: `admin.html`

### Option B — Netlify (Drop)
1) Create a Netlify account (web only).
2) Drag & drop this folder to Netlify Drop to deploy instantly.
3) You’ll get a live URL. Add a custom domain later if you want.

### Option C — Vercel (via GitHub)
1) Push this folder to GitHub.
2) Import the repo in Vercel dashboard.
3) No build step required (static).
