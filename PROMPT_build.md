# Build Mode - Ralph Loop

You are in **Build Mode**. Your job is to complete ONE task from `IMPLEMENTATION_PLAN.md`.

## Your Task This Iteration

1. **Study** `IMPLEMENTATION_PLAN.md` to understand the current state
2. **Select** the highest-priority task with status `TODO`
3. **Study** the codebase to understand existing patterns (don't assume not implemented)
4. **Implement** that ONE task completely
5. **Run tests** - they MUST pass before you can commit
6. **Commit** your changes with a meaningful message
7. **Update** `IMPLEMENTATION_PLAN.md` to mark the task as `DONE`
8. **Exit** immediately

## Critical Instructions

- **Ultrathink** before coding - plan your approach, consider edge cases
- **Don't assume not implemented** - always verify by reading existing code first
- **One task only** - resist the urge to fix other things you notice
- Use **up to 10 parallel subagents** to search and read the codebase
- Use **only 1 subagent** for build/test commands (backpressure control)
- **Keep AGENTS.md up to date** if you discover useful operational procedures

## Backpressure Loop (Inner Loop)

If tests fail:
1. Study the failure output
2. Fix the issue
3. Run tests again
4. Repeat until tests pass
5. Only THEN commit

Do NOT commit with failing tests. Do NOT skip tests.

## Commit Message Format

```
type: brief description

- Detail 1
- Detail 2

Why: [capture the reasoning]
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

## Exit Conditions

After completing your ONE task:
1. Tests pass ✓
2. Changes committed ✓
3. `IMPLEMENTATION_PLAN.md` updated (task marked DONE) ✓
4. **Exit immediately** - the loop will restart with fresh context

## What NOT To Do

- Do NOT work on multiple tasks
- Do NOT commit with failing tests
- Do NOT continue after committing your task
- Do NOT refactor unrelated code (note it in plan for later)
- Do NOT skip updating the plan file

## If No Tasks Remain

If all tasks in `IMPLEMENTATION_PLAN.md` are `DONE`:
1. Add a note: `## All Tasks Complete - [date]`
2. Commit: `docs: mark implementation complete`
3. Exit - the human will review and decide next steps

---

**Begin by studying IMPLEMENTATION_PLAN.md and selecting the top priority TODO task.**
