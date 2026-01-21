#!/usr/bin/env node

/**
 * Claude Architecture CLI
 * Main entry point for the command-line interface
 */

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { migrateCommand } from './commands/migrate';
import { validateCommand } from './commands/validate';
import { showCommand } from './commands/show';
import { doctorCommand } from './commands/doctor';
import { logger } from './utils/logger';

const program = new Command();

program
  .name('claude-arch')
  .description('5-layer configuration system for Claude Code')
  .version('0.1.0');

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
  .option('-f, --format <type>', 'Display format: tree, precedence, or json (default: tree)')
  .option('-l, --layer <layer>', 'Show specific layer only')
  .option('-v, --verbose', 'Verbose output with full details')
  .option('-c, --compact', 'Compact output (minimal)')
  .option('--no-color', 'Disable color output')
  .option('--show-empty', 'Show empty layers/scopes')
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

// Version command (kept for backward compatibility)
program
  .command('version')
  .description('Show version information')
  .action(() => {
    console.log('claude-arch v0.1.0');
  });

program.parse(process.argv);
