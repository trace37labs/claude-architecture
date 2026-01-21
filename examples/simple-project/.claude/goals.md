# Goals Layer

> **Layer 5**: Current objectives, tasks, and success criteria

## Current Sprint (Week of 2026-01-21)

### Primary Goal
Implement `validate` command that checks input files against rules

### Success Criteria
- [ ] Command accepts file path argument
- [ ] Validates against Zod schema
- [ ] Reports clear error messages
- [ ] Returns exit code 0 on success, 1 on failure
- [ ] Has 100% test coverage

## This Session

**Objective**: Add input validation to the `process` command

**Context**: Currently the process command doesn't validate input, leading to runtime errors.

**Acceptance Criteria**:
1. Add Zod schema for input structure
2. Validate before processing
3. Return helpful error messages
4. Add tests for invalid inputs

## Backlog

### Next Sprint
- Add `--format` flag for JSON/YAML output
- Implement configuration file support
- Add progress indicators for long operations

### Future
- Add plugin system for custom validators
- Support batch file processing
- Create interactive mode with prompts

## Blockers

None currently

## Notes

- User requested better error messages in GitHub issue #42
- Performance is acceptable (<100ms for typical files)
- Consider adding `--watch` mode in future
