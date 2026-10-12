# Universe demo — setup & runbook

A ~10 minute GitHub Copilot App demo showing **Connectors**, **Computer Use**, **Image Generation**, and the **Library**, using this arcade app.

**Story:** we just "shipped" **v1.4.0**, which adds a Time-To-First-Frame (TTFF) metric and touch (swipe) controls for Snake.

- **Act 1, Sentry:** a mobile-only crash shows up in Sentry. You paste the Sentry issue link into Copilot, Copilot auto-discovers the **Sentry connector**, pulls the stack trace, and finds the bug in `SnakeGame.tsx`.
- **Act 2, Dashboard and Computer Use:** you ask Copilot to add a "TTFF by game" panel, filtered by app version, to the team dashboard through the **Arcade Telemetry connector** (MCP). Copilot opens the live dashboard with **Computer Use** to check it. The **first check fails** and the panel shows an error. Copilot fixes the query and checks again, and the panel renders.

> ⚠️ This file describes the planted behaviors. If the agent reads it during the live demo, the surprise is gone. Don't point the agent at `demo/`, and keep prompts focused on the app and the dashboard.

---

## What's in the repo

| Piece | Location |
| --- | --- |
| Sentry init (no-op unless `VITE_SENTRY_DSN` is set) | `src/utils/sentry.ts`, `src/main.tsx` |
| TTFF metric (Sentry span/measurement + optional POST to the dashboard) | `src/utils/telemetry.ts`, wired in `GameLayout` in `src/App.tsx` |
| Snake touch controls (contains the planted crash) | `src/components/SnakeGame.tsx` |
| Env template | `.env.example` |
| Sentry seeding script | `scripts/seed-sentry-crash.mjs` (`npm run seed:sentry`) |
| Local "Arcade Telemetry" dashboard | `demo/telemetry-dashboard/` (http://localhost:4319) |
| MCP connector for the dashboard | `demo/telemetry-dashboard/mcp-server/server.js` |

App version is **1.4.0** (`package.json`). Sentry release is `arcade-games@1.4.0`.

---

## One-time setup

### 1. Install

```bash
npm install                                   # app
cd demo/telemetry-dashboard && npm install    # dashboard and MCP server (needs Node 18+)
```

### 2. Create a Sentry project (free)

1. Sign up at <https://sentry.io> and create an org (the free Developer plan is enough).
2. Create a project: **Platform → React**. Name it `arcade`.
3. Open **Project Settings → Client Keys (DSN)** and copy the DSN.
4. In the repo root, run `cp .env.example .env`, then set:
   ```ini
   VITE_SENTRY_DSN=https://<key>@o<id>.ingest.sentry.io/<project>
   SENTRY_DSN=https://<key>@o<id>.ingest.sentry.io/<project>
   SENTRY_ORG=<your-org-slug>        # optional; used to print a direct link
   VITE_TELEMETRY_URL=http://localhost:4319/ingest
   ```

### 3. Seed the Sentry crash

```bash
npm run seed:sentry          # or: node scripts/seed-sentry-crash.mjs --dry-run
```

This sends 30 events for the 1.4.0 touch crash. They come from iOS Safari, iPadOS, and Chrome Android, across 6 users, with stack frames pointing at the real `src/components/SnakeGame.tsx` line. It also sends 6 unrelated low-volume errors on 1.3.0: a Tetris `canPlace` TypeError and `ResizeObserver` noise. The script prints an issues link. Open the `TypeError … clientX` issue in `handleTouchEnd` and **save that issue URL**, because you'll paste it in Act 1.

> The 30 events should group into one issue, because the stack frames are identical even though Safari and Chrome word the message differently. Seeded events are timestamped over the last ~18 hours. Re-run the script on the morning of the demo so the issue looks fresh.

### 4. Start the dashboard

```bash
cd demo/telemetry-dashboard
npm start                    # http://localhost:4319
```

Leave it running. The page auto-refreshes over server-sent events whenever `dashboard.json` changes or new events are ingested.

### 5. Register the MCP connector

Print the snippet with this machine's absolute path:

```bash
cd demo/telemetry-dashboard && npm run mcp:config
```

Merge the output into `~/.copilot/mcp-config.json` (Windows: `%USERPROFILE%\.copilot\mcp-config.json`):

```json
{
  "mcpServers": {
    "arcade-telemetry": {
      "type": "local",
      "command": "node",
      "args": ["<ABSOLUTE PATH>/demo/telemetry-dashboard/mcp-server/server.js"],
      "tools": ["*"]
    }
  }
}
```

Restart the Copilot App or CLI. You should see the `arcade-telemetry` tools: `get_dashboard`, `list_metrics`, `add_panel`, `update_panel`, and `remove_panel`. Run `npm run test:mcp` to smoke-test the server from the command line.

### 6. Dry run (optional, takes a few seconds)

With the dashboard running:

```bash
cd demo/telemetry-dashboard && npm run verify
```

This adds a panel through MCP using the legacy field and confirms the panel renders the error. It then fixes the panel, confirms data renders, checks `/ingest`, and **resets the dashboard**.

### (Optional) Live data from the app

With `VITE_SENTRY_DSN` and `VITE_TELEMETRY_URL` set, run `npm run dev`. Every game mount sends a TTFF event to Sentry (span `ui.render.first_frame` plus the `ttff_ms` measurement) and to the dashboard. To reproduce the crash for real, open Snake with Chrome DevTools device emulation (touch) and swipe on the board.

---

## Pre-demo reset checklist

Do these in order, about 10 minutes before you go on.

- [ ] **Reset the dashboard:** `cd demo/telemetry-dashboard && npm run reset`. This restores the pre-demo `dashboard.json` (5 panels, no TTFF panel) and clears ingested events. The open page updates by itself.
- [ ] **Dashboard server is running** (`npm start`) and http://localhost:4319 shows **Arcade — Game Health** with `App version = 1.4.0`.
- [ ] **Open the dashboard in a normal browser window** and leave it visible, so Computer Use can find it. Don't use a hidden tab.
- [ ] **Uninstall or disconnect the Sentry connector** in the Copilot App, so that pasting the Sentry link triggers **auto-discovery** in Act 1.
- [ ] **Arcade Telemetry MCP connector is registered** and its tools are listed in the app.
- [ ] **Sentry issue is fresh** (re-run `npm run seed:sentry` if it's older than a day) and the **issue URL is on your clipboard or in your notes**.
- [ ] **Image generation is enabled** in the Copilot App.
- [ ] **Computer Use is enabled** and has screen permissions.
- [ ] The repo is on the demo branch and the working tree is clean (`git status`).

---

## Planted behaviors (presenter only)

### 1. Mobile-only crash: Snake swipe controls

`src/components/SnakeGame.tsx`, in `handleTouchEnd`:

```ts
const touch = event.touches[0];
const dx = touch.clientX - start.x;   // 💥 touches is empty on touchend
```

During `touchend`, `event.touches` lists only the fingers that are *still* on the screen, so it's empty when the user lifts their finger. `touch` is `undefined`, which throws:

- Chrome Android: `TypeError: Cannot read properties of undefined (reading 'clientX')`
- iOS Safari: `TypeError: undefined is not an object (evaluating 'touch.clientX')`

Desktop and keyboard play is unaffected, and so are the existing tests. **The fix** is to read `event.changedTouches[0]`. There are no code comments flagging the bug.

### 2. Legacy `version` field trap: TTFF panel

The dashboard has a `$app_version` variable (a dropdown). The existing panels come from the older events pipeline and filter with a **legacy field name**:

```
metric=session_start | where version = $app_version | count by game
```

The `ttff_ms` events come from the new pipeline and only have **`app_version`**. This is how the trap plays out:

- `list_metrics` returns metric names only, with no field schemas. `add_panel` and `update_panel` **never validate** fields, so writes always succeed.
- An agent that copies the existing panels' pattern writes:
  `metric=ttff_ms | where version = $app_version | avg by game`
- The rendered dashboard shows that panel with a red border and:
  **`No data — unknown field 'version' for metric ttff_ms (did you mean app_version?)`**
  The error appears for every dropdown value, including "All".
- The error is visible **only** in the rendered UI, so the first Computer Use check fails on screen. Copilot then calls `update_panel` with
  `metric=ttff_ms | where app_version = $app_version | avg by game`, checks again, and the bars render. On 1.4.0, mobile TTFF has roughly tripled compared to 1.3.0.

### Data notes

`data/events.json` holds about 2,400 seeded events covering 14 days and versions 1.2.0, 1.3.0, and 1.4.0. They're regenerated deterministically by `npm run generate-data`, and timestamps are shifted at load time so the newest day is always "today". The 1.4.0 data shows a TTFF regression on mobile only, about 3.4×, and a spike in Snake errors on mobile.

---

## Query language reference

```
metric=<name> [| where <field> (=|!=) <value|$var|"quoted"> [and ...]] [| <agg>[(field)] [by <field>]]
```

- `agg` is one of `count` (the default), `avg`, `sum`, `min`, `max`, `p50`, `p90`, or `p95`. Numeric aggregations use `value`.
- `day` is a derived field (`YYYY-MM-DD`) that works with every metric, for example `count by day`.
- `viz` is one of `stat`, `bar`, `line`, or `table`. `width` is the number of grid columns out of 12.
- A variable set to `All` skips that filter, but field validation still applies.
- Ingest endpoint: `POST http://localhost:4319/ingest` with a JSON event or an array of events, each with a `metric` string.
