import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  json,
  index,
  jsonb,
  foreignKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  role: varchar("role").default("user").notNull(),
  email: varchar("email").unique(),
  username: varchar("username").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  preferences: json("preferences"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Permissions
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
});

// User Permissions (Many-to-Many)
export const userPermissions = pgTable(
  "user_permissions",
  {
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permissionId: integer("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: { name: 'user_permission_pk', columns: [table.userId, table.permissionId] }
  }),
);

// Test Runs
export const testRuns = pgTable("test_runs", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  status: varchar("status").default("in-progress"),
  type: varchar("type").default("automated"),
  createdById: varchar("created_by_id").references(() => users.id),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  environment: varchar("environment"),
  branch: varchar("branch"),
  buildNumber: varchar("build_number"),
  metadata: json("metadata"),
  totalTests: integer("total_tests"),
  passedTests: integer("passed_tests"),
  failedTests: integer("failed_tests"),
  skippedTests: integer("skipped_tests"),
  executionTime: integer("execution_time"), // in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  xmlData: text("xml_data"), // For storing raw JUnit XML data
});

// Test Cases
export const testCases = pgTable("test_cases", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  className: varchar("class_name"),
  metadata: json("metadata"),
  type: varchar("type").default("automated"), // automated, manual
  status: varchar("status").default("active"),
  priority: varchar("priority"),
  createdById: varchar("created_by_id").references(() => users.id),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  description: text("description"),
  preconditions: text("preconditions"),
  steps: text("steps"), // Could be JSON for structured steps
  expectedResults: text("expected_results"),
  actualResults: text("actual_results"),
  tags: text("tags").array(), // Array of string tags
  attachments: text("attachments").array(), // Array of attachment URLs
  testSuiteId: integer("test_suite_id").references(() => testSuites.id),
  automationStatus: varchar("automation_status").default("not-automated"), // not-automated, in-progress, automated
  automationScript: text("automation_script"), // URL or reference to automation script
  estimatedDuration: integer("estimated_duration"), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  customFields: json("custom_fields"), // For extensibility
});

// Test Results
export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  status: varchar("status").notNull(), // passed, failed, skipped, blocked
  testRunId: integer("test_run_id")
    .notNull()
    .references(() => testRuns.id),
  testCaseId: integer("test_case_id").references(() => testCases.id),
  executedById: varchar("executed_by_id").references(() => users.id),
  executionTime: integer("execution_time"), // in milliseconds
  errorMessage: text("error_message"),
  errorType: varchar("error_type"),
  stackTrace: text("stack_trace"),
  stdOut: text("std_out"),
  stdErr: text("std_err"),
  attachments: text("attachments").array(), // Array of attachment URLs
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Failure Tracking (Kanban board)
export const failureTracking = pgTable("failure_tracking", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  status: varchar("status").default("new"), // new, in-progress, blocked, resolved
  priority: varchar("priority").default("medium"), // low, medium, high, critical
  testResultId: integer("test_result_id").references(() => testResults.id),
  testCaseId: integer("test_case_id").references(() => testCases.id),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  createdById: varchar("created_by_id").references(() => users.id),
  description: text("description"),
  rootCause: text("root_cause"),
  resolution: text("resolution"),
  externalReferenceId: varchar("external_reference_id"), // For linking to external issue tracker
  externalReferenceUrl: varchar("external_reference_url"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  customFields: json("custom_fields"), // For extensibility
});

// Test Suites (for organizing test cases in folders)
export const testSuites = pgTable("test_suites", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdById: varchar("created_by_id").references(() => users.id),
  description: text("description"),
  parentId: integer("parent_id").references(() => testSuites.id), // For hierarchical structure
});

// Many-to-Many for Test Suites and Test Cases
export const testSuiteTestCases = pgTable(
  "test_suite_test_cases",
  {
    testSuiteId: integer("test_suite_id")
      .notNull()
      .references(() => testSuites.id, { onDelete: "cascade" }),
    testCaseId: integer("test_case_id")
      .notNull()
      .references(() => testCases.id, { onDelete: "cascade" }),
    position: integer("position"), // For ordering test cases within a suite
  },
  (table) => ({
    pk: { name: 'test_suite_test_case_pk', columns: [table.testSuiteId, table.testCaseId] }
  }),
);

// Test Plans (for manual test execution planning)
export const testPlans = pgTable("test_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  status: varchar("status").default("draft"), // draft, active, completed
  createdById: varchar("created_by_id").references(() => users.id),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  progress: integer("progress").default(0), // Percentage of completed test cases
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  customFields: json("custom_fields"), // For extensibility
});

// Many-to-Many for Test Plans and Test Cases
export const testPlanTestCases = pgTable(
  "test_plan_test_cases",
  {
    testPlanId: integer("test_plan_id")
      .notNull()
      .references(() => testPlans.id, { onDelete: "cascade" }),
    testCaseId: integer("test_case_id")
      .notNull()
      .references(() => testCases.id, { onDelete: "cascade" }),
    position: integer("position"), // For ordering test cases within a plan
    status: varchar("status").default("not-run"), // not-run, in-progress, passed, failed, blocked
    assignedToId: varchar("assigned_to_id").references(() => users.id),
    executedById: varchar("executed_by_id").references(() => users.id),
    executedAt: timestamp("executed_at"),
    notes: text("notes"),
  },
  (table) => ({
    pk: { name: 'test_plan_test_case_pk', columns: [table.testPlanId, table.testCaseId] }
  }),
);

// Notification system
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  content: text("content"),
  type: varchar("type").default("info"), // info, warning, error, success
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  link: varchar("link"), // Optional link to related resource
  resourceType: varchar("resource_type"), // Type of related resource (test case, run, etc.)
  resourceId: varchar("resource_id"), // ID of related resource
});

// Report Templates
export const reportTemplates = pgTable("report_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  content: text("content").notNull(), // HTML template or structure
  createdById: varchar("created_by_id").references(() => users.id),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Generated Reports
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // manual, automated, combined
  format: varchar("format").default("pdf"), // pdf, html, etc.
  content: text("content"), // Generated content
  contentUrl: varchar("content_url"), // URL to the generated report file
  testRunId: integer("test_run_id").references(() => testRuns.id),
  testPlanId: integer("test_plan_id").references(() => testPlans.id),
  templateId: integer("template_id").references(() => reportTemplates.id),
  createdById: varchar("created_by_id").references(() => users.id),
  parameters: json("parameters"), // User-selected parameters used to generate the report
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comments for collaboration
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  authorId: varchar("author_id")
    .notNull()
    .references(() => users.id),
  testCaseId: integer("test_case_id").references(() => testCases.id),
  testResultId: integer("test_result_id").references(() => testResults.id),
  failureTrackingId: integer("failure_tracking_id").references(() => failureTracking.id),
  parentId: integer("parent_id").references(() => comments.id), // For hierarchical comments (replies)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  role: z.string().default("user"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
  preferences: z.any().optional(),
});

export const registerUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const insertTestRunSchema = createInsertSchema(testRuns, {
  status: z.enum(["queued", "in-progress", "completed", "failed", "cancelled"]).default("in-progress"),
  type: z.enum(["automated", "manual", "mixed"]).default("automated"),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  environment: z.string().optional(),
  branch: z.string().optional(),
  buildNumber: z.string().optional(),
  metadata: z.any().optional(),
  totalTests: z.number().int().nonnegative().optional(),
  passedTests: z.number().int().nonnegative().optional(),
  failedTests: z.number().int().nonnegative().optional(),
  skippedTests: z.number().int().nonnegative().optional(),
  executionTime: z.number().int().nonnegative().optional(),
  xmlData: z.string().optional(),
});

export const insertTestCaseSchema = createInsertSchema(testCases, {
  type: z.enum(["automated", "manual", "api", "performance", "security"]).default("automated"),
  status: z.enum(["active", "deprecated", "draft", "archived"]).default("active"),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  description: z.string().optional(),
  preconditions: z.string().optional(),
  steps: z.string().optional(),
  expectedResults: z.string().optional(),
  actualResults: z.string().optional(),
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
  automationStatus: z.enum(["not-automated", "in-progress", "automated"]).default("not-automated"),
  automationScript: z.string().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  customFields: z.any().optional(),
});

export const insertTestResultSchema = createInsertSchema(testResults, {
  status: z.enum(["passed", "failed", "skipped", "blocked", "not-run"]),
  executionTime: z.number().int().nonnegative().optional(),
  errorMessage: z.string().optional(),
  errorType: z.string().optional(),
  stackTrace: z.string().optional(),
  stdOut: z.string().optional(),
  stdErr: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  metadata: z.any().optional(),
});

export const insertFailureTrackingSchema = createInsertSchema(failureTracking, {
  status: z.enum(["new", "in-progress", "blocked", "resolved"]).default("new"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  description: z.string().optional(),
  rootCause: z.string().optional(),
  resolution: z.string().optional(),
  externalReferenceId: z.string().optional(),
  externalReferenceUrl: z.string().optional(),
  dueDate: z.date().optional(),
  customFields: z.any().optional(),
});

export const insertTestSuiteSchema = createInsertSchema(testSuites, {
  description: z.string().optional(),
  parentId: z.number().int().positive().optional(),
});

export const insertTestPlanSchema = createInsertSchema(testPlans, {
  status: z.enum(["draft", "active", "completed", "archived"]).default("draft"),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  progress: z.number().int().min(0).max(100).default(0),
  customFields: z.any().optional(),
});

export const insertNotificationSchema = createInsertSchema(notifications, {
  type: z.enum(["info", "warning", "error", "success"]).default("info"),
  read: z.boolean().default(false),
  link: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
});

export const insertReportTemplateSchema = createInsertSchema(reportTemplates, {
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export const insertReportSchema = createInsertSchema(reports, {
  type: z.enum(["manual", "automated", "combined"]),
  format: z.enum(["pdf", "html", "csv", "xml", "json"]).default("pdf"),
  content: z.string().optional(),
  contentUrl: z.string().optional(),
  testRunId: z.number().int().positive().optional(),
  testPlanId: z.number().int().positive().optional(),
  parameters: z.any().optional(),
});

export const insertCommentSchema = createInsertSchema(comments, {
  parentId: z.number().int().positive().optional(),
  testCaseId: z.number().int().positive().optional(),
  testResultId: z.number().int().positive().optional(),
  failureTrackingId: z.number().int().positive().optional(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type TestRun = typeof testRuns.$inferSelect;
export type InsertTestRun = z.infer<typeof insertTestRunSchema>;

export type TestCase = typeof testCases.$inferSelect;
export type InsertTestCase = z.infer<typeof insertTestCaseSchema>;

export type TestResult = typeof testResults.$inferSelect;
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;

export type FailureTracking = typeof failureTracking.$inferSelect;
export type InsertFailureTracking = z.infer<typeof insertFailureTrackingSchema>;

export type TestSuite = typeof testSuites.$inferSelect;
export type InsertTestSuite = z.infer<typeof insertTestSuiteSchema>;

export type TestPlan = typeof testPlans.$inferSelect;
export type InsertTestPlan = z.infer<typeof insertTestPlanSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportTemplate = z.infer<typeof insertReportTemplateSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;