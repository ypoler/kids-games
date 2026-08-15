# משחקים (kids-games)

Casual web games for two children (about 7 and 10): times tables to 10×10, and English ↔ Hebrew vocabulary. Progress stays in the browser (`localStorage`). No accounts.

Play on a recent iPad, Chrome OS Flex, or a phone as old as a Samsung S10. Add to Home Screen from the browser for a full-screen icon.

If this device has no current player, sign in with Google or type/pick a name. **זה לא אני** lets someone else sign in. Everyone who is signed in can open settings.

Product decisions and remaining work: [PLAN.md](PLAN.md).

## Games

| Tile | Route | What it is |
| --- | --- | --- |
| ✖️ כפל | `/#/play/multiplication` | Facts through 10×10, number pad, optional missing number |
| 🔤 אנגלית — בחירה | `/#/play/vocab-mc` | English (or Hebrew) prompt, four answers |
| 🧩 אנגלית — התאמה | `/#/play/vocab-match` | Pair English with Hebrew |

Round length is per game: **5 questions**, **10 questions**, or **against the clock**. Recap compares this round to the child’s personal best. Leaving with **X** saves a session for later publish but does not update bests.

Word lists load from a public Google Sheet tab `english` (`english`, `עברית`, `קטגוריה`), with a bundled JSON fallback.

## Run locally

```bash
npm install
npm run dev
```

Open the printed URL. Hash routes: `/#/`, `/#/play/multiplication`, `/#/play/vocab-mc`, `/#/play/vocab-match`.

## GitHub Pages

This repo deploys with GitHub Actions on push to `main`.

1. Push the project to GitHub.
2. Repo **Settings → Pages → Source**: GitHub Actions.
3. After the workflow succeeds, the site is at `https://<user>.github.io/<repo>/`.

`base: './'` and `HashRouter` so it works as a project site without a custom domain. `public/.nojekyll` avoids Jekyll eating the build.

To try the production build locally: `npm run build && npm run preview`.

## Settings

Open the hamburger for **הגדרות** (anyone who is signed in): sound, per-game finish, tables or word groups, missing-number toggle, Hebrew→English toggle, reset progress. Google Sheet **score** sync is not enabled yet.

## Stack

Vite + React + TypeScript. Static only — no Firebase, no server.
