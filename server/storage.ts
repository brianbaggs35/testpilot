import {
  users,
  testRuns,
  testCases,
  testResults,
  testSuites,
  testSuitesTestCases,
  testPlans,
  testPlansTestCases,
  failureTracking,
  notifications,
  reportTemplates,
  reports,
  comments,
  sessions,
  type User,
  type UpsertUser,
  type TestRun,
  type InsertTestRun,
  type TestCase,
  type InsertTestCase,
  type TestResult,
  type InsertTestResult,
  type TestSuite,
  type InsertTestSuite,
  type TestPlan,
  type InsertTestPlan,
  type FailureTracking,
  type InsertFailureTracking,
  type Notification,
  type InsertNotification,
  type ReportTemplate,
  type InsertReportTemplate,
  type Report,
  type InsertReport,
  type Comment,
  type InsertComment,
} from "@shared/schema";

import { db } from "./db";
import { eq, and, like, desc, isNull, or, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  updateUserPreferences(id: string, preferences: any): Promise<User | undefined>;
  
  // Test run operations
  createTestRun(run: InsertTestRun): Promise<TestRun>;
  getTestRun(id: number): Promise<TestRun | undefined>;
  getTestRuns(limit?: number): Promise<TestRun[]>;
  updateTestRun(id: number, data: Partial<InsertTestRun>): Promise<TestRun | undefined>;
  deleteTestRun(id: number): Promise<void>;
  
  // Test suite operations
  createTestSuite(suite: InsertTestSuite): Promise<TestSuite>;
  getTestSuite(id: number): Promise<TestSuite | undefined>;
  getTestSuites(parentId?: number): Promise<TestSuite[]>;
  updateTestSuite(id: number, data: Partial<InsertTestSuite>): Promise<TestSuite | undefined>;
  deleteTestSuite(id: number): Promise<void>;
  addTestCasesToSuite(suiteId: number, testCaseIds: number[]): Promise<void>;
  removeTestCasesFromSuite(suiteId: number, testCaseIds: number[]): Promise<void>;
  getTestCasesForSuite(suiteId: number): Promise<TestCase[]>;
  
  // Test case operations
  createTestCase(testCase: InsertTestCase): Promise<TestCase>;
  getTestCase(id: number): Promise<TestCase | undefined>;
  getTestCases(type?: string, search?: string, limit?: number): Promise<TestCase[]>;
  updateTestCase(id: number, data: Partial<InsertTestCase>): Promise<TestCase | undefined>;
  deleteTestCase(id: number): Promise<void>;
  
  // Test result operations
  createTestResult(result: InsertTestResult): Promise<TestResult>;
  getTestResult(id: number): Promise<TestResult | undefined>;
  getTestResultsByRunId(runId: number): Promise<TestResult[]>;
  getTestResultHistory(testCaseId: number, limit?: number): Promise<TestResult[]>;
  
  // Failure tracking operations
  createFailureTracking(tracking: InsertFailureTracking): Promise<FailureTracking>;
  getFailureTracking(id: number): Promise<FailureTracking | undefined>;
  getFailureTrackingByStatus(status: string): Promise<FailureTracking[]>;
  getFailureTrackingByAssignee(userId: string): Promise<FailureTracking[]>;
  updateFailureTracking(id: number, data: Partial<InsertFailureTracking>): Promise<FailureTracking | undefined>;
  
  // Test plan operations
  createTestPlan(plan: InsertTestPlan): Promise<TestPlan>;
  getTestPlan(id: number): Promise<TestPlan | undefined>;
  getTestPlans(status?: string): Promise<TestPlan[]>;
  updateTestPlan(id: number, data: Partial<InsertTestPlan>): Promise<TestPlan | undefined>;
  addTestCasesToPlan(planId: number, testCaseIds: number[]): Promise<void>;
  removeTestCasesFromPlan(planId: number, testCaseIds: number[]): Promise<void>;
  getTestCasesForPlan(planId: number): Promise<TestCase[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsForUser(userId: string, read?: boolean): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  
  // Report operations
  createReportTemplate(template: InsertReportTemplate): Promise<ReportTemplate>;
  getReportTemplates(): Promise<ReportTemplate[]>;
  createReport(report: InsertReport): Promise<Report>;
  getReport(id: number): Promise<Report | undefined>;
  getReportsByUser(userId: string): Promise<Report[]>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByTestCase(testCaseId: number): Promise<Comment[]>;
  getCommentsByUser(userId: string): Promise<Comment[]>;
  getCommentReplies(parentId: number): Promise<Comment[]>;
  updateComment(id: number, content: string): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: UpsertUser): Promise<User> {
    const [createdUser] = await db
      .insert(users)
      .values(user)
      .returning();
    return createdUser;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserPreferences(id: string, preferences: any): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ preferences, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Test run operations
  async createTestRun(run: InsertTestRun): Promise<TestRun> {
    const [testRun] = await db
      .insert(testRuns)
      .values(run)
      .returning();
    return testRun;
  }

  async getTestRun(id: number): Promise<TestRun | undefined> {
    const [run] = await db.select().from(testRuns).where(eq(testRuns.id, id));
    return run;
  }

  async getTestRuns(limit: number = 100): Promise<TestRun[]> {
    return db
      .select()
      .from(testRuns)
      .orderBy(desc(testRuns.createdAt))
      .limit(limit);
  }

  async updateTestRun(id: number, data: Partial<InsertTestRun>): Promise<TestRun | undefined> {
    const [updatedRun] = await db
      .update(testRuns)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(testRuns.id, id))
      .returning();
    return updatedRun;
  }

  async deleteTestRun(id: number): Promise<void> {
    await db.delete(testRuns).where(eq(testRuns.id, id));
  }

  // Test suite operations
  async createTestSuite(suite: InsertTestSuite): Promise<TestSuite> {
    const [testSuite] = await db
      .insert(testSuites)
      .values(suite)
      .returning();
    return testSuite;
  }

  async getTestSuite(id: number): Promise<TestSuite | undefined> {
    const [suite] = await db.select().from(testSuites).where(eq(testSuites.id, id));
    return suite;
  }

  async getTestSuites(parentId?: number): Promise<TestSuite[]> {
    let query = db.select().from(testSuites);
    
    if (parentId) {
      query = query.where(eq(testSuites.parentId, parentId));
    } else {
      query = query.where(isNull(testSuites.parentId));
    }
    
    return query.orderBy(testSuites.name);
  }

  async updateTestSuite(id: number, data: Partial<InsertTestSuite>): Promise<TestSuite | undefined> {
    const [updatedSuite] = await db
      .update(testSuites)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(testSuites.id, id))
      .returning();
    return updatedSuite;
  }

  async deleteTestSuite(id: number): Promise<void> {
    await db.delete(testSuites).where(eq(testSuites.id, id));
  }

  async addTestCasesToSuite(suiteId: number, testCaseIds: number[]): Promise<void> {
    const values = testCaseIds.map(testCaseId => ({
      suiteId,
      testCaseId,
      order: null // Order could be set properly in a more complex implementation
    }));
    
    await db
      .insert(testSuitesTestCases)
      .values(values)
      .onConflictDoNothing(); // In case some relationships already exist
  }

  async removeTestCasesFromSuite(suiteId: number, testCaseIds: number[]): Promise<void> {
    await db
      .delete(testSuitesTestCases)
      .where(
        and(
          eq(testSuitesTestCases.suiteId, suiteId),
          sql`${testSuitesTestCases.testCaseId} IN (${testCaseIds.join(',')})`
        )
      );
  }

  async getTestCasesForSuite(suiteId: number): Promise<TestCase[]> {
    const relations = await db
      .select()
      .from(testSuitesTestCases)
      .where(eq(testSuitesTestCases.suiteId, suiteId))
      .orderBy(testSuitesTestCases.order);
    
    const testCaseIds = relations.map(r => r.testCaseId);
    
    if (testCaseIds.length === 0) {
      return [];
    }
    
    return db
      .select()
      .from(testCases)
      .where(sql`${testCases.id} IN (${testCaseIds.join(',')})`)
      .orderBy(testCases.title);
  }

  // Test case operations
  async createTestCase(testCase: InsertTestCase): Promise<TestCase> {
    const [createdCase] = await db
      .insert(testCases)
      .values(testCase)
      .returning();
    return createdCase;
  }

  async getTestCase(id: number): Promise<TestCase | undefined> {
    const [testCase] = await db.select().from(testCases).where(eq(testCases.id, id));
    return testCase;
  }

  async getTestCases(type?: string, search?: string, limit: number = 100): Promise<TestCase[]> {
    let query = db.select().from(testCases);
    
    if (type) {
      query = query.where(eq(testCases.type, type));
    }
    
    if (search) {
      query = query.where(
        or(
          like(testCases.title, `%${search}%`),
          like(testCases.description || '', `%${search}%`)
        )
      );
    }
    
    return query.orderBy(desc(testCases.updatedAt)).limit(limit);
  }

  async updateTestCase(id: number, data: Partial<InsertTestCase>): Promise<TestCase | undefined> {
    const [updatedCase] = await db
      .update(testCases)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(testCases.id, id))
      .returning();
    return updatedCase;
  }

  async deleteTestCase(id: number): Promise<void> {
    await db.delete(testCases).where(eq(testCases.id, id));
  }

  // Test result operations
  async createTestResult(result: InsertTestResult): Promise<TestResult> {
    const [createdResult] = await db
      .insert(testResults)
      .values(result)
      .returning();
    return createdResult;
  }

  async getTestResult(id: number): Promise<TestResult | undefined> {
    const [result] = await db.select().from(testResults).where(eq(testResults.id, id));
    return result;
  }

  async getTestResultsByRunId(runId: number): Promise<TestResult[]> {
    return db
      .select()
      .from(testResults)
      .where(eq(testResults.testRunId, runId));
  }

  async getTestResultHistory(testCaseId: number, limit: number = 10): Promise<TestResult[]> {
    return db
      .select()
      .from(testResults)
      .where(eq(testResults.testCaseId, testCaseId))
      .orderBy(desc(testResults.createdAt))
      .limit(limit);
  }

  // Failure tracking operations
  async createFailureTracking(tracking: InsertFailureTracking): Promise<FailureTracking> {
    const [createdTracking] = await db
      .insert(failureTracking)
      .values(tracking)
      .returning();
    return createdTracking;
  }

  async getFailureTracking(id: number): Promise<FailureTracking | undefined> {
    const [tracking] = await db.select().from(failureTracking).where(eq(failureTracking.id, id));
    return tracking;
  }

  async getFailureTrackingByStatus(status: string): Promise<FailureTracking[]> {
    return db
      .select()
      .from(failureTracking)
      .where(eq(failureTracking.status, status))
      .orderBy(desc(failureTracking.updatedAt));
  }

  async getFailureTrackingByAssignee(userId: string): Promise<FailureTracking[]> {
    return db
      .select()
      .from(failureTracking)
      .where(eq(failureTracking.assignedToId, userId))
      .orderBy(desc(failureTracking.updatedAt));
  }

  async updateFailureTracking(id: number, data: Partial<InsertFailureTracking>): Promise<FailureTracking | undefined> {
    const [updatedTracking] = await db
      .update(failureTracking)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(failureTracking.id, id))
      .returning();
    return updatedTracking;
  }

  // Test plan operations
  async createTestPlan(plan: InsertTestPlan): Promise<TestPlan> {
    const [createdPlan] = await db
      .insert(testPlans)
      .values(plan)
      .returning();
    return createdPlan;
  }

  async getTestPlan(id: number): Promise<TestPlan | undefined> {
    const [plan] = await db.select().from(testPlans).where(eq(testPlans.id, id));
    return plan;
  }

  async getTestPlans(status?: string): Promise<TestPlan[]> {
    let query = db.select().from(testPlans);
    
    if (status) {
      query = query.where(eq(testPlans.status, status));
    }
    
    return query.orderBy(desc(testPlans.updatedAt));
  }

  async updateTestPlan(id: number, data: Partial<InsertTestPlan>): Promise<TestPlan | undefined> {
    const [updatedPlan] = await db
      .update(testPlans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(testPlans.id, id))
      .returning();
    return updatedPlan;
  }

  async addTestCasesToPlan(planId: number, testCaseIds: number[]): Promise<void> {
    const values = testCaseIds.map(testCaseId => ({
      planId,
      testCaseId,
      status: 'not-started',
      order: null // Order could be set properly in a more complex implementation
    }));
    
    await db
      .insert(testPlansTestCases)
      .values(values)
      .onConflictDoNothing(); // In case some relationships already exist
  }

  async removeTestCasesFromPlan(planId: number, testCaseIds: number[]): Promise<void> {
    await db
      .delete(testPlansTestCases)
      .where(
        and(
          eq(testPlansTestCases.planId, planId),
          sql`${testPlansTestCases.testCaseId} IN (${testCaseIds.join(',')})`
        )
      );
  }

  async getTestCasesForPlan(planId: number): Promise<TestCase[]> {
    const relations = await db
      .select()
      .from(testPlansTestCases)
      .where(eq(testPlansTestCases.planId, planId))
      .orderBy(testPlansTestCases.order);
    
    const testCaseIds = relations.map(r => r.testCaseId);
    
    if (testCaseIds.length === 0) {
      return [];
    }
    
    return db
      .select()
      .from(testCases)
      .where(sql`${testCases.id} IN (${testCaseIds.join(',')})`)
      .orderBy(testCases.title);
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [createdNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return createdNotification;
  }

  async getNotificationsForUser(userId: string, read?: boolean): Promise<Notification[]> {
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
    
    if (read !== undefined) {
      query = query.where(eq(notifications.read, read));
    }
    
    return query.orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  // Report operations
  async createReportTemplate(template: InsertReportTemplate): Promise<ReportTemplate> {
    const [createdTemplate] = await db
      .insert(reportTemplates)
      .values(template)
      .returning();
    return createdTemplate;
  }

  async getReportTemplates(): Promise<ReportTemplate[]> {
    return db
      .select()
      .from(reportTemplates)
      .orderBy(reportTemplates.name);
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [createdReport] = await db
      .insert(reports)
      .values(report)
      .returning();
    return createdReport;
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async getReportsByUser(userId: string): Promise<Report[]> {
    return db
      .select()
      .from(reports)
      .where(eq(reports.createdById, userId))
      .orderBy(desc(reports.createdAt));
  }

  // Comment operations
  async createComment(comment: InsertComment): Promise<Comment> {
    const [createdComment] = await db
      .insert(comments)
      .values(comment)
      .returning();
    return createdComment;
  }

  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment;
  }

  async getCommentsByTestCase(testCaseId: number): Promise<Comment[]> {
    return db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.testCaseId, testCaseId),
          isNull(comments.parentId) // Only top-level comments
        )
      )
      .orderBy(comments.createdAt);
  }

  async getCommentsByUser(userId: string): Promise<Comment[]> {
    return db
      .select()
      .from(comments)
      .where(eq(comments.authorId, userId))
      .orderBy(desc(comments.createdAt));
  }

  async getCommentReplies(parentId: number): Promise<Comment[]> {
    return db
      .select()
      .from(comments)
      .where(eq(comments.parentId, parentId))
      .orderBy(comments.createdAt);
  }

  async updateComment(id: number, content: string): Promise<Comment | undefined> {
    const [updatedComment] = await db
      .update(comments)
      .set({ content, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteComment(id: number): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }
}

export const storage = new DatabaseStorage();