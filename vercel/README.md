# The Super 7 — Vercel build

A self-contained, from-scratch static site (HTML/CSS/JS). No build step, no
framework, no backend. This is the version to deploy on Vercel.

## Contents

```
vercel/
├── index.html          # landing page + interactive prediction demo
├── rules.html          # Rules & T&Cs
├── css/styles.css      # all styling (imports brand/tokens.css)
├── js/app.js           # the prediction demo logic
├── brand/
│   ├── tokens.css      # design tokens (colours, fonts)
│   └── assets/logo.png # logo (header, footer, favicon)
└── vercel.json         # cleanUrls so /rules works without the .html
```

## Deploy on Vercel

### Option A — connect the GitHub repo (recommended)

1. Go to https://vercel.com and sign in (GitHub login is easiest).
2. **Add New → Project → Import** the `AkbarH123/thesuper7` repo.
3. When configuring:
   - **Framework Preset:** Other
   - **Root Directory:** `vercel`  ← important, point it at this folder
   - **Build Command:** leave empty
   - **Output Directory:** leave empty
4. **Deploy.** You'll get a `*.vercel.app` URL in a few seconds.

Every push to `main` then redeploys automatically.

### Option B — Vercel CLI

```
npm i -g vercel
cd vercel
vercel            # preview deploy
vercel --prod     # production deploy
```

## Connect your domain (thesuper7.com)

Your domain is registered with Fasthosts; you can still host on Vercel:

1. In the Vercel project: **Settings → Domains → Add** `thesuper7.com`.
2. Vercel shows the DNS records to set (an A record / CNAME, or its nameservers).
3. In the **Fasthosts** control panel, edit the domain's DNS to match those
   records (or switch to Vercel's nameservers).
4. Wait for DNS to propagate; Vercel issues the HTTPS certificate automatically.

## Notes

- The prediction slip is a front-end demo (saves in the browser). No accounts or
  real prizes yet.
- The "Notify me" email box is front-end only. To collect emails, point it at a
  service (Formspree, Mailchimp, ConvertKit) or add a serverless function.
- The X (Twitter) link is a placeholder (`x.com/thesuper7`) — update it in
  `index.html` and `rules.html`.
