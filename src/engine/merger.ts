/**
 * Layer Merger - merges layer content across scopes
 */

import {
  RulesLayer,
  ToolsLayer,
  MethodsLayer,
  KnowledgeLayer,
  GoalsLayer,
  MCPServerConfig,
  SlashCommand,
  Pattern,
  ADR,
  SuccessCriteria,
} from '../types/layers.js';
import { ScopeLevel } from '../types/scope.js';

function dedupe<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function mergeRules(rules: RulesLayer[]): RulesLayer {
  const result: RulesLayer = {
    security: [],
    outputRequirements: [],
    forbidden: [],
    required: [],
    compliance: [],
  };
  const all: {
    security?: string[];
    outputRequirements?: string[];
    forbidden?: string[];
    required?: string[];
    compliance?: string[];
    rawContent?: string;
  } = {
    security: [],
    outputRequirements: [],
    forbidden: [],
    required: [],
    compliance: [],
  };

  for (const r of rules) {
    if (r.security) all.security!.push(...r.security);
    if (r.outputRequirements) all.outputRequirements!.push(...r.outputRequirements);
    if (r.forbidden) all.forbidden!.push(...r.forbidden);
    if (r.required) all.required!.push(...r.required);
    if (r.compliance) all.compliance!.push(...r.compliance);
    if (r.rawContent) {
      all.rawContent = all.rawContent ? `${all.rawContent}\n\n${r.rawContent}` : r.rawContent;
    }
  }

  if (all.security!.length) result.security = dedupe(all.security!);
  if (all.outputRequirements!.length) result.outputRequirements = dedupe(all.outputRequirements!);
  if (all.forbidden!.length) result.forbidden = dedupe(all.forbidden!);
  if (all.required!.length) result.required = dedupe(all.required!);
  if (all.compliance!.length) result.compliance = dedupe(all.compliance!);
  if (all.rawContent) result.rawContent = all.rawContent;

  return result;
}

export function mergeTools(tools: ToolsLayer[]): ToolsLayer {
  const result: ToolsLayer = {};
  const mcpMap = new Map<string, MCPServerConfig>();
  const cmdMap = new Map<string, SlashCommand>();
  let scripts: Record<string, string> = {};
  let apis: Record<string, string> = {};
  const services: string[] = [];
  const rawContents: string[] = [];

  for (const t of tools) {
    if (t.mcpServers) t.mcpServers.forEach(s => mcpMap.set(s.name, s));
    if (t.commands) t.commands.forEach(c => cmdMap.set(c.name, c));
    if (t.scripts) scripts = { ...scripts, ...t.scripts };
    if (t.apis) apis = { ...apis, ...t.apis };
    if (t.services) services.push(...t.services);
    if (t.rawContent) rawContents.push(t.rawContent);
  }

  if (mcpMap.size) result.mcpServers = Array.from(mcpMap.values());
  if (cmdMap.size) result.commands = Array.from(cmdMap.values());
  if (Object.keys(scripts).length) result.scripts = scripts;
  if (Object.keys(apis).length) result.apis = apis;
  if (services.length) result.services = dedupe(services);
  if (rawContents.length) result.rawContent = rawContents.join('\n\n');

  return result;
}

export function mergeMethods(methods: MethodsLayer[], _scopes: ScopeLevel[]): MethodsLayer {
  let overrideIdx = -1;
  for (let i = methods.length - 1; i >= 0; i--) {
    if (methods[i].override) {
      overrideIdx = i;
      break;
    }
  }

  const toMerge = overrideIdx >= 0 ? methods.slice(overrideIdx) : methods;
  const result: MethodsLayer = {};
  const patternMap = new Map<string, Pattern>();
  let workflows: Record<string, any> = {};
  const practices: string[] = [];
  let decisions: Record<string, string> = {};
  let checklists: Record<string, string[]> = {};
  const rawContents: string[] = [];

  for (const m of toMerge) {
    if (m.patterns) m.patterns.forEach(p => patternMap.set(p.name, p));
    if (m.workflows) workflows = { ...workflows, ...m.workflows };
    if (m.bestPractices) practices.push(...m.bestPractices);
    if (m.decisions) decisions = { ...decisions, ...m.decisions };
    if (m.checklists) checklists = { ...checklists, ...m.checklists };
    if (m.rawContent) {
      if (m.override) {
        rawContents.length = 0;
        rawContents.push(m.rawContent);
      } else {
        rawContents.push(m.rawContent);
      }
    }
  }

  if (patternMap.size) result.patterns = Array.from(patternMap.values());
  if (Object.keys(workflows).length) result.workflows = workflows;
  if (practices.length) result.bestPractices = dedupe(practices);
  if (Object.keys(decisions).length) result.decisions = decisions;
  if (Object.keys(checklists).length) result.checklists = checklists;
  if (rawContents.length) result.rawContent = rawContents.join('\n\n');

  return result;
}

export function mergeKnowledge(knowledge: KnowledgeLayer[]): KnowledgeLayer {
  const result: KnowledgeLayer = {};
  const overviews: string[] = [];
  const architectures: string[] = [];
  const histories: string[] = [];
  let glossary: Record<string, string> = {};
  const adrMap = new Map<number, ADR>();
  let specs: Record<string, string> = {};
  const rules: string[] = [];
  const rawContents: string[] = [];

  for (const k of knowledge) {
    if (k.overview) overviews.push(k.overview);
    if (k.architecture) architectures.push(k.architecture);
    if (k.history) histories.push(k.history);
    if (k.glossary) glossary = { ...glossary, ...k.glossary };
    if (k.adrs) k.adrs.forEach(a => adrMap.set(a.number, a));
    if (k.specs) specs = { ...specs, ...k.specs };
    if (k.businessRules) rules.push(...k.businessRules);
    if (k.rawContent) rawContents.push(k.rawContent);
  }

  if (overviews.length) result.overview = overviews.join('\n\n');
  if (architectures.length) result.architecture = architectures.join('\n\n');
  if (histories.length) result.history = histories.join('\n\n');
  if (Object.keys(glossary).length) result.glossary = glossary;
  if (adrMap.size) result.adrs = Array.from(adrMap.values()).sort((a, b) => a.number - b.number);
  if (Object.keys(specs).length) result.specs = specs;
  if (rules.length) result.businessRules = dedupe(rules);
  if (rawContents.length) result.rawContent = rawContents.join('\n\n');

  return result;
}

export function mergeGoals(goals: GoalsLayer[], _scopes: ScopeLevel[]): GoalsLayer {
  let overrideIdx = -1;
  for (let i = goals.length - 1; i >= 0; i--) {
    if (goals[i].override) {
      overrideIdx = i;
      break;
    }
  }

  const toMerge = overrideIdx >= 0 ? goals.slice(overrideIdx) : goals;
  const result: GoalsLayer = {};
  const criteriaMap = new Map<string, SuccessCriteria>();
  const nonGoals: string[] = [];
  let priorities: string[] = [];
  const done: string[] = [];
  const rawContents: string[] = [];

  for (const g of toMerge) {
    if (g.current && !result.current) result.current = g.current;
    if (g.successCriteria) {
      g.successCriteria.forEach(c => {
        const existing = criteriaMap.get(c.description);
        if (existing) {
          existing.completed = existing.completed || c.completed;
          if (c.test) existing.test = c.test;
        } else {
          criteriaMap.set(c.description, { ...c });
        }
      });
    }
    if (g.nonGoals) nonGoals.push(...g.nonGoals);
    if (g.priorities) priorities = g.priorities;
    if (g.done) done.push(...g.done);
    if (g.rawContent) {
      if (g.override) {
        rawContents.length = 0;
        rawContents.push(g.rawContent);
      } else {
        rawContents.push(g.rawContent);
      }
    }
  }

  if (criteriaMap.size) result.successCriteria = Array.from(criteriaMap.values());
  if (nonGoals.length) result.nonGoals = dedupe(nonGoals);
  if (priorities.length) result.priorities = priorities;
  if (done.length) result.done = dedupe(done);
  if (rawContents.length) result.rawContent = rawContents.join('\n\n');

  return result;
}
