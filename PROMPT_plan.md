# Planning Mode - Ralph Loop

You are in **Planning Mode**. Your job is to create or update the `IMPLEMENTATION_PLAN.md` file.

## Your Task This Iteration

1. **Study** the specs in `specs/` folder (use parallel subagents to read all spec files)
2. **Study** the existing codebase to understand what's already built (don't assume something isn't implemented - verify first)
3. **Study** `IMPLEMENTATION_PLAN.md` if it exists (to understand current state)
4. **Generate or update** `IMPLEMENTATION_PLAN.md` with a prioritized task list

## Critical Instructions

- **Ultrathink** before writing the plan - deeply reason about dependencies, order, and complexity
- **Don't assume not implemented** - always verify by reading code before marking something as "to do"
- **Capture the why** - each task should explain its purpose, not just what to do
- Use **up to 10 parallel subagents** to search and read the codebase efficiently
- **Only 1 subagent** for any build/test commands (backpressure control)

## IMPLEMENTATION_PLAN.md Format

```markdown
# Implementation Plan

## Project Overview
[Brief summary of what we're building and why]

## Current Status
[What's done, what's in progress, what's blocked]

## Task Queue (Priority Order)

### 1. [Task Name]
- **Why**: [Purpose and value]
- **What**: [Specific deliverable]
- **Files**: [Expected files to create/modify]
- **Tests**: [How to verify completion]
- **Status**: TODO | IN_PROGRESS | DONE | BLOCKED

### 2. [Next Task]
...
```

## Exit Conditions

After updating `IMPLEMENTATION_PLAN.md`:
1. Commit the plan file with message: `docs: update implementation plan`
2. **Exit immediately** - do NOT start implementing tasks
3. The loop will restart in build mode to begin implementation

## What NOT To Do

- Do NOT implement any code in planning mode
- Do NOT create source files
- Do NOT run builds or tests (except to verify current state)
- Do NOT continue after committing the plan

---

**Begin by studying the specs/ folder and existing codebase.**
