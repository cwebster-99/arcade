# Universe demo — offline fallback for Act 1

The live demo uses real Copilot App Sentry data for Act 1 and a real Sentry dashboard for Act 2. Use this arcade setup **only if the real Sentry data can't be shown**, for example because there's no network, an account problem, or the data can't be shared. It tells the same Act 1 story against this app. v1.4.0 "shipped" a Time-To-First-Frame (TTFF) metric and Snake swipe controls, and the swipe controls crash on mobile. You paste the Sentry issue link into Copilot, the Sentry connector is auto-discovered, and Copilot finds the bug in `SnakeGame.tsx`.

> ⚠️ This file describes the planted bug. Don't point the agent at `demo/` during the demo.

## What's in the repo

| Piece | Location |
| --- | --- |
| Sentry init (does nothing unless `VITE_SENTRY_DSN` is set) | `src/utils/sentry.ts`, `src/main.tsx` |
| TTFF metric (Sentry span/measurement, plus an optional POST to `VITE_TELEMETRY_URL`) | `src/utils/telemetry.ts`, `GameLayout` in `src/App.tsx` |
| Snake touch controls (where the planted crash lives) | `src/components/SnakeGame.tsx` |
| Env template | `.env.example` |
| Sentry seeding script | `scripts/seed-sentry-crash.mjs` (`npm run seed:sentry`) |

The app version is **1.4.0** (`package.json`). The Sentry release is `arcade-games@1.4.0`.

## One-time setup

1. Create a free Sentry org at <https://sentry.io>, then create a **React** project named `arcade`.
2. In the repo root, run `npm install` and `cp .env.example .env`, then set:
   ```ini
   VITE_SENTRY_DSN=https://<key>@o<id>.ingest.sentry.io/<project>
   SENTRY_DSN=https://<key>@o<id>.ingest.sentry.io/<project>
   SENTRY_ORG=<your-org-slug>        # optional; used to print a direct link
   ```
3. Run `npm run seed:sentry`. To preview without sending anything, run `node scripts/seed-sentry-crash.mjs --dry-run`.
   - It sends 30 synthetic events for the touch crash on release `arcade-games@1.4.0`. They come from iOS Safari, iPadOS and Chrome Android, spread across 6 users, and their stack frames point at the real file and line.
   - It also sends 6 unrelated low-volume errors on 1.3.0: a Tetris `canPlace` TypeError and `ResizeObserver` noise.
   - The 30 crash events should group into one issue because their stack frames are identical. Events are timestamped over the last ~18 hours, so run the script again on the morning of the demo to keep the issue fresh.
   - Save the URL of the `TypeError … clientX` issue in `handleTouchEnd`.
4. Optional: run `npm run dev` with `VITE_SENTRY_DSN` set. To reproduce the crash for real, open Snake with Chrome DevTools device emulation (touch) and swipe on the board.

## Pre-demo checklist (fallback)

- [ ] The Sentry issue is fresh (run `npm run seed:sentry` again if it's older than a day), and its URL is on your clipboard or in your notes.
- [ ] **The Sentry connector is uninstalled or disconnected** in the Copilot App, so pasting the link triggers auto-discovery.
- [ ] The Sentry connector is signed in to the org that holds the `arcade` project.
- [ ] The repo is on the demo branch and the working tree is clean (`git status`).

## The planted crash

In `src/components/SnakeGame.tsx`, inside `handleTouchEnd`:

```ts
const touch = event.touches[0];
const dx = touch.clientX - start.x;   // touches is empty on touchend
```

During `touchend`, `event.touches` lists only the fingers that are still on the screen. When the last finger lifts, it's empty, so `touch` is `undefined`:

- Chrome Android: `TypeError: Cannot read properties of undefined (reading 'clientX')`
- iOS Safari: `TypeError: undefined is not an object (evaluating 'touch.clientX')`

Desktop and keyboard play are unaffected, and so are the existing tests. **The fix:** read `event.changedTouches[0]`. No code comment points out the bug.
