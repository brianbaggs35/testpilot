import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  timestamp, 
  integer, 
  boolean,
  json,
  unique,
  primaryKey,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Schema for users (including auth users)
export const users = pgTable('users', {
  id: varchar('id').primaryKey().notNull(),
  role: varchar('role').default('user').notNull(), // 'admin', 'manager', 'user', etc.
  email: varchar('email').unique(),
  username: varchar('username').unique(),
  passwordHash: varchar('password_hash'),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  profileImageUrl: varchar('profile_image_url'),
  preferences: json('preferences'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);

// Schema for test runs (test execution instances)
export const testRuns = pgTable('test_runs', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  status: varchar('status').notNull(), // 'running', 'completed', 'failed', etc.
  environment: varchar('environment'), // 'dev', 'staging', 'prod'
  type: varchar('type'), // 'manual', 'automated'
  totalTests: integer('total_tests'),
  passedTests: integer('passed_tests'),
  failedTests: integer('failed_tests'),
  skippedTests: integer('skipped_tests'),
  duration: integer('duration'), // in milliseconds
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdById: varchar('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  metadata: json('metadata'), // Additional metadata
  xmlData: text('xml_data'), // For JUnit XML upload storage
});

// Relations for test runs
export const testRunsRelations = relations(testRuns, ({ one }) => ({
  createdBy: one(users, {
    fields: [testRuns.createdById],
    references: [users.id],
  }),
}));

// Schema for test suites (folders for test cases)
export const testSuites = pgTable('test_suites', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  description: text('description'),
  parentId: integer('parent_id').references(() => testSuites.id),
  path: varchar('path'), // Hierarchical path
  createdById: varchar('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations for test suites
export const testSuitesRelations = relations(testSuites, ({ one, many }) => ({
  parent: one(testSuites, {
    fields: [testSuites.parentId],
    references: [testSuites.id],
  }),
  children: many(testSuites),
  createdBy: one(users, {
    fields: [testSuites.createdById],
    references: [users.id],
  }),
  testCases: many(testSuitesTestCases),
}));

// Schema for test cases
export const testCases = pgTable('test_cases', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  className: varchar('class_name'), // For automated tests (Java class etc.)
  type: varchar('type').notNull(), // 'manual', 'automated'
  description: text('description'),
  richContent: text('rich_content'), // HTML/rich text for manual test steps
  expectedResult: text('expected_result'),
  preconditions: text('preconditions'),
  priority: varchar('priority'), // 'high', 'medium', 'low'
  status: varchar('status'), // 'active', 'deprecated', 'draft'
  tags: text('tags').array(),
  estimatedTime: integer('estimated_time'), // in minutes
  createdById: varchar('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  metadata: json('metadata'), // Additional metadata
});

// Relations for test cases
export const testCasesRelations = relations(testCases, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [testCases.createdById],
    references: [users.id],
  }),
  suites: many(testSuitesTestCases),
  plans: many(testPlansTestCases),
  results: many(testResults),
  comments: many(comments),
}));

// Join table for test suites to test cases
export const testSuitesTestCases = pgTable('test_suites_test_cases', {
  testSuiteId: integer('test_suite_id').notNull().references(() => testSuites.id),
  testCaseId: integer('test_case_id').notNull().references(() => testCases.id),
  addedAt: timestamp('added_at').defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey(t.testSuiteId, t.testCaseId),
}));

// Relations for test suites to test cases
export const testSuitesTestCasesRelations = relations(testSuitesTestCases, ({ one }) => ({
  testSuite: one(testSuites, {
    fields: [testSuitesTestCases.testSuiteId],
    references: [testSuites.id],
  }),
  testCase: one(testCases, {
    fields: [testSuitesTestCases.testCaseId],
    references: [testCases.id],
  }),
}));

// Schema for test results
export const testResults = pgTable('test_results', {
  id: serial('id').primaryKey(),
  testRunId: integer('test_run_id').references(() => testRuns.id).notNull(),
  testCaseId: integer('test_case_id').references(() => testCases.id).notNull(),
  className: varchar('class_name'), // For automated tests
  status: varchar('status').notNull(), // 'passed', 'failed', 'skipped', 'error'
  duration: integer('duration'), // in milliseconds
  errorMessage: text('error_message'),
  stackTrace: text('stack_trace'),
  executedById: varchar('executed_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  metadata: json('metadata'), // Additional metadata
});

// Relations for test results
export const testResultsRelations = relations(testResults, ({ one }) => ({
  testRun: one(testRuns, {
    fields: [testResults.testRunId],
    references: [testRuns.id],
  }),
  testCase: one(testCases, {
    fields: [testResults.testCaseId],
    references: [testCases.id],
  }),
  executedBy: one(users, {
    fields: [testResults.executedById],
    references: [users.id],
  }),
}));

// Schema for failure tracking (kanban board)
export const failureTracking = pgTable('failure_tracking', {
  id: serial('id').primaryKey(),
  testResultId: integer('test_result_id').references(() => testResults.id),
  testCaseId: integer('test_case_id').references(() => testCases.id),
  status: varchar('status').notNull(), // 'new', 'investigating', 'fixed', 'wont_fix', etc.
  priority: varchar('priority'), // 'high', 'medium', 'low'
  assignedToId: varchar('assigned_to_id').references(() => users.id),
  notes: text('notes'),
  createdById: varchar('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations for failure tracking
export const failureTrackingRelations = relations(failureTracking, ({ one }) => ({
  testResult: one(testResults, {
    fields: [failureTracking.testResultId],
    references: [testResults.id],
  }),
  testCase: one(testCases, {
    fields: [failureTracking.testCaseId],
    references: [testCases.id],
  }),
  assignedTo: one(users, {
    fields: [failureTracking.assignedToId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [failureTracking.createdById],
    references: [users.id],
  }),
}));

// Schema for test plans
export const testPlans = pgTable('test_plans', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  description: text('description'),
  status: varchar('status').notNull(), // 'draft', 'active', 'completed'
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdById: varchar('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations for test plans
export const testPlansRelations = relations(testPlans, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [testPlans.createdById],
    references: [users.id],
  }),
  testCases: many(testPlansTestCases),
}));

// Join table for test plans to test cases
export const testPlansTestCases = pgTable('test_plans_test_cases', {
  testPlanId: integer('test_plan_id').notNull().references(() => testPlans.id),
  testCaseId: integer('test_case_id').notNull().references(() => testCases.id),
  order: integer('order'), // For ordering cases in the plan
  addedAt: timestamp('added_at').defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey(t.testPlanId, t.testCaseId),
}));

// Relations for test plans to test cases
export const testPlansTestCasesRelations = relations(testPlansTestCases, ({ one }) => ({
  testPlan: one(testPlans, {
    fields: [testPlansTestCases.testPlanId],
    references: [testPlans.id],
  }),
  testCase: one(testCases, {
    fields: [testPlansTestCases.testCaseId],
    references: [testCases.id],
  }),
}));

// Schema for notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id),
  title: varchar('title').notNull(),
  message: text('message').notNull(),
  type: varchar('type').notNull(), // 'info', 'success', 'warning', 'error'
  read: boolean('read').default(false).notNull(),
  relatedId: varchar('related_id'), // ID of the related resource
  relatedType: varchar('related_type'), // Type of the related resource
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations for notifications
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Schema for report templates
export const reportTemplates = pgTable('report_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  description: text('description'),
  template: json('template').notNull(), // Template definition (JSON)
  createdById: varchar('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations for report templates
export const reportTemplatesRelations = relations(reportTemplates, ({ one }) => ({
  createdBy: one(users, {
    fields: [reportTemplates.createdById],
    references: [users.id],
  }),
}));

// Schema for generated reports
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  templateId: integer('template_id').references(() => reportTemplates.id),
  content: json('content').notNull(), // Generated report content (JSON)
  createdById: varchar('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations for reports
export const reportsRelations = relations(reports, ({ one }) => ({
  template: one(reportTemplates, {
    fields: [reports.templateId],
    references: [reportTemplates.id],
  }),
  createdBy: one(users, {
    fields: [reports.createdById],
    references: [users.id],
  }),
}));

// Schema for comments
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  testCaseId: integer('test_case_id').references(() => testCases.id),
  parentId: integer('parent_id').references(() => comments.id), // For threaded comments
  authorId: varchar('author_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations for comments
export const commentsRelations = relations(comments, ({ one, many }) => ({
  testCase: one(testCases, {
    fields: [comments.testCaseId],
    references: [testCases.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

// Create insert schemas with Zod
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email format").nullish(),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  passwordHash: z.string(),
});

export const insertTestRunSchema = createInsertSchema(testRuns, {
  name: z.string().min(1, "Name is required"),
  status: z.string().refine((val) => 
    ['running', 'completed', 'failed', 'queued'].includes(val), 
    "Invalid status"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTestCaseSchema = createInsertSchema(testCases, {
  name: z.string().min(1, "Name is required"),
  type: z.string().refine((val) => 
    ['manual', 'automated'].includes(val), 
    "Type must be 'manual' or 'automated'"),
  priority: z.string().refine((val) => 
    ['high', 'medium', 'low'].includes(val), 
    "Invalid priority"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTestResultSchema = createInsertSchema(testResults, {
  testRunId: z.number(),
  status: z.string().refine((val) => 
    ['passed', 'failed', 'skipped', 'error'].includes(val), 
    "Invalid status"),
}).omit({
  id: true,
  createdAt: true,
});

export const insertFailureTrackingSchema = createInsertSchema(failureTracking, {
  status: z.string().refine((val) => 
    ['new', 'investigating', 'fixed', 'wont_fix', 'cannot_reproduce'].includes(val), 
    "Invalid status"),
  priority: z.string().refine((val) => 
    ['high', 'medium', 'low'].includes(val), 
    "Invalid priority"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTestPlanSchema = createInsertSchema(testPlans, {
  name: z.string().min(1, "Name is required"),
  status: z.string().refine((val) => 
    ['draft', 'active', 'completed'].includes(val), 
    "Invalid status"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications, {
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.string().refine((val) => 
    ['info', 'success', 'warning', 'error'].includes(val), 
    "Invalid type"),
}).omit({
  id: true,
  createdAt: true,
  read: true,
});

export const insertReportTemplateSchema = createInsertSchema(reportTemplates, {
  name: z.string().min(1, "Name is required"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportSchema = createInsertSchema(reports, {
  name: z.string().min(1, "Name is required"),
}).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments, {
  content: z.string().min(1, "Content is required"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Define types based on the schemas
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type TestRun = typeof testRuns.$inferSelect;
export type InsertTestRun = z.infer<typeof insertTestRunSchema>;

export type TestSuite = typeof testSuites.$inferSelect;
export type InsertTestSuite = typeof testSuites.$inferInsert;

export type TestCase = typeof testCases.$inferSelect;
export type InsertTestCase = z.infer<typeof insertTestCaseSchema>;

export type TestResult = typeof testResults.$inferSelect;
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;

export type FailureTracking = typeof failureTracking.$inferSelect;
export type InsertFailureTracking = z.infer<typeof insertFailureTrackingSchema>;

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