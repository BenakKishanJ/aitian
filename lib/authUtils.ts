import { doc, getDoc } from 'firebase/firestore';

export type Role = "student" | "teacher" | "parent" | "admin";

export interface UserData {
  email: string;
  role: Role;
  batch?: string;
  dept?: string;
  usn?: string;
  createdAt: Date;
}

/**
 * Validates if the email is from the allowed organizational domain
 */
export function isValidOrgEmail(email: string): boolean {
  return email.endsWith('@drait.edu.in');
}

/**
 * Infers user role and details from email
 */
export function inferUserDetails(email: string): Omit<UserData, 'email' | 'createdAt'> | null {
  if (!isValidOrgEmail(email)) return null;

  const localPart = email.split('@')[0];

  // Student pattern: 1da22cs040.cs
  const studentMatch = localPart.match(/^(\d)(da)(\d{2})([a-z]{2})(\d{3})\.([a-z]{2})$/);
  if (studentMatch) {
    const [, , , batch, dept, usn] = studentMatch;
    return {
      role: 'student',
      batch: '20' + batch,
      dept: dept.toUpperCase(),
      usn,
    };
  }

  // Teacher pattern: harishd.cs
  const teacherMatch = localPart.match(/^([a-z]+)\.([a-z]{2})$/);
  if (teacherMatch) {
    const [, , dept] = teacherMatch;
    return {
      role: 'teacher',
      dept: dept.toUpperCase(),
    };
  }

  return null; // Invalid format
}

/**
 * Validates admin secret code against stored value in Firestore
 */
export async function validateAdminSecret(inputCode: string): Promise<boolean> {
  try {
    // Fetch admin secret from Firestore (assuming it's stored in a config collection)
    // In production, this should be hashed and compared securely
    const { db } = await import('./firebase');
    const docRef = doc(db, 'config', 'adminSecret');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const storedSecret = docSnap.data().secret;
      return inputCode === storedSecret; // Plain text comparison - use hashing in production
    }
    return false;
  } catch (error) {
    console.error('Error validating admin secret:', error);
    return false;
  }
}