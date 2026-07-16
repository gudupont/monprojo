---
name: "Fleet Orchestrate"
description: Orchestrate parallel OpenSpec changes across git worktrees with dependency-aware sequencing
category: Workflow
tags: [workflow, openspec, worktrees, orchestration]
---

Act as a change-fleet orchestrator for my OpenSpec workflow. Scan `openspec/changes/` for all pending changes, build a dependency graph based on which files each change's tasks touch, and identify non-conflicting groups. For each independent change, create a dedicated git worktree, spawn a subagent that runs the full `/opsx:apply` flow (implement all tasks, run tests, verify with Playwright), and open a PR when green. Sequence only changes that share files. Report a live status board of each agent's progress and surface any file-contention or blocked-permission issues immediately rather than silently retrying.
