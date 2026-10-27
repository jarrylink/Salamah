export const userRoles = ["superadmin", "admin", "manager", "staff", "student", "teacher", "academic_staff", "non_academic_staff", "guardian"] as const;
export type UserRole = (typeof userRoles)[number];
