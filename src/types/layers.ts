/**
 * Layer Type Definitions
 *
 * Defines the 5-layer architecture:
 * RULES > TOOLS > METHODS > KNOWLEDGE > GOALS
 *
 * Each layer has specific content types and merge behaviors.
 */

import { z } from 'zod';

/**
 * Layer types in the architecture
 */
export enum LayerType {
  /** Constraints, security, forbidden actions (additive merge) */
  Rules = 'rules',
  /** MCP servers, commands, capabilities (additive merge) */
  Tools = 'tools',
  /** Patterns, workflows, how-tos (override merge) */
  Methods = 'methods',
  /** Context, specs, architecture (additive merge) */
  Knowledge = 'knowledge',
  /** Current tasks, objectives (override merge) */
  Goals = 'goals',
}

/**
 * Zod schema for layer type validation
 */
export const LayerTypeSchema = z.nativeEnum(LayerType);

/**
 * Merge strategy for combining layer content across scopes
 */
export enum MergeStrategy {
  /** All values combine (rules, tools, knowledge) */
  Additive = 'additive',
  /** More specific replaces general (methods, goals) */
  Override = 'override',
}

/**
 * Zod schema for merge strategy
 */
export const MergeStrategySchema = z.nativeEnum(MergeStrategy);

/**
 * Layer 1: RULES
 * Constraints that MUST be respected. Absolute, additive merge.
 */
export interface RulesLayer {
  /** Security constraints */
  security?: string[];
  /** Output format requirements */
  outputRequirements?: string[];
  /** Forbidden actions */
  forbidden?: string[];
  /** Required behaviors */
  required?: string[];
  /** Compliance requirements */
  compliance?: string[];
  /** Raw markdown content */
  rawContent?: string;
}

/**
 * Zod schema for Rules layer
 */
export const RulesLayerSchema = z.object({
  security: z.array(z.string()).optional(),
  outputRequirements: z.array(z.string()).optional(),
  forbidden: z.array(z.string()).optional(),
  required: z.array(z.string()).optional(),
  compliance: z.array(z.string()).optional(),
  rawContent: z.string().optional(),
});

/**
 * MCP server configuration
 */
export interface MCPServerConfig {
  /** Server name/identifier */
  name: string;
  /** Command to start the server */
  command: string;
  /** Command arguments */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** Description of server purpose */
  description?: string;
}

/**
 * Zod schema for MCP server config
 */
export const MCPServerConfigSchema = z.object({
  name: z.string(),
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  description: z.string().optional(),
});

/**
 * Custom slash command definition
 */
export interface SlashCommand {
  /** Command name (without /) */
  name: string;
  /** Command description */
  description: string;
  /** Command implementation or script path */
  implementation: string;
  /** Command parameters */
  parameters?: Record<string, string>;
}

/**
 * Zod schema for slash command
 */
export const SlashCommandSchema = z.object({
  name: z.string(),
  description: z.string(),
  implementation: z.string(),
  parameters: z.record(z.string()).optional(),
});

/**
 * Layer 2: TOOLS
 * Capabilities available. Additive merge.
 */
export interface ToolsLayer {
  /** MCP server configurations */
  mcpServers?: MCPServerConfig[];
  /** Available slash commands */
  commands?: SlashCommand[];
  /** Custom scripts */
  scripts?: Record<string, string>;
  /** API integrations */
  apis?: Record<string, string>;
  /** External services */
  services?: string[];
  /** Raw markdown content */
  rawContent?: string;
}

/**
 * Zod schema for Tools layer
 */
export const ToolsLayerSchema = z.object({
  mcpServers: z.array(MCPServerConfigSchema).optional(),
  commands: z.array(SlashCommandSchema).optional(),
  scripts: z.record(z.string()).optional(),
  apis: z.record(z.string()).optional(),
  services: z.array(z.string()).optional(),
  rawContent: z.string().optional(),
});

/**
 * Workflow step definition
 */
export interface WorkflowStep {
  /** Step number or identifier */
  step: number | string;
  /** Step description */
  description: string;
  /** Optional sub-steps */
  substeps?: string[];
}

/**
 * Zod schema for workflow step
 */
export const WorkflowStepSchema = z.object({
  step: z.union([z.number(), z.string()]),
  description: z.string(),
  substeps: z.array(z.string()).optional(),
});

/**
 * Pattern definition
 */
export interface Pattern {
  /** Pattern name */
  name: string;
  /** When to use this pattern */
  when: string;
  /** How to implement the pattern */
  implementation: string;
  /** Example code or usage */
  example?: string;
}

/**
 * Zod schema for pattern
 */
export const PatternSchema = z.object({
  name: z.string(),
  when: z.string(),
  implementation: z.string(),
  example: z.string().optional(),
});

/**
 * Layer 3: METHODS
 * How to do things. Override merge (specific replaces general).
 */
export interface MethodsLayer {
  /** Workflow definitions */
  workflows?: Record<string, WorkflowStep[]>;
  /** Coding patterns */
  patterns?: Pattern[];
  /** Best practices */
  bestPractices?: string[];
  /** Decision frameworks */
  decisions?: Record<string, string>;
  /** Checklists */
  checklists?: Record<string, string[]>;
  /** Whether this explicitly overrides parent scopes */
  override?: boolean;
  /** Raw markdown content */
  rawContent?: string;
}

/**
 * Zod schema for Methods layer
 */
export const MethodsLayerSchema = z.object({
  workflows: z.record(z.array(WorkflowStepSchema)).optional(),
  patterns: z.array(PatternSchema).optional(),
  bestPractices: z.array(z.string()).optional(),
  decisions: z.record(z.string()).optional(),
  checklists: z.record(z.array(z.string())).optional(),
  override: z.boolean().optional(),
  rawContent: z.string().optional(),
});

/**
 * Architecture Decision Record
 */
export interface ADR {
  /** ADR number */
  number: number;
  /** Decision title */
  title: string;
  /** Decision status (proposed, accepted, deprecated, superseded) */
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
  /** Decision context */
  context: string;
  /** The decision made */
  decision: string;
  /** Consequences of the decision */
  consequences?: string;
}

/**
 * Zod schema for ADR
 */
export const ADRSchema = z.object({
  number: z.number(),
  title: z.string(),
  status: z.enum(['proposed', 'accepted', 'deprecated', 'superseded']),
  context: z.string(),
  decision: z.string(),
  consequences: z.string().optional(),
});

/**
 * Layer 4: KNOWLEDGE
 * Context and specifications. Additive merge.
 */
export interface KnowledgeLayer {
  /** Project overview */
  overview?: string;
  /** System architecture description */
  architecture?: string;
  /** Domain glossary */
  glossary?: Record<string, string>;
  /** Architecture Decision Records */
  adrs?: ADR[];
  /** Specifications */
  specs?: Record<string, string>;
  /** Business rules */
  businessRules?: string[];
  /** Historical context */
  history?: string;
  /** Raw markdown content */
  rawContent?: string;
}

/**
 * Zod schema for Knowledge layer
 */
export const KnowledgeLayerSchema = z.object({
  overview: z.string().optional(),
  architecture: z.string().optional(),
  glossary: z.record(z.string()).optional(),
  adrs: z.array(ADRSchema).optional(),
  specs: z.record(z.string()).optional(),
  businessRules: z.array(z.string()).optional(),
  history: z.string().optional(),
  rawContent: z.string().optional(),
});

/**
 * Success criteria for a goal
 */
export interface SuccessCriteria {
  /** Criterion description */
  description: string;
  /** Whether this criterion is met */
  completed: boolean;
  /** Optional acceptance test */
  test?: string;
}

/**
 * Zod schema for success criteria
 */
export const SuccessCriteriaSchema = z.object({
  description: z.string(),
  completed: z.boolean(),
  test: z.string().optional(),
});

/**
 * Layer 5: GOALS
 * Current objectives. Override merge (current wins).
 */
export interface GoalsLayer {
  /** Current sprint/task objective */
  current?: string;
  /** Success criteria */
  successCriteria?: SuccessCriteria[];
  /** Explicitly out of scope */
  nonGoals?: string[];
  /** Priority order */
  priorities?: string[];
  /** Definition of done */
  done?: string[];
  /** Whether this explicitly overrides parent scopes */
  override?: boolean;
  /** Raw markdown content */
  rawContent?: string;
}

/**
 * Zod schema for Goals layer
 */
export const GoalsLayerSchema = z.object({
  current: z.string().optional(),
  successCriteria: z.array(SuccessCriteriaSchema).optional(),
  nonGoals: z.array(z.string()).optional(),
  priorities: z.array(z.string()).optional(),
  done: z.array(z.string()).optional(),
  override: z.boolean().optional(),
  rawContent: z.string().optional(),
});

/**
 * Union type for any layer content
 */
export type LayerContent =
  | RulesLayer
  | ToolsLayer
  | MethodsLayer
  | KnowledgeLayer
  | GoalsLayer;

/**
 * Zod schema for any layer content
 */
export const LayerContentSchema = z.union([
  RulesLayerSchema,
  ToolsLayerSchema,
  MethodsLayerSchema,
  KnowledgeLayerSchema,
  GoalsLayerSchema,
]);

/**
 * Get the merge strategy for a given layer type
 */
export function getMergeStrategy(layer: LayerType): MergeStrategy {
  switch (layer) {
    case LayerType.Rules:
    case LayerType.Tools:
    case LayerType.Knowledge:
      return MergeStrategy.Additive;
    case LayerType.Methods:
    case LayerType.Goals:
      return MergeStrategy.Override;
  }
}
