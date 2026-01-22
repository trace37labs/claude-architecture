/**
 * Tree Command
 *
 * Displays the .claude/ directory structure as a visual tree
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger.js';

export interface TreeOptions {
  /** Directory to show tree for (default: current directory) */
  targetDir?: string;
  /** Maximum depth to traverse */
  depth?: number;
  /** Show hidden files */
  all?: boolean;
  /** Disable color output */
  noColor?: boolean;
  /** Show file sizes */
  size?: boolean;
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: TreeNode[];
  size?: number;
}

/**
 * Display .claude/ directory structure as tree
 */
export async function treeCommand(options: TreeOptions = {}): Promise<void> {
  const targetDir = options.targetDir || process.cwd();
  const claudeDir = path.join(targetDir, '.claude');
  const maxDepth = options.depth ?? 10;
  const showHidden = options.all ?? false;
  const useColor = !options.noColor;
  const showSize = options.size ?? false;

  // Check if .claude/ exists
  if (!fs.existsSync(claudeDir)) {
    logger.warn('No .claude/ directory found');
    logger.info('Run `claude-arch init` to create one');
    return;
  }

  const c = useColor ? {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
  } : {
    reset: '', bright: '', dim: '', blue: '', green: '', yellow: '', cyan: '',
  };

  // Build tree structure
  const tree = buildTree(claudeDir, maxDepth, showHidden, 0);

  // Display tree
  console.log(`\n${c.bright}.claude/${c.reset}`);
  displayTree(tree.children || [], '', c, showSize);

  // Summary
  const stats = countNodes(tree);
  console.log(`\n${c.dim}${stats.dirs} directories, ${stats.files} files${c.reset}\n`);
}

/**
 * Build tree structure from directory
 */
function buildTree(
  dirPath: string,
  maxDepth: number,
  showHidden: boolean,
  currentDepth: number
): TreeNode {
  const name = path.basename(dirPath);
  const node: TreeNode = {
    name,
    path: dirPath,
    isDirectory: true,
    children: [],
  };

  if (currentDepth >= maxDepth) {
    return node;
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    // Sort: directories first, then files, alphabetically
    const sorted = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of sorted) {
      // Skip hidden files unless --all
      if (!showHidden && entry.name.startsWith('.')) {
        continue;
      }

      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const childNode = buildTree(entryPath, maxDepth, showHidden, currentDepth + 1);
        node.children!.push(childNode);
      } else {
        const stats = fs.statSync(entryPath);
        node.children!.push({
          name: entry.name,
          path: entryPath,
          isDirectory: false,
          size: stats.size,
        });
      }
    }
  } catch (err) {
    // Permission denied or other error - skip
  }

  return node;
}

/**
 * Display tree with connectors
 */
function displayTree(
  nodes: TreeNode[],
  prefix: string,
  c: Record<string, string>,
  showSize: boolean
): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isLast = i === nodes.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';

    // Color based on type
    let displayName = node.name;
    if (node.isDirectory) {
      displayName = `${c.blue}${node.name}/${c.reset}`;
    } else if (node.name.endsWith('.md')) {
      displayName = `${c.green}${node.name}${c.reset}`;
    } else if (node.name.endsWith('.json') || node.name.endsWith('.yaml')) {
      displayName = `${c.yellow}${node.name}${c.reset}`;
    }

    // Size info
    let sizeStr = '';
    if (showSize && !node.isDirectory && node.size !== undefined) {
      sizeStr = ` ${c.dim}(${formatSize(node.size)})${c.reset}`;
    }

    console.log(`${prefix}${c.dim}${connector}${c.reset}${displayName}${sizeStr}`);

    if (node.isDirectory && node.children && node.children.length > 0) {
      displayTree(node.children, prefix + childPrefix, c, showSize);
    }
  }
}

/**
 * Count directories and files
 */
function countNodes(node: TreeNode): { dirs: number; files: number } {
  let dirs = 0;
  let files = 0;

  if (node.isDirectory) {
    for (const child of node.children || []) {
      if (child.isDirectory) {
        dirs++;
        const childStats = countNodes(child);
        dirs += childStats.dirs;
        files += childStats.files;
      } else {
        files++;
      }
    }
  }

  return { dirs, files };
}

/**
 * Format file size
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}
