/**
 * Grading utilities for calculating student grades
 * Grading Scale:
 * - O: 90-100 (9-10 SGPA range)
 * - A+: 80-89 (8-9 SGPA range)
 * - A: 70-79 (7-8 SGPA range)
 * - B+: 60-69 (6-7 SGPA range)
 * - B: 50-59 (5-6 SGPA range)
 * - F: Below 50 (Fail)
 */

import { Grade, GradingConfig } from '@/types';
import { GRADES } from '@/types/constants';

interface ComponentMarks {
  cie1: number;
  cie2: number;
  see: number;
  assignment?: number;
  groupActivity?: number;
}

interface ComponentMaxMarks {
  cie1Max: number;
  cie2Max: number;
  seeMax: number;
  assignmentMax: number;
  groupActivityMax: number;
}

const DEFAULT_MAX_MARKS: ComponentMaxMarks = {
  cie1Max: 25,
  cie2Max: 25,
  seeMax: 50,
  assignmentMax: 10,
  groupActivityMax: 10,
};

/**
 * Calculate total marks based on enabled components
 */
export function calculateTotalMarks(
  marks: ComponentMarks,
  config: Partial<GradingConfig>,
  maxMarks: Partial<ComponentMaxMarks> = {}
): { total: number; maxTotal: number } {
  const defaults = { ...DEFAULT_MAX_MARKS, ...maxMarks };
  
  let total = 0;
  let maxTotal = 0;

  // CIE1 (required)
  if (config.cie1Enabled !== false) {
    total += marks.cie1 || 0;
    maxTotal += config.cie1MaxMarks || defaults.cie1Max;
  }

  // CIE2 (required)
  if (config.cie2Enabled !== false) {
    total += marks.cie2 || 0;
    maxTotal += config.cie2MaxMarks || defaults.cie2Max;
  }

  // SEE (required)
  if (config.seeEnabled !== false) {
    total += marks.see || 0;
    maxTotal += config.seeMaxMarks || defaults.seeMax;
  }

  // Assignment (optional)
  if (config.assignmentEnabled) {
    total += marks.assignment || 0;
    maxTotal += config.assignmentMaxMarks || defaults.assignmentMax;
  }

  // Group Activity (optional)
  if (config.groupActivityEnabled) {
    total += marks.groupActivity || 0;
    maxTotal += config.groupActivityMaxMarks || defaults.groupActivityMax;
  }

  return { total, maxTotal };
}

/**
 * Calculate percentage from total marks
 */
export function calculatePercentage(total: number, maxTotal: number): number {
  if (maxTotal === 0) return 0;
  return Math.round((total / maxTotal) * 100 * 100) / 100; // Round to 2 decimal places
}

/**
 * Get grade letter from percentage
 * Based on: O (90-100), A+ (80-89), A (70-79), B+ (60-69), B (50-59), F (<50)
 */
export function getGradeFromPercentage(percentage: number): Grade {
  if (percentage >= 90) return GRADES.O;
  if (percentage >= 80) return GRADES.A_PLUS;
  if (percentage >= 70) return GRADES.A;
  if (percentage >= 60) return GRADES.B_PLUS;
  if (percentage >= 50) return GRADES.B;
  return GRADES.F;
}

/**
 * Get grade letter from marks directly
 */
export function calculateGrade(
  marks: ComponentMarks,
  config: Partial<GradingConfig>,
  maxMarks?: Partial<ComponentMaxMarks>
): { grade: Grade; percentage: number; total: number; maxTotal: number } {
  const { total, maxTotal } = calculateTotalMarks(marks, config, maxMarks);
  const percentage = calculatePercentage(total, maxTotal);
  const grade = getGradeFromPercentage(percentage);

  return { grade, percentage, total, maxTotal };
}

/**
 * Get color code for grade
 */
export function getGradeColor(grade: Grade): string {
  switch (grade) {
    case GRADES.O:
      return '#5AA578'; // Green
    case GRADES.A_PLUS:
      return '#7BC89A'; // Light Green
    case GRADES.A:
      return '#7477FF'; // Purple
    case GRADES.B_PLUS:
      return '#F9CD61'; // Yellow
    case GRADES.B:
      return '#F9A03F'; // Orange
    case GRADES.F:
      return '#F96857'; // Red
    default:
      return '#77867D'; // Gray
  }
}

/**
 * Get display name for grade
 */
export function getGradeDisplayName(grade: Grade): string {
  switch (grade) {
    case GRADES.O:
      return 'Outstanding';
    case GRADES.A_PLUS:
      return 'Excellent';
    case GRADES.A:
      return 'Very Good';
    case GRADES.B_PLUS:
      return 'Good';
    case GRADES.B:
      return 'Above Average';
    case GRADES.F:
      return 'Fail';
    default:
      return grade;
  }
}

/**
 * Get SGPA points for grade
 */
export function getGradePoints(grade: Grade): number {
  switch (grade) {
    case GRADES.O:
      return 10;
    case GRADES.A_PLUS:
      return 9;
    case GRADES.A:
      return 8;
    case GRADES.B_PLUS:
      return 7;
    case GRADES.B:
      return 6;
    case GRADES.F:
      return 0;
    default:
      return 0;
  }
}

/**
 * Default grading configuration
 */
export function getDefaultGradingConfig(): GradingConfig {
  return {
    cie1Enabled: true,
    cie2Enabled: true,
    seeEnabled: true,
    assignmentEnabled: false,
    groupActivityEnabled: false,
    cie1MaxMarks: 25,
    cie2MaxMarks: 25,
    seeMaxMarks: 50,
    assignmentMaxMarks: 10,
    groupActivityMaxMarks: 10,
  };
}

/**
 * Validate marks input
 */
export function validateMarks(
  marks: ComponentMarks,
  config: Partial<GradingConfig>,
  maxMarks: Partial<ComponentMaxMarks> = {}
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const defaults = { ...DEFAULT_MAX_MARKS, ...maxMarks };

  // Validate CIE1
  if (config.cie1Enabled !== false) {
    const max = config.cie1MaxMarks || defaults.cie1Max;
    if (marks.cie1 < 0 || marks.cie1 > max) {
      errors.push(`CIE1 marks must be between 0 and ${max}`);
    }
  }

  // Validate CIE2
  if (config.cie2Enabled !== false) {
    const max = config.cie2MaxMarks || defaults.cie2Max;
    if (marks.cie2 < 0 || marks.cie2 > max) {
      errors.push(`CIE2 marks must be between 0 and ${max}`);
    }
  }

  // Validate SEE
  if (config.seeEnabled !== false) {
    const max = config.seeMaxMarks || defaults.seeMax;
    if (marks.see < 0 || marks.see > max) {
      errors.push(`SEE marks must be between 0 and ${max}`);
    }
  }

  // Validate Assignment
  if (config.assignmentEnabled) {
    const max = config.assignmentMaxMarks || defaults.assignmentMax;
    if ((marks.assignment || 0) < 0 || (marks.assignment || 0) > max) {
      errors.push(`Assignment marks must be between 0 and ${max}`);
    }
  }

  // Validate Group Activity
  if (config.groupActivityEnabled) {
    const max = config.groupActivityMaxMarks || defaults.groupActivityMax;
    if ((marks.groupActivity || 0) < 0 || (marks.groupActivity || 0) > max) {
      errors.push(`Group Activity marks must be between 0 and ${max}`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

export default {
  calculateTotalMarks,
  calculatePercentage,
  getGradeFromPercentage,
  calculateGrade,
  getGradeColor,
  getGradeDisplayName,
  getGradePoints,
  getDefaultGradingConfig,
  validateMarks,
};
