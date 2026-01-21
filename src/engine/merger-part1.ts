/**
 * Layer Content Merger
 *
 * Implements merge logic for combining layer content across scopes.
 * Handles both additive merging (combine all) and override merging (higher scope wins).
 */

import type {
  RulesLayer,
  ToolsLayer,
  MethodsLayer,
  KnowledgeLayer,
  GoalsLayer,
  LayerContent,
  MCPServerConfig,
  SlashCommand,
  Pattern,
  ADR,
  SuccessCriteria,
} from '../types/layers.js';
import { LayerType } from '../types/layers.js';
import type { LayerWithScope } from '../types/config.js';

/**
 * Merge metadata tracking which sources contributed to fields
 */
export interface FieldSource {
  /** Field name */
  field: string;
  /** Source file paths that contributed */
  sources: string[];
}

/**
 * Merge multiple RulesLayer objects (additive)
 */
export function mergeRulesLayers(
  layers: LayerWithScope<RulesLayer>[]
): { merged: RulesLayer; sources: FieldSource[] } {
  const merged: RulesLayer = {};
  const fieldSources = new Map<string, Set<string>>();

  for (const { content, scope } of layers) {
    const trackField = (field: string) => {
      if (!fieldSources.has(field)) {
        fieldSources.set(field, new Set());
      }
      fieldSources.get(field)!.add(scope.sourcePath);
    };

    if (content.security) {
      merged.security = [...(merged.security || []), ...content.security];
      trackField('security');
    }
    if (content.outputRequirements) {
      merged.outputRequirements = [
        ...(merged.outputRequirements || []),
        ...content.outputRequirements,
      ];
      trackField('outputRequirements');
    }
    if (content.forbidden) {
      merged.forbidden = [...(merged.forbidden || []), ...content.forbidden];
      trackField('forbidden');
    }
    if (content.required) {
      merged.required = [...(merged.required || []), ...content.required];
      trackField('required');
    }
    if (content.compliance) {
      merged.compliance = [...(merged.compliance || []), ...content.compliance];
      trackField('compliance');
    }
    if (content.rawContent) {
      merged.rawContent = merged.rawContent
        ? `${merged.rawContent}\n\n---\n\n${content.rawContent}`
        : content.rawContent;
      trackField('rawContent');
    }
  }

  const sources: FieldSource[] = Array.from(fieldSources.entries()).map(
    ([field, sourcesSet]) => ({
      field,
      sources: Array.from(sourcesSet),
    })
  );

  return { merged, sources };
}
