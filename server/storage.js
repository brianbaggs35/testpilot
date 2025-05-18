import { pool } from './db.js';

// In-memory storage as a fallback when the database is not available
class MemStorage {
  constructor() {
    this.users = [];
    this.testRuns = [];
    this.testSuites = [];
    this.testCases = [];
    this.testResults = [];
    this.failureTracking = [];
    this.testPlans = [];
    this.comments = [];
    this.notifications = [];
    this.reportTemplates = [];
    this.reports = [];
    
    // Relations
    this.testSuiteTestCases = [];
    this.testPlanTestCases = [];
    
    // Counters for ID generation
    this.counters = {
      users: 1,
      testRuns: 1,
      testSuites: 1,
      testCases: 1,
      testResults: 1,
      failureTracking: 1,
      testPlans: 1,
      comments: 1,
      notifications: 1,
      reportTemplates: 1,
      reports: 1
    };
  }
  
  // User operations
  async getUser(id) {
    return this.users.find(user => user.id === id);
  }
  
  async getUserByUsername(username) {
    return this.users.find(user => user.username === username);
  }
  
  async getUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }
  
  async createUser(user) {
    const newUser = {
      ...user,
      id: user.id || String(this.counters.users++),
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date()
    };
    this.users.push(newUser);
    return newUser;
  }
  
  async upsertUser(userData) {
    const existingUserIndex = this.users.findIndex(user => user.id === userData.id);
    
    if (existingUserIndex !== -1) {
      // Update existing user
      const updatedUser = {
        ...this.users[existingUserIndex],
        ...userData,
        updatedAt: new Date()
      };
      this.users[existingUserIndex] = updatedUser;
      return updatedUser;
    } else {
      // Create new user
      return this.createUser(userData);
    }
  }
  
  async getUsersByRole(role) {
    return this.users.filter(user => user.role === role);
  }
  
  async updateUserRole(id, role) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return undefined;
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      role,
      updatedAt: new Date()
    };
    
    return this.users[userIndex];
  }
  
  async updateUserPreferences(id, preferences) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return undefined;
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      preferences,
      updatedAt: new Date()
    };
    
    return this.users[userIndex];
  }
  
  // Test run operations
  async createTestRun(run) {
    const newRun = {
      ...run,
      id: run.id || this.counters.testRuns++,
      createdAt: run.createdAt || new Date(),
      updatedAt: run.updatedAt || new Date()
    };
    this.testRuns.push(newRun);
    return newRun;
  }
  
  async getTestRun(id) {
    return this.testRuns.find(run => run.id === id);
  }
  
  async getTestRuns(limit) {
    let runs = [...this.testRuns].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    if (limit) {
      runs = runs.slice(0, limit);
    }
    
    return runs;
  }
  
  async updateTestRun(id, data) {
    const runIndex = this.testRuns.findIndex(run => run.id === id);
    if (runIndex === -1) return undefined;
    
    this.testRuns[runIndex] = {
      ...this.testRuns[runIndex],
      ...data,
      updatedAt: new Date()
    };
    
    return this.testRuns[runIndex];
  }
  
  async deleteTestRun(id) {
    const initialLength = this.testRuns.length;
    this.testRuns = this.testRuns.filter(run => run.id !== id);
    
    // Delete related test results
    this.testResults = this.testResults.filter(result => result.testRunId !== id);
    
    return this.testRuns.length !== initialLength;
  }
  
  // Test suite operations
  async createTestSuite(suite) {
    const newSuite = {
      ...suite,
      id: suite.id || this.counters.testSuites++,
      createdAt: suite.createdAt || new Date(),
      updatedAt: suite.updatedAt || new Date()
    };
    this.testSuites.push(newSuite);
    return newSuite;
  }
  
  async getTestSuite(id) {
    return this.testSuites.find(suite => suite.id === id);
  }
  
  async getTestSuites(parentId) {
    if (parentId) {
      return this.testSuites.filter(suite => suite.parentId === parentId);
    }
    return this.testSuites;
  }
  
  async updateTestSuite(id, data) {
    const suiteIndex = this.testSuites.findIndex(suite => suite.id === id);
    if (suiteIndex === -1) return undefined;
    
    this.testSuites[suiteIndex] = {
      ...this.testSuites[suiteIndex],
      ...data,
      updatedAt: new Date()
    };
    
    return this.testSuites[suiteIndex];
  }
  
  async deleteTestSuite(id) {
    const initialLength = this.testSuites.length;
    this.testSuites = this.testSuites.filter(suite => suite.id !== id);
    
    // Delete relationships
    this.testSuiteTestCases = this.testSuiteTestCases.filter(rel => rel.testSuiteId !== id);
    
    return this.testSuites.length !== initialLength;
  }
  
  async addTestCasesToSuite(suiteId, testCaseIds) {
    // Remove existing relationships for these test cases with this suite
    this.testSuiteTestCases = this.testSuiteTestCases.filter(
      rel => !(rel.testSuiteId === suiteId && testCaseIds.includes(rel.testCaseId))
    );
    
    // Add new relationships
    for (const testCaseId of testCaseIds) {
      this.testSuiteTestCases.push({
        testSuiteId: suiteId,
        testCaseId,
        addedAt: new Date()
      });
    }
    
    return true;
  }
  
  async removeTestCasesFromSuite(suiteId, testCaseIds) {
    const initialLength = this.testSuiteTestCases.length;
    this.testSuiteTestCases = this.testSuiteTestCases.filter(
      rel => !(rel.testSuiteId === suiteId && testCaseIds.includes(rel.testCaseId))
    );
    
    return this.testSuiteTestCases.length !== initialLength;
  }
  
  async getTestCasesForSuite(suiteId) {
    const testCaseIds = this.testSuiteTestCases
      .filter(rel => rel.testSuiteId === suiteId)
      .map(rel => rel.testCaseId);
    
    return this.testCases.filter(testCase => testCaseIds.includes(testCase.id));
  }
  
  // Test case operations
  async createTestCase(testCase) {
    const newTestCase = {
      ...testCase,
      id: testCase.id || this.counters.testCases++,
      createdAt: testCase.createdAt || new Date(),
      updatedAt: testCase.updatedAt || new Date()
    };
    this.testCases.push(newTestCase);
    return newTestCase;
  }
  
  async getTestCase(id) {
    return this.testCases.find(testCase => testCase.id === id);
  }
  
  async getTestCases(type, search, limit) {
    let filteredTestCases = [...this.testCases];
    
    if (type) {
      filteredTestCases = filteredTestCases.filter(testCase => testCase.type === type);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTestCases = filteredTestCases.filter(testCase => 
        testCase.name?.toLowerCase().includes(searchLower) ||
        testCase.description?.toLowerCase().includes(searchLower) ||
        testCase.richContent?.toLowerCase().includes(searchLower)
      );
    }
    
    filteredTestCases.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    if (limit) {
      filteredTestCases = filteredTestCases.slice(0, limit);
    }
    
    return filteredTestCases;
  }
  
  async updateTestCase(id, data) {
    const testCaseIndex = this.testCases.findIndex(testCase => testCase.id === id);
    if (testCaseIndex === -1) return undefined;
    
    this.testCases[testCaseIndex] = {
      ...this.testCases[testCaseIndex],
      ...data,
      updatedAt: new Date()
    };
    
    return this.testCases[testCaseIndex];
  }
  
  async deleteTestCase(id) {
    const initialLength = this.testCases.length;
    this.testCases = this.testCases.filter(testCase => testCase.id !== id);
    
    // Delete relationships
    this.testSuiteTestCases = this.testSuiteTestCases.filter(rel => rel.testCaseId !== id);
    this.testPlanTestCases = this.testPlanTestCases.filter(rel => rel.testCaseId !== id);
    
    // Delete related test results and comments
    this.testResults = this.testResults.filter(result => result.testCaseId !== id);
    this.comments = this.comments.filter(comment => comment.testCaseId !== id);
    
    return this.testCases.length !== initialLength;
  }
  
  // Test result operations
  async createTestResult(result) {
    const newResult = {
      ...result,
      id: result.id || this.counters.testResults++,
      createdAt: result.createdAt || new Date()
    };
    this.testResults.push(newResult);
    return newResult;
  }
  
  async getTestResult(id) {
    return this.testResults.find(result => result.id === id);
  }
  
  async getTestResultsByRunId(runId) {
    return this.testResults.filter(result => result.testRunId === runId);
  }
  
  async getTestResultHistory(testCaseId, limit) {
    let results = this.testResults
      .filter(result => result.testCaseId === testCaseId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (limit) {
      results = results.slice(0, limit);
    }
    
    return results;
  }
  
  // Failure tracking operations
  async createFailureTracking(tracking) {
    const newTracking = {
      ...tracking,
      id: tracking.id || this.counters.failureTracking++,
      createdAt: tracking.createdAt || new Date(),
      updatedAt: tracking.updatedAt || new Date()
    };
    this.failureTracking.push(newTracking);
    return newTracking;
  }
  
  async getFailureTracking(id) {
    return this.failureTracking.find(tracking => tracking.id === id);
  }
  
  async getFailureTrackingByStatus(status) {
    return this.failureTracking.filter(tracking => tracking.status === status);
  }
  
  async getFailureTrackingByAssignee(userId) {
    return this.failureTracking.filter(tracking => tracking.assignedToId === userId);
  }
  
  async updateFailureTracking(id, data) {
    const trackingIndex = this.failureTracking.findIndex(tracking => tracking.id === id);
    if (trackingIndex === -1) return undefined;
    
    this.failureTracking[trackingIndex] = {
      ...this.failureTracking[trackingIndex],
      ...data,
      updatedAt: new Date()
    };
    
    return this.failureTracking[trackingIndex];
  }
  
  // Test plan operations
  async createTestPlan(plan) {
    const newPlan = {
      ...plan,
      id: plan.id || this.counters.testPlans++,
      createdAt: plan.createdAt || new Date(),
      updatedAt: plan.updatedAt || new Date()
    };
    this.testPlans.push(newPlan);
    return newPlan;
  }
  
  async getTestPlan(id) {
    return this.testPlans.find(plan => plan.id === id);
  }
  
  async getTestPlans(status) {
    if (status) {
      return this.testPlans.filter(plan => plan.status === status);
    }
    return this.testPlans;
  }
  
  async updateTestPlan(id, data) {
    const planIndex = this.testPlans.findIndex(plan => plan.id === id);
    if (planIndex === -1) return undefined;
    
    this.testPlans[planIndex] = {
      ...this.testPlans[planIndex],
      ...data,
      updatedAt: new Date()
    };
    
    return this.testPlans[planIndex];
  }
  
  async addTestCasesToPlan(planId, testCaseIds) {
    // Remove existing relationships for these test cases with this plan
    this.testPlanTestCases = this.testPlanTestCases.filter(
      rel => !(rel.testPlanId === planId && testCaseIds.includes(rel.testCaseId))
    );
    
    // Add new relationships
    for (const testCaseId of testCaseIds) {
      this.testPlanTestCases.push({
        testPlanId: planId,
        testCaseId,
        addedAt: new Date()
      });
    }
    
    return true;
  }
  
  async removeTestCasesFromPlan(planId, testCaseIds) {
    const initialLength = this.testPlanTestCases.length;
    this.testPlanTestCases = this.testPlanTestCases.filter(
      rel => !(rel.testPlanId === planId && testCaseIds.includes(rel.testCaseId))
    );
    
    return this.testPlanTestCases.length !== initialLength;
  }
  
  async getTestCasesForPlan(planId) {
    const testCaseIds = this.testPlanTestCases
      .filter(rel => rel.testPlanId === planId)
      .map(rel => rel.testCaseId);
    
    return this.testCases.filter(testCase => testCaseIds.includes(testCase.id));
  }
  
  // Notification operations
  async createNotification(notification) {
    const newNotification = {
      ...notification,
      id: notification.id || this.counters.notifications++,
      createdAt: notification.createdAt || new Date()
    };
    this.notifications.push(newNotification);
    return newNotification;
  }
  
  async getNotificationsForUser(userId, read) {
    let notifications = this.notifications.filter(n => n.userId === userId);
    
    if (read !== undefined) {
      notifications = notifications.filter(n => n.read === read);
    }
    
    return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  async markNotificationAsRead(id) {
    const notificationIndex = this.notifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) return false;
    
    this.notifications[notificationIndex] = {
      ...this.notifications[notificationIndex],
      read: true
    };
    
    return true;
  }
  
  async markAllNotificationsAsRead(userId) {
    this.notifications = this.notifications.map(n => 
      n.userId === userId ? { ...n, read: true } : n
    );
    
    return true;
  }
  
  // Report template operations
  async createReportTemplate(template) {
    const newTemplate = {
      ...template,
      id: template.id || this.counters.reportTemplates++,
      createdAt: template.createdAt || new Date(),
      updatedAt: template.updatedAt || new Date()
    };
    this.reportTemplates.push(newTemplate);
    return newTemplate;
  }
  
  async getReportTemplates() {
    return this.reportTemplates;
  }
  
  // Report operations
  async createReport(report) {
    const newReport = {
      ...report,
      id: report.id || this.counters.reports++,
      createdAt: report.createdAt || new Date()
    };
    this.reports.push(newReport);
    return newReport;
  }
  
  async getReport(id) {
    return this.reports.find(report => report.id === id);
  }
  
  async getReportsByUser(userId) {
    return this.reports.filter(report => report.createdById === userId);
  }
  
  // Comment operations
  async createComment(comment) {
    const newComment = {
      ...comment,
      id: comment.id || this.counters.comments++,
      createdAt: comment.createdAt || new Date(),
      updatedAt: comment.updatedAt || new Date()
    };
    this.comments.push(newComment);
    return newComment;
  }
  
  async getComment(id) {
    return this.comments.find(comment => comment.id === id);
  }
  
  async getCommentsByTestCase(testCaseId) {
    return this.comments.filter(comment => comment.testCaseId === testCaseId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  
  async getCommentsByUser(userId) {
    return this.comments.filter(comment => comment.authorId === userId);
  }
  
  async getCommentReplies(parentId) {
    return this.comments.filter(comment => comment.parentId === parentId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  
  async updateComment(id, content) {
    const commentIndex = this.comments.findIndex(comment => comment.id === id);
    if (commentIndex === -1) return undefined;
    
    this.comments[commentIndex] = {
      ...this.comments[commentIndex],
      content,
      updatedAt: new Date()
    };
    
    return this.comments[commentIndex];
  }
  
  async deleteComment(id) {
    const initialLength = this.comments.length;
    this.comments = this.comments.filter(comment => comment.id !== id);
    
    // Delete replies
    this.comments = this.comments.filter(comment => comment.parentId !== id);
    
    return this.comments.length !== initialLength;
  }
}

// DatabaseStorage will be implemented when connected to a database
class DatabaseStorage {
  // Implement methods similar to MemStorage but using the database
  // For now, we'll use the same interface but with database operations
  async getUser(id) {
    // Implementation will be added later
    return null;
  }
  
  async getUserByUsername(username) {
    // Implementation will be added later
    return null;
  }
  
  // Other methods would be implemented here
}

// This will switch storage implementations based on database connection
const storage = pool ? new DatabaseStorage() : new MemStorage();

export { storage, MemStorage, DatabaseStorage };