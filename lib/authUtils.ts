import { doc, getDoc, Timestamp } from "firebase/firestore";
import type { Role, UserData, UserRegistrationData, DepartmentId } from "@/types";
import {
  getDepartmentByCode,
} from "@/types/constants";

/**
 * Re-export types from centralized location
 * @deprecated Import directly from @/types instead
 */
export type { Role, UserData };

/**
 * Validates if the email is from the allowed organizational domain
 */
export function isValidOrgEmail(email: string): boolean {
  return email.endsWith("@drait.edu.in");
}

/**
 * Infers user role and details from email
 * Returns registration data that can be used to create a user
 */
export function inferUserDetails(
  email: string,
): Omit<UserRegistrationData, "email" | "name"> | null {
  if (!isValidOrgEmail(email)) return null;

  const localPart = email.split("@")[0];

  // Student pattern: 1da22cs040.cs
  const studentMatch = localPart.match(
    /^(\d)(da)(\d{2})([a-z]{2})(\d{3})\.([a-z]{2})$/,
  );
  if (studentMatch) {
    const [, , , batch, deptCode, usn] = studentMatch;
    const department = getDepartmentByCode(deptCode);

    return {
      role: "student",
      batch: "20" + batch,
      departmentId: (department?.id ?? deptCode.toLowerCase()) as DepartmentId,
      usn: `1DA${batch}${deptCode.toUpperCase()}${usn}`,
    };
  }

  // Teacher pattern: harishd.cs
  const teacherMatch = localPart.match(/^([a-z]+)\.([a-z]{2})$/);
  if (teacherMatch) {
    const [, , deptCode] = teacherMatch;
    const department = getDepartmentByCode(deptCode);

    return {
      role: "teacher",
      departmentId: (department?.id ?? deptCode.toLowerCase()) as DepartmentId,
    };
  }

  return null; // Invalid format
}

/**
 * Validates admin secret code against stored value in Firestore
 */
export async function validateAdminSecret(inputCode: string): Promise<boolean> {
  try {
    const { db } = await import("./firebase");
    const docRef = doc(db, "config", "adminSecret");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const storedSecret = docSnap.data().secret;
      return inputCode === storedSecret;
    }
    return false;
  } catch (error) {
    console.error("Error validating admin secret:", error);
    return false;
  }
}

/**
 * Get display name for a department
 */
export function getDepartmentDisplayName(departmentId?: string): string {
  if (!departmentId) return "Unknown";
  const dept = getDepartmentByCode(departmentId);
  return dept?.name ?? departmentId.toUpperCase();
}

/**
 * Get department code from department ID
 */
export function getDepartmentCode(departmentId?: string): string {
  if (!departmentId) return "";
  const dept = getDepartmentByCode(departmentId);
  return dept?.code ?? departmentId.toUpperCase();
}
