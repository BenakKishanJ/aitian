export type UserRole = "student" | "teacher" | "admin" | "parent";

// Re-export Role from authUtils to maintain consistency
export type { Role } from './authUtils';

const STUDENT_REGEX = /^(\d)(da)(\d{2})([a-z]{2})(\d{3})\.(cs)$/i;
const TEACHER_REGEX = /^([a-z]+)\.([a-z]{2})$/i;

const ADMIN_EMAILS = [
  "principal@drait.edu.in",
  "admin@drait.edu.in",
];

export function inferRoleFromEmail(email: string): UserRole {
  const lowerEmail = email.toLowerCase();
  
  // Check admin emails first (full email)
  if (ADMIN_EMAILS.includes(lowerEmail)) return "admin";
  
  // Extract local part for student/teacher pattern matching
  const localPart = lowerEmail.split('@')[0];
  
  if (STUDENT_REGEX.test(localPart)) return "student";
  if (TEACHER_REGEX.test(localPart)) return "teacher";
  
  return "parent";
}

export function inferUserDetails(email: string): {
  role: UserRole;
  batch?: string;
  dept?: string;
  usn?: string;
} | null {
  const lowerEmail = email.toLowerCase();
  
  // Check admin emails first (full email)
  if (ADMIN_EMAILS.includes(lowerEmail)) {
    return {
      role: "admin",
    };
  }
  
  // Extract local part for student/teacher pattern matching
  const localPart = lowerEmail.split('@')[0];
  
  // student pattern: 1da22cs040.cs
  const studentMatch = localPart.match(STUDENT_REGEX);
  if (studentMatch) {
    return {
      role: "student",
      batch: `20${studentMatch[3]}`,
      dept: studentMatch[4].toUpperCase(),
      usn: studentMatch[5],
    };
  }

  // teacher pattern: harishd.cs
  const teacherMatch = localPart.match(TEACHER_REGEX);
  if (teacherMatch) {
    return {
      role: "teacher",
      dept: teacherMatch[2].toUpperCase(),
    };
  }

  // parent fallback - any other email
  return {
    role: "parent",
  };
}

export function isOrganisationalEmail(email: string): boolean {
  return (
    STUDENT_REGEX.test(email.toLowerCase()) ||
    TEACHER_REGEX.test(email.toLowerCase()) ||
    ADMIN_EMAILS.includes(email.toLowerCase())
  );
}
