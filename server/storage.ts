import { 
  users, 
  testRuns, 
  testResults, 
  testCases, 
  testSuites, 
  testSuitesTestCases,
  testPlans,
  testPlansTestCases,
  failureTracking,
  notifications,
  reportTemplates,
  reports,
  comments,
  type User, 
  type UpsertUser,
  type TestRun,
  type InsertTestRun,
  type TestCase,
  type InsertTestCase,
  type TestResult,
  type InsertTestResult,
  type FailureTracking,
  type InsertFailureTracking,
  type TestSuite,
  type InsertTestSuite,
  type TestPlan,
  type InsertTestPlan,
  type Notification,
  type InsertNotification,
  type ReportTemplate,
  type InsertReportTemplate,
  type Report,
  type InsertReport,
  type Comment,
  type InsertComment
} from "../shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull, sql, or, like, inArray } from "drizzle-orm";

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
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
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
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async updateUserPreferences(id: string, preferences: any): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ preferences, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  // Test run operations
  async createTestRun(run: InsertTestRun): Promise<TestRun> {
    const [testRun] = await db.insert(testRuns).values(run).returning();
    return testRun;
  }
  
  async getTestRun(id: number): Promise<TestRun | undefined> {
    const [testRun] = await db.select().from(testRuns).where(eq(testRuns.id, id));
    return testRun;
  }
  
  async getTestRuns(limit?: number): Promise<TestRun[]> {
    let query = db.select().from(testRuns).orderBy(desc(testRuns.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query;
  }
  
  async updateTestRun(id: number, data: Partial<InsertTestRun>): Promise<TestRun | undefined> {
    const [testRun] = await db
      .update(testRuns)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(testRuns.id, id))
      .returning();
    return testRun;
  }
  
  async deleteTestRun(id: number): Promise<void> {
    await db.delete(testRuns).where(eq(testRuns.id, id));
  }
  
  // Test suite operations
  async createTestSuite(suite: InsertTestSuite): Promise<TestSuite> {
    const [testSuite] = await db.insert(testSuites).values(suite).returning();
    return testSuite;
  }
  
  async getTestSuite(id: number): Promise<TestSuite | undefined> {
    const [testSuite] = await db.select().from(testSuites).where(eq(testSuites.id, id));
    return testSuite;
  }
  
  async getTestSuites(parentId?: number): Promise<TestSuite[]> {
    if (parentId !== undefined) {
      return db.select().from(testSuites).where(eq(testSuites.parentId, parentId));
    } else {
      return db.select().from(testSuites).where(isNull(testSuites.parentId));
    }
  }
  
  async updateTestSuite(id: number, data: Partial<InsertTestSuite>): Promise<TestSuite | undefined> {
    const [testSuite] = await db
      .update(testSuites)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(testSuites.id, id))
      .returning();
    return testSuite;
  }
  
  async deleteTestSuite(id: number): Promise<void> {
    await db.delete(testSuites).where(eq(testSuites.id, id));
  }
  
  async addTestCasesToSuite(suiteId: number, testCaseIds: number[]): Promise<void> {
    const values = testCaseIds.map(testCaseId => ({
      suiteId,
      testCaseId,
      order: 0 // Default order, can be updated later
    }));
    
    await db.insert(testSuitesTestCases).values(values).onConflictDoNothing({
      target: [testSuitesTestCases.suiteId, testSuitesTestCases.testCaseId]
    });
  }
  
  async removeTestCasesFromSuite(suiteId: number, testCaseIds: number[]): Promise<void> {
    await db.delete(testSuitesTestCases)
      .where(and(
        eq(testSuitesTestCases.suiteId, suiteId),
        inArray(testSuitesTestCases.testCaseId, testCaseIds)
      ));
  }
  
  async getTestCasesForSuite(suiteId: number): Promise<TestCase[]> {
    const result = await db.select({
      testCase: testCases
    })
    .from(testSuitesTestCases)
    .innerJoin(testCases, eq(testSuitesTestCases.testCaseId, testCases.id))
    .where(eq(testSuitesTestCases.suiteId, suiteId))
    .orderBy(testSuitesTestCases.order);
    
    return result.map(r => r.testCase);
  }
  
  // Test case operations
  async createTestCase(testCase: InsertTestCase): Promise<TestCase> {
    const [newTestCase] = await db.insert(testCases).values(testCase).returning();
    return newTestCase;
  }
  
  async getTestCase(id: number): Promise<TestCase | undefined> {
    const [testCase] = await db.select().from(testCases).where(eq(testCases.id, id));
    return testCase;
  }
  
  async getTestCases(type?: string, search?: string, limit?: number): Promise<TestCase[]> {
    let query = db.select().from(testCases);
    
    if (type) {
      query = query.where(eq(testCases.type, type));
    }
    
    if (search) {
      query = query.where(or(
        like(testCases.title, `%${search}%`),
        like(testCases.description || '', `%${search}%`)
      ));
    }
    
    query = query.orderBy(desc(testCases.updatedAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query;
  }
  
  async updateTestCase(id: number, data: Partial<InsertTestCase>): Promise<TestCase | undefined> {
    const [testCase] = await db
      .update(testCases)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(testCases.id, id))
      .returning();
    return testCase;
  }
  
  async deleteTestCase(id: number): Promise<void> {
    await db.delete(testCases).where(eq(testCases.id, id));
  }
  
  // Test result operations
  async createTestResult(result: InsertTestResult): Promise<TestResult> {
    const [testResult] = await db.insert(testResults).values(result).returning();
    return testResult;
  }
  
  async getTestResult(id: number): Promise<TestResult | undefined> {
    const [testResult] = await db.select().from(testResults).where(eq(testResults.id, id));
    return testResult;
  }
  
  async getTestResultsByRunId(runId: number): Promise<TestResult[]> {
    return db.select().from(testResults).where(eq(testResults.testRunId, runId));
  }
  
  async getTestResultHistory(testCaseId: number, limit?: number): Promise<TestResult[]> {
    let query = db.select()
      .from(testResults)
      .where(eq(testResults.testCaseId, testCaseId))
      .orderBy(desc(testResults.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query;
  }
  
  // Failure tracking operations
  async createFailureTracking(tracking: InsertFailureTracking): Promise<FailureTracking> {
    const [failureTrack] = await db.insert(failureTracking).values(tracking).returning();
    return failureTrack;
  }
  
  async getFailureTracking(id: number): Promise<FailureTracking | undefined> {
    const [failure] = await db.select().from(failureTracking).where(eq(failureTracking.id, id));
    return failure;
  }
  
  async getFailureTrackingByStatus(status: string): Promise<FailureTracking[]> {
    return db.select().from(failureTracking).where(eq(failureTracking.status, status));
  }
  
  async getFailureTrackingByAssignee(userId: string): Promise<FailureTracking[]> {
    return db.select().from(failureTracking).where(eq(failureTracking.assignedToId, userId));
  }
  
  async updateFailureTracking(id: number, data: Partial<InsertFailureTracking>): Promise<FailureTracking | undefined> {
    const [failure] = await db
      .update(failureTracking)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(failureTracking.id, id))
      .returning();
    return failure;
  }
  
  // Test plan operations
  async createTestPlan(plan: InsertTestPlan): Promise<TestPlan> {
    const [testPlan] = await db.insert(testPlans).values(plan).returning();
    return testPlan;
  }
  
  async getTestPlan(id: number): Promise<TestPlan | undefined> {
    const [testPlan] = await db.select().from(testPlans).where(eq(testPlans.id, id));
    return testPlan;
  }
  
  async getTestPlans(status?: string): Promise<TestPlan[]> {
    if (status) {
      return db.select().from(testPlans).where(eq(testPlans.status, status));
    } else {
      return db.select().from(testPlans).orderBy(desc(testPlans.updatedAt));
    }
  }
  
  async updateTestPlan(id: number, data: Partial<InsertTestPlan>): Promise<TestPlan | undefined> {
    const [testPlan] = await db
      .update(testPlans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(testPlans.id, id))
      .returning();
    return testPlan;
  }
  
  async addTestCasesToPlan(planId: number, testCaseIds: number[]): Promise<void> {
    const values = testCaseIds.map(testCaseId => ({
      planId,
      testCaseId,
      status: 'not-started',
      order: 0 // Default order, can be updated later
    }));
    
    await db.insert(testPlansTestCases).values(values).onConflictDoNothing({
      target: [testPlansTestCases.planId, testPlansTestCases.testCaseId]
    });
  }
  
  async removeTestCasesFromPlan(planId: number, testCaseIds: number[]): Promise<void> {
    await db.delete(testPlansTestCases)
      .where(and(
        eq(testPlansTestCases.planId, planId),
        inArray(testPlansTestCases.testCaseId, testCaseIds)
      ));
  }
  
  async getTestCasesForPlan(planId: number): Promise<TestCase[]> {
    const result = await db.select({
      testCase: testCases
    })
    .from(testPlansTestCases)
    .innerJoin(testCases, eq(testPlansTestCases.testCaseId, testCases.id))
    .where(eq(testPlansTestCases.planId, planId))
    .orderBy(testPlansTestCases.order);
    
    return result.map(r => r.testCase);
  }
  
  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }
  
  async getNotificationsForUser(userId: string, read?: boolean): Promise<Notification[]> {
    let query = db.select().from(notifications).where(eq(notifications.userId, userId));
    
    if (read !== undefined) {
      query = query.where(eq(notifications.read, read));
    }
    
    return query.orderBy(desc(notifications.createdAt));
  }
  
  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }
  
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  }
  
  // Report operations
  async createReportTemplate(template: InsertReportTemplate): Promise<ReportTemplate> {
    const [newTemplate] = await db.insert(reportTemplates).values(template).returning();
    return newTemplate;
  }
  
  async getReportTemplates(): Promise<ReportTemplate[]> {
    return db.select().from(reportTemplates).orderBy(reportTemplates.name);
  }
  
  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }
  
  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }
  
  async getReportsByUser(userId: string): Promise<Report[]> {
    return db.select().from(reports).where(eq(reports.createdById, userId)).orderBy(desc(reports.createdAt));
  }
  
  // Comment operations
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }
  
  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment;
  }
  
  async getCommentsByTestCase(testCaseId: number): Promise<Comment[]> {
    return db
      .select()
      .from(comments)
      .where(and(
        eq(comments.testCaseId, testCaseId),
        isNull(comments.parentId)
      ))
      .orderBy(comments.createdAt);
  }
  
  async getCommentsByUser(userId: string): Promise<Comment[]> {
    return db.select().from(comments).where(eq(comments.authorId, userId)).orderBy(desc(comments.createdAt));
  }
  
  async getCommentReplies(parentId: number): Promise<Comment[]> {
    return db.select().from(comments).where(eq(comments.parentId, parentId)).orderBy(comments.createdAt);
  }
  
  async updateComment(id: number, content: string): Promise<Comment | undefined> {
    const [comment] = await db
      .update(comments)
      .set({ content, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return comment;
  }
  
  async deleteComment(id: number): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }
}

export const storage = new DatabaseStorage();