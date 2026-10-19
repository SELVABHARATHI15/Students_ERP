export type FormField = {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "date" | "time" | "textarea" | "select";
  required?: boolean;
  hint?: string;
  minLength?: number;
  createOnly?: boolean;
  confirmFor?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
  lookup?: {
    path: string;
    idKey: string;
    labelKeys: string[];
  };
};

export const formFieldsByPath: Record<string, FormField[]> = {
  "/students/": [
    { name: "username", label: "Login username", required: true, createOnly: true },
    {
      name: "password",
      label: "Temporary password",
      type: "password",
      required: true,
      minLength: 12,
      createOnly: true,
      hint: "Use at least 12 characters. Django hashes it before sending; confirm ORDS accepts this hash format before production use.",
    },
    {
      name: "password_confirm",
      label: "Confirm temporary password",
      type: "password",
      required: true,
      minLength: 12,
      createOnly: true,
      confirmFor: "password",
    },
    { name: "register_number", label: "Register number", required: true },
    { name: "full_name", label: "Full name", required: true },
    { name: "email", label: "Email address", type: "email" },
    { name: "class_name", label: "Class", required: true, hint: "For example, BCA or CSE." },
    { name: "section", label: "Section" },
    {
      name: "user_id",
      label: "Linked user ID",
      type: "number",
      min: 1,
      hint: "Optional. Leave blank if the ORDS handler links the user automatically.",
    },
  ],
  "/staff/": [
    { name: "username", label: "Login username", required: true, createOnly: true },
    {
      name: "password",
      label: "Temporary password",
      type: "password",
      required: true,
      minLength: 12,
      createOnly: true,
      hint: "Use at least 12 characters. Django hashes it before sending; confirm ORDS accepts this hash format before production use.",
    },
    {
      name: "password_confirm",
      label: "Confirm temporary password",
      type: "password",
      required: true,
      minLength: 12,
      createOnly: true,
      confirmFor: "password",
    },
    { name: "staff_code", label: "Staff code", required: true },
    { name: "full_name", label: "Full name", required: true },
    { name: "email", label: "Email address", type: "email" },
    {
      name: "user_id",
      label: "Linked user ID",
      type: "number",
      min: 1,
      hint: "Optional. Leave blank if the ORDS handler links the user automatically.",
    },
  ],
  "/attendance/": [
    {
      name: "student_id",
      label: "Student",
      type: "select",
      required: true,
      lookup: { path: "/students/", idKey: "student_id", labelKeys: ["full_name", "register_number"] },
    },
    {
      name: "subject_id",
      label: "Subject",
      type: "select",
      required: true,
      lookup: { path: "/subjects/", idKey: "subject_id", labelKeys: ["subject_code", "subject_name"] },
    },
    {
      name: "marked_by_staff_id",
      label: "Marked by",
      type: "select",
      required: true,
      lookup: { path: "/staff/", idKey: "staff_id", labelKeys: ["full_name", "staff_code"] },
    },
    { name: "attendance_date", label: "Attendance date", type: "date", required: true },
    {
      name: "status",
      label: "Attendance status",
      type: "select",
      required: true,
      options: [
        { label: "Present", value: "PRESENT" },
        { label: "Absent", value: "ABSENT" },
      ],
    },
  ],
  "/marks/": [
    {
      name: "student_id",
      label: "Student",
      type: "select",
      required: true,
      lookup: { path: "/students/", idKey: "student_id", labelKeys: ["full_name", "register_number"] },
    },
    {
      name: "subject_id",
      label: "Subject",
      type: "select",
      required: true,
      lookup: { path: "/subjects/", idKey: "subject_id", labelKeys: ["subject_code", "subject_name"] },
    },
    { name: "exam_name", label: "Exam name", required: true },
    {
      name: "marks_obtained",
      label: "Marks obtained",
      type: "number",
      min: 0,
      step: 0.01,
      required: true,
    },
    { name: "max_marks", label: "Maximum marks", type: "number", min: 0.01, step: 0.01, required: true },
    {
      name: "entered_by_staff_id",
      label: "Entered by",
      type: "select",
      required: true,
      lookup: { path: "/staff/", idKey: "staff_id", labelKeys: ["full_name", "staff_code"] },
    },
  ],
  "/announcements/": [
    { name: "title", label: "Announcement title", required: true },
    {
      name: "message",
      label: "Message",
      type: "textarea",
      required: true,
      hint: "Write a clear message for students and staff.",
    },
    {
      name: "created_by_user_id",
      label: "Created by Oracle user ID",
      type: "number",
      min: 1,
      required: true,
      hint: "Use the Oracle APP_USERS ID (not your Django login ID).",
    },
  ],
  "/subjects/": [
    { name: "subject_code", label: "Subject code", required: true },
    { name: "subject_name", label: "Subject name", required: true },
  ],
  "/timetable/": [
    { name: "class_name", label: "Class", required: true },
    { name: "section", label: "Section" },
    {
      name: "subject_id",
      label: "Subject",
      type: "select",
      required: true,
      lookup: { path: "/subjects/", idKey: "subject_id", labelKeys: ["subject_code", "subject_name"] },
    },
    {
      name: "staff_id",
      label: "Staff member",
      type: "select",
      required: true,
      lookup: { path: "/staff/", idKey: "staff_id", labelKeys: ["full_name", "staff_code"] },
    },
    {
      name: "day_of_week",
      label: "Day",
      type: "select",
      required: true,
      options: [
        { label: "Monday", value: "MONDAY" },
        { label: "Tuesday", value: "TUESDAY" },
        { label: "Wednesday", value: "WEDNESDAY" },
        { label: "Thursday", value: "THURSDAY" },
        { label: "Friday", value: "FRIDAY" },
        { label: "Saturday", value: "SATURDAY" },
        { label: "Sunday", value: "SUNDAY" },
      ],
    },
    { name: "start_time", label: "Start time", type: "time", required: true },
    { name: "end_time", label: "End time", type: "time", required: true },
  ],
};
