#!/usr/bin/env node

/**
 * Claude Architecture CLI
 * Main entry point for the command-line interface
 */

import { Command } from 'commander';
import { initCommand } from './commands/init';
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

// Version command (kept for backward compatibility)
program
  .command('version')
  .description('Show version information')
  .action(() => {
    console.log('claude-arch v0.1.0');
  });

program.parse(process.argv);
