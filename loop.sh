#!/bin/bash
# Ralph Loop - Autonomous AI Development Loop
# Usage: ./loop.sh [mode] [max_iterations]
#   mode: "build" (default) or "plan"
#   max_iterations: number (optional, default unlimited)
#
# Examples:
#   ./loop.sh              # Build mode, unlimited
#   ./loop.sh 20           # Build mode, max 20 iterations
#   ./loop.sh plan         # Plan mode, unlimited
#   ./loop.sh plan 5       # Plan mode, max 5 iterations

set -e

# Parse arguments
MODE="build"
MAX_ITERATIONS=0

if [[ "$1" == "plan" ]]; then
    MODE="plan"
    MAX_ITERATIONS="${2:-0}"
elif [[ "$1" =~ ^[0-9]+$ ]]; then
    MAX_ITERATIONS="$1"
elif [[ -n "$1" ]]; then
    MODE="$1"
    MAX_ITERATIONS="${2:-0}"
fi

PROMPT_FILE="PROMPT_${MODE}.md"

# Verify prompt file exists
if [[ ! -f "$PROMPT_FILE" ]]; then
    echo "Error: $PROMPT_FILE not found in current directory"
    echo "Make sure you're in a project with Ralph Loop configured"
    exit 1
fi

echo "=== Ralph Loop Starting ==="
echo "Mode: $MODE"
echo "Prompt: $PROMPT_FILE"
echo "Max iterations: ${MAX_ITERATIONS:-unlimited}"
echo "==========================="
echo ""

ITERATION=0

while :; do
    ITERATION=$((ITERATION + 1))

    echo ""
    echo ">>> Iteration $ITERATION - $(date '+%Y-%m-%d %H:%M:%S') <<<"
    echo ""

    # Run Claude with the prompt file
    # -p: headless/non-interactive mode (reads from stdin)
    # --dangerously-skip-permissions: auto-approve tool calls (ONLY in sandboxed env!)
    # --output-format stream-json: structured logging for parsing
    cat "$PROMPT_FILE" | claude -p \
        --dangerously-skip-permissions \
        --verbose \
        --output-format stream-json \
        2>&1 | tee "ralph_iteration_${ITERATION}.log"

    EXIT_CODE=$?

    echo ""
    echo ">>> Iteration $ITERATION completed (exit: $EXIT_CODE) <<<"

    # Check iteration limit
    if [[ $MAX_ITERATIONS -gt 0 && $ITERATION -ge $MAX_ITERATIONS ]]; then
        echo ""
        echo "=== Reached max iterations ($MAX_ITERATIONS) ==="
        break
    fi

    # Small pause to allow manual interrupt (Ctrl+C)
    sleep 2
done

echo ""
echo "=== Ralph Loop Finished ==="
echo "Total iterations: $ITERATION"
