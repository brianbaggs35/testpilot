import express, { Request, Response, NextFunction, Express } from 'express';
import { createServer, Server } from 'http';
import { WebSocketServer } from 'ws';
import { ZodError } from 'zod';
import { storage } from './storage';
import { 
  insertTestRunSchema, 
  insertTestCaseSchema, 
  insertTestResultSchema,
  insertTestSuiteSchema,
  insertTestPlanSchema,
  insertCommentSchema,
  insertFailureTrackingSchema
} from '../shared/schema';

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle different message types
        if (data.type === 'subscribe') {
          // Subscribe to updates for a specific resource
          ws.resourceId = data.resourceId;
          ws.resourceType = data.resourceType;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  // Helper function to broadcast updates to WebSocket clients
  const broadcastUpdate = (resourceType: string, resourceId: string | number, data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === 1 && // WebSocket.OPEN
          (client.resourceType === resourceType && client.resourceId === resourceId)) {
        client.send(JSON.stringify({
          type: 'update',
          resourceType,
          resourceId,
          data
        }));
      }
    });
  };

  // Error handling middleware
  const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
      fn(req, res, next).catch(next);
    };
  };

  // Test run routes
  router.post('/test-runs', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = insertTestRunSchema.parse(req.body);
      const testRun = await storage.createTestRun({
        ...data, 
        createdById: req.user?.id
      });
      res.status(201).json(testRun);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        throw error;
      }
    }
  }));

  router.get('/test-runs', asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const testRuns = await storage.getTestRuns(limit);
    res.json(testRuns);
  }));

  router.get('/test-runs/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const testRun = await storage.getTestRun(id);
    
    if (!testRun) {
      return res.status(404).json({ message: 'Test run not found' });
    }
    
    res.json(testRun);
  }));

  router.patch('/test-runs/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    try {
      const data = insertTestRunSchema.partial().parse(req.body);
      const testRun = await storage.updateTestRun(id, data);
      
      if (!testRun) {
        return res.status(404).json({ message: 'Test run not found' });
      }
      
      // Broadcast update to WebSocket clients
      broadcastUpdate('test-run', id, testRun);
      
      res.json(testRun);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        throw error;
      }
    }
  }));

  router.delete('/test-runs/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await storage.deleteTestRun(id);
    res.status(204).send();
  }));

  // Test suite routes
  router.post('/test-suites', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = insertTestSuiteSchema.parse(req.body);
      const testSuite = await storage.createTestSuite({
        ...data,
        createdById: req.user?.id
      });
      res.status(201).json(testSuite);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        throw error;
      }
    }
  }));

  router.get('/test-suites', asyncHandler(async (req: Request, res: Response) => {
    const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
    const testSuites = await storage.getTestSuites(parentId);
    res.json(testSuites);
  }));

  router.get('/test-suites/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const testSuite = await storage.getTestSuite(id);
    
    if (!testSuite) {
      return res.status(404).json({ message: 'Test suite not found' });
    }
    
    res.json(testSuite);
  }));

  router.patch('/test-suites/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    try {
      const data = insertTestSuiteSchema.partial().parse(req.body);
      const testSuite = await storage.updateTestSuite(id, data);
      
      if (!testSuite) {
        return res.status(404).json({ message: 'Test suite not found' });
      }
      
      res.json(testSuite);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        throw error;
      }
    }
  }));

  router.delete('/test-suites/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await storage.deleteTestSuite(id);
    res.status(204).send();
  }));

  router.post('/test-suites/:id/test-cases', asyncHandler(async (req: Request, res: Response) => {
    const suiteId = parseInt(req.params.id);
    const { testCaseIds } = req.body;
    
    if (!Array.isArray(testCaseIds)) {
      return res.status(400).json({ message: 'testCaseIds must be an array' });
    }
    
    await storage.addTestCasesToSuite(suiteId, testCaseIds);
    res.status(204).send();
  }));

  router.delete('/test-suites/:id/test-cases', asyncHandler(async (req: Request, res: Response) => {
    const suiteId = parseInt(req.params.id);
    const { testCaseIds } = req.body;
    
    if (!Array.isArray(testCaseIds)) {
      return res.status(400).json({ message: 'testCaseIds must be an array' });
    }
    
    await storage.removeTestCasesFromSuite(suiteId, testCaseIds);
    res.status(204).send();
  }));

  router.get('/test-suites/:id/test-cases', asyncHandler(async (req: Request, res: Response) => {
    const suiteId = parseInt(req.params.id);
    const testCases = await storage.getTestCasesForSuite(suiteId);
    res.json(testCases);
  }));

  // Test case routes
  router.post('/test-cases', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = insertTestCaseSchema.parse(req.body);
      const testCase = await storage.createTestCase({
        ...data,
        createdById: req.user?.id
      });
      res.status(201).json(testCase);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        throw error;
      }
    }
  }));

  router.get('/test-cases', asyncHandler(async (req: Request, res: Response) => {
    const type = req.query.type as string | undefined;
    const search = req.query.search as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    
    const testCases = await storage.getTestCases(type, search, limit);
    res.json(testCases);
  }));

  router.get('/test-cases/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const testCase = await storage.getTestCase(id);
    
    if (!testCase) {
      return res.status(404).json({ message: 'Test case not found' });
    }
    
    res.json(testCase);
  }));

  router.patch('/test-cases/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    try {
      const data = insertTestCaseSchema.partial().parse(req.body);
      const testCase = await storage.updateTestCase(id, data);
      
      if (!testCase) {
        return res.status(404).json({ message: 'Test case not found' });
      }
      
      // Broadcast update to WebSocket clients
      broadcastUpdate('test-case', id, testCase);
      
      res.json(testCase);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        throw error;
      }
    }
  }));

  router.delete('/test-cases/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await storage.deleteTestCase(id);
    res.status(204).send();
  }));

  // Test result routes
  router.post('/test-results', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = insertTestResultSchema.parse(req.body);
      const testResult = await storage.createTestResult({
        ...data,
        executedById: req.user?.id
      });
      res.status(201).json(testResult);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        throw error;
      }
    }
  }));

  router.get('/test-runs/:runId/results', asyncHandler(async (req: Request, res: Response) => {
    const runId = parseInt(req.params.runId);
    const results = await storage.getTestResultsByRunId(runId);
    res.json(results);
  }));

  router.get('/test-cases/:caseId/results', asyncHandler(async (req: Request, res: Response) => {
    const caseId = parseInt(req.params.caseId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const results = await storage.getTestResultHistory(caseId, limit);
    res.json(results);
  }));

  router.get('/test-results/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const result = await storage.getTestResult(id);
    
    if (!result) {
      return res.status(404).json({ message: 'Test result not found' });
    }
    
    res.json(result);
  }));

  // Failure tracking routes
  router.post('/failures', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = insertFailureTrackingSchema.parse(req.body);
      const failure = await storage.createFailureTracking({
        ...data,
        createdById: req.user?.id
      });
      res.status(201).json(failure);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        throw error;
      }
    }
  }));

  router.get('/failures', asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as string;
    const assignedTo = req.query.assignedTo as string;
    
    let failures;
    if (status) {
      failures = await storage.getFailureTrackingByStatus(status);
    } else if (assignedTo) {
      failures = await storage.getFailureTrackingByAssignee(assignedTo);
    } else {
      failures = await storage.getFailureTrackingByStatus('new');
    }
    
    res.json(failures);
  }));

  router.get('/failures/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const failure = await storage.getFailureTracking(id);
    
    if (!failure) {
      return res.status(404).json({ message: 'Failure tracking not found' });
    }
    
    res.json(failure);
  }));

  router.patch('/failures/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    try {
      const data = insertFailureTrackingSchema.partial().parse(req.body);
      const failure = await storage.updateFailureTracking(id, data);
      
      if (!failure) {
        return res.status(404).json({ message: 'Failure tracking not found' });
      }
      
      // Broadcast update to WebSocket clients
      broadcastUpdate('failure', id, failure);
      
      res.json(failure);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        throw error;
      }
    }
  }));

  // Test plan routes
  router.post('/test-plans', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = insertTestPlanSchema.parse(req.body);
      const testPlan = await storage.createTestPlan({
        ...data,
        createdById: req.user?.id
      });
      res.status(201).json(testPlan);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        throw error;
      }
    }
  }));

  router.get('/test-plans', asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const testPlans = await storage.getTestPlans(status);
    res.json(testPlans);
  }));

  router.get('/test-plans/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const testPlan = await storage.getTestPlan(id);
    
    if (!testPlan) {
      return res.status(404).json({ message: 'Test plan not found' });
    }
    
    res.json(testPlan);
  }));

  router.patch('/test-plans/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    try {
      const data = insertTestPlanSchema.partial().parse(req.body);
      const testPlan = await storage.updateTestPlan(id, data);
      
      if (!testPlan) {
        return res.status(404).json({ message: 'Test plan not found' });
      }
      
      res.json(testPlan);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        throw error;
      }
    }
  }));

  router.post('/test-plans/:id/test-cases', asyncHandler(async (req: Request, res: Response) => {
    const planId = parseInt(req.params.id);
    const { testCaseIds } = req.body;
    
    if (!Array.isArray(testCaseIds)) {
      return res.status(400).json({ message: 'testCaseIds must be an array' });
    }
    
    await storage.addTestCasesToPlan(planId, testCaseIds);
    res.status(204).send();
  }));

  router.delete('/test-plans/:id/test-cases', asyncHandler(async (req: Request, res: Response) => {
    const planId = parseInt(req.params.id);
    const { testCaseIds } = req.body;
    
    if (!Array.isArray(testCaseIds)) {
      return res.status(400).json({ message: 'testCaseIds must be an array' });
    }
    
    await storage.removeTestCasesFromPlan(planId, testCaseIds);
    res.status(204).send();
  }));

  router.get('/test-plans/:id/test-cases', asyncHandler(async (req: Request, res: Response) => {
    const planId = parseInt(req.params.id);
    const testCases = await storage.getTestCasesForPlan(planId);
    res.json(testCases);
  }));
  
  // Comment routes
  router.post('/comments', asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment({
        ...data,
        authorId: req.user?.id
      });
      res.status(201).json(comment);
      
      // Broadcast update to WebSocket clients
      if (data.testCaseId) {
        broadcastUpdate('test-case-comments', data.testCaseId, { added: comment });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        throw error;
      }
    }
  }));

  router.get('/test-cases/:testCaseId/comments', asyncHandler(async (req: Request, res: Response) => {
    const testCaseId = parseInt(req.params.testCaseId);
    const comments = await storage.getCommentsByTestCase(testCaseId);
    res.json(comments);
  }));

  router.get('/comments/:commentId/replies', asyncHandler(async (req: Request, res: Response) => {
    const commentId = parseInt(req.params.commentId);
    const replies = await storage.getCommentReplies(commentId);
    res.json(replies);
  }));

  router.patch('/comments/:commentId', asyncHandler(async (req: Request, res: Response) => {
    const commentId = parseInt(req.params.commentId);
    const { content } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    const comment = await storage.updateComment(commentId, content);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    res.json(comment);
    
    // Broadcast update to WebSocket clients
    if (comment.testCaseId) {
      broadcastUpdate('test-case-comments', comment.testCaseId, { updated: comment });
    }
  }));

  router.delete('/comments/:commentId', asyncHandler(async (req: Request, res: Response) => {
    const commentId = parseInt(req.params.commentId);
    const comment = await storage.getComment(commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is the author
    if (comment.authorId !== req.user?.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    await storage.deleteComment(commentId);
    res.status(204).send();
    
    // Broadcast update to WebSocket clients
    if (comment.testCaseId) {
      broadcastUpdate('test-case-comments', comment.testCaseId, { deleted: commentId });
    }
  }));

  // Apply the router to the app
  app.use('/api', router);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    
    res.status(err.status || 500).json({
      message: err.message || 'Something went wrong',
      errors: err.errors || undefined
    });
  });

  return httpServer;
}