/**
 * Schema Validator
 *
 * Validates that layer files conform to expected schemas using Zod.
 */

import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'yaml';
import {
  LayerType,
  RulesLayerSchema,
  ToolsLayerSchema,
  MethodsLayerSchema,
  KnowledgeLayerSchema,
  GoalsLayerSchema,
  MCPServerConfigSchema,
} from '../types/layers.js';

/**
 * Schema validation error
 */
export interface SchemaError {
  /** File path where error occurred */
  file: string;
  /** Layer type */
  layer: LayerType;
  /** Error message */
  message: string;
  /** Field path in the schema (if applicable) */
  field?: string;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Schema validation result
 */
export interface SchemaValidationResult {
  /** Whether all schemas are valid */
  valid: boolean;
  /** Validation errors */
  errors: SchemaError[];
  /** Validation warnings */
  warnings: SchemaError[];
  /** Files that were validated */
  filesValidated: string[];
}

/**
 * Validate schema of all layer files
 *
 * @param claudeDir - Path to .claude/ directory
 * @returns Validation result
 */
export async function validateSchemas(
  claudeDir: string
): Promise<SchemaValidationResult> {
  const errors: SchemaError[] = [];
  const warnings: SchemaError[] = [];
  const filesValidated: string[] = [];

  // Validate each layer
  for (const layer of Object.values(LayerType)) {
    await validateLayerFiles(claudeDir, layer, errors, warnings, filesValidated);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    filesValidated,
  };
}

/**
 * Validate files for a specific layer
 */
async function validateLayerFiles(
  claudeDir: string,
  layer: LayerType,
  errors: SchemaError[],
  warnings: SchemaError[],
  filesValidated: string[]
): Promise<void> {
  // Check minimal structure file
  const minimalFile = path.join(claudeDir, `${layer}.md`);
  try {
    await fs.access(minimalFile);
    await validateLayerFile(minimalFile, layer, errors, warnings);
    filesValidated.push(minimalFile);
  } catch (err) {
    // File doesn't exist, not an error
  }

  // Check full structure directory
  const layerDir = path.join(claudeDir, layer);
  try {
    const entries = await fs.readdir(layerDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const filepath = path.join(layerDir, entry.name);

        if (entry.name.endsWith('.md')) {
          await validateLayerFile(filepath, layer, errors, warnings);
          filesValidated.push(filepath);
        } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
          // Special handling for YAML files (e.g., MCP configs)
          await validateYAMLFile(filepath, layer, errors, warnings);
          filesValidated.push(filepath);
        } else {
          warnings.push({
            file: filepath,
            layer,
            message: `Unexpected file type: ${entry.name}`,
            suggestion: 'Use .md for markdown or .yaml for configuration files',
          });
        }
      }
    }
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      // Directory exists but couldn't be read
      errors.push({
        file: layerDir,
        layer,
        message: `Could not read ${layer} directory: ${err.message}`,
      });
    }
  }
}

/**
 * Validate a single layer file (markdown)
 */
async function validateLayerFile(
  filepath: string,
  layer: LayerType,
  errors: SchemaError[],
  warnings: SchemaError[]
): Promise<void> {
  try {
    const content = await fs.readFile(filepath, 'utf-8');

    // Basic markdown validation
    if (!content.trim()) {
      warnings.push({
        file: filepath,
        layer,
        message: 'File is empty',
        suggestion: 'Add content or remove the file',
      });
      return;
    }

    // Check for markdown headings
    if (!/^#+ /m.test(content)) {
      warnings.push({
        file: filepath,
        layer,
        message: 'File does not contain markdown headings',
        suggestion: 'Add markdown headings to structure the content',
      });
    }

    // Layer-specific validation
    validateLayerContent(filepath, layer, content, errors, warnings);
  } catch (err: any) {
    errors.push({
      file: filepath,
      layer,
      message: `Could not read file: ${err.message}`,
    });
  }
}

/**
 * Validate layer-specific content
 */
function validateLayerContent(
  filepath: string,
  layer: LayerType,
  content: string,
  _errors: SchemaError[],
  warnings: SchemaError[]
): void {
  switch (layer) {
    case LayerType.Rules:
      // Check for common rule sections
      if (!content.match(/security|forbidden|required/i)) {
        warnings.push({
          file: filepath,
          layer,
          message: 'Rules file should contain security, forbidden, or required sections',
          suggestion: 'Add sections describing project constraints and requirements',
        });
      }
      break;

    case LayerType.Tools:
      // Check for tool definitions
      if (!content.match(/mcp|command|script|tool/i)) {
        warnings.push({
          file: filepath,
          layer,
          message: 'Tools file should describe available tools or capabilities',
          suggestion: 'Add MCP servers, commands, or scripts',
        });
      }
      break;

    case LayerType.Methods:
      // Check for workflow or pattern sections
      if (!content.match(/workflow|pattern|practice|process/i)) {
        warnings.push({
          file: filepath,
          layer,
          message: 'Methods file should contain workflows, patterns, or practices',
          suggestion: 'Add sections describing how to approach tasks',
        });
      }
      break;

    case LayerType.Knowledge:
      // Check for knowledge sections
      if (!content.match(/overview|architecture|glossary|spec/i)) {
        warnings.push({
          file: filepath,
          layer,
          message: 'Knowledge file should contain project context or specifications',
          suggestion: 'Add overview, architecture, or domain knowledge',
        });
      }
      break;

    case LayerType.Goals:
      // Check for goal-related content
      if (!content.match(/goal|objective|task|sprint|current|priority/i)) {
        warnings.push({
          file: filepath,
          layer,
          message: 'Goals file should describe current objectives or tasks',
          suggestion: 'Add current goals, priorities, or success criteria',
        });
      }
      break;
  }
}

/**
 * Validate a YAML file (e.g., MCP server config)
 */
async function validateYAMLFile(
  filepath: string,
  layer: LayerType,
  errors: SchemaError[],
  warnings: SchemaError[]
): Promise<void> {
  try {
    const content = await fs.readFile(filepath, 'utf-8');

    // Parse YAML
    let parsed: any;
    try {
      parsed = yaml.parse(content);
    } catch (err: any) {
      errors.push({
        file: filepath,
        layer,
        message: `Invalid YAML: ${err.message}`,
        suggestion: 'Fix YAML syntax errors',
      });
      return;
    }

    // Validate MCP server configs if in tools layer
    if (layer === LayerType.Tools && parsed && typeof parsed === 'object') {
      if (parsed.servers) {
        for (const [name, config] of Object.entries(parsed.servers)) {
          try {
            MCPServerConfigSchema.parse({
              name,
              ...(config as any),
            });
          } catch (err: any) {
            errors.push({
              file: filepath,
              layer,
              message: `Invalid MCP server config for '${name}': ${err.message}`,
              field: name,
              suggestion: 'Check MCP server configuration format',
            });
          }
        }
      }
    }
  } catch (err: any) {
    errors.push({
      file: filepath,
      layer,
      message: `Could not read YAML file: ${err.message}`,
    });
  }
}

/**
 * Validate a specific layer's content against its schema
 */
export function validateLayerSchema(
  layer: LayerType,
  content: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Suppress unused variable warning for layer parameter
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _layer = layer;

  try {
    switch (layer) {
      case LayerType.Rules:
        RulesLayerSchema.parse(content);
        break;
      case LayerType.Tools:
        ToolsLayerSchema.parse(content);
        break;
      case LayerType.Methods:
        MethodsLayerSchema.parse(content);
        break;
      case LayerType.Knowledge:
        KnowledgeLayerSchema.parse(content);
        break;
      case LayerType.Goals:
        GoalsLayerSchema.parse(content);
        break;
    }
  } catch (err: any) {
    if (err.errors) {
      errors.push(...err.errors.map((e: any) => e.message));
    } else {
      errors.push(err.message);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
