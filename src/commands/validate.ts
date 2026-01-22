/**
 * Validate Command
 *
 * Validates that .claude/ directory structure and contents follow the specification.
 * Checks directory structure, file schemas, and configuration validity.
 */

import path from 'path';
import { logger } from '../utils/logger.js';
import { validateStructure, type StructureValidationResult } from '../validators/structure.js';
import { validateSchemas, type SchemaValidationResult } from '../validators/schema.js';
import { scanAllConfigSources } from '../scanner.js';
import type { ConfigSources } from '../types/sources.js';
import { existsSync } from 'fs';

export interface ValidateOptions {
  /** Directory to validate (default: current directory) */
  targetDir?: string;
  /** Only validate structure, skip schema validation */
  structureOnly?: boolean;
  /** Verbose output */
  verbose?: boolean;
  /** Check all configuration sources, not just .claude/ */
  checkAllSources?: boolean;
  /** Output validation report as JSON */
  json?: boolean;
}

export interface ValidationReport {
  /** Overall validation result */
  valid: boolean;
  /** Structure validation result */
  structure: StructureValidationResult;
  /** Schema validation result (if performed) */
  schema?: SchemaValidationResult;
  /** Total errors */
  totalErrors: number;
  /** Total warnings */
  totalWarnings: number;
  /** Source validation issues (if checkAllSources enabled) */
  sourceIssues?: Array<{
    type: 'error' | 'warning';
    source: string;
    message: string;
    suggestion?: string;
  }>;
}

/**
 * Validate .claude/ directory structure and contents
 */
export async function validateCommand(options: ValidateOptions = {}): Promise<ValidationReport> {
  const targetDir = options.targetDir || process.cwd();
  const claudeDir = path.join(targetDir, '.claude');

  // Suppress logger in JSON mode
  const showLog = !options.json;

  if (showLog) {
    logger.info(`Validating ${claudeDir}...`);
  }

  // If checkAllSources enabled, scan and validate ALL config sources
  let sourceIssues: ValidationReport['sourceIssues'] = [];
  if (options.checkAllSources) {
    const scanResult = scanAllConfigSources({ cwd: targetDir });
    sourceIssues = validateAllSources(scanResult.sources, options.verbose || false);

    if (sourceIssues.length > 0 && showLog) {
      const errors = sourceIssues.filter(i => i.type === 'error');
      const warnings = sourceIssues.filter(i => i.type === 'warning');

      if (errors.length > 0) {
        logger.error(`Found ${errors.length} configuration source error(s):`);
        for (const error of errors) {
          logger.error(`  - ${error.source}: ${error.message}`);
          if (error.suggestion && options.verbose) {
            logger.info(`    Suggestion: ${error.suggestion}`);
          }
        }
      }

      if (warnings.length > 0 && options.verbose) {
        logger.warn(`Found ${warnings.length} configuration source warning(s):`);
        for (const warning of warnings) {
          logger.warn(`  - ${warning.source}: ${warning.message}`);
          if (warning.suggestion) {
            logger.info(`    Suggestion: ${warning.suggestion}`);
          }
        }
      }
    }
  }

  // Step 1: Validate directory structure
  const structureResult = await validateStructure(claudeDir);

  if (options.verbose && showLog) {
    logger.info(`Structure type: ${structureResult.structureType}`);
  }

  // Report structure errors
  if (structureResult.errors.length > 0 && showLog) {
    logger.error(`Found ${structureResult.errors.length} structure error(s):`);
    for (const error of structureResult.errors) {
      logger.error(`  - ${error.message}`);
      if (error.suggestion && options.verbose) {
        logger.info(`    Suggestion: ${error.suggestion}`);
      }
    }
  }

  // Report structure warnings
  if (structureResult.warnings.length > 0 && options.verbose && showLog) {
    logger.warn(`Found ${structureResult.warnings.length} structure warning(s):`);
    for (const warning of structureResult.warnings) {
      logger.warn(`  - ${warning.message}`);
      if (warning.suggestion) {
        logger.info(`    Suggestion: ${warning.suggestion}`);
      }
    }
  }

  // Step 2: Validate schemas (if structure is valid enough)
  let schemaResult: SchemaValidationResult | undefined;

  if (!options.structureOnly && structureResult.structureType !== 'unknown') {
    schemaResult = await validateSchemas(claudeDir);

    if (schemaResult.errors.length > 0 && showLog) {
      logger.error(`Found ${schemaResult.errors.length} schema error(s):`);
      for (const error of schemaResult.errors) {
        logger.error(`  - ${error.file}: ${error.message}`);
        if (error.suggestion && options.verbose) {
          logger.info(`    Suggestion: ${error.suggestion}`);
        }
      }
    }

    if (schemaResult.warnings.length > 0 && options.verbose && showLog) {
      logger.warn(`Found ${schemaResult.warnings.length} schema warning(s):`);
      for (const warning of schemaResult.warnings) {
        logger.warn(`  - ${warning.file}: ${warning.message}`);
        if (warning.suggestion) {
          logger.info(`    Suggestion: ${warning.suggestion}`);
        }
      }
    }

    if (options.verbose && showLog) {
      logger.info(`Validated ${schemaResult.filesValidated.length} file(s)`);
    }
  }

  // Build report
  const sourceErrors = sourceIssues.filter(i => i.type === 'error').length;
  const sourceWarnings = sourceIssues.filter(i => i.type === 'warning').length;

  const totalErrors =
    structureResult.errors.length +
    (schemaResult?.errors.length || 0) +
    sourceErrors;

  const totalWarnings =
    structureResult.warnings.length +
    (schemaResult?.warnings.length || 0) +
    sourceWarnings;

  const report: ValidationReport = {
    valid: totalErrors === 0,
    structure: structureResult,
    schema: schemaResult,
    totalErrors,
    totalWarnings,
    sourceIssues: sourceIssues.length > 0 ? sourceIssues : undefined,
  };

  // Summary or JSON output
  if (options.json) {
    // Output as JSON
    console.log(JSON.stringify(report, null, 2));
  } else {
    // Text summary
    if (report.valid) {
      if (totalWarnings === 0) {
        logger.success('✓ Validation passed with no issues');
      } else {
        logger.success(`✓ Validation passed with ${totalWarnings} warning(s)`);
      }
    } else {
      logger.error(`✗ Validation failed with ${totalErrors} error(s)`);
    }
  }

  return report;
}

/**
 * Validate all configuration sources for issues
 */
function validateAllSources(
  sources: ConfigSources,
  _verbose: boolean
): Array<{
  type: 'error' | 'warning';
  source: string;
  message: string;
  suggestion?: string;
}> {
  const issues: Array<{
    type: 'error' | 'warning';
    source: string;
    message: string;
    suggestion?: string;
  }> = [];

  // Check for missing MCP config files that are referenced
  if (sources.userMcpConfig && !existsSync(sources.userMcpConfig)) {
    issues.push({
      type: 'error',
      source: sources.userMcpConfig,
      message: 'Referenced MCP config file does not exist',
      suggestion: 'Run `claude mcp add` to configure MCP servers',
    });
  }

  // Check for missing hooks scripts
  for (const hook of sources.projectHooks) {
    if (hook.command && !hook.command.startsWith('npx') && !hook.command.startsWith('node')) {
      const scriptPath = path.resolve(sources.projectSettings ? path.dirname(sources.projectSettings) : '.', hook.command);
      if (!existsSync(scriptPath)) {
        issues.push({
          type: 'warning',
          source: `Hook: ${hook.name}`,
          message: `Hook script not found: ${hook.command}`,
          suggestion: `Create the script at ${scriptPath} or update the hook command`,
        });
      }
    }
  }

  // Check for invalid skill structures
  for (const skill of sources.projectSkills) {
    if (!existsSync(skill.path)) {
      issues.push({
        type: 'error',
        source: `Skill: ${skill.name}`,
        message: 'SKILL.md file does not exist',
        suggestion: `Check the skill directory structure`,
      });
    }
  }

  // IMPORTANT: User vs project config is NORMAL precedence, not duplication
  // User config is read-only context. Only flag issues WITHIN project scope.

  // Check for AGENTS.md when new structure exists (project-level fragmentation)
  if (sources.projectAgents && sources.newStructure) {
    issues.push({
      type: 'warning',
      source: sources.projectAgents,
      message: 'Legacy AGENTS.md found alongside new layered structure',
      suggestion: 'Run `claude-arch migrate` to consolidate into new structure',
    });
  }

  // User and project MCP configs are EXPECTED for different scopes - not an issue

  return issues;
}
