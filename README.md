# The Super 7 — Website

*The Home of the Super 7.* An all-new free-to-play football prediction game built
around England's seven biggest clubs (Arsenal, Chelsea, Liverpool, Man City,
Man United, Newcastle, Tottenham). Modelled on Sky Sports' Super 6 format:
each gameweek you predict **the score of each of the 7 clubs' games AND that
club's first goalscorer**. Win cash & prizes — all in The Super 7's own brand.

## What's here

This is the **pre-launch "Coming Soon" landing site + interactive demo** (Phase 1):

- A branded **Coming Soon** homepage (hero with email "notify me" capture,
  how-it-works, prizes, leaderboard).
- A working **prediction slip** sneak peek: pick all 7 scorelines with the
  steppers and choose each club's first scorer, then submit. Predictions save in
  your browser and a live countdown ticks to the next Saturday 3pm deadline.

It's a static site — **no accounts, backend, or real money.** The "notify me"
email field is front-end only (stores locally); it needs a backend or an email
service (e.g. Mailchimp/Formspree) wired up before it actually collects sign-ups.

## How to view it

Just open `index.html` in any browser (double-click it).

If you later install Node.js, you can run a local server for a cleaner setup:

```
npx serve thesuper7 -l 5050
```

…then open http://localhost:5050. (A `.claude/launch.json` is already set up for
the in-editor preview once Node is available.)

## Structure

```
thesuper7/
├── index.html            # the landing page (hero, how-it-works, demo, prizes, leaderboard, FAQ)
├── rules.html            # Rules & T&Cs page (draft)
├── css/styles.css        # all styling (imports brand tokens), incl. mobile/responsive
├── js/app.js             # the prediction demo logic + mobile menu
├── brand/
│   ├── BRAND-GUIDE.md     # colours, type, logo rules
│   ├── tokens.css         # CSS design tokens (single source of truth)
│   └── assets/
│       └── logo.svg       # placeholder logo mark (swap for the real one)
└── README.md
```

## Notes / next steps

- **Logo:** `brand/assets/logo.svg` is a placeholder approximation. Drop in the
  real logo (and a transparent PNG) when ready.
- **Club crests:** shown as coloured initial chips to avoid using copyrighted
  crests. Swap for licensed badge artwork if/when you have rights.
- **Fixtures & leaderboard** are mock data for Gameweek 34.
- **Phase 2** (if you want it): real accounts, live fixtures, a scoring engine,
  and persistent leaderboards — which needs a backend.
