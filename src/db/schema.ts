import { boolean, date, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["superadmin", "admin", "manager", "staff", "student", "teacher", "academic_staff", "non_academic_staff", "guardian"]);
export const accountStatus = pgEnum("account_status", ["active", "inactive", "suspended"]);
export const personStatus = pgEnum("person_status", ["active", "inactive"]);
export const enrollmentStatus = pgEnum("enrollment_status", ["active", "transferred", "withdrawn", "completed"]);
export const assignmentStatus = pgEnum("assignment_status", ["active", "inactive"]);
export const sessionStatus = pgEnum("academic_session_status", ["draft", "active", "closed"]);
export const assessmentStatus = pgEnum("assessment_status", ["draft", "open", "closed"]);
const timestamps = { createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull() };

export const people = pgTable("people", { id: uuid("id").defaultRandom().primaryKey(), firstName: text("first_name").notNull(), middleName: text("middle_name"), lastName: text("last_name").notNull(), gender: text("gender"), dateOfBirth: date("date_of_birth"), phone: text("phone"), email: text("email"), address: text("address"), avatarUrl: text("avatar_url"), status: personStatus("status").default("active").notNull(), ...timestamps }, (t) => [index("people_name_idx").on(t.lastName, t.firstName), index("people_email_idx").on(t.email)]);

// Kept during the RBAC transition so established account login continues to work.
export const users = pgTable("users", { id: uuid("id").defaultRandom().primaryKey(), personId: uuid("person_id").references(() => people.id, { onDelete: "set null" }), email: text("email").notNull().unique(), passwordHash: text("password_hash").notNull(), role: userRole("role").notNull(), status: accountStatus("status").default("active").notNull(), designation: text("designation"), passportUrl: text("passport_url"), lastLoginAt: timestamp("last_login_at", { withTimezone: true }), ...timestamps }, (t) => [index("users_person_idx").on(t.personId), index("users_status_idx").on(t.status)]);
export const userDocuments = pgTable("user_documents", { id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), title: text("title").notNull(), docType: text("doc_type").notNull(), fileUrl: text("file_url").notNull(), fileName: text("file_name"), fileSize: text("file_size"), category: text("category").default("general").notNull(), notes: text("notes"), ...timestamps }, (t) => [index("user_documents_user_idx").on(t.userId)]);
export const roles = pgTable("roles", { id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull().unique(), name: text("name").notNull(), description: text("description"), isSystem: boolean("is_system").default(true).notNull(), ...timestamps });
export const permissions = pgTable("permissions", { id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull().unique(), name: text("name").notNull(), description: text("description"), ...timestamps });
export const userRoles = pgTable("user_roles", { id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }), ...timestamps }, (t) => [uniqueIndex("user_roles_user_role_idx").on(t.userId, t.roleId)]);
export const rolePermissions = pgTable("role_permissions", { id: uuid("id").defaultRandom().primaryKey(), roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }), permissionId: uuid("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }), ...timestamps }, (t) => [uniqueIndex("role_permissions_role_permission_idx").on(t.roleId, t.permissionId)]);

export const staff = pgTable("staff", { id: uuid("id").defaultRandom().primaryKey(), personId: uuid("person_id").notNull().unique().references(() => people.id, { onDelete: "restrict" }), staffNumber: text("staff_number").notNull().unique(), employmentDate: date("employment_date").notNull(), employmentType: text("employment_type").notNull(), department: text("department"), status: accountStatus("status").default("active").notNull(), metadata: jsonb("metadata").$type<Record<string, unknown>>(), ...timestamps });
export const teachers = pgTable("teachers", { id: uuid("id").defaultRandom().primaryKey(), staffId: uuid("staff_id").notNull().unique().references(() => staff.id, { onDelete: "restrict" }), teacherNumber: text("teacher_number").unique(), qualification: text("qualification"), specialization: text("specialization"), status: accountStatus("status").default("active").notNull(), ...timestamps });
export const students = pgTable("students", { id: uuid("id").defaultRandom().primaryKey(), personId: uuid("person_id").notNull().unique().references(() => people.id, { onDelete: "restrict" }), admissionNumber: text("admission_number").notNull().unique(), admissionDate: date("admission_date").notNull(), status: accountStatus("status").default("active").notNull(), ...timestamps });
export const guardians = pgTable("guardians", { id: uuid("id").defaultRandom().primaryKey(), personId: uuid("person_id").notNull().unique().references(() => people.id, { onDelete: "restrict" }), status: accountStatus("status").default("active").notNull(), ...timestamps });
export const studentGuardians = pgTable("student_guardians", { id: uuid("id").defaultRandom().primaryKey(), studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }), guardianId: uuid("guardian_id").notNull().references(() => guardians.id, { onDelete: "cascade" }), relationship: text("relationship").notNull(), isPrimary: boolean("is_primary").default(false).notNull(), isEmergencyContact: boolean("is_emergency_contact").default(false).notNull(), status: accountStatus("status").default("active").notNull(), ...timestamps }, (t) => [uniqueIndex("student_guardians_student_guardian_idx").on(t.studentId, t.guardianId)]);

export const academicSessions = pgTable("academic_sessions", { id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull().unique(), startDate: date("start_date").notNull(), endDate: date("end_date").notNull(), status: sessionStatus("status").default("draft").notNull(), isCurrent: boolean("is_current").default(false).notNull(), ...timestamps });
export const academicTerms = pgTable("academic_terms", { id: uuid("id").defaultRandom().primaryKey(), sessionId: uuid("session_id").notNull().references(() => academicSessions.id, { onDelete: "cascade" }), termNumber: integer("term_number").notNull(), name: text("name").notNull(), startDate: date("start_date"), endDate: date("end_date"), status: sessionStatus("status").default("draft").notNull(), isCurrent: boolean("is_current").default(false).notNull(), ...timestamps }, (t) => [uniqueIndex("academic_terms_session_term_idx").on(t.sessionId, t.termNumber)]);
export const grades = pgTable("grades", { id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull().unique(), code: text("code").notNull().unique(), sortOrder: integer("sort_order").default(0).notNull(), status: accountStatus("status").default("active").notNull(), ...timestamps });
export const classes = pgTable("classes", { id: uuid("id").defaultRandom().primaryKey(), gradeId: uuid("grade_id").notNull().references(() => grades.id, { onDelete: "restrict" }), name: text("name").notNull(), code: text("code").notNull().unique(), status: accountStatus("status").default("active").notNull(), ...timestamps }, (t) => [uniqueIndex("classes_grade_name_idx").on(t.gradeId, t.name)]);
export const subjects = pgTable("subjects", { id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull(), code: text("code").notNull().unique(), shortName: text("short_name"), description: text("description"), status: accountStatus("status").default("active").notNull(), ...timestamps });
export const subjectCombinations = pgTable("subject_combinations", { id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull().unique(), description: text("description"), status: accountStatus("status").default("active").notNull(), ...timestamps });
export const subjectCombinationSubjects = pgTable("subject_combination_subjects", { id: uuid("id").defaultRandom().primaryKey(), combinationId: uuid("combination_id").notNull().references(() => subjectCombinations.id, { onDelete: "cascade" }), subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "restrict" }), sortOrder: integer("sort_order").default(0).notNull(), ...timestamps }, (t) => [uniqueIndex("combination_subject_idx").on(t.combinationId, t.subjectId)]);
export const classSubjectCombinations = pgTable("class_subject_combinations", { id: uuid("id").defaultRandom().primaryKey(), classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }), combinationId: uuid("combination_id").notNull().references(() => subjectCombinations.id, { onDelete: "restrict" }), sessionId: uuid("session_id").notNull().references(() => academicSessions.id, { onDelete: "cascade" }), status: assignmentStatus("status").default("active").notNull(), ...timestamps }, (t) => [uniqueIndex("class_combination_session_idx").on(t.classId, t.combinationId, t.sessionId)]);
export const classSubjects = pgTable("class_subjects", { id: uuid("id").defaultRandom().primaryKey(), classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }), subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "restrict" }), sessionId: uuid("session_id").notNull().references(() => academicSessions.id, { onDelete: "cascade" }), status: assignmentStatus("status").default("active").notNull(), ...timestamps }, (t) => [uniqueIndex("class_subject_session_idx").on(t.classId, t.subjectId, t.sessionId)]);
export const studentEnrollments = pgTable("student_enrollments", { id: uuid("id").defaultRandom().primaryKey(), studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "restrict" }), sessionId: uuid("session_id").notNull().references(() => academicSessions.id, { onDelete: "restrict" }), classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "restrict" }), enrollmentDate: date("enrollment_date").notNull(), status: enrollmentStatus("status").default("active").notNull(), context: text("context"), ...timestamps }, (t) => [uniqueIndex("student_enrollment_session_idx").on(t.studentId, t.sessionId), index("enrollments_class_session_idx").on(t.classId, t.sessionId)]);

export const teacherClassAssignments = pgTable("teacher_class_assignments", { id: uuid("id").defaultRandom().primaryKey(), teacherId: uuid("teacher_id").notNull().references(() => teachers.id, { onDelete: "restrict" }), classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "restrict" }), sessionId: uuid("session_id").notNull().references(() => academicSessions.id, { onDelete: "cascade" }), termId: uuid("term_id").references(() => academicTerms.id, { onDelete: "cascade" }), assignmentType: text("assignment_type").default("class_teacher").notNull(), status: assignmentStatus("status").default("active").notNull(), ...timestamps }, (t) => [uniqueIndex("teacher_class_assignment_idx").on(t.teacherId, t.classId, t.sessionId, t.assignmentType)]);
export const teacherSubjectAssignments = pgTable("teacher_subject_assignments", { id: uuid("id").defaultRandom().primaryKey(), teacherId: uuid("teacher_id").notNull().references(() => teachers.id, { onDelete: "restrict" }), subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "restrict" }), classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "restrict" }), sessionId: uuid("session_id").notNull().references(() => academicSessions.id, { onDelete: "cascade" }), termId: uuid("term_id").references(() => academicTerms.id, { onDelete: "cascade" }), status: assignmentStatus("status").default("active").notNull(), ...timestamps }, (t) => [uniqueIndex("teacher_subject_assignment_idx").on(t.teacherId, t.subjectId, t.classId, t.sessionId, t.termId)]);

export const assessmentTypes = pgTable("assessment_types", { id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull().unique(), code: text("code").notNull().unique(), maximumScore: integer("maximum_score").notNull(), weight: integer("weight").notNull(), sortOrder: integer("sort_order").default(0).notNull(), status: accountStatus("status").default("active").notNull(), ...timestamps });
export const assessments = pgTable("assessments", { id: uuid("id").defaultRandom().primaryKey(), sessionId: uuid("session_id").notNull().references(() => academicSessions.id, { onDelete: "cascade" }), termId: uuid("term_id").notNull().references(() => academicTerms.id, { onDelete: "cascade" }), classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "restrict" }), subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "restrict" }), assessmentTypeId: uuid("assessment_type_id").notNull().references(() => assessmentTypes.id, { onDelete: "restrict" }), name: text("name").notNull(), maximumScore: integer("maximum_score").notNull(), status: assessmentStatus("status").default("draft").notNull(), ...timestamps }, (t) => [uniqueIndex("assessment_context_type_idx").on(t.sessionId, t.termId, t.classId, t.subjectId, t.assessmentTypeId)]);
export const assessmentScores = pgTable("assessment_scores", { id: uuid("id").defaultRandom().primaryKey(), assessmentId: uuid("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }), studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "restrict" }), score: integer("score").notNull(), enteredByUserId: uuid("entered_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }), ...timestamps }, (t) => [uniqueIndex("assessment_score_student_idx").on(t.assessmentId, t.studentId)]);
export const gradingScales = pgTable("grading_scales", { id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull().unique(), isDefault: boolean("is_default").default(false).notNull(), status: accountStatus("status").default("active").notNull(), ...timestamps });
export const gradingScaleItems = pgTable("grading_scale_items", { id: uuid("id").defaultRandom().primaryKey(), gradingScaleId: uuid("grading_scale_id").notNull().references(() => gradingScales.id, { onDelete: "cascade" }), minimumScore: integer("minimum_score").notNull(), maximumScore: integer("maximum_score").notNull(), grade: text("grade").notNull(), point: integer("point"), remark: text("remark"), ...timestamps }, (t) => [uniqueIndex("grading_scale_grade_idx").on(t.gradingScaleId, t.grade)]);
export const studentRemarks = pgTable("student_remarks", { id: uuid("id").defaultRandom().primaryKey(), studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }), sessionId: uuid("session_id").notNull().references(() => academicSessions.id, { onDelete: "cascade" }), termId: uuid("term_id").notNull().references(() => academicTerms.id, { onDelete: "cascade" }), subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "cascade" }), remarkType: text("remark_type").notNull(), remark: text("remark").notNull(), authorUserId: uuid("author_user_id").notNull().references(() => users.id, { onDelete: "restrict" }), ...timestamps });
export const reportCardSignatories = pgTable("report_card_signatories", { id: uuid("id").defaultRandom().primaryKey(), personId: uuid("person_id").notNull().references(() => people.id, { onDelete: "restrict" }), title: text("title").notNull(), signatureUrl: text("signature_url"), sessionId: uuid("session_id").references(() => academicSessions.id, { onDelete: "cascade" }), effectiveFrom: date("effective_from"), effectiveTo: date("effective_to"), displayOrder: integer("display_order").default(0).notNull(), status: accountStatus("status").default("active").notNull(), ...timestamps });
export const auditLogs = pgTable("audit_logs", { id: uuid("id").defaultRandom().primaryKey(), actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }), action: text("action").notNull(), entityType: text("entity_type").notNull(), entityId: uuid("entity_id"), metadata: jsonb("metadata").$type<Record<string, unknown>>(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull() }, (t) => [index("audit_logs_entity_idx").on(t.entityType, t.entityId), index("audit_logs_actor_idx").on(t.actorUserId)]);

// Operational modules deliberately sit beside the academic core: balances and stock are
// derived from their ledgers, while historical academic records remain immutable.
export const sections = pgTable("sections", { id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull().unique(), name: text("name").notNull().unique(), sortOrder: integer("sort_order").default(0).notNull(), status: accountStatus("status").default("active").notNull(), ...timestamps });
export const gradeSections = pgTable("grade_sections", { id: uuid("id").defaultRandom().primaryKey(), gradeId: uuid("grade_id").notNull().references(() => grades.id, { onDelete: "cascade" }), sectionId: uuid("section_id").notNull().references(() => sections.id, { onDelete: "restrict" }), ...timestamps }, (t) => [uniqueIndex("grade_section_idx").on(t.gradeId, t.sectionId)]);
export const subjectSections = pgTable("subject_sections", { id: uuid("id").defaultRandom().primaryKey(), subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }), sectionId: uuid("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }), ...timestamps }, (t) => [uniqueIndex("subject_section_idx").on(t.subjectId, t.sectionId)]);
export const attendanceStatus = pgEnum("attendance_status", ["present", "absent", "late", "excused"]);
export const attendanceRecords = pgTable("attendance_records", { id: uuid("id").defaultRandom().primaryKey(), sessionId: uuid("session_id").notNull().references(() => academicSessions.id, { onDelete: "cascade" }), termId: uuid("term_id").notNull().references(() => academicTerms.id, { onDelete: "cascade" }), classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "restrict" }), studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "restrict" }), attendanceDate: date("attendance_date").notNull(), status: attendanceStatus("status").notNull(), recordedByUserId: uuid("recorded_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }), note: text("note"), ...timestamps }, (t) => [uniqueIndex("attendance_student_day_idx").on(t.studentId, t.attendanceDate), index("attendance_class_date_idx").on(t.classId, t.attendanceDate)]);
export const notices = pgTable("notices", { id: uuid("id").defaultRandom().primaryKey(), title: text("title").notNull(), content: text("content").notNull(), audience: text("audience").notNull().default("everyone"), sectionId: uuid("section_id").references(() => sections.id, { onDelete: "set null" }), publishDate: date("publish_date").notNull(), expiryDate: date("expiry_date"), status: accountStatus("status").default("active").notNull(), createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }), ...timestamps }, (t) => [index("notices_active_idx").on(t.status, t.publishDate)]);
export const feeCategories = pgTable("fee_categories", { id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull().unique(), description: text("description"), status: accountStatus("status").default("active").notNull(), ...timestamps });
export const feeStructures = pgTable("fee_structures", { id: uuid("id").defaultRandom().primaryKey(), categoryId: uuid("category_id").notNull().references(() => feeCategories.id, { onDelete: "restrict" }), sessionId: uuid("session_id").notNull().references(() => academicSessions.id, { onDelete: "cascade" }), termId: uuid("term_id").references(() => academicTerms.id, { onDelete: "cascade" }), sectionId: uuid("section_id").references(() => sections.id, { onDelete: "restrict" }), classId: uuid("class_id").references(() => classes.id, { onDelete: "restrict" }), amountKobo: integer("amount_kobo").notNull(), dueDate: date("due_date"), status: accountStatus("status").default("active").notNull(), ...timestamps });
export const studentInvoices = pgTable("student_invoices", { id: uuid("id").defaultRandom().primaryKey(), studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "restrict" }), feeStructureId: uuid("fee_structure_id").references(() => feeStructures.id, { onDelete: "set null" }), sessionId: uuid("session_id").notNull().references(() => academicSessions.id, { onDelete: "cascade" }), termId: uuid("term_id").references(() => academicTerms.id, { onDelete: "cascade" }), reference: text("reference").notNull().unique(), amountKobo: integer("amount_kobo").notNull(), status: accountStatus("status").default("active").notNull(), ...timestamps });
export const feePayments = pgTable("fee_payments", { id: uuid("id").defaultRandom().primaryKey(), invoiceId: uuid("invoice_id").notNull().references(() => studentInvoices.id, { onDelete: "restrict" }), amountKobo: integer("amount_kobo").notNull(), paymentDate: date("payment_date").notNull(), reference: text("reference").notNull().unique(), paymentMethod: text("payment_method").notNull(), receivedByUserId: uuid("received_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }), ...timestamps });
export const inventoryCategories = pgTable("inventory_categories", { id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull().unique(), description: text("description"), ...timestamps });
export const inventoryLocations = pgTable("inventory_locations", { id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull().unique(), description: text("description"), ...timestamps });
export const suppliers = pgTable("suppliers", { id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull().unique(), phone: text("phone"), email: text("email"), address: text("address"), ...timestamps });
export const inventoryItems = pgTable("inventory_items", { id: uuid("id").defaultRandom().primaryKey(), categoryId: uuid("category_id").references(() => inventoryCategories.id, { onDelete: "set null" }), locationId: uuid("location_id").references(() => inventoryLocations.id, { onDelete: "set null" }), name: text("name").notNull().unique(), sku: text("sku").notNull().unique(), unit: text("unit").notNull().default("unit"), minimumStock: integer("minimum_stock").default(0).notNull(), condition: text("condition").default("good").notNull(), status: accountStatus("status").default("active").notNull(), ...timestamps });
export const inventoryTransactions = pgTable("inventory_transactions", { id: uuid("id").defaultRandom().primaryKey(), itemId: uuid("item_id").notNull().references(() => inventoryItems.id, { onDelete: "restrict" }), supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }), transactionType: text("transaction_type").notNull(), quantity: integer("quantity").notNull(), transactionDate: date("transaction_date").notNull(), reference: text("reference"), note: text("note"), recordedByUserId: uuid("recorded_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }), ...timestamps }, (t) => [index("inventory_item_date_idx").on(t.itemId, t.transactionDate)]);
export const traitDefinitions = pgTable("trait_definitions", { id: uuid("id").defaultRandom().primaryKey(), category: text("category").notNull(), name: text("name").notNull(), sortOrder: integer("sort_order").default(0).notNull(), status: accountStatus("status").default("active").notNull(), ...timestamps }, (t) => [uniqueIndex("trait_category_name_idx").on(t.category, t.name)]);
export const studentTraitAssessments = pgTable("student_trait_assessments", { id: uuid("id").defaultRandom().primaryKey(), traitId: uuid("trait_id").notNull().references(() => traitDefinitions.id, { onDelete: "restrict" }), studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }), sessionId: uuid("session_id").notNull().references(() => academicSessions.id, { onDelete: "cascade" }), termId: uuid("term_id").notNull().references(() => academicTerms.id, { onDelete: "cascade" }), rating: integer("rating").notNull(), authorUserId: uuid("author_user_id").notNull().references(() => users.id, { onDelete: "restrict" }), ...timestamps }, (t) => [uniqueIndex("student_trait_term_idx").on(t.traitId, t.studentId, t.termId)]);

export const managerStaffAssignments = pgTable("manager_staff_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  managerUserId: uuid("manager_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  staffUserId: uuid("staff_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedByUserId: uuid("assigned_by_user_id").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  status: accountStatus("status").default("active").notNull(),
  ...timestamps
}, (t) => [uniqueIndex("manager_staff_unique_idx").on(t.managerUserId, t.staffUserId)]);

export const offices = pgTable("offices", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  location: text("location"),
  responsibilities: text("responsibilities").notNull(),
  assignedUserId: uuid("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
  status: accountStatus("status").default("active").notNull(),
  ...timestamps
});

export const officeLogs = pgTable("office_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  officeId: uuid("office_id").notNull().references(() => offices.id, { onDelete: "cascade" }),
  authorUserId: uuid("author_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  logDate: date("log_date").notNull(),
  weekSummary: text("week_summary").notNull(),
  dailyTasksCarriedOut: text("daily_tasks_carried_out").notNull(),
  challenges: text("challenges"),
  nextWeekPlan: text("next_week_plan"),
  status: text("status").default("submitted").notNull(),
  ...timestamps
});

export const schoolTasks = pgTable("school_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  responsibilityDocument: text("responsibility_document").notNull(),
  assignedUserId: uuid("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
  frequency: text("frequency").default("daily").notNull(),
  status: text("status").default("active").notNull(),
  ...timestamps
});

export const schoolTaskLogs = pgTable("school_task_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull().references(() => schoolTasks.id, { onDelete: "cascade" }),
  staffUserId: uuid("staff_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  logDate: date("log_date").notNull(),
  report: text("report").notNull(),
  status: text("status").default("completed").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const elearningResources = pgTable("elearning_resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  classId: uuid("class_id").references(() => classes.id, { onDelete: "set null" }),
  resourceType: text("resource_type").default("url").notNull(), // text, file, url
  content: text("content").notNull(),
  fileName: text("file_name"),
  status: text("status").default("active").notNull(),
  authorUserId: uuid("author_user_id").references(() => users.id, { onDelete: "set null" }),
  ...timestamps
});

export const cmsSections = pgTable("cms_sections", {
  id: uuid("id").defaultRandom().primaryKey(),
  sectionKey: text("section_key").notNull().unique(), // hero, about, curriculum, facilities, fees, testimonials, contact
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps
});

export const admissionApplications = pgTable("admission_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationNumber: text("application_number").notNull().unique(),
  guardianName: text("guardian_name").notNull(),
  guardianEmail: text("guardian_email").notNull(),
  guardianPhone: text("guardian_phone").notNull(),
  guardianAddress: text("guardian_address").notNull(),
  guardianOccupation: text("guardian_occupation"),
  numberOfChildren: integer("number_of_children").default(1).notNull(),
  feePerChildKobo: integer("fee_per_child_kobo").notNull(),
  totalFeeKobo: integer("total_fee_kobo").notNull(),
  paymentStatus: text("payment_status").default("paid").notNull(),
  paymentReference: text("payment_reference").notNull().unique(),
  paymentMethod: text("payment_method").default("online_card").notNull(),
  status: text("status").default("submitted").notNull(), // submitted, under_review, admitted, rejected
  ...timestamps
});

export const applicationChildren = pgTable("application_children", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").notNull().references(() => admissionApplications.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  gender: text("gender").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  intendedClass: text("intended_class").notNull(),
  previousSchool: text("previous_school"),
  medicalInfo: text("medical_info"),
  passportUrl: text("passport_url"),
  avatarUrl: text("avatar_url"),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const letterheadDocuments = pgTable("letterhead_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  referenceNumber: text("reference_number").notNull(),
  senderTitle: text("sender_title").notNull(),
  senderOffice: text("sender_office").notNull(),
  recipientName: text("recipient_name").notNull(),
  recipientAddress: text("recipient_address"),
  salutation: text("salutation").notNull(),
  heading: text("heading").notNull(),
  content: text("content").notNull(),
  closure: text("closure").notNull(),
  signatoryName: text("signatory_name").notNull(),
  signatoryRole: text("signatory_role").notNull(),
  signatureUrl: text("signature_url"),
  letterDate: date("letter_date").notNull(),
  authorUserId: uuid("author_user_id").references(() => users.id, { onDelete: "set null" }),
  ...timestamps
});

export const systemSettings = pgTable("system_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: jsonb("setting_value").$type<Record<string, unknown>>().notNull(),
  description: text("description"),
  ...timestamps
});

export const studentFileEntries = pgTable("student_file_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  entryType: text("entry_type").notNull(), // 'document' | 'text' | 'url' | 'activity'
  title: text("title").notNull(),
  content: text("content"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: text("file_size"),
  urlLink: text("url_link"),
  category: text("category").default("general").notNull(), // 'document' | 'academic' | 'medical' | 'discipline' | 'pastoral' | 'general'
  authorUserId: uuid("author_user_id").references(() => users.id, { onDelete: "set null" }),
  authorName: text("author_name"),
  ...timestamps
}, (t) => [index("student_file_entries_student_idx").on(t.studentId, t.entryType)]);

export const studentClassroomComments = pgTable("student_classroom_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  category: text("category").default("general").notNull(), // 'sickness' | 'misbehavior' | 'academic' | 'praise' | 'pastoral' | 'general'
  comment: text("comment").notNull(),
  commentDate: date("comment_date").notNull(),
  authorUserId: uuid("author_user_id").references(() => users.id, { onDelete: "set null" }),
  authorName: text("author_name"),
  ...timestamps
}, (t) => [index("student_classroom_comments_class_idx").on(t.classId, t.studentId)]);

export const dutyRosters = pgTable("duty_rosters", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  sessionId: uuid("session_id").references(() => academicSessions.id, { onDelete: "cascade" }),
  termId: uuid("term_id").references(() => academicTerms.id, { onDelete: "cascade" }),
  totalWeeks: integer("total_weeks").default(12).notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  dutiesList: jsonb("duties_list").$type<string[]>().default([]).notNull(),
  weeksData: jsonb("weeks_data").$type<Array<{
    weekNumber: number;
    startDate: string;
    endDate: string;
    duties: Array<{
      dutyName: string;
      staff: Array<{
        staffId: string;
        name: string;
        qualification?: string;
      }>;
    }>;
  }>>().default([]).notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  ...timestamps
}, (t) => [index("duty_rosters_session_term_idx").on(t.sessionId, t.termId, t.isActive)]);

export const schoolAcademicCalendars = pgTable("school_academic_calendars", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => academicSessions.id, { onDelete: "cascade" }),
  termId: uuid("term_id").references(() => academicTerms.id, { onDelete: "cascade" }),
  termName: text("term_name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalWeeks: integer("total_weeks").default(12).notNull(),
  currentWeek: integer("current_week").default(1).notNull(),
  manualOverrideWeek: integer("manual_override_week"),
  weeksConfig: jsonb("weeks_config").$type<Array<{
    weekNumber: number;
    startDate: string;
    endDate: string;
    title: string;
    isCurrent: boolean;
  }>>().default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps
}, (t) => [index("school_academic_calendars_active_idx").on(t.isActive)]);

export const weeklyThemes = pgTable("weekly_themes", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => academicSessions.id, { onDelete: "cascade" }),
  termId: uuid("term_id").references(() => academicTerms.id, { onDelete: "cascade" }),
  weekNumber: integer("week_number").notNull(),
  themeTitle: text("theme_title").notNull(),
  scriptureReference: text("scripture_reference"),
  quoteOrHadith: text("quote_or_hadith"),
  assemblyFocus: text("assembly_focus"),
  coreValues: text("core_values"),
  ...timestamps
}, (t) => [index("weekly_themes_week_idx").on(t.weekNumber)]);

export const studentTerminalReports = pgTable("student_terminal_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull().references(() => academicSessions.id, { onDelete: "cascade" }),
  termId: uuid("term_id").notNull().references(() => academicTerms.id, { onDelete: "cascade" }),
  classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  teacherComment: text("teacher_comment"),
  principalComment: text("principal_comment"),
  affectiveDomain: jsonb("affective_domain").$type<Record<string, number>>().default({}).notNull(),
  psychomotorDomain: jsonb("psychomotor_domain").$type<Record<string, number>>().default({}).notNull(),
  daysSchoolOpened: integer("days_school_opened").default(60),
  daysPresent: integer("days_present"),
  daysAbsent: integer("days_absent"),
  nextTermResumption: text("next_term_resumption"),
  height: text("height"),
  weight: text("weight"),
  recordedByUserId: uuid("recorded_by_user_id").references(() => users.id, { onDelete: "set null" }),
  ...timestamps
}, (t) => [
  uniqueIndex("student_terminal_reports_period_idx").on(t.sessionId, t.termId, t.classId, t.studentId),
  index("student_terminal_reports_class_idx").on(t.classId)
]);

export const subjectSchemesOfWork = pgTable("subject_schemes_of_work", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  classId: uuid("class_id").references(() => classes.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => academicSessions.id, { onDelete: "cascade" }),
  termId: uuid("term_id").references(() => academicTerms.id, { onDelete: "cascade" }),
  teacherUserId: uuid("teacher_user_id").references(() => users.id, { onDelete: "set null" }),
  weeksData: jsonb("weeks_data").$type<Array<{
    weekNumber: number;
    topic: string;
    subtopics?: string;
    objectives?: string;
    activities?: string;
    resources?: string;
  }>>().default([]).notNull(),
  ...timestamps
});

export const subjectLessonNotes = pgTable("subject_lesson_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  classId: uuid("class_id").references(() => classes.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => academicSessions.id, { onDelete: "cascade" }),
  termId: uuid("term_id").references(() => academicTerms.id, { onDelete: "cascade" }),
  teacherUserId: uuid("teacher_user_id").references(() => users.id, { onDelete: "set null" }),
  weekNumber: integer("week_number").notNull(),
  topic: text("topic").notNull(),
  subtopics: text("subtopics"),
  content: text("content").notNull(),
  learningMaterials: text("learning_materials"),
  homework: text("homework"),
  status: text("status").default("approved").notNull(),
  ...timestamps
});

export const subjectLessonPlans = pgTable("subject_lesson_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  classId: uuid("class_id").references(() => classes.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => academicSessions.id, { onDelete: "cascade" }),
  termId: uuid("term_id").references(() => academicTerms.id, { onDelete: "cascade" }),
  teacherUserId: uuid("teacher_user_id").references(() => users.id, { onDelete: "set null" }),
  weekNumber: integer("week_number").notNull(),
  topic: text("topic").notNull(),
  durationMinutes: integer("duration_minutes").default(40),
  behavioralObjectives: text("behavioral_objectives"),
  instructionalMaterials: text("instructional_materials"),
  previousKnowledge: text("previous_knowledge"),
  steps: jsonb("steps").$type<Array<{
    stepNumber: number;
    title: string;
    teacherActivity: string;
    studentActivity: string;
  }>>().default([]).notNull(),
  evaluation: text("evaluation"),
  conclusion: text("conclusion"),
  status: text("status").default("ready").notNull(),
  ...timestamps
});

export const schoolSectionHeads = pgTable("school_section_heads", {
  id: uuid("id").defaultRandom().primaryKey(),
  sectionId: uuid("section_id").references(() => sections.id, { onDelete: "cascade" }),
  sectionCode: text("section_code").notNull().unique(),
  title: text("title").notNull(),
  fullName: text("full_name").notNull(),
  qualification: text("qualification"),
  avatarUrl: text("avatar_url"),
  signatureUrl: text("signature_url"),
  stampUrl: text("stamp_url"),
  defaultComment: text("default_comment"),
  phone: text("phone"),
  email: text("email"),
  ...timestamps
});

export const studentPromotions = pgTable("student_promotions", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  fromClassId: uuid("from_class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  toClassId: uuid("to_class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  fromSessionId: uuid("from_session_id").notNull().references(() => academicSessions.id, { onDelete: "cascade" }),
  toSessionId: uuid("to_session_id").notNull().references(() => academicSessions.id, { onDelete: "cascade" }),
  fromTermId: uuid("from_term_id").references(() => academicTerms.id, { onDelete: "set null" }),
  promotionStatus: text("promotion_status").default("promoted").notNull(),
  averageScore: numeric("average_score", { precision: 5, scale: 2 }),
  decisionReason: text("decision_reason"),
  decidedByUserId: uuid("decided_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => [
  index("student_promotions_student_idx").on(t.studentId),
  index("student_promotions_session_idx").on(t.fromSessionId, t.toSessionId)
]);


