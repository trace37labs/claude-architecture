/**
 * File Reader Utilities
 *
 * Reads and parses markdown and YAML files from layer directories.
 * Handles both structured YAML configs and freeform markdown content.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import { parse as parseYaml } from 'yaml';

/**
 * File content with metadata
 */
export interface FileContent {
  /** Absolute path to the file */
  path: string;
  /** File name without extension */
  name: string;
  /** File extension (e.g., '.md', '.yaml') */
  extension: string;
  /** Raw file content */
  content: string;
  /** When the file was read */
  readAt: Date;
}

/**
 * Options for reading files
 */
export interface ReadOptions {
  /** File extensions to include (default: ['.md', '.yaml', '.yml']) */
  extensions?: string[];
  /** Whether to read subdirectories recursively */
  recursive?: boolean;
  /** Pattern to match file names (regex or glob-like string) */
  pattern?: string | RegExp;
  /** Encoding to use (default: 'utf-8') */
  encoding?: BufferEncoding;
}

/**
 * Read a single file and return its content with metadata
 *
 * @param filePath - Path to the file
 * @param options - Read options
 * @returns File content object
 *
 * @example
 * ```typescript
 * const content = readFile('/path/to/file.md');
 * console.log(content.content);
 * ```
 */
export function readFile(
  filePath: string,
  options: ReadOptions = {}
): FileContent {
  const encoding = options.encoding || 'utf-8';
  const content = readFileSync(filePath, encoding);

  return {
    path: filePath,
    name: basename(filePath, extname(filePath)),
    extension: extname(filePath),
    content,
    readAt: new Date(),
  };
}

/**
 * Read all files in a directory matching the criteria
 *
 * @param dirPath - Directory path
 * @param options - Read options
 * @returns Array of file content objects
 *
 * @example
 * ```typescript
 * const files = readDirectory('/path/to/layer');
 * files.forEach(file => console.log(file.name, file.content));
 * ```
 */
export function readDirectory(
  dirPath: string,
  options: ReadOptions = {}
): FileContent[] {
  const extensions = options.extensions || ['.md', '.yaml', '.yml'];
  const recursive = options.recursive ?? false;
  const pattern = options.pattern;

  const files: FileContent[] = [];

  try {
    const entries = readdirSync(dirPath);

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        if (recursive) {
          files.push(...readDirectory(fullPath, options));
        }
      } else if (stats.isFile()) {
        const ext = extname(entry);
        if (!extensions.includes(ext)) {
          continue;
        }

        // Check pattern if provided
        if (pattern) {
          const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
          if (!regex.test(entry)) {
            continue;
          }
        }

        files.push(readFile(fullPath, options));
      }
    }
  } catch (error) {
    // Directory doesn't exist or is not readable
    // Return empty array rather than throwing
  }

  return files;
}

/**
 * Read all markdown files from a directory
 *
 * @param dirPath - Directory path
 * @param recursive - Whether to read subdirectories
 * @returns Array of markdown file contents
 */
export function readMarkdownFiles(
  dirPath: string,
  recursive = false
): FileContent[] {
  return readDirectory(dirPath, {
    extensions: ['.md', '.markdown'],
    recursive,
  });
}

/**
 * Read all YAML files from a directory
 *
 * @param dirPath - Directory path
 * @param recursive - Whether to read subdirectories
 * @returns Array of YAML file contents
 */
export function readYamlFiles(
  dirPath: string,
  recursive = false
): FileContent[] {
  return readDirectory(dirPath, {
    extensions: ['.yaml', '.yml'],
    recursive,
  });
}

/**
 * Parsed YAML content
 */
export interface ParsedYaml<T = unknown> {
  /** Original file content */
  file: FileContent;
  /** Parsed YAML data */
  data: T;
  /** Any parsing errors */
  error?: Error;
}

/**
 * Parse a YAML file and return the data
 *
 * @param filePath - Path to YAML file
 * @returns Parsed YAML content
 *
 * @example
 * ```typescript
 * const result = parseYamlFile<ConfigFile>('/path/to/config.yaml');
 * if (!result.error) {
 *   console.log(result.data);
 * }
 * ```
 */
export function parseYamlFile<T = unknown>(filePath: string): ParsedYaml<T> {
  const file = readFile(filePath);

  try {
    const data = parseYaml(file.content) as T;
    return { file, data };
  } catch (error) {
    return {
      file,
      data: {} as T,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Parse multiple YAML files
 *
 * @param dirPath - Directory path
 * @param recursive - Whether to read subdirectories
 * @returns Array of parsed YAML contents
 */
export function parseYamlFiles<T = unknown>(
  dirPath: string,
  recursive = false
): ParsedYaml<T>[] {
  const files = readYamlFiles(dirPath, recursive);
  return files.map((file) => {
    try {
      const data = parseYaml(file.content) as T;
      return { file, data };
    } catch (error) {
      return {
        file,
        data: {} as T,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  });
}

/**
 * Read and combine content from multiple markdown files
 *
 * @param dirPath - Directory path
 * @param separator - Separator between files (default: '\n\n---\n\n')
 * @returns Combined markdown content
 */
export function combineMarkdownFiles(
  dirPath: string,
  separator = '\n\n---\n\n'
): string {
  const files = readMarkdownFiles(dirPath, false);

  // Sort by filename for consistent ordering
  files.sort((a, b) => a.name.localeCompare(b.name));

  return files.map((file) => file.content).join(separator);
}

/**
 * Check if a file exists and is readable
 *
 * @param filePath - Path to check
 * @returns True if file exists and is readable
 */
export function fileExists(filePath: string): boolean {
  try {
    const stats = statSync(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Get file modification time
 *
 * @param filePath - Path to the file
 * @returns Modification date, or null if file doesn't exist
 */
export function getFileModificationTime(filePath: string): Date | null {
  try {
    const stats = statSync(filePath);
    return stats.mtime;
  } catch {
    return null;
  }
}

/**
 * Read a config.yaml file from a .claude/ directory
 *
 * @param claudeDir - Path to .claude/ directory
 * @returns Parsed config file, or null if not found
 */
export function readConfigFile<T = unknown>(claudeDir: string): ParsedYaml<T> | null {
  const configPath = join(claudeDir, 'config.yaml');
  if (!fileExists(configPath)) {
    return null;
  }

  return parseYamlFile<T>(configPath);
}

/**
 * File tree structure for debugging/display
 */
export interface FileTree {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTree[];
  size?: number;
}

/**
 * Build a file tree structure for a directory
 *
 * @param dirPath - Directory to scan
 * @param maxDepth - Maximum depth to traverse (default: 3)
 * @returns File tree structure
 */
export function buildFileTree(dirPath: string, maxDepth = 3): FileTree | null {
  try {
    const stats = statSync(dirPath);
    const name = basename(dirPath);

    if (stats.isFile()) {
      return {
        name,
        path: dirPath,
        type: 'file',
        size: stats.size,
      };
    }

    if (!stats.isDirectory() || maxDepth <= 0) {
      return null;
    }

    const children: FileTree[] = [];
    const entries = readdirSync(dirPath);

    for (const entry of entries) {
      // Skip hidden files except .claude
      if (entry.startsWith('.') && entry !== '.claude') {
        continue;
      }

      const childPath = join(dirPath, entry);
      const childTree = buildFileTree(childPath, maxDepth - 1);
      if (childTree) {
        children.push(childTree);
      }
    }

    return {
      name,
      path: dirPath,
      type: 'directory',
      children: children.length > 0 ? children : undefined,
    };
  } catch {
    return null;
  }
}
