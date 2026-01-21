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

export interface ValidateOptions {
  /** Directory to validate (default: current directory) */
  targetDir?: string;
  /** Only validate structure, skip schema validation */
  structureOnly?: boolean;
  /** Verbose output */
  verbose?: boolean;
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
}

/**
 * Validate .claude/ directory structure and contents
 */
export async function validateCommand(options: ValidateOptions = {}): Promise<ValidationReport> {
  const targetDir = options.targetDir || process.cwd();
  const claudeDir = path.join(targetDir, '.claude');

  logger.info(`Validating ${claudeDir}...`);

  // Step 1: Validate directory structure
  const structureResult = await validateStructure(claudeDir);

  if (options.verbose) {
    logger.info(`Structure type: ${structureResult.structureType}`);
  }

  // Report structure errors
  if (structureResult.errors.length > 0) {
    logger.error(`Found ${structureResult.errors.length} structure error(s):`);
    for (const error of structureResult.errors) {
      logger.error(`  - ${error.message}`);
      if (error.suggestion && options.verbose) {
        logger.info(`    Suggestion: ${error.suggestion}`);
      }
    }
  }

  // Report structure warnings
  if (structureResult.warnings.length > 0 && options.verbose) {
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

    if (schemaResult.errors.length > 0) {
      logger.error(`Found ${schemaResult.errors.length} schema error(s):`);
      for (const error of schemaResult.errors) {
        logger.error(`  - ${error.file}: ${error.message}`);
        if (error.suggestion && options.verbose) {
          logger.info(`    Suggestion: ${error.suggestion}`);
        }
      }
    }

    if (schemaResult.warnings.length > 0 && options.verbose) {
      logger.warn(`Found ${schemaResult.warnings.length} schema warning(s):`);
      for (const warning of schemaResult.warnings) {
        logger.warn(`  - ${warning.file}: ${warning.message}`);
        if (warning.suggestion) {
          logger.info(`    Suggestion: ${warning.suggestion}`);
        }
      }
    }

    if (options.verbose) {
      logger.info(`Validated ${schemaResult.filesValidated.length} file(s)`);
    }
  }

  // Build report
  const totalErrors =
    structureResult.errors.length +
    (schemaResult?.errors.length || 0);

  const totalWarnings =
    structureResult.warnings.length +
    (schemaResult?.warnings.length || 0);

  const report: ValidationReport = {
    valid: totalErrors === 0,
    structure: structureResult,
    schema: schemaResult,
    totalErrors,
    totalWarnings,
  };

  // Summary
  if (report.valid) {
    if (totalWarnings === 0) {
      logger.success('✓ Validation passed with no issues');
    } else {
      logger.success(`✓ Validation passed with ${totalWarnings} warning(s)`);
    }
  } else {
    logger.error(`✗ Validation failed with ${totalErrors} error(s)`);
  }

  return report;
}
