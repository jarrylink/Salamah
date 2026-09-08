export const userRoles = ["superadmin", "admin", "staff", "student"] as const;
export type UserRole = (typeof userRoles)[number];
