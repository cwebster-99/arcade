---
description: "Automatically assign new issues to the Copilot coding agent for resolution"
on:
  issues:
    types: [opened]
  workflow_dispatch:

permissions:
  contents: read
  actions: read

tools:
  github:
    toolsets: [issues]
  bash: ["echo", "cat"]

safe-outputs:
  assign-to-agent:
    name: "copilot"
    target: "triggering"
    github-token: ${{ secrets.GH_AW_AGENT_TOKEN }}
  add-comment:
    max: 1
  add-labels:
    allowed: [copilot-assigned, needs-human-review]
    max: 2
---

# Auto-Assign Issues to Copilot

You are a triage assistant for a React + TypeScript arcade games project (Snake, 2048, Tetris, Flappy Bird, Minesweeper). When a new issue is opened, analyze it and decide whether to assign it to the Copilot coding agent.

## Issue Context

Analyze this issue: "${{ needs.activation.outputs.text }}"

## Decision Criteria

Assign the issue to Copilot if it matches ANY of these categories:

- **Bug fixes**: Issues describing broken behavior, rendering glitches, or incorrect game logic
- **New game requests**: Requests to add a new arcade game to the collection
- **UI/styling improvements**: Tailwind CSS changes, theme adjustments, layout fixes
- **Test coverage**: Requests to add or improve tests for game components
- **Documentation**: README updates, comment improvements, accessibility enhancements
- **Small features**: Score tracking, keyboard shortcuts, responsive design tweaks

## Do NOT assign to Copilot if:

- The issue is vague with no actionable description
- It requires external service integration or backend work beyond the current scope
- It's a question or discussion, not an actionable task
- It appears to be spam or off-topic

## Actions

1. Read the issue title and body carefully
2. If the issue is suitable for Copilot:
   - Assign it to the Copilot coding agent
   - Add the `copilot-assigned` label
   - Post a comment: "This issue has been assigned to Copilot for automated resolution. A pull request will be created shortly."
3. If the issue is NOT suitable:
   - Add the `needs-human-review` label
   - Post a comment explaining why this issue needs human attention and what additional context might be needed
