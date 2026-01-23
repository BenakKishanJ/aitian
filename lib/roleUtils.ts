export type UserRole = "student" | "teacher" | "admin";

export function isOrgEmail(email: string) {
  return email.endsWith("@drait.edu.in");
}

export function inferRole(email: string): {
  role: UserRole;
  batch?: string;
  dept?: string;
  usn?: string;
} {
  const local = email.split("@")[0];

  // student pattern: 1da22cs040.cs
  const studentMatch = local.match(/1da(\d{2})([a-z]{2})(\d{3})/i);

  if (studentMatch) {
    return {
      role: "student",
      batch: `20${studentMatch[1]}`,
      dept: studentMatch[2].toUpperCase(),
      usn: studentMatch[3],
    };
  }

  // teacher pattern
  return {
    role: "teacher",
    dept: local.split(".")[1]?.toUpperCase(),
  };
}
