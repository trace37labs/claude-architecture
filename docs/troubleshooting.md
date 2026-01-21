# Troubleshooting Guide

> Solutions to common issues when using claude-arch and the 5-layer architecture.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Migration Issues](#migration-issues)
- [Validation Errors](#validation-errors)
- [MCP Integration Issues](#mcp-integration-issues)
- [Performance Problems](#performance-problems)
- [Common Errors](#common-errors)
- [Getting Help](#getting-help)

---

## Installation Issues

### Issue: `npm install -g claude-arch` fails

**Symptoms**:
```
npm ERR! code EACCES
npm ERR! syscall access
npm ERR! path /usr/local/lib/node_modules
npm ERR! errno -13
```

**Cause**: No permission to write to global npm directory.

**Solutions**:

**Option 1: Use npx** (no installation):
```bash
npx claude-arch --version
```

**Option 2: Fix npm permissions**:
```bash
# macOS/Linux
sudo chown -R $USER /usr/local/lib/node_modules
npm install -g claude-arch
```

**Option 3: Use nvm** (recommended):
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node via nvm
nvm install node

# Now install globally
npm install -g claude-arch
```

---

### Issue: Command not found after installation

**Symptoms**:
```bash
claude-arch --version
# bash: claude-arch: command not found
```

**Cause**: Global npm bin directory not in PATH.

**Solution**:

1. Find npm bin directory:
   ```bash
   npm bin -g
   # Output: /usr/local/bin (or similar)
   ```

2. Add to PATH:
   ```bash
   # In ~/.bashrc or ~/.zshrc
   export PATH="$PATH:$(npm bin -g)"
   ```

3. Reload shell:
   ```bash
   source ~/.bashrc  # or ~/.zshrc
   ```

4. Verify:
   ```bash
   claude-arch --version
   ```

---

### Issue: Wrong Node.js version

**Symptoms**:
```
Error: Requires Node.js >= 18.0.0
Current version: 16.14.0
```

**Cause**: Node.js version too old.

**Solution**:

```bash
# Check current version
node --version

# Install latest via nvm
nvm install node
nvm use node

# Or update via package manager
# macOS:
brew upgrade node

# Ubuntu:
sudo apt update
sudo apt install nodejs
```

---

## Migration Issues

### Issue: Migration creates empty files

**Symptoms**:
```bash
claude-arch migrate
# Creates .claude/ but all files are empty
```

**Cause**: No CLAUDE.md found or file is empty.

**Solutions**:

1. **Check CLAUDE.md exists**:
   ```bash
   ls -la CLAUDE.md
   ```

2. **Specify path explicitly**:
   ```bash
   claude-arch migrate --from ./path/to/CLAUDE.md
   ```

3. **Check file is not empty**:
   ```bash
   wc -l CLAUDE.md
   # Should show > 0 lines
   ```

---

### Issue: Content classified to wrong layer

**Symptoms**:
```
Workflow ended up in knowledge/ instead of methods/
```

**Cause**: Heuristics didn't match content type.

**Solutions**:

**Option 1: Add layer hints** in CLAUDE.md:
```markdown
<!-- LAYER: METHODS -->
## Deployment Workflow
Run `npm run deploy`
```

**Option 2: Move manually** after migration:
```bash
mv .claude/knowledge/workflow.md .claude/methods/workflow.md
claude-arch validate
```

**Option 3: Edit source** and re-migrate:
```bash
# Add more specific keywords to CLAUDE.md
# "workflow", "process", "how to" → triggers methods/

claude-arch migrate --force
```

---

### Issue: Migration overwrites existing .claude/

**Symptoms**:
```
Error: .claude/ already exists. Use --force to overwrite.
```

**Cause**: Safety feature to prevent accidental overwrites.

**Solutions**:

**Option 1: Backup first**:
```bash
mv .claude/ .claude.backup/
claude-arch migrate
```

**Option 2: Use --force**:
```bash
claude-arch migrate --force
```

**Option 3: Merge manually**:
```bash
# Migrate to temp directory
claude-arch migrate --to .claude-new/

# Merge manually
cp .claude-new/rules/* .claude/rules/
# ... repeat for other layers

# Remove temp
rm -rf .claude-new/
```

---

### Issue: Large CLAUDE.md creates huge files

**Symptoms**:
```
.claude/knowledge.md is 2000 lines
```

**Cause**: All unclassified content goes to knowledge/.

**Solutions**:

1. **Use full structure** (creates subdirectories):
   ```bash
   claude-arch migrate --full
   ```

2. **Manually split** after migration:
   ```bash
   mkdir .claude/knowledge/architecture/
   # Move sections to separate files
   claude-arch validate
   ```

3. **Add hints** to improve classification:
   ```markdown
   <!-- LAYER: METHODS -->
   ## API Patterns
   ...

   <!-- LAYER: RULES -->
   ## Security Rules
   ...
   ```

---

## Validation Errors

### Issue: "Missing required layer" error

**Symptoms**:
```
✗ Validation failed: Missing required layer 'rules'
```

**Cause**: Required layer directory/file doesn't exist.

**Solutions**:

**For minimal structure**:
```bash
touch .claude/rules.md
echo "# Rules\n\nNo specific rules yet." > .claude/rules.md
claude-arch validate
```

**For full structure**:
```bash
mkdir -p .claude/rules
echo "# Rules\n\nNo specific rules yet." > .claude/rules/README.md
claude-arch validate
```

---

### Issue: "Invalid markdown syntax" error

**Symptoms**:
```
✗ Validation failed: .claude/methods.md has syntax errors
  Line 42: Unclosed code block
```

**Cause**: Malformed markdown.

**Solutions**:

1. **Find the error**:
   ```bash
   claude-arch validate --verbose
   # Shows exact line number
   ```

2. **Fix syntax**:
   ```bash
   # Open in editor
   code .claude/methods.md

   # Jump to line 42
   # Fix unclosed code block (add closing ```)
   ```

3. **Validate again**:
   ```bash
   claude-arch validate
   ```

**Common syntax errors**:
- Unclosed code blocks: ` ``` ` without closing ` ``` `
- Unclosed links: `[text](url` missing `)`
- Invalid headings: `#Header` (missing space: `# Header`)

---

### Issue: "Schema validation failed" error

**Symptoms**:
```
✗ Validation failed: .claude/tools/mcp.yaml does not match schema
```

**Cause**: YAML structure doesn't match expected format.

**Solutions**:

1. **Check schema**:
   ```bash
   claude-arch validate --verbose
   # Shows expected vs actual structure
   ```

2. **Fix YAML**:
   ```yaml
   # Expected format:
   servers:
     - name: github
       description: GitHub operations
       command: npx
       args: ["-y", "@modelcontextprotocol/server-github"]
   ```

3. **Validate YAML syntax**:
   ```bash
   # Use online validator or:
   npm install -g js-yaml
   js-yaml .claude/tools/mcp.yaml
   ```

---

### Issue: Validation passes but config not working

**Symptoms**:
```bash
claude-arch validate
# ✓ All checks passed

# But Claude Code doesn't see the config
```

**Cause**: File exists but is empty or malformed.

**Solutions**:

1. **Check file contents**:
   ```bash
   cat .claude/methods.md
   # Should have actual content
   ```

2. **Test config resolution**:
   ```bash
   claude-arch show --format json
   # Should show your content
   ```

3. **Check MCP integration**:
   ```bash
   # Verify MCP server is running
   claude-arch-mcp  # Should not error
   ```

---

## MCP Integration Issues

### Issue: MCP server not found

**Symptoms**:
```
Error: MCP server 'claude-arch-mcp' not found
```

**Cause**: Server not added to Claude Code config.

**Solutions**:

1. **Add MCP server**:
   ```bash
   claude mcp add claude-arch -- npx -y claude-arch-mcp
   ```

2. **Verify addition**:
   ```bash
   claude mcp list
   # Should show 'claude-arch'
   ```

3. **Restart Claude Code**:
   ```bash
   # Restart Claude Code application
   ```

---

### Issue: MCP tools not available in Claude

**Symptoms**:
```
Claude Code doesn't show resolve-config, validate-structure, etc.
```

**Cause**: MCP server not started or crashed.

**Solutions**:

1. **Check MCP server status**:
   ```bash
   # In Claude Code, check MCP servers panel
   # or
   claude-arch-mcp  # Run manually to see errors
   ```

2. **Check logs**:
   ```bash
   # Claude Code logs (macOS):
   tail -f ~/Library/Logs/Claude/main.log

   # Look for MCP-related errors
   ```

3. **Reinstall**:
   ```bash
   npm uninstall -g claude-arch
   npm install -g claude-arch
   claude mcp remove claude-arch
   claude mcp add claude-arch -- npx -y claude-arch-mcp
   ```

---

### Issue: MCP tools return errors

**Symptoms**:
```
Error calling resolve-config: Cannot read property 'rules' of undefined
```

**Cause**: Invalid .claude/ structure or missing files.

**Solutions**:

1. **Validate structure**:
   ```bash
   claude-arch validate --verbose
   ```

2. **Fix errors** reported by validation

3. **Test manually**:
   ```bash
   claude-arch show
   # Should work without errors
   ```

4. **Retry MCP tool** in Claude Code

---

## Performance Problems

### Issue: `claude-arch show` is slow

**Symptoms**:
```bash
claude-arch show
# Takes 5+ seconds
```

**Cause**: Many large files or deep hierarchy.

**Solutions**:

1. **Split large files**:
   ```bash
   # Split files over 200 lines into subdirectories
   wc -l .claude/**/*.md
   # Identify large files

   # Split them:
   mkdir .claude/methods/workflows/
   # Move sections to separate files
   ```

2. **Reduce file count**:
   ```bash
   # Combine related small files
   cat .claude/methods/workflow-*.md > .claude/methods/workflows.md
   rm .claude/methods/workflow-*.md
   ```

3. **Use specific scope**:
   ```bash
   # Only resolve project scope (faster)
   claude-arch show --scope project
   ```

4. **Clear cache** (if corrupted):
   ```bash
   rm -rf ~/.claude-arch-cache/
   claude-arch show
   ```

---

### Issue: High memory usage

**Symptoms**:
```
Node.js heap out of memory
```

**Cause**: Very large configuration files.

**Solutions**:

1. **Increase Node.js heap**:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   claude-arch show
   ```

2. **Split large files** (see above)

3. **Use minimal structure**:
   ```bash
   # Convert full → minimal
   claude-arch migrate --to-minimal
   ```

---

## Common Errors

### Error: "ENOENT: no such file or directory"

**Symptoms**:
```
Error: ENOENT: no such file or directory, open '.claude/rules.md'
```

**Cause**: File referenced but doesn't exist.

**Solutions**:

1. **Create missing file**:
   ```bash
   touch .claude/rules.md
   echo "# Rules" > .claude/rules.md
   ```

2. **Or use full structure**:
   ```bash
   mkdir -p .claude/rules
   touch .claude/rules/README.md
   ```

---

### Error: "YAML parse error"

**Symptoms**:
```
YAMLException: bad indentation of a mapping entry at line 5
```

**Cause**: Invalid YAML syntax.

**Solutions**:

1. **Check indentation** (YAML is whitespace-sensitive):
   ```yaml
   # Bad:
   servers:
   - name: github    # Wrong indentation

   # Good:
   servers:
     - name: github  # Correct indentation
   ```

2. **Validate YAML**:
   ```bash
   npm install -g js-yaml
   js-yaml .claude/tools/mcp.yaml
   ```

3. **Use YAML linter**:
   ```bash
   npm install -g yaml-lint
   yamllint .claude/tools/mcp.yaml
   ```

---

### Error: "Cannot merge configs: conflicting types"

**Symptoms**:
```
Error: Cannot merge configs: rules is object in project but array in user
```

**Cause**: Same key has different types in different scopes.

**Solutions**:

1. **Make types consistent**:
   ```yaml
   # Both should be arrays or both objects
   # Project (.claude/rules.yaml):
   rules:
     - security
     - code-standards

   # User (~/.claude/rules.yaml):
   rules:
     - personal-style   # Also array
   ```

2. **Or use different keys**:
   ```yaml
   # Project:
   team_rules:
     - security

   # User:
   personal_rules:
     - style
   ```

---

### Error: "Permission denied"

**Symptoms**:
```
Error: EACCES: permission denied, mkdir '.claude'
```

**Cause**: No write permission to current directory.

**Solutions**:

1. **Check permissions**:
   ```bash
   ls -la .
   # Should show write permissions for current user
   ```

2. **Fix permissions**:
   ```bash
   chmod u+w .
   ```

3. **Or run with sudo** (not recommended):
   ```bash
   sudo claude-arch init
   ```

---

### Error: "Invalid JSON output"

**Symptoms**:
```
SyntaxError: Unexpected token in JSON at position 0
```

**Cause**: JSON output is malformed or truncated.

**Solutions**:

1. **Check output**:
   ```bash
   claude-arch show --format json > config.json
   cat config.json
   # Should be valid JSON
   ```

2. **Validate JSON**:
   ```bash
   cat config.json | jq .
   # jq will show syntax errors
   ```

3. **Regenerate**:
   ```bash
   rm config.json
   claude-arch show --format json > config.json
   ```

---

## Getting Help

### Debug Mode

Run commands with verbose output:

```bash
# Verbose validation
claude-arch validate --verbose

# Debug mode (if supported)
DEBUG=* claude-arch show
```

### Check Logs

```bash
# macOS
tail -f ~/Library/Logs/claude-arch/debug.log

# Linux
tail -f ~/.local/share/claude-arch/debug.log

# Windows
type %APPDATA%\claude-arch\debug.log
```

### Run Doctor

```bash
# Health check with recommendations
claude-arch doctor --verbose
```

### Verify Installation

```bash
# Check version
claude-arch --version

# Check Node.js version
node --version

# Check npm version
npm --version
```

### Test in Isolation

Create a minimal test case:

```bash
# Create test directory
mkdir /tmp/claude-arch-test
cd /tmp/claude-arch-test

# Initialize
claude-arch init

# Test commands
claude-arch validate
claude-arch show

# If this works, issue is in your project config
# If this fails, issue is with installation
```

### Search Issues

Before reporting a bug, search existing issues:

1. **GitHub Issues**: https://github.com/yourusername/claude-architecture/issues
2. **Search for error message**
3. **Check closed issues** (may already be fixed)

### Report a Bug

If you can't find a solution:

1. **Create minimal reproduction**:
   ```bash
   # Minimum files to reproduce issue
   .claude/
   └── rules.md  # Only what's needed
   ```

2. **Gather information**:
   ```bash
   # Version info
   claude-arch --version
   node --version
   npm --version

   # OS info
   uname -a  # Linux/macOS
   ver       # Windows
   ```

3. **Open issue** with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Version information
   - Error messages

---

## Quick Reference

### Common Commands for Debugging

```bash
# Validate structure
claude-arch validate --verbose

# Show merged config
claude-arch show --format json

# Health check
claude-arch doctor

# Test migration
claude-arch migrate --dry-run

# Clear cache
rm -rf ~/.claude-arch-cache/

# Reinstall
npm uninstall -g claude-arch
npm install -g claude-arch
```

### Common File Issues

```bash
# Check file exists
ls -la .claude/rules.md

# Check file is not empty
wc -l .claude/rules.md

# Check file encoding
file .claude/rules.md  # Should show "UTF-8 Unicode text"

# Check permissions
ls -l .claude/rules.md  # Should show readable/writable
```

### Common Structure Issues

```bash
# Check directory structure
tree .claude/

# Verify all layers present
ls .claude/
# Should show: rules, tools, methods, knowledge, goals

# Check for invalid files
find .claude/ -type f ! -name "*.md" ! -name "*.yaml"
# Should only show markdown/YAML files
```

---

**Still stuck?** See [User Guide](./user-guide.md) or [open an issue](https://github.com/yourusername/claude-architecture/issues).
