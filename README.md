# EF Rough Purchase Dashboard — V3

Diamond rough tender assortment, polish calculation, demand forecast, and bid pricing tool for Excellent Facets.

---

## Quick Start (Local Development)

**Prerequisites:** Node.js 18+ installed on your machine.

```bash
# 1. Navigate to the project folder
cd ef-dashboard

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

This opens the dashboard at `http://localhost:5173`.

---

## Deploy to Vercel (Step-by-Step)

### Option A: Deploy via GitHub (Recommended)

This gives you automatic re-deploys whenever you push changes.

**Step 1 — Create a GitHub repository**

1. Go to https://github.com/new
2. Repository name: `ef-rough-dashboard` (or any name)
3. Set to **Private**
4. Click "Create repository"

**Step 2 — Push the code to GitHub**

Open a terminal in the `ef-dashboard` folder and run:

```bash
git init
git add .
git commit -m "EF Rough Purchase Dashboard V3"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ef-rough-dashboard.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

**Step 3 — Connect to Vercel**

1. Go to https://vercel.com and sign up / log in (use "Continue with GitHub")
2. Click **"Add New..."** → **"Project"**
3. It will show your GitHub repos — find `ef-rough-dashboard` and click **"Import"**
4. Vercel auto-detects the Vite framework. Settings should show:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click **"Deploy"**
6. Wait 30-60 seconds — Vercel builds and deploys
7. You get a live URL like `https://ef-rough-dashboard-xyz.vercel.app`

**Every time you push to GitHub, Vercel automatically re-deploys.**

---

### Option B: Deploy via Vercel CLI (No GitHub needed)

**Step 1 — Install Vercel CLI**

```bash
npm install -g vercel
```

**Step 2 — Deploy**

```bash
cd ef-dashboard
vercel
```

Follow the prompts:
- "Set up and deploy?" → **Y**
- "Which scope?" → Select your account
- "Link to existing project?" → **N**
- "What's your project's name?" → `ef-rough-dashboard`
- "In which directory is your code located?" → `.` (current)
- "Want to modify these settings?" → **N**

Vercel builds and gives you a preview URL. To deploy to production:

```bash
vercel --prod
```

---

## Project Structure

```
ef-dashboard/
├── index.html          ← HTML entry point
├── package.json        ← Dependencies & scripts
├── vite.config.js      ← Vite bundler config
├── vercel.json         ← Vercel deployment config
├── .gitignore          ← Files excluded from Git
├── README.md           ← This file
└── src/
    ├── main.jsx        ← React entry point
    └── App.jsx         ← Dashboard (all logic in one file)
```

---

## Features

### 4 Parcel Types (Pre-loaded with ODC March 2026 data)
1. **+7+9+11 GEM SW** (Lot 91) — 3 segments, Sawable, 100% Round
2. **+7+9+11 GEM MB** (Lot 92) — 3 segments, Makeable, Round + Pear/Oval
3. **+5+3 GEM SW** (Lot 101) — 2 segments, sample extrapolation
4. **+5+3 GEM MB** (Lot 102) — 2 segments, sample extrapolation

### Per-Parcel Tabs
- **Parcel Input** — Parcel info, yield/multiplier config, fluo discounts, EF PL discount
- **Assortment** — Fluorescence + Color × Clarity (× Shape for MB) input per segment
- **Polish Calc** — Full polish output with sieve lookup, fluo adjustment, avg size debug
- **Price Masters** — 4 shape tabs × 8 sieve blocks, all editable
- **Summary** — Grand totals, charts (segment value, rough vs polish, color pie), ODC profile comparison, shape detail
- **Demand Forecast** — Hot band analysis (B1, B2, B3a/b/c), per-segment split, color breakdown, no-demand risk

### Master Summary (Separate Mode)
- Cross-parcel overview with all key metrics
- Bid calculator with editable labour $/ct and profit margin %
- Formula: Bid = ((Pol Value − Labour×Rough CTS) / Rough CTS) × (1 − Profit%)
- Global defaults with per-parcel overrides
- Waterfall breakdown per parcel
- Bid vs Last Sold comparison chart

### Key Calculations
- **EF PL Bucket Mapping** — DEF/VVS→B1, DEF/VS→B2, G/VVS→Avg(B1,B3), etc.
- **Fancy Prices** — CTM Baguettes, Standard BG/Tapers, Pears & Marquise
- **EF PL Discount** — Applied to polish sizes ≥ 0.052ct (default 15%)
- **Fluo Adjustment** — None/Faint pass-through, Med/Strong discounted
- **Sample Extrapolation** — For +5+3 parcels: combined sample ratios × segment rough cts from ODC profile
- **Hot Sizes** — Band 1 (0.012-0.013ct), Band 2 (0.033-0.037ct), Band 3a/b/c (s6/s7/s8)

### ODC Production Profile (Real Data — Feb 2026 Auction)
- Lot 91: +11 27/61/12%, -11+9 28/61/11%, -9+7 30/61/9%
- Lot 92: +11 37/53/10%, -11+9 43/47/10%, -9+7 47/42/11%
- Lot 101: Combined 47/44/9%
- Lot 102: Combined 48/43/9%

### Last Sold Prices (Feb 2026 Auction Results)
- Lot 91 (+11+9+7 White Gem Z): $206/ct
- Lot 92 (+11+9+7 White Gem MB): $160/ct
- Lot 101 (+5+3 White Gem Z): $120/ct
- Lot 102 (+5+3 White Gem MB): $102/ct

---

## Customization

### Adding New Parcels
Edit the `PARCEL_DEFS` array in `src/App.jsx`. Each parcel needs:
- `id`, `label`, `type` ("SW" or "MB")
- `segs` — segment labels array
- `parcel` — lot info (date, tender, number, name, totalCts, pcs, lastSold)
- `flu` — fluorescence data per segment
- `segInfo` — sample cts/pcs per segment
- `odcPrf` — ODC color profile (1Col/2Col/3Col %)
- `pre` or `pre_mb` — assortment data per segment

For sample extrapolation parcels, also add:
- `sampleExtrap: true`
- `segRoughCts` — full rough cts per segment from ODC profile
- `combinedSample` or `combinedSample_mb` — the sample assortment
- `combinedSampleTotal` — total cts/pcs of sample

### Modifying Price Masters
Edit the `mkPM()` function or manually override in the Price Masters tab.

### Changing Hot Band Ranges
Edit the `isHot()` function and the `bands` array in the `hotData` computation.

---

## Tech Stack
- **React 18** — UI framework
- **Recharts** — Charts (BarChart, PieChart)
- **Vite** — Build tool
- **Vercel** — Deployment

No backend, no database — all data is client-side. Data persists during a session but resets on page refresh.

---

## Troubleshooting

**Build fails on Vercel:**
- Ensure `package.json` has all dependencies listed
- Check Vercel build logs for specific errors
- Framework should be detected as "Vite"

**Charts not rendering:**
- Recharts requires a parent with defined width/height
- Check browser console for errors

**Data resets on refresh:**
- This is expected — the app is stateless (no backend)
- To persist data, you would need to add localStorage or a database

---

*Built for Excellent Facets Private Limited — Rough Diamond Sourcing*
