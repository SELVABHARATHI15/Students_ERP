export type UserRole = "admin" | "staff" | "student";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  external_student_id: string | null;
  external_staff_id: string | null;
}
