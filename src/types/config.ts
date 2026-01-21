/**
 * Configuration Structure Types
 *
 * Defines the complete configuration structure combining all layers
 * and scopes with proper metadata tracking.
 */

import { z } from 'zod';
import {
  LayerType,
  LayerTypeSchema,
  RulesLayer,
  RulesLayerSchema,
  ToolsLayer,
  ToolsLayerSchema,
  MethodsLayer,
  MethodsLayerSchema,
  KnowledgeLayer,
  KnowledgeLayerSchema,
  GoalsLayer,
  GoalsLayerSchema,
} from './layers.js';
import {
  ScopeLevel,
  ScopeLevelSchema,
  ScopeMetadata,
  ScopeMetadataSchema,
} from './scope.js';

/**
 * Complete configuration for all layers at a single scope
 */
export interface ScopeConfig {
  /** Scope level this config belongs to */
  scope: ScopeLevel;
  /** Base path for this scope's configuration files */
  basePath: string;
  /** Layer 1: Rules */
  rules?: RulesLayer;
  /** Layer 2: Tools */
  tools?: ToolsLayer;
  /** Layer 3: Methods */
  methods?: MethodsLayer;
  /** Layer 4: Knowledge */
  knowledge?: KnowledgeLayer;
  /** Layer 5: Goals */
  goals?: GoalsLayer;
}

/**
 * Zod schema for scope config
 */
export const ScopeConfigSchema = z.object({
  scope: ScopeLevelSchema,
  basePath: z.string(),
  rules: RulesLayerSchema.optional(),
  tools: ToolsLayerSchema.optional(),
  methods: MethodsLayerSchema.optional(),
  knowledge: KnowledgeLayerSchema.optional(),
  goals: GoalsLayerSchema.optional(),
});

/**
 * A layer with scope metadata attached
 */
export interface LayerWithScope<T> {
  /** Layer type identifier */
  layer: LayerType;
  /** Layer content */
  content: T;
  /** Scope metadata */
  scope: ScopeMetadata;
}

/**
 * Create a Zod schema for a layer with scope
 */
export function layerWithScopeSchema<T extends z.ZodTypeAny>(
  contentSchema: T
) {
  return z.object({
    layer: LayerTypeSchema,
    content: contentSchema,
    scope: ScopeMetadataSchema,
  });
}

/**
 * Merged configuration combining all scopes with precedence applied
 */
export interface MergedConfig {
  /** Merged rules from all scopes (additive) */
  rules: RulesLayer;
  /** Merged tools from all scopes (additive) */
  tools: ToolsLayer;
  /** Merged methods from all scopes (override) */
  methods: MethodsLayer;
  /** Merged knowledge from all scopes (additive) */
  knowledge: KnowledgeLayer;
  /** Merged goals from all scopes (override) */
  goals: GoalsLayer;
  /** Metadata about the merge operation */
  metadata: MergeMetadata;
}

/**
 * Zod schema for merged config
 */
export const MergedConfigSchema = z.object({
  rules: RulesLayerSchema,
  tools: ToolsLayerSchema,
  methods: MethodsLayerSchema,
  knowledge: KnowledgeLayerSchema,
  goals: GoalsLayerSchema,
  metadata: z.object({
    mergedAt: z.date(),
    scopesIncluded: z.array(ScopeLevelSchema),
    layerSources: z.record(z.array(z.string())),
  }),
});

/**
 * Metadata about a merge operation
 */
export interface MergeMetadata {
  /** When the merge was performed */
  mergedAt: Date;
  /** Which scopes were included in the merge */
  scopesIncluded: ScopeLevel[];
  /** For each layer, which source files contributed */
  layerSources: Record<LayerType, string[]>;
}

/**
 * Configuration context for the current task/session
 */
export interface ConfigContext {
  /** The fully merged configuration */
  config: MergedConfig;
  /** Individual scope configs that were merged */
  scopes: {
    system?: ScopeConfig;
    user?: ScopeConfig;
    project?: ScopeConfig;
    task?: ScopeConfig;
  };
  /** When this context was created */
  createdAt: Date;
  /** Optional task identifier */
  taskId?: string;
}

/**
 * Zod schema for config context
 */
export const ConfigContextSchema = z.object({
  config: MergedConfigSchema,
  scopes: z.object({
    system: ScopeConfigSchema.optional(),
    user: ScopeConfigSchema.optional(),
    project: ScopeConfigSchema.optional(),
    task: ScopeConfigSchema.optional(),
  }),
  createdAt: z.date(),
  taskId: z.string().optional(),
});

/**
 * Configuration file format (for .claude/config.yaml)
 */
export interface ConfigFile {
  /** Schema version for future compatibility */
  version: string;
  /** Optional config description */
  description?: string;
  /** Layer-specific configuration */
  layers?: {
    rules?: {
      /** Files to include from rules/ directory */
      include?: string[];
      /** Files to exclude */
      exclude?: string[];
    };
    tools?: {
      include?: string[];
      exclude?: string[];
    };
    methods?: {
      include?: string[];
      exclude?: string[];
      /** Whether to override parent methods */
      override?: boolean;
    };
    knowledge?: {
      include?: string[];
      exclude?: string[];
    };
    goals?: {
      include?: string[];
      exclude?: string[];
      /** Whether to override parent goals */
      override?: boolean;
    };
  };
  /** Legacy file support */
  legacy?: {
    /** Whether to parse CLAUDE.md */
    claudeMd?: boolean;
    /** Whether to parse AGENTS.md */
    agentsMd?: boolean;
  };
}

/**
 * Zod schema for config file
 */
export const ConfigFileSchema = z.object({
  version: z.string(),
  description: z.string().optional(),
  layers: z
    .object({
      rules: z
        .object({
          include: z.array(z.string()).optional(),
          exclude: z.array(z.string()).optional(),
        })
        .optional(),
      tools: z
        .object({
          include: z.array(z.string()).optional(),
          exclude: z.array(z.string()).optional(),
        })
        .optional(),
      methods: z
        .object({
          include: z.array(z.string()).optional(),
          exclude: z.array(z.string()).optional(),
          override: z.boolean().optional(),
        })
        .optional(),
      knowledge: z
        .object({
          include: z.array(z.string()).optional(),
          exclude: z.array(z.string()).optional(),
        })
        .optional(),
      goals: z
        .object({
          include: z.array(z.string()).optional(),
          exclude: z.array(z.string()).optional(),
          override: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  legacy: z
    .object({
      claudeMd: z.boolean().optional(),
      agentsMd: z.boolean().optional(),
    })
    .optional(),
});

/**
 * Validation error with context
 */
export interface ValidationError {
  /** The layer or scope where the error occurred */
  location: string;
  /** Error message */
  message: string;
  /** Source file path */
  sourcePath?: string;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Zod schema for validation error
 */
export const ValidationErrorSchema = z.object({
  location: z.string(),
  message: z.string(),
  sourcePath: z.string().optional(),
  suggestion: z.string().optional(),
});

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors if any */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationError[];
}

/**
 * Zod schema for validation result
 */
export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(ValidationErrorSchema),
  warnings: z.array(ValidationErrorSchema),
});
