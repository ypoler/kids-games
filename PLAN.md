# Kids games suite — plan (as built)

Family web hub with casual, touch-first games for two children (~7 and ~10). Playable on recent iPads, Chrome OS Flex, and phones as old as a Samsung S10.

Progress is **local** (`localStorage` key `kids-games-v4`). There is **no kid Google login**. Names are typed on the device. **זה לא אני** switches child.

## Status

| Phase | State |
| --- | --- |
| Scaffold, hub, local profiles | **Done** |
| Multiplication | **Done** (see deviations below) |
| English vocab (MC + match) | **Done** (see deviations below) |
| PWA / Add to Home Screen | **Done** (device QA on S10 / iPad / Flex still informal) |
| Hosting | **GitHub Pages** (Actions), not Firebase |
| Vocab lists from a public Sheet | **Done** (tab `english`; bundled JSON fallback) |
| Score publish to Sheets (parent OAuth) | **Not built** — outbox is queued locally only |

## Stack

Vite + React + TypeScript SPA. `base: './'` + `HashRouter` for project Pages. PWA via `vite-plugin-pwa`. No Firebase, no server, no secrets in the bundle except the public Sheet ID used for **reads**.

Routes: `/#/`, `/#/play/multiplication`, `/#/play/vocab-mc`, `/#/play/vocab-match` (`/#/play/vocab` redirects to MC).

## Chrome and hub

- Sticky app bar. Hamburger always. Home: empty slot opposite the menu. In-game: **X** leaves to home (no **סיימתי**).
- Settings (cog) and **זה לא אני** live in the hamburger only.
- Leaving a game flushes a session to the outbox if anything was answered. **Personal bests update only on a natural round finish**, not on X-leave.
- Hub tiles: ✖️ כפל · 🔤 אנגלית — בחירה · 🧩 אנגלית — התאמה.

## Settings

Hamburger → הגדרות.

- **General:** sound.
- **Per child:** name + reset progress. Round length is **not** per child.
- **Per game:** tables / word groups, round goal, multiplication **מספר חסר**, MC **עברית → אנגלית**.

**Round goal** (same chips on every game): **5 שאלות / 10 שאלות / נגד השעון** (~60s). Recap is a personal scoreboard (`הסיבוב הזה` vs `השיא שלך`, **שיא חדש!**). Bests: `timed` / `q5` / `q10`.

Play score is `correct / total` with `dir="ltr"`. Question rounds use the round length as the denominator; timed uses asked-so-far. Timer ring only when timed.

Answer feedback: large **✔** (green) / **✘** (red). Misses still show the correct value, then **הבא**.

## Game 1 — Multiplication (to 10×10)

Shuffled facts from selected tables (default 2–5). Number pad + keyboard. Optional **מספר חסר** (`? × b = p` / `a × ? = p` / product missing). Light adaptive weighting from per-fact streaks; never leaves 10×10.

**Dropped vs original sketch:** no practice/mix/missing **mode chips**, no on-screen mastery grid, no forced retry of the same fact before moving on (miss still shows the answer).

## Game 2 — English vocabulary

Two separate games (own pack picker + round goal):

- **Multiple choice:** prompt in EN (or HE if toggle), four choices.
- **Matching:** board up to 6 pairs; remaining pairs are dealt so a 10-question round is 10 attempts. Duplicate EN or HE labels are skipped (e.g. class/grade both כיתה).

Live source: public Google Sheet tab **`english`**, columns `english`, `עברית`, `קטגוריה`. Cached locally; fallback `src/data/vocab/packs.json`. Empty `packIds` = all groups; sentinel `__none__` = none. Pack picker: search + **הכל** (turning **הכל** off clears all).

**Dropped vs original sketch:** no on-start pack screen (settings instead), no visible spaced-repetition UI (local word stats may still exist for later).

## Sheets — later (scores)

**Decision unchanged: client-only writes.** Editors on the Sheet + Google Identity in the browser + Sheets API. No Apps Script, no Cloud Functions. Kids never see Google.

v1 already appends **session summaries** to a local outbox (`timestamp`, player, game, asked/correct, duration, `client_id`, coarse device). Parent corner does not sign in or flush yet.

When we turn this on:

1. Share a log Sheet: **Editor** for parent Google accounts; view-or-CSV for reads.
2. OAuth Web client ID; authorized origins = Pages URL + `localhost`.
3. Parent corner: GIS with Sheets scope; `spreadsheets.values.append`; drop published `client_id`s from the outbox.

Do not paste the family Sheet URL in the public README. Vocab **read** Sheet ID is already in the client for public CSV.

## Explicitly out of scope (until asked)

- Kid Google accounts, Firebase Hosting, mastery grid UI
- Settings cog on every screen, **סיימתי**, per-child session length
- Per-question rows in Sheets; using Sheets as live mastery
- Future games (addition, Hebrew reading, sibling challenge)

## Ship checklist

1. Push `main` to GitHub (`ypoler/kids-games` or similar).
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. After `Deploy GitHub Pages` succeeds, open `https://<user>.github.io/<repo>/`.
4. Add to Home Screen on iPad / phone; smoke-test Flex.
