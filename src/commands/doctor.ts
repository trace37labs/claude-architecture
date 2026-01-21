/**
 * Doctor Command
 *
 * Health check for configuration - detects conflicts, issues, and
 * suggests improvements.
 */

import { logger } from '../utils/logger.js';
import { scanForClaudeDirectories } from '../scanner.js';
import { loadAllScopes } from '../loader.js';
import { resolveForTask } from '../engine/resolver.js';
import { ScopeLevel } from '../types/scope.js';
import {
  detectConflicts,
  ConflictDetectionResult,
  Conflict,
} from '../diagnostics/conflict-detector.js';
import {
  generateRecommendations,
  RecommendationResult,
  Recommendation,
} from '../diagnostics/recommendations.js';

export interface DoctorOptions {
  /** Directory to analyze (default: current directory) */
  targetDir?: string;
  /** Show detailed conflict information */
  verbose?: boolean;
  /** Only show errors (no warnings or info) */
  errorsOnly?: boolean;
  /** Show recommendations for improvement */
  recommendations?: boolean;
  /** Output format: text or json */
  format?: 'text' | 'json';
  /** Disable color output */
  noColor?: boolean;
}

export interface DoctorReport {
  /** Health score (0-100) */
  healthScore: number;
  /** Conflict detection results */
  conflicts: ConflictDetectionResult;
  /** Recommendations for improvement */
  recommendations?: RecommendationResult;
  /** Overall assessment */
  assessment: 'healthy' | 'needs-attention' | 'critical';
}

/**
 * Run health check on configuration
 */
export async function doctorCommand(options: DoctorOptions = {}): Promise<DoctorReport> {
  const targetDir = options.targetDir || process.cwd();
  const format = options.format || 'text';
  const showLog = format !== 'json';

  if (showLog) {
    logger.info(`🏥 Running health check on ${targetDir}...`);
    console.log('');
  }

  // Step 1: Scan for .claude/ directories
  const scanResult = scanForClaudeDirectories({
    cwd: targetDir,
    includeNonExistent: false,
  });

  const existingDirs = scanResult.directories.filter(d => d.exists);

  if (existingDirs.length === 0) {
    if (showLog) {
      logger.warn('No .claude/ directories found');
      logger.info('Run `claude-arch init` to create one');
    }

    return {
      healthScore: 0,
      conflicts: {
        conflicts: [],
        bySeverity: { errors: [], warnings: [], info: [] },
        healthScore: 0,
      },
      assessment: 'critical',
    };
  }

  // Step 2: Load configs from all scopes
  const scopeMap = loadAllScopes({ cwd: targetDir });

  // Step 3: Resolve merged config
  const context = resolveForTask(
    scopeMap.get(ScopeLevel.Task),
    scopeMap.get(ScopeLevel.Project),
    scopeMap.get(ScopeLevel.User),
    scopeMap.get(ScopeLevel.System)
  );

  // Step 4: Detect conflicts
  const conflictResults = detectConflicts(context.config, context.scopes);

  // Step 5: Generate recommendations (if requested)
  let recommendationResults: RecommendationResult | undefined;
  if (options.recommendations) {
    recommendationResults = generateRecommendations(
      context.config,
      context.scopes,
      conflictResults
    );
  }

  // Step 6: Determine overall assessment
  const assessment = getAssessment(conflictResults.healthScore);

  const report: DoctorReport = {
    healthScore: conflictResults.healthScore,
    conflicts: conflictResults,
    recommendations: recommendationResults,
    assessment,
  };

  // Step 7: Display results
  if (format === 'json') {
    displayJson(report);
  } else {
    displayText(report, options);
  }

  return report;
}

/**
 * Get overall assessment based on health score
 */
function getAssessment(healthScore: number): 'healthy' | 'needs-attention' | 'critical' {
  if (healthScore >= 80) return 'healthy';
  if (healthScore >= 50) return 'needs-attention';
  return 'critical';
}

/**
 * Display report as formatted text
 */
function displayText(report: DoctorReport, options: DoctorOptions): void {
  const { conflicts, recommendations, healthScore, assessment } = report;

  // Health score header
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const scoreColor = healthScore >= 80 ? '🟢' : healthScore >= 50 ? '🟡' : '🔴';
  console.log(`${scoreColor} HEALTH SCORE: ${healthScore}/100 (${assessment.toUpperCase()})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Summary
  const { errors, warnings, info } = conflicts.bySeverity;
  console.log('📊 SUMMARY:');
  if (errors.length > 0) {
    logger.error(`  ❌ ${errors.length} error(s)`);
  }
  if (warnings.length > 0) {
    logger.warn(`  ⚠️  ${warnings.length} warning(s)`);
  }
  if (info.length > 0) {
    logger.info(`  ℹ️  ${info.length} info message(s)`);
  }
  if (errors.length === 0 && warnings.length === 0 && info.length === 0) {
    logger.success('  ✓ No issues detected');
  }
  console.log('');

  // Display conflicts
  if (conflicts.conflicts.length > 0) {
    displayConflicts(conflicts, options);
  }

  // Display recommendations
  if (recommendations) {
    displayRecommendations(recommendations, options);
  }

  // Footer
  if (assessment === 'healthy') {
    logger.success('✅ Configuration looks good!');
  } else if (assessment === 'needs-attention') {
    logger.warn('⚠️  Configuration needs attention');
    logger.info('Review warnings and consider recommendations');
  } else {
    logger.error('🚨 Configuration has critical issues');
    logger.info('Fix errors before proceeding');
  }
}

/**
 * Display conflicts in formatted text
 */
function displayConflicts(
  conflicts: ConflictDetectionResult,
  options: DoctorOptions
): void {
  const { errors, warnings, info } = conflicts.bySeverity;

  // Show errors
  if (errors.length > 0) {
    console.log('❌ ERRORS:');
    console.log('');
    for (const conflict of errors) {
      displayConflict(conflict, options);
    }
  }

  // Show warnings (unless errors-only mode)
  if (!options.errorsOnly && warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    console.log('');
    for (const conflict of warnings) {
      displayConflict(conflict, options);
    }
  }

  // Show info (only in verbose mode)
  if (options.verbose && info.length > 0) {
    console.log('ℹ️  INFORMATION:');
    console.log('');
    for (const conflict of info) {
      displayConflict(conflict, options);
    }
  }
}

/**
 * Display a single conflict
 */
function displayConflict(conflict: Conflict, options: DoctorOptions): void {
  const icon = conflict.severity === 'error' ? '  ❌' : conflict.severity === 'warning' ? '  ⚠️ ' : '  ℹ️ ';

  console.log(`${icon} ${conflict.message}`);

  if (options.verbose && conflict.details) {
    console.log(`     ${conflict.details}`);
  }

  if (options.verbose) {
    console.log(`     Layer: ${conflict.layer}`);
    if (conflict.scopes.length > 0) {
      console.log(`     Scopes: ${conflict.scopes.join(', ')}`);
    }
  }

  if (conflict.suggestion) {
    logger.info(`     💡 ${conflict.suggestion}`);
  }

  console.log('');
}

/**
 * Display recommendations in formatted text
 */
function displayRecommendations(
  recommendations: RecommendationResult,
  options: DoctorOptions
): void {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 RECOMMENDATIONS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const { high, medium, low } = recommendations.byPriority;

  // Quick wins section
  if (recommendations.quickWins.length > 0) {
    console.log('🎯 QUICK WINS (High Impact, Easy to Fix):');
    console.log('');
    for (const rec of recommendations.quickWins) {
      displayRecommendation(rec, options);
    }
  }

  // High priority
  if (high.length > 0) {
    console.log('🔴 HIGH PRIORITY:');
    console.log('');
    for (const rec of high.filter(r => !recommendations.quickWins.includes(r))) {
      displayRecommendation(rec, options);
    }
  }

  // Medium priority (only in verbose mode)
  if (options.verbose && medium.length > 0) {
    console.log('🟡 MEDIUM PRIORITY:');
    console.log('');
    for (const rec of medium) {
      displayRecommendation(rec, options);
    }
  }

  // Low priority (only in verbose mode)
  if (options.verbose && low.length > 0) {
    console.log('🟢 LOW PRIORITY:');
    console.log('');
    for (const rec of low) {
      displayRecommendation(rec, options);
    }
  }
}

/**
 * Display a single recommendation
 */
function displayRecommendation(rec: Recommendation, options: DoctorOptions): void {
  console.log(`  📌 ${rec.title}`);
  console.log(`     ${rec.description}`);
  console.log(`     ✅ Action: ${rec.action}`);

  if (rec.benefit) {
    console.log(`     💎 Benefit: ${rec.benefit}`);
  }

  if (options.verbose && rec.layer) {
    console.log(`     Layer: ${rec.layer}`);
  }

  console.log('');
}

/**
 * Display report as JSON
 */
function displayJson(report: DoctorReport): void {
  console.log(JSON.stringify(report, null, 2));
}
