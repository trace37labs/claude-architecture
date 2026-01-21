#!/usr/bin/env node

/**
 * Claude Architecture CLI
 * Main entry point for the command-line interface
 */

import { Command } from 'commander';

const program = new Command();

program
  .name('claude-arch')
  .description('5-layer configuration system for Claude Code')
  .version('0.1.0');

// Placeholder for future commands
program
  .command('version')
  .description('Show version information')
  .action(() => {
    console.log('claude-arch v0.1.0');
  });

program.parse(process.argv);
