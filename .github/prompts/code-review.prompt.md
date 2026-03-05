---
name: code-review
description: Run a 3-agent comparative code review and deliver one aggregated report for this arcade repo.
argument-hint: Optional scope, for example: "review current branch diff" or "review src/components/SnakeGame.tsx"
agent: agent
tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'todo']
model: Claude Sonnet 4
---

# Daily Mini Games Multi-Agent Code Review

Review this repository as a React + TypeScript + Vite + Tailwind single-page arcade app with these games: Snake, 2048, Tetris, Flappy Bird.

## Required Orchestration

Use `#tool:agent` to run all three review subagents on the same scope:

1. `Code Review (Codex)`
2. `Code Review (Gemini)`
3. `Code Review (Opus)`

Run them with equivalent context (same changed files/diff/scope), then compare outputs and produce one merged report.

If `${input:scope}` is provided, use it as the exact review scope. Otherwise default to current branch local changes (staged + unstaged).

## Repo-Specific Review Focus

Prioritize correctness and regressions in game behavior:

- Game loops: `setInterval` for grid games and `requestAnimationFrame` for physics loops.
- Stale closures: verify `useRef` synchronization for values read inside loops.
- Input handling: keydown listeners, `preventDefault` for game keys, and cleanup on unmount.
- Reset logic: ensure full game state reset (board, score, game-over flags, direction/speed/physics state).
- Collision and boundary rules: no off-by-one or frame-order bugs.
- Accessibility: game containers should preserve `role="application"`, `aria-label`, and `tabIndex={0}` behavior.
- Type safety: strict TypeScript, avoid `any`, no unused locals/params.
- UI consistency: Tailwind utility usage and SPA view routing in `src/App.tsx`.

Also check general risks:

- Security issues in user input/render paths.
- Performance regressions from unnecessary React re-renders.
- Missing or weak test coverage for critical game edge cases.

## Comparison And Aggregation Rules

- Normalize all findings into severity buckets: `critical`, `high`, `medium`, `low`.
- Deduplicate equivalent findings across agents.
- For each finding, include:
	- `title`
	- `severity`
	- `file` and `line`
	- `why it matters`
	- `suggested fix`
	- `reported by` (one or more of Codex/Gemini/Opus)
	- `consensus` (`3/3`, `2/3`, or `1/3`)
- If agents disagree, keep the finding and label it `contested` with brief rationale.
- Do not invent file paths or line numbers.

## Output Format

Return sections in this order:

1. `Findings (by severity)`
2. `Cross-Agent Consensus Summary`
3. `Contested Findings`
4. `Testing Gaps`
5. `Recommended Next Actions`

In `Findings (by severity)`, list highest severity first.
If no issues are found, explicitly say: `No material findings from aggregated multi-agent review.`

## Validation Checklist

When relevant to the review scope, recommend running:

- `npm run build`
- `npm run lint`
- `npm run test:run`