/**
 * Validation utilities for forms
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate course code format
 * Expected format: 2-4 letters followed by 3 digits (e.g., CS101, MATH201)
 */
export function validateCourseCode(code: string): ValidationResult {
  if (!code || !code.trim()) {
    return { isValid: false, error: 'Course code is required' };
  }

  const trimmed = code.trim().toUpperCase();

  // Pattern: 2-4 letters followed by 3 digits
  const pattern = /^\d{2}[A-Z]{3}\d{3}[A-Z]?$/;

  if (!pattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid format. Use format like 22CSU701, 22CST704B'
    };
  }

  return { isValid: true };
}

/**
 * Validate course name
 */
export function validateCourseName(name: string): ValidationResult {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Course name is required' };
  }

  if (name.trim().length < 3) {
    return { isValid: false, error: 'Course name must be at least 3 characters' };
  }

  if (name.trim().length > 100) {
    return { isValid: false, error: 'Course name must be less than 100 characters' };
  }

  return { isValid: true };
}

/**
 * Validate section format
 * Expected: Single letter A-Z or number 01-99
 */
export function validateSection(section: string): ValidationResult {
  if (!section || !section.trim()) {
    return { isValid: false, error: 'Section is required' };
  }

  const trimmed = section.trim().toUpperCase();

  // Pattern: Single letter A-Z or 2-digit number 01-99
  const pattern = /^[A-Z]$|^\d{2}$/;

  if (!pattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid section. Use single letter (A-Z) or two digits (01-99)'
    };
  }

  return { isValid: true };
}

/**
 * Validate academic year
 */
export function validateAcademicYear(year: string): ValidationResult {
  if (!year || !year.trim()) {
    return { isValid: false, error: 'Academic year is required' };
  }

  const yearNum = parseInt(year.trim());
  const currentYear = new Date().getFullYear();

  if (isNaN(yearNum) || year.toString().length !== 4) {
    return { isValid: false, error: 'Invalid year format. Use 4-digit year (e.g., 2025)' };
  }

  if (yearNum < currentYear - 5 || yearNum > currentYear + 5) {
    return {
      isValid: false,
      error: `Year must be between ${currentYear - 5} and ${currentYear + 5}`
    };
  }

  return { isValid: true };
}

/**
 * Validate credits
 */
export function validateCredits(credits: string | number): ValidationResult {
  const creditNum = typeof credits === 'string' ? parseInt(credits) : credits;

  if (isNaN(creditNum) || creditNum <= 0) {
    return { isValid: false, error: 'Credits must be a positive number' };
  }

  if (creditNum > 10) {
    return { isValid: false, error: 'Credits cannot exceed 10' };
  }

  return { isValid: true };
}

/**
 * Validate USN (University Seat Number)
 * Format varies by university, but typically alphanumeric
 */
export function validateUSN(usn: string): ValidationResult {
  if (!usn || !usn.trim()) {
    return { isValid: false, error: 'USN is required' };
  }

  const trimmed = usn.trim().toUpperCase();

  // Pattern: Alphanumeric, typically 10 characters
  // Example formats: 1SI21CS001, 4NM21IS042, etc.
  if (trimmed.length < 6 || trimmed.length > 15) {
    return { isValid: false, error: 'USN must be 6-15 characters' };
  }

  const pattern = /^[A-Z0-9]+$/;
  if (!pattern.test(trimmed)) {
    return { isValid: false, error: 'USN can only contain letters and numbers' };
  }

  return { isValid: true };
}

/**
 * Validate teacher code
 */
export function validateTeacherCode(code: string): ValidationResult {
  if (!code || !code.trim()) {
    return { isValid: false, error: 'Teacher code is required' };
  }

  const trimmed = code.trim().toUpperCase();

  if (trimmed.length < 3 || trimmed.length > 10) {
    return { isValid: false, error: 'Teacher code must be 3-10 characters' };
  }

  const pattern = /^[A-Z0-9]+$/;
  if (!pattern.test(trimmed)) {
    return { isValid: false, error: 'Teacher code can only contain letters and numbers' };
  }

  return { isValid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }

  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email.trim())) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }

  return { isValid: true };
}

/**
 * Validate URL format
 */
export function validateURL(url: string): ValidationResult {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    new URL(url.trim());
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate marks/score
 */
export function validateMarks(marks: number, maxMarks: number): ValidationResult {
  if (isNaN(marks)) {
    return { isValid: false, error: 'Marks must be a number' };
  }

  if (marks < 0) {
    return { isValid: false, error: 'Marks cannot be negative' };
  }

  if (marks > maxMarks) {
    return { isValid: false, error: `Marks cannot exceed ${maxMarks}` };
  }

  return { isValid: true };
}

export default {
  validateCourseCode,
  validateCourseName,
  validateSection,
  validateAcademicYear,
  validateCredits,
  validateUSN,
  validateTeacherCode,
  validateEmail,
  validatePassword,
  validateURL,
  validateMarks,
};
