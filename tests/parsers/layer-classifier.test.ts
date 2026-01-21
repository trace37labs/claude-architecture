import { describe, it, expect } from 'vitest';
import {
  classifyContent,
  classifySections,
  suggestLayer,
  validateLayerContent,
  getLayerGuidelines,
} from '../../src/parsers/layer-classifier.js';
import { LayerType } from '../../src/types/layers.js';

describe('Layer Classifier', () => {
  describe('classifyContent', () => {
    it('should classify security rules correctly', () => {
      const result = classifyContent(
        'Security Rules',
        'Never commit API keys or passwords'
      );

      expect(result.layer).toBe(LayerType.Rules);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify tools correctly', () => {
      const result = classifyContent(
        'MCP Servers',
        'claude mcp add database -- npx db-server'
      );

      expect(result.layer).toBe(LayerType.Tools);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify methods/workflows correctly', () => {
      const result = classifyContent(
        'Development Workflow',
        'Step 1: Write tests. Step 2: Implement feature.'
      );

      expect(result.layer).toBe(LayerType.Methods);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify knowledge/architecture correctly', () => {
      const result = classifyContent(
        'Architecture Overview',
        'The system uses a microservices architecture'
      );

      expect(result.layer).toBe(LayerType.Knowledge);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify goals correctly', () => {
      const result = classifyContent(
        'Current Objectives',
        'Goal: Deploy to production by Friday'
      );

      expect(result.layer).toBe(LayerType.Goals);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should return null for ambiguous content', () => {
      const result = classifyContent('Random Heading', 'Some generic text');

      expect(result.layer).toBeNull();
      expect(result.confidence).toBeLessThan(0.3);
    });

    it('should prioritize heading over content', () => {
      const result = classifyContent(
        'Security Rules',
        'This talks about workflows' // Conflicting content
      );

      // Should still classify as Rules due to strong heading signal
      expect(result.layer).toBe(LayerType.Rules);
    });

    it('should handle case-insensitive matching', () => {
      const result1 = classifyContent('SECURITY RULES', 'NEVER COMMIT SECRETS');
      const result2 = classifyContent('security rules', 'never commit secrets');

      expect(result1.layer).toBe(result2.layer);
    });
  });

  describe('Layer-specific classification', () => {
    describe('Rules layer', () => {
      it('should detect "never" statements', () => {
        const result = classifyContent('Rules', 'Never commit secrets');
        expect(result.layer).toBe(LayerType.Rules);
      });

      it('should detect "must not" statements', () => {
        const result = classifyContent('Constraints', 'Must not expose credentials');
        expect(result.layer).toBe(LayerType.Rules);
      });

      it('should detect "always" statements', () => {
        const result = classifyContent('Security Requirements', 'Always validate input for security');
        expect(result.layer).toBe(LayerType.Rules);
      });

      it('should detect security keywords', () => {
        const result = classifyContent(
          'Configuration',
          'Security: Use authentication for all endpoints'
        );
        expect(result.layer).toBe(LayerType.Rules);
      });
    });

    describe('Tools layer', () => {
      it('should detect MCP commands', () => {
        const result = classifyContent(
          'Setup',
          'claude mcp add server -- npx mcp-server'
        );
        expect(result.layer).toBe(LayerType.Tools);
      });

      it('should detect API mentions', () => {
        const result = classifyContent(
          'Integration',
          'Use the GitHub API for repository access'
        );
        expect(result.layer).toBe(LayerType.Tools);
      });

      it('should detect service integrations', () => {
        const result = classifyContent(
          'External Services',
          'Database service and cache service'
        );
        expect(result.layer).toBe(LayerType.Tools);
      });
    });

    describe('Methods layer', () => {
      it('should detect workflows', () => {
        const result = classifyContent(
          'Process',
          'Workflow: Create PR, review, merge'
        );
        expect(result.layer).toBe(LayerType.Methods);
      });

      it('should detect step-by-step instructions', () => {
        const result = classifyContent('Guide', 'Step 1: Setup. Step 2: Run tests.');
        expect(result.layer).toBe(LayerType.Methods);
      });

      it('should detect best practices', () => {
        const result = classifyContent(
          'Coding',
          'Best practice: Write tests first'
        );
        expect(result.layer).toBe(LayerType.Methods);
      });

      it('should detect patterns', () => {
        const result = classifyContent('Design', 'Pattern: Use factory pattern');
        expect(result.layer).toBe(LayerType.Methods);
      });
    });

    describe('Knowledge layer', () => {
      it('should detect architecture descriptions', () => {
        const result = classifyContent(
          'System',
          'Architecture: Microservices with event bus'
        );
        expect(result.layer).toBe(LayerType.Knowledge);
      });

      it('should detect specifications', () => {
        const result = classifyContent('Architecture Docs', 'Specification: System architecture uses microservices');
        expect(result.layer).toBe(LayerType.Knowledge);
      });

      it('should detect ADRs', () => {
        const result = classifyContent('Decisions', 'ADR-001: Use TypeScript');
        expect(result.layer).toBe(LayerType.Knowledge);
      });

      it('should detect glossaries', () => {
        const result = classifyContent('Terms', 'Glossary: Term definitions');
        expect(result.layer).toBe(LayerType.Knowledge);
      });
    });

    describe('Goals layer', () => {
      it('should detect goals', () => {
        const result = classifyContent('Objectives', 'Goal: Ship v2 by Q4');
        expect(result.layer).toBe(LayerType.Goals);
      });

      it('should detect current tasks', () => {
        const result = classifyContent('Now', 'Current: Implement auth');
        expect(result.layer).toBe(LayerType.Goals);
      });

      it('should detect priorities', () => {
        const result = classifyContent('Important', 'Priority: Fix critical bugs');
        expect(result.layer).toBe(LayerType.Goals);
      });

      it('should detect todos', () => {
        const result = classifyContent('Tasks', 'TODO: Update documentation');
        expect(result.layer).toBe(LayerType.Goals);
      });
    });
  });

  describe('classifySections', () => {
    it('should classify multiple sections', () => {
      const sections = [
        { heading: 'Rules', content: 'Never commit secrets' },
        { heading: 'Tools', content: 'MCP servers' },
        { heading: 'Workflow', content: 'Step 1: Test' },
      ];

      const results = classifySections(sections);

      expect(results).toHaveLength(3);
      expect(results[0].layer).toBe(LayerType.Rules);
      expect(results[1].layer).toBe(LayerType.Tools);
      expect(results[2].layer).toBe(LayerType.Methods);
    });

    it('should include headings in results', () => {
      const sections = [{ heading: 'Test', content: 'Content' }];
      const results = classifySections(sections);

      expect(results[0].heading).toBe('Test');
    });

    it('should handle empty sections array', () => {
      const results = classifySections([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('suggestLayer', () => {
    it('should suggest layer based on description', () => {
      const result = suggestLayer('Add security constraints for API access');
      expect(result.layer).toBe(LayerType.Rules);
    });

    it('should suggest tools for integration descriptions', () => {
      const result = suggestLayer('Setup database MCP server');
      expect(result.layer).toBe(LayerType.Tools);
    });

    it('should suggest methods for process descriptions', () => {
      const result = suggestLayer('Define the code review workflow');
      expect(result.layer).toBe(LayerType.Methods);
    });

    it('should provide confidence score', () => {
      const result = suggestLayer('Never commit secrets');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('validateLayerContent', () => {
    it('should validate correct layer assignment', () => {
      const result = validateLayerContent(
        LayerType.Rules,
        'Never commit API keys'
      );

      expect(result.valid).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.3);
      expect(result.suggestions).toBeUndefined();
    });

    it('should detect mismatched layer assignment', () => {
      const result = validateLayerContent(
        LayerType.Tools,
        'Never commit secrets' // This is rules content
      );

      expect(result.valid).toBe(false);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.length).toBeGreaterThan(0);
    });

    it('should suggest corrections', () => {
      const result = validateLayerContent(
        LayerType.Goals,
        'Architecture uses microservices' // This is knowledge content
      );

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.[0]).toContain('knowledge');
    });

    it('should handle ambiguous content', () => {
      const result = validateLayerContent(LayerType.Rules, 'Some random text');

      expect(result.valid).toBe(false);
      expect(result.suggestions?.[0]).toContain('does not clearly match');
    });
  });

  describe('getLayerGuidelines', () => {
    it('should return guidelines for Rules layer', () => {
      const guidelines = getLayerGuidelines(LayerType.Rules);

      expect(guidelines.description).toBeDefined();
      expect(guidelines.examples.length).toBeGreaterThan(0);
      expect(guidelines.keywords.length).toBeGreaterThan(0);
      expect(guidelines.keywords).toContain('rule');
    });

    it('should return guidelines for Tools layer', () => {
      const guidelines = getLayerGuidelines(LayerType.Tools);

      expect(guidelines.description).toContain('capabilities');
      expect(guidelines.examples).toBeDefined();
      expect(guidelines.keywords).toContain('tool');
    });

    it('should return guidelines for Methods layer', () => {
      const guidelines = getLayerGuidelines(LayerType.Methods);

      expect(guidelines.description.toLowerCase()).toContain('workflow');
      expect(guidelines.examples[0].toLowerCase()).toContain('workflow');
    });

    it('should return guidelines for Knowledge layer', () => {
      const guidelines = getLayerGuidelines(LayerType.Knowledge);

      expect(guidelines.description).toContain('context');
      expect(guidelines.keywords).toContain('architecture');
    });

    it('should return guidelines for Goals layer', () => {
      const guidelines = getLayerGuidelines(LayerType.Goals);

      expect(guidelines.description).toContain('objective');
      expect(guidelines.keywords).toContain('goal');
    });

    it('should include realistic examples', () => {
      const allLayers = [
        LayerType.Rules,
        LayerType.Tools,
        LayerType.Methods,
        LayerType.Knowledge,
        LayerType.Goals,
      ];

      allLayers.forEach((layer) => {
        const guidelines = getLayerGuidelines(layer);
        expect(guidelines.examples.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings', () => {
      const result = classifyContent('', '');
      expect(result.layer).toBeNull();
    });

    it('should handle very long content', () => {
      const longContent = 'Never '.repeat(1000) + 'commit secrets';
      const result = classifyContent('Rules', longContent);
      expect(result.layer).toBe(LayerType.Rules);
    });

    it('should handle special characters', () => {
      const result = classifyContent(
        'Rules!!!',
        'Never commit secrets @#$%'
      );
      expect(result.layer).toBe(LayerType.Rules);
    });

    it('should handle unicode characters', () => {
      const result = classifyContent('規則', 'Never commit secrets');
      // Should still classify based on content even with non-ASCII heading
      expect(result.layer).toBe(LayerType.Rules);
    });

    it('should handle multiple keywords from different layers', () => {
      const result = classifyContent(
        'Security Rules and Tools',
        'Never commit secrets. Use MCP servers.'
      );

      // Should pick the strongest signal (both present, but heading emphasizes Rules)
      expect(result.layer).not.toBeNull();
      expect(result.confidence).toBeGreaterThan(0);
    });
  });
});
