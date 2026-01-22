/**
 * Manifest Types
 *
 * Type definitions for portable configuration manifests used in export/gaps commands.
 */

import { Platform } from '../utils/platform-utils.js';

export interface MCPServer {
  name: string;
  package: string;
  required: boolean;
}

export interface CLITool {
  name: string;
  required: boolean;
  platform?: Platform;
  install_cmd?: string;
}

export interface EnvironmentVariable {
  name: string;
  required: boolean;
}

export interface PathRequirement {
  source: string;
  description: string;
  required: boolean;
}

export interface SkillDependency {
  name: string;
  dependencies: string[];
  platform?: Platform;
}

export interface HookDefinition {
  event: string;
  script: string;
}

export interface PathMapping {
  [key: string]: string;
}

export interface ManifestMetadata {
  generated_from: string;
  date: string;
  platform: Platform;
  target_platform?: Platform;
}

export interface ConfigManifest {
  metadata: ManifestMetadata;
  required: {
    mcp_servers: MCPServer[];
    cli_tools: CLITool[];
    environment_variables: EnvironmentVariable[];
    paths: PathRequirement[];
    skills: SkillDependency[];
    hooks: HookDefinition[];
  };
  path_mappings?: Record<string, PathMapping>;
}

export interface GapAnalysisResult {
  mcp_servers: {
    installed: MCPServer[];
    missing: MCPServer[];
  };
  cli_tools: {
    available: Array<CLITool & { version?: string }>;
    missing: CLITool[];
    skipped: CLITool[];
  };
  environment_variables: {
    set: EnvironmentVariable[];
    missing: EnvironmentVariable[];
  };
  paths: {
    exists: PathRequirement[];
    missing: PathRequirement[];
  };
  hooks: {
    found: HookDefinition[];
    missing: HookDefinition[];
  };
  summary: {
    required_missing: number;
    required_available: number;
    optional_missing: number;
    optional_available: number;
  };
}
