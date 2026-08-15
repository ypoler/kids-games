# משחקים (kids-games)

Casual web games for two children (about 7 and 10): times tables to 10×10, addition and subtraction, and English ↔ Hebrew vocabulary. Progress stays in the browser (`localStorage`). No kid-only Google accounts are required.

Play on a recent iPad, Chrome OS Flex, or a phone as old as a Samsung S10. Add to Home Screen from the browser for a full-screen icon.

If this device has no current player, type a name and tap **המשך**, sign in with Google, or pick a saved account. **זה לא אני** lets someone else sign in. Everyone who is signed in can open settings.

Live site: [https://ypoler.github.io/kids-games/](https://ypoler.github.io/kids-games/). Product decisions and remaining work: [PLAN.md](PLAN.md).

## Games

| Tile | Route | What it is |
| --- | --- | --- |
| ✖️ כפל | `/#/play/multiplication` | Facts through 10×10, number pad, optional missing number |
| ➕ חיבור וחיסור | `/#/play/add-sub` | Mix of `+` and `−`, number pad, max 10 / 20 / 30 / 40 / 100 |
| 🔤 אנגלית — בחירה | `/#/play/vocab-mc` | English (or Hebrew) prompt, four answers |
| 🧩 אנגלית — התאמה | `/#/play/vocab-match` | Pair English with Hebrew; either column first |

Round length is per game: **5 questions**, **10 questions**, or **against the clock**. Recap compares this round to the child’s personal best. Leaving with **X** saves a session for later publish but does not update bests.

Word lists load from a public Google Sheet tab `english` (`english`, `עברית`, `קטגוריה`), with a bundled JSON fallback. English words can be spoken with the device’s speech (speaker button; auto-play on English prompts when sound is on).

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` (Vite is pinned to that port). Hash routes: `/#/`, `/#/play/multiplication`, `/#/play/add-sub`, `/#/play/vocab-mc`, `/#/play/vocab-match`.

Google sign-in on localhost needs `VITE_GOOGLE_CLIENT_ID` (see `.env.example` and [PLAN.md](PLAN.md)).

## GitHub Pages

This repo deploys with GitHub Actions on push to `main`.

1. Push the project to GitHub.
2. Repo **Settings → Pages → Source**: GitHub Actions.
3. After the workflow succeeds, the site is at `https://<user>.github.io/<repo>/`.

`base: './'` and `HashRouter` so it works as a project site without a custom domain. `public/.nojekyll` avoids Jekyll eating the build.

To try the production build locally: `npm run build && npm run preview`.

## Settings

Open the hamburger for **הגדרות** (anyone who is signed in). Two tabs only:

- **כללי** — sound, appearance (light / dark / system), reset this player’s progress.
- **לכל משחק** — shared options for every player on this device (round goal, tables, add/sub max, word groups, missing-number, Hebrew→English). Scores and personal bests stay per player.

Google Sheet **score** sync is not enabled yet.

## Stack

Vite + React + TypeScript. Static only — no Firebase, no server.
