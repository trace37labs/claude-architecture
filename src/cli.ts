#!/usr/bin/env node

/**
 * Claude Architecture CLI
 * Main entry point for the command-line interface
 */

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { migrateCommand } from './commands/migrate.js';
import { validateCommand } from './commands/validate.js';
import { showCommand } from './commands/show.js';
import { doctorCommand } from './commands/doctor.js';
import { exportCommand } from './commands/export.js';
import { gapsCommand } from './commands/gaps.js';
import { treeCommand } from './commands/tree.js';
import { logger } from './utils/logger.js';

const program = new Command();

program
  .name('claude-arch')
  .description('5-layer configuration system for Claude Code')
  .version('0.1.11');

// Init command
program
  .command('init')
  .description('Initialize .claude/ directory structure')
  .option('-m, --minimal', 'Create minimal structure (single files)')
  .option('-d, --target-dir <path>', 'Target directory (default: current)')
  .option('-f, --force', 'Overwrite existing .claude/ directory')
  .option('--dry-run', 'Show what would be created without creating')
  .action(async (options) => {
    try {
      await initCommand(options);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      } else {
        logger.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

// Migrate command
program
  .command('migrate')
  .description('Migrate CLAUDE.md/AGENTS.md to new .claude/ structure')
  .option('-s, --source-dir <path>', 'Source directory with CLAUDE.md (default: current)')
  .option('-t, --target-dir <path>', 'Target directory for .claude/ (default: source)')
  .option('-m, --minimal', 'Create minimal structure (single files)')
  .option('-f, --force', 'Overwrite existing .claude/ directory')
  .option('-b, --backup', 'Backup original files before migration')
  .option('--dry-run', 'Show what would be migrated without migrating')
  .option('--all', 'Migrate all configuration sources (MCP, hooks, skills, memory)')
  .option('--source <type>', 'Migrate specific source: mcp, hooks, skills, or memory')
  .action(async (options) => {
    try {
      await migrateCommand(options);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      } else {
        logger.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate .claude/ directory structure and contents')
  .option('-t, --target-dir <path>', 'Directory to validate (default: current)')
  .option('--structure-only', 'Only validate structure, skip schema validation')
  .option('-v, --verbose', 'Verbose output with detailed errors and suggestions')
  .option('--check-all-sources', 'Check all configuration sources, not just .claude/')
  .option('--json', 'Output validation report as JSON')
  .action(async (options) => {
    try {
      const report = await validateCommand(options);
      if (!report.valid) {
        process.exit(1);
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      } else {
        logger.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

// Show command
program
  .command('show')
  .description('Display active configuration with source attribution')
  .option('-t, --target-dir <path>', 'Directory to show config for (default: current)')
  .option('-f, --format <type>', 'Display format: tree, precedence, json, or unified (default: tree)')
  .option('-s, --scope <scope>', 'Show specific scope only: user, project, task, or system')
  .option('-l, --layer <layer>', 'Show specific layer only')
  .option('-v, --verbose', 'Verbose output with full details')
  .option('-c, --compact', 'Compact output (minimal)')
  .option('--no-color', 'Disable color output')
  .option('--show-empty', 'Show empty layers/scopes')
  .option('--show-sources', 'Show all configuration sources (enables unified format)')
  .action(async (options) => {
    try {
      await showCommand(options);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      } else {
        logger.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

// Doctor command
program
  .command('doctor')
  .description('Health check for configuration - detects conflicts and suggests improvements')
  .option('-t, --target-dir <path>', 'Directory to analyze (default: current)')
  .option('-v, --verbose', 'Show detailed conflict information')
  .option('--errors-only', 'Only show errors (no warnings or info)')
  .option('-r, --recommendations', 'Show recommendations for improvement')
  .option('--quick-wins', 'Show only quick wins (high impact, easy fixes)')
  .option('-f, --format <type>', 'Output format: text or json (default: text)')
  .option('--no-color', 'Disable color output')
  .action(async (options) => {
    try {
      const report = await doctorCommand(options);
      // Exit with error code if health is critical or has errors
      if (report.assessment === 'critical' || report.conflicts.bySeverity.errors.length > 0) {
        process.exit(1);
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      } else {
        logger.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

// Export command
program
  .command('export')
  .description('Export portable requirements manifest')
  .option('-o, --output <file>', 'Output file (default: manifest.yaml)')
  .option('-p, --platform <platform>', 'Target platform: darwin, linux, or windows')
  .option('-e, --env <environment>', 'Target environment hints')
  .option('--json', 'Output as JSON instead of YAML')
  .option('--generate-setup', 'Generate setup.sh script alongside manifest')
  .option('-t, --target-dir <path>', 'Directory to export from (default: current)')
  .action(async (options) => {
    try {
      await exportCommand(options);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      } else {
        logger.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

// Gaps command
program
  .command('gaps')
  .description('Analyze gaps between manifest and current environment')
  .option('-m, --manifest <file>', 'Manifest file to check against')
  .option('-f, --from <path>', 'Source project to compare against')
  .option('--fix', 'Show install commands for missing items')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      await gapsCommand(options);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      } else {
        logger.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

// Tree command
program
  .command('tree')
  .description('Display .claude/ directory structure as a visual tree')
  .option('-t, --target-dir <path>', 'Directory to show tree for (default: current)')
  .option('-d, --depth <number>', 'Maximum depth to traverse (default: 10)')
  .option('-a, --all', 'Show hidden files')
  .option('-s, --size', 'Show file sizes')
  .option('--no-color', 'Disable color output')
  .action(async (options) => {
    try {
      await treeCommand({
        ...options,
        depth: options.depth ? parseInt(options.depth, 10) : undefined,
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      } else {
        logger.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

// Version command (kept for backward compatibility)
program
  .command('version')
  .description('Show version information')
  .action(() => {
  console.log('claude-arch v0.1.10');
  });

program.parse(process.argv);
