/**
 * Structure Validator
 *
 * Validates that .claude/ directory structure follows the specification:
 * - Minimal structure: single files (rules.md, tools.md, etc.)
 * - Full structure: subdirectories (rules/, tools/, etc.)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { LayerType } from '../types/layers.js';

/**
 * Structure validation error
 */
export interface StructureError {
  /** Type of structure error */
  type: 'missing-directory' | 'invalid-file' | 'unexpected-file' | 'invalid-structure';
  /** Error message */
  message: string;
  /** Affected path */
  path: string;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Structure validation result
 */
export interface StructureValidationResult {
  /** Whether structure is valid */
  valid: boolean;
  /** Detected structure type */
  structureType: 'minimal' | 'full' | 'mixed' | 'unknown';
  /** Validation errors */
  errors: StructureError[];
  /** Validation warnings */
  warnings: StructureError[];
}

/**
 * Validate .claude/ directory structure
 *
 * @param claudeDir - Path to .claude/ directory
 * @returns Validation result
 */
export async function validateStructure(
  claudeDir: string
): Promise<StructureValidationResult> {
  const errors: StructureError[] = [];
  const warnings: StructureError[] = [];

  // Check if .claude/ directory exists
  try {
    const stat = await fs.stat(claudeDir);
    if (!stat.isDirectory()) {
      errors.push({
        type: 'invalid-structure',
        message: '.claude path exists but is not a directory',
        path: claudeDir,
        suggestion: 'Remove the file and run `claude-arch init`',
      });
      return {
        valid: false,
        structureType: 'unknown',
        errors,
        warnings,
      };
    }
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      errors.push({
        type: 'missing-directory',
        message: '.claude/ directory not found',
        path: claudeDir,
        suggestion: 'Run `claude-arch init` to create the directory',
      });
      return {
        valid: false,
        structureType: 'unknown',
        errors,
        warnings,
      };
    }
    throw err;
  }

  // Detect structure type
  const structureType = await detectStructureType(claudeDir);

  // Validate based on detected type
  if (structureType === 'minimal') {
    await validateMinimalStructure(claudeDir, errors, warnings);
  } else if (structureType === 'full') {
    await validateFullStructure(claudeDir, errors, warnings);
  } else if (structureType === 'mixed') {
    warnings.push({
      type: 'invalid-structure',
      message: 'Mixed structure detected (both single files and subdirectories)',
      path: claudeDir,
      suggestion: 'Use either minimal (single files) or full (subdirectories) structure consistently',
    });
    // Still validate what we can
    await validateMinimalStructure(claudeDir, errors, warnings);
    await validateFullStructure(claudeDir, errors, warnings);
  } else {
    errors.push({
      type: 'invalid-structure',
      message: 'Unable to detect valid structure type',
      path: claudeDir,
      suggestion: 'Run `claude-arch init` to create a proper structure',
    });
  }

  return {
    valid: errors.length === 0,
    structureType,
    errors,
    warnings,
  };
}

/**
 * Detect whether structure is minimal or full
 */
async function detectStructureType(
  claudeDir: string
): Promise<'minimal' | 'full' | 'mixed' | 'unknown'> {
  try {
    const entries = await fs.readdir(claudeDir, { withFileTypes: true });

    const hasMinimalFiles = entries.some(
      (e) => e.isFile() && e.name.match(/^(rules|tools|methods|knowledge|goals)\.md$/)
    );

    const hasFullDirs = entries.some(
      (e) => e.isDirectory() && ['rules', 'tools', 'methods', 'knowledge', 'goals'].includes(e.name)
    );

    if (hasMinimalFiles && hasFullDirs) {
      return 'mixed';
    } else if (hasMinimalFiles) {
      return 'minimal';
    } else if (hasFullDirs) {
      return 'full';
    } else {
      return 'unknown';
    }
  } catch (err) {
    return 'unknown';
  }
}

/**
 * Validate minimal structure (single files)
 */
async function validateMinimalStructure(
  claudeDir: string,
  _errors: StructureError[],
  warnings: StructureError[]
): Promise<void> {
  const expectedFiles = [
    'rules.md',
    'tools.md',
    'methods.md',
    'knowledge.md',
    'goals.md',
  ];

  for (const filename of expectedFiles) {
    const filepath = path.join(claudeDir, filename);

    try {
      const stat = await fs.stat(filepath);

      if (!stat.isFile()) {
        warnings.push({
          type: 'invalid-file',
          message: `${filename} exists but is not a regular file`,
          path: filepath,
          suggestion: `Remove the directory and create ${filename} as a markdown file`,
        });
      } else {
        // Check if file has content
        const content = await fs.readFile(filepath, 'utf-8');
        if (content.trim().length === 0) {
          warnings.push({
            type: 'invalid-file',
            message: `${filename} is empty`,
            path: filepath,
            suggestion: `Add content to ${filename} or remove it`,
          });
        }
      }
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        // File missing is just a warning for minimal structure
        warnings.push({
          type: 'missing-directory',
          message: `Expected file ${filename} not found`,
          path: filepath,
          suggestion: `Create ${filename} or run \`claude-arch init --minimal\``,
        });
      }
    }
  }
}

/**
 * Validate full structure (subdirectories)
 */
async function validateFullStructure(
  claudeDir: string,
  _errors: StructureError[],
  warnings: StructureError[]
): Promise<void> {
  const expectedDirs = ['rules', 'tools', 'methods', 'knowledge', 'goals'];

  for (const dirname of expectedDirs) {
    const dirpath = path.join(claudeDir, dirname);

    try {
      const stat = await fs.stat(dirpath);

      if (!stat.isDirectory()) {
        warnings.push({
          type: 'invalid-file',
          message: `${dirname} exists but is not a directory`,
          path: dirpath,
          suggestion: `Remove the file and create ${dirname}/ as a directory`,
        });
      } else {
        // Check if directory has at least some content
        const entries = await fs.readdir(dirpath);
        if (entries.length === 0) {
          warnings.push({
            type: 'invalid-structure',
            message: `${dirname}/ directory is empty`,
            path: dirpath,
            suggestion: `Add markdown files to ${dirname}/ or remove the directory`,
          });
        }
      }
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        // Directory missing is just a warning
        warnings.push({
          type: 'missing-directory',
          message: `Expected directory ${dirname}/ not found`,
          path: dirpath,
          suggestion: `Create ${dirname}/ directory or run \`claude-arch init\``,
        });
      }
    }
  }
}

/**
 * Check if a file is a valid markdown file
 */
export async function isValidMarkdownFile(filepath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    // Basic check: should have markdown headings
    return /^#+ /m.test(content);
  } catch (err) {
    return false;
  }
}

/**
 * Get all layer files from a .claude/ directory
 */
export async function getLayerFiles(
  claudeDir: string,
  layer: LayerType
): Promise<string[]> {
  const files: string[] = [];

  // Try minimal structure first
  const minimalFile = path.join(claudeDir, `${layer}.md`);
  try {
    await fs.access(minimalFile);
    files.push(minimalFile);
  } catch (err) {
    // Not found, try full structure
  }

  // Try full structure
  const layerDir = path.join(claudeDir, layer);
  try {
    const entries = await fs.readdir(layerDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.yaml'))) {
        files.push(path.join(layerDir, entry.name));
      }
    }
  } catch (err) {
    // Directory doesn't exist
  }

  return files;
}
