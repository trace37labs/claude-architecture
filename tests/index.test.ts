import { describe, it, expect } from 'vitest';
import { getVersion, VERSION } from '../src/index.js';

describe('Index', () => {
  it('should export correct version', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('should return version from getVersion()', () => {
    expect(getVersion()).toBe('0.1.0');
  });
});
