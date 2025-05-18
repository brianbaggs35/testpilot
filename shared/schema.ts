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
  index,
} from 'drizzle-orm/pg-core';
import { relations, type SQL } from 'drizzle-orm';
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
  preferences: json('preferences').$type<{ defaultDashboard?: string }>(),
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
  },
  (table) => {
    return {
      expireIdx: index("IDX_session_expire").on(table.expire),
    };
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
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  xmlData: text('xml_data'),
  createdById: varchar('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  metadata: json('metadata').$type<Record<string, any>>(), // Additional metadata
});

// Relations for test runs
export const testRunsRelations = relations(testRuns, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [testRuns.createdById],
    references: [users.id]
  }),
  testResults: many(testResults)
}));

// Schema for test cases
export const testCases = pgTable('test_cases', {
  id: serial('id').primaryKey(),
  title: varchar('title').notNull(),
  description: text('description'),
  steps: text('steps'), // Can be rich text or JSON
  expectedResult: text('expected_result'),
  preconditions: text('preconditions'),
  type: varchar('type').notNull(), // 'manual', 'automated'
  status: varchar('status').default('active'), // 'active', 'deprecated', 'draft'
  priority: varchar('priority'), // 'high', 'medium', 'low'
  tags: json('tags').$type<string[]>(),
  estimatedDuration: integer('estimated_duration'), // in minutes
  automationStatus: varchar('automation_status'), // 'automated', 'not-automated', 'in-progress'
  automationScript: text('automation_script'), // Reference to automation script if any
  createdById: varchar('created_by_id').references(() => users.id),
  lastModifiedById: varchar('last_modified_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  metadata: json('metadata').$type<Record<string, any>>(), // For additional customizable fields
});

// Relations for test cases
export const testCasesRelations = relations(testCases, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [testCases.createdById],
    references: [users.id]
  }),
  lastModifiedBy: one(users, {
    fields: [testCases.lastModifiedById],
    references: [users.id]
  }),
  testResults: many(testResults),
  testSuites: many(testSuitesTestCases),
  testPlans: many(testPlansTestCases),
  comments: many(comments)
}));

// Schema for test results
export const testResults = pgTable('test_results', {
  id: serial('id').primaryKey(),
  testRunId: integer('test_run_id').references(() => testRuns.id),
  testCaseId: integer('test_case_id').references(() => testCases.id),
  className: varchar('class_name'), // For automated tests
  name: varchar('name'), // Method name for automated tests
  status: varchar('status').notNull(), // 'passed', 'failed', 'skipped', 'error'
  duration: integer('duration'), // in milliseconds
  errorMessage: text('error_message'),
  stackTrace: text('stack_trace'),
  screenshots: json('screenshots').$type<string[]>(), // URLs to screenshots
  videoUrl: varchar('video_url'), // URL to test execution video if available
  executedById: varchar('executed_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  metadata: json('metadata').$type<Record<string, any>>(), // For custom attributes
});

// Relations for test results
export const testResultsRelations = relations(testResults, ({ one }) => ({
  testRun: one(testRuns, {
    fields: [testResults.testRunId],
    references: [testRuns.id]
  }),
  testCase: one(testCases, {
    fields: [testResults.testCaseId],
    references: [testCases.id]
  }),
  executedBy: one(users, {
    fields: [testResults.executedById],
    references: [users.id]
  })
}));

// Schema for test suites (folders/collections of test cases)
export const testSuites = pgTable('test_suites', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  description: text('description'),
  parentId: integer('parent_id').references(() => testSuites.id), // For hierarchical structure
  path: varchar('path'), // Full path to the suite e.g. /Root/Frontend/Login
  createdById: varchar('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations for test suites
export const testSuitesRelations = relations(testSuites, ({ one, many }) => ({
  parent: one(testSuites, {
    fields: [testSuites.parentId],
    references: [testSuites.id]
  }),
  children: many(testSuites),
  testCases: many(testSuitesTestCases),
  createdBy: one(users, {
    fields: [testSuites.createdById],
    references: [users.id]
  })
}));

// Join table for test suites and test cases (many-to-many)
export const testSuitesTestCases = pgTable('test_suites_test_cases', {
  suiteId: integer('suite_id').notNull().references(() => testSuites.id),
  testCaseId: integer('test_case_id').notNull().references(() => testCases.id),
  order: integer('order'), // For ordering test cases within a suite
}, (t) => ({
  pk: primaryKey({ columns: [t.suiteId, t.testCaseId] })
}));

// Relations for test suite test cases
export const testSuitesTestCasesRelations = relations(testSuitesTestCases, ({ one }) => ({
  testSuite: one(testSuites, {
    fields: [testSuitesTestCases.suiteId],
    references: [testSuites.id]
  }),
  testCase: one(testCases, {
    fields: [testSuitesTestCases.testCaseId],
    references: [testCases.id]
  })
}));

// Schema for test plans (collection of test cases for a specific test execution)
export const testPlans = pgTable('test_plans', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  description: text('description'),
  status: varchar('status').default('draft'), // 'draft', 'active', 'completed', 'archived'
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdById: varchar('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations for test plans
export const testPlansRelations = relations(testPlans, ({ one, many }) => ({
  testCases: many(testPlansTestCases),
  createdBy: one(users, {
    fields: [testPlans.createdById],
    references: [users.id]
  })
}));

// Join table for test plans and test cases (many-to-many)
export const testPlansTestCases = pgTable('test_plans_test_cases', {
  planId: integer('plan_id').notNull().references(() => testPlans.id),
  testCaseId: integer('test_case_id').notNull().references(() => testCases.id),
  assignedToId: varchar('assigned_to_id').references(() => users.id),
  status: varchar('status'), // 'not-started', 'in-progress', 'passed', 'failed', 'blocked'
  notes: text('notes'),
  order: integer('order'), // For ordering test cases within a plan
}, (t) => ({
  pk: primaryKey({ columns: [t.planId, t.testCaseId] })
}));

// Relations for test plan test cases
export const testPlansTestCasesRelations = relations(testPlansTestCases, ({ one }) => ({
  testPlan: one(testPlans, {
    fields: [testPlansTestCases.planId],
    references: [testPlans.id]
  }),
  testCase: one(testCases, {
    fields: [testPlansTestCases.testCaseId],
    references: [testCases.id]
  }),
  assignedTo: one(users, {
    fields: [testPlansTestCases.assignedToId],
    references: [users.id]
  })
}));

// Schema for failure tracking (Kanban-style tracking of test failures)
export const failureTracking = pgTable('failure_tracking', {
  id: serial('id').primaryKey(),
  testResultId: integer('test_result_id').references(() => testResults.id),
  title: varchar('title').notNull(),
  description: text('description'),
  status: varchar('status').default('new'), // 'new', 'in-progress', 'fixed', 'wont-fix', 'duplicate'
  priority: varchar('priority'), // 'high', 'medium', 'low'
  assignedToId: varchar('assigned_to_id').references(() => users.id),
  jiraTicketId: varchar('jira_ticket_id'), // For integration with issue tracking
  resolvedById: varchar('resolved_by_id').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  resolution: text('resolution'), // Notes on how the issue was resolved
  createdById: varchar('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations for failure tracking
export const failureTrackingRelations = relations(failureTracking, ({ one }) => ({
  testResult: one(testResults, {
    fields: [failureTracking.testResultId],
    references: [testResults.id]
  }),
  assignedTo: one(users, {
    fields: [failureTracking.assignedToId],
    references: [users.id]
  }),
  resolvedBy: one(users, {
    fields: [failureTracking.resolvedById],
    references: [users.id]
  }),
  createdBy: one(users, {
    fields: [failureTracking.createdById],
    references: [users.id]
  })
}));

// Schema for user notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').references(() => users.id).notNull(),
  title: varchar('title').notNull(),
  message: text('message').notNull(),
  type: varchar('type'), // 'info', 'success', 'warning', 'error'
  read: boolean('read').default(false),
  link: varchar('link'), // Optional link to related resource
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations for notifications
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  })
}));

// Schema for report templates
export const reportTemplates = pgTable('report_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  description: text('description'),
  template: text('template').notNull(), // Could be HTML, Markdown, or JSON
  createdById: varchar('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations for report templates
export const reportTemplatesRelations = relations(reportTemplates, ({ one }) => ({
  createdBy: one(users, {
    fields: [reportTemplates.createdById],
    references: [users.id]
  })
}));

// Schema for generated reports
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  description: text('description'),
  templateId: integer('template_id').references(() => reportTemplates.id),
  content: text('content').notNull(), // Generated report content
  format: varchar('format').default('html'), // 'html', 'pdf', 'markdown', 'csv'
  filters: json('filters').$type<Record<string, any>>(), // Filters used to generate the report
  createdById: varchar('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations for reports
export const reportsRelations = relations(reports, ({ one }) => ({
  template: one(reportTemplates, {
    fields: [reports.templateId],
    references: [reportTemplates.id]
  }),
  createdBy: one(users, {
    fields: [reports.createdById],
    references: [users.id]
  })
}));

// Schema for comments on test cases
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  testCaseId: integer('test_case_id').references(() => testCases.id).notNull(),
  parentId: integer('parent_id').references(() => comments.id), // For replies
  content: text('content').notNull(),
  authorId: varchar('author_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations for comments
export const commentsRelations = relations(comments, ({ one, many }) => ({
  testCase: one(testCases, {
    fields: [comments.testCaseId],
    references: [testCases.id]
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id]
  }),
  replies: many(comments),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id]
  })
}));

// Define Zod schemas for insertions
export const insertUserSchema = createInsertSchema(users);
export const insertTestRunSchema = createInsertSchema(testRuns, {
  startedAt: (schema) => schema.startedAt.default(new Date()),
});
export const insertTestCaseSchema = createInsertSchema(testCases);
export const insertTestResultSchema = createInsertSchema(testResults);
export const insertTestSuiteSchema = createInsertSchema(testSuites);
export const insertTestPlanSchema = createInsertSchema(testPlans);
export const insertFailureTrackingSchema = createInsertSchema(failureTracking);
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertReportTemplateSchema = createInsertSchema(reportTemplates);
export const insertReportSchema = createInsertSchema(reports);
export const insertCommentSchema = createInsertSchema(comments);

// Define types for insert and select
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertTestRun = typeof testRuns.$inferInsert;
export type TestRun = typeof testRuns.$inferSelect;

export type InsertTestCase = typeof testCases.$inferInsert;
export type TestCase = typeof testCases.$inferSelect;

export type InsertTestResult = typeof testResults.$inferInsert;
export type TestResult = typeof testResults.$inferSelect;

export type InsertTestSuite = typeof testSuites.$inferInsert;
export type TestSuite = typeof testSuites.$inferSelect;

export type InsertTestPlan = typeof testPlans.$inferInsert;
export type TestPlan = typeof testPlans.$inferSelect;

export type InsertFailureTracking = typeof failureTracking.$inferInsert;
export type FailureTracking = typeof failureTracking.$inferSelect;

export type InsertNotification = typeof notifications.$inferInsert;
export type Notification = typeof notifications.$inferSelect;

export type InsertReportTemplate = typeof reportTemplates.$inferInsert;
export type ReportTemplate = typeof reportTemplates.$inferSelect;

export type InsertReport = typeof reports.$inferInsert;
export type Report = typeof reports.$inferSelect;

export type InsertComment = typeof comments.$inferInsert;
export type Comment = typeof comments.$inferSelect;