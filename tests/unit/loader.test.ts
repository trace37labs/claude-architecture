import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import {
  loadLayer,
  loadScopeConfig,
  loadAllScopes,
  loadLayerAcrossScopes,
  loadScope,
  hasScopeConfig,
  loadWithMetadata,
  preloadConfigurations,
} from '../../src/loader.js';
import { LayerType } from '../../src/types/layers.js';
import { ScopeLevel } from '../../src/types/scope.js';

describe('Loader', () => {
  const fixturesDir = resolve(process.cwd(), 'tests/fixtures');
  const simpleProjectDir = resolve(fixturesDir, 'simple-project');
  const claudeDir = resolve(simpleProjectDir, '.claude');

  describe('loadLayer', () => {
    it('should load a layer with raw content', () => {
      const rulesDir = resolve(claudeDir, 'rules');
      const layer = loadLayer(rulesDir, LayerType.Rules, {
        includeRawContent: true,
      });

      expect(layer.rawContent).toBeDefined();
      expect(layer.rawContent).toContain('Security Rules');
    });

    it('should load layer without raw content', () => {
      const rulesDir = resolve(claudeDir, 'rules');
      const layer = loadLayer(rulesDir, LayerType.Rules, {
        includeRawContent: false,
      });

      expect(layer.rawContent).toBeUndefined();
    });

    it('should handle different layer types', () => {
      const toolsDir = resolve(claudeDir, 'tools');
      const layer = loadLayer(toolsDir, LayerType.Tools);

      expect(layer).toBeDefined();
      expect(layer.rawContent).toContain('MCP Servers');
    });
  });

  describe('loadScopeConfig', () => {
    it('should load all layers from scope', () => {
      const config = loadScopeConfig(claudeDir, ScopeLevel.Project);

      expect(config.scope).toBe(ScopeLevel.Project);
      expect(config.basePath).toBe(claudeDir);
      expect(config.rules).toBeDefined();
      expect(config.tools).toBeDefined();
      expect(config.methods).toBeDefined();
      expect(config.knowledge).toBeDefined();
      expect(config.goals).toBeDefined();
    });

    it('should include raw content in layers', () => {
      const config = loadScopeConfig(claudeDir, ScopeLevel.Project, {
        includeRawContent: true,
      });

      expect(config.rules?.rawContent).toBeDefined();
      expect(config.rules?.rawContent).toContain('Security Rules');
    });

    it('should handle scope with missing layers gracefully', () => {
      // If we had a partial scope, it should still work
      const config = loadScopeConfig(claudeDir, ScopeLevel.Project);

      // All layers should be present in simple-project fixture
      expect(config.rules).toBeDefined();
    });
  });

  describe('loadAllScopes', () => {
    it('should load all available scopes', () => {
      const configs = loadAllScopes({ cwd: simpleProjectDir });

      expect(configs.size).toBeGreaterThan(0);
      expect(configs.has(ScopeLevel.Project)).toBe(true);
    });

    it('should return map keyed by scope level', () => {
      const configs = loadAllScopes({ cwd: simpleProjectDir });

      for (const [scope, config] of configs) {
        expect(config.scope).toBe(scope);
      }
    });

    it('should not include system scope', () => {
      const configs = loadAllScopes({ cwd: simpleProjectDir });

      expect(configs.has(ScopeLevel.System)).toBe(false);
    });
  });

  describe('loadLayerAcrossScopes', () => {
    it('should load specific layer from all scopes', () => {
      const layers = loadLayerAcrossScopes(LayerType.Rules, {
        cwd: simpleProjectDir,
      });

      expect(layers.length).toBeGreaterThan(0);
      expect(layers[0].layer).toBe(LayerType.Rules);
    });

    it('should include scope metadata', () => {
      const layers = loadLayerAcrossScopes(LayerType.Rules, {
        cwd: simpleProjectDir,
      });

      for (const layer of layers) {
        expect(layer.scope.level).toBeDefined();
        expect(layer.scope.sourcePath).toBeDefined();
        expect(layer.scope.loadedAt).toBeInstanceOf(Date);
      }
    });

    it('should sort by scope precedence', () => {
      const layers = loadLayerAcrossScopes(LayerType.Rules, {
        cwd: simpleProjectDir,
      });

      if (layers.length > 1) {
        // Task should come before Project, Project before User, etc.
        const scopeOrder = [
          ScopeLevel.Task,
          ScopeLevel.Project,
          ScopeLevel.User,
          ScopeLevel.System,
        ];

        for (let i = 1; i < layers.length; i++) {
          const prevIndex = scopeOrder.indexOf(layers[i - 1].scope.level);
          const currIndex = scopeOrder.indexOf(layers[i].scope.level);
          expect(prevIndex).toBeLessThanOrEqual(currIndex);
        }
      }
    });
  });

  describe('loadScope', () => {
    it('should load specific scope', () => {
      const config = loadScope(ScopeLevel.Project, { cwd: simpleProjectDir });

      expect(config).toBeDefined();
      expect(config?.scope).toBe(ScopeLevel.Project);
    });

    it('should return null for non-existent scope', () => {
      const config = loadScope(ScopeLevel.Task, { cwd: simpleProjectDir });

      expect(config).toBeNull();
    });
  });

  describe('hasScopeConfig', () => {
    it('should return true for existing scope', () => {
      const hasConfig = hasScopeConfig(ScopeLevel.Project, {
        cwd: simpleProjectDir,
      });

      expect(hasConfig).toBe(true);
    });

    it('should return false for non-existent scope', () => {
      const hasConfig = hasScopeConfig(ScopeLevel.Task, {
        cwd: simpleProjectDir,
      });

      expect(hasConfig).toBe(false);
    });
  });

  describe('loadWithMetadata', () => {
    it('should load configs with metadata', () => {
      const result = loadWithMetadata({ cwd: simpleProjectDir });

      expect(result.configs).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.loadedScopes).toContain(ScopeLevel.Project);
      expect(result.metadata.totalLayers).toBeGreaterThan(0);
    });

    it('should track missing scopes', () => {
      const result = loadWithMetadata({ cwd: simpleProjectDir });

      // Task and System scopes should be missing
      expect(result.metadata.missingScopes).toContain(ScopeLevel.Task);
    });

    it('should count layers by scope', () => {
      const result = loadWithMetadata({ cwd: simpleProjectDir });

      const projectLayers = result.metadata.layersByScope.get(
        ScopeLevel.Project
      );
      expect(projectLayers).toBeDefined();
      expect(projectLayers!.length).toBe(5); // All 5 layers present
    });

    it('should include load timestamp', () => {
      const result = loadWithMetadata({ cwd: simpleProjectDir });

      expect(result.metadata.loadedAt).toBeInstanceOf(Date);
    });
  });

  describe('preloadConfigurations', () => {
    it('should preload all configurations', () => {
      const result = preloadConfigurations({ cwd: simpleProjectDir });

      expect(result.configs.size).toBeGreaterThan(0);
      expect(result.metadata.totalLayers).toBeGreaterThan(0);
    });

    it('should include raw content by default', () => {
      const result = preloadConfigurations({ cwd: simpleProjectDir });

      const projectConfig = result.configs.get(ScopeLevel.Project);
      expect(projectConfig?.rules?.rawContent).toBeDefined();
    });
  });
});
