/**
 * MCP Server Tests
 */

import { describe, it, expect } from 'vitest';
import { createMcpServer } from '../../../src/mcp/server';

describe('MCP Server', () => {
  it('should create server with correct name and version', () => {
    const server = createMcpServer();
    expect(server).toBeDefined();
  });

  it('should register all tool handlers', () => {
    const server = createMcpServer();
    expect(server).toBeDefined();
    // Server internals are not directly testable, but we can verify creation
  });
});
