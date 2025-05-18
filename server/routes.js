import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { storage } from './storage.js';

export async function registerRoutes(app) {
  const router = express.Router();
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Add custom properties to WebSocket objects
    ws.resourceId = null;
    ws.resourceType = null;
    
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
  const broadcastUpdate = (resourceType, resourceId, data) => {
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
  const asyncHandler = (fn) => {
    return (req, res, next) => {
      fn(req, res, next).catch(next);
    };
  };

  // Test run routes
  router.post('/test-runs', asyncHandler(async (req, res) => {
    try {
      const data = req.body;
      const testRun = await storage.createTestRun({
        ...data, 
        createdById: req.user?.id || 'anonymous'
      });
      res.status(201).json(testRun);
    } catch (error) {
      res.status(400).json({ message: 'Validation error', errors: error.message });
    }
  }));

  router.get('/test-runs', asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const testRuns = await storage.getTestRuns(limit);
    res.json(testRuns);
  }));

  router.get('/test-runs/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const testRun = await storage.getTestRun(id);
    
    if (!testRun) {
      return res.status(404).json({ message: 'Test run not found' });
    }
    
    res.json(testRun);
  }));

  router.patch('/test-runs/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const data = req.body;
      const testRun = await storage.updateTestRun(id, data);
      
      if (!testRun) {
        return res.status(404).json({ message: 'Test run not found' });
      }
      
      // Broadcast update to WebSocket clients
      broadcastUpdate('test-run', id, testRun);
      
      res.json(testRun);
    } catch (error) {
      res.status(400).json({ message: 'Validation error', errors: error.message });
    }
  }));

  router.delete('/test-runs/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteTestRun(id);
    res.status(204).send();
  }));

  // Test suite routes
  router.post('/test-suites', asyncHandler(async (req, res) => {
    try {
      const data = req.body;
      const testSuite = await storage.createTestSuite({
        ...data,
        createdById: req.user?.id || 'anonymous'
      });
      res.status(201).json(testSuite);
    } catch (error) {
      res.status(400).json({ message: 'Validation error', errors: error.message });
    }
  }));

  router.get('/test-suites', asyncHandler(async (req, res) => {
    const parentId = req.query.parentId ? parseInt(req.query.parentId) : undefined;
    const testSuites = await storage.getTestSuites(parentId);
    res.json(testSuites);
  }));

  router.get('/test-suites/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const testSuite = await storage.getTestSuite(id);
    
    if (!testSuite) {
      return res.status(404).json({ message: 'Test suite not found' });
    }
    
    res.json(testSuite);
  }));

  router.patch('/test-suites/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const data = req.body;
      const testSuite = await storage.updateTestSuite(id, data);
      
      if (!testSuite) {
        return res.status(404).json({ message: 'Test suite not found' });
      }
      
      res.json(testSuite);
    } catch (error) {
      res.status(400).json({ message: 'Validation error', errors: error.message });
    }
  }));

  router.delete('/test-suites/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteTestSuite(id);
    res.status(204).send();
  }));

  router.post('/test-suites/:id/test-cases', asyncHandler(async (req, res) => {
    const suiteId = parseInt(req.params.id);
    const { testCaseIds } = req.body;
    
    if (!Array.isArray(testCaseIds)) {
      return res.status(400).json({ message: 'testCaseIds must be an array' });
    }
    
    await storage.addTestCasesToSuite(suiteId, testCaseIds);
    res.status(204).send();
  }));

  router.delete('/test-suites/:id/test-cases', asyncHandler(async (req, res) => {
    const suiteId = parseInt(req.params.id);
    const { testCaseIds } = req.body;
    
    if (!Array.isArray(testCaseIds)) {
      return res.status(400).json({ message: 'testCaseIds must be an array' });
    }
    
    await storage.removeTestCasesFromSuite(suiteId, testCaseIds);
    res.status(204).send();
  }));

  router.get('/test-suites/:id/test-cases', asyncHandler(async (req, res) => {
    const suiteId = parseInt(req.params.id);
    const testCases = await storage.getTestCasesForSuite(suiteId);
    res.json(testCases);
  }));

  // Test case routes
  router.post('/test-cases', asyncHandler(async (req, res) => {
    try {
      const data = req.body;
      const testCase = await storage.createTestCase({
        ...data,
        createdById: req.user?.id || 'anonymous'
      });
      res.status(201).json(testCase);
    } catch (error) {
      res.status(400).json({ message: 'Validation error', errors: error.message });
    }
  }));

  router.get('/test-cases', asyncHandler(async (req, res) => {
    const type = req.query.type;
    const search = req.query.search;
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    
    const testCases = await storage.getTestCases(type, search, limit);
    res.json(testCases);
  }));

  router.get('/test-cases/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const testCase = await storage.getTestCase(id);
    
    if (!testCase) {
      return res.status(404).json({ message: 'Test case not found' });
    }
    
    res.json(testCase);
  }));

  router.patch('/test-cases/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const data = req.body;
      const testCase = await storage.updateTestCase(id, data);
      
      if (!testCase) {
        return res.status(404).json({ message: 'Test case not found' });
      }
      
      // Broadcast update to WebSocket clients
      broadcastUpdate('test-case', id, testCase);
      
      res.json(testCase);
    } catch (error) {
      res.status(400).json({ message: 'Validation error', errors: error.message });
    }
  }));

  router.delete('/test-cases/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteTestCase(id);
    res.status(204).send();
  }));

  // Test result routes
  router.post('/test-results', asyncHandler(async (req, res) => {
    try {
      const data = req.body;
      const testResult = await storage.createTestResult({
        ...data,
        executedById: req.user?.id || 'anonymous'
      });
      res.status(201).json(testResult);
    } catch (error) {
      res.status(400).json({ message: 'Validation error', errors: error.message });
    }
  }));

  router.get('/test-runs/:runId/results', asyncHandler(async (req, res) => {
    const runId = parseInt(req.params.runId);
    const results = await storage.getTestResultsByRunId(runId);
    res.json(results);
  }));

  router.get('/test-cases/:caseId/results', asyncHandler(async (req, res) => {
    const caseId = parseInt(req.params.caseId);
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const results = await storage.getTestResultHistory(caseId, limit);
    res.json(results);
  }));

  router.get('/test-results/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const result = await storage.getTestResult(id);
    
    if (!result) {
      return res.status(404).json({ message: 'Test result not found' });
    }
    
    res.json(result);
  }));

  // Failure tracking routes
  router.post('/failures', asyncHandler(async (req, res) => {
    try {
      const data = req.body;
      const failure = await storage.createFailureTracking({
        ...data,
        createdById: req.user?.id || 'anonymous'
      });
      res.status(201).json(failure);
    } catch (error) {
      res.status(400).json({ message: 'Validation error', errors: error.message });
    }
  }));

  router.get('/failures', asyncHandler(async (req, res) => {
    const status = req.query.status;
    const assignedTo = req.query.assignedTo;
    
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

  router.get('/failures/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const failure = await storage.getFailureTracking(id);
    
    if (!failure) {
      return res.status(404).json({ message: 'Failure tracking not found' });
    }
    
    res.json(failure);
  }));

  router.patch('/failures/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const data = req.body;
      const failure = await storage.updateFailureTracking(id, data);
      
      if (!failure) {
        return res.status(404).json({ message: 'Failure tracking not found' });
      }
      
      // Broadcast update to WebSocket clients
      broadcastUpdate('failure', id, failure);
      
      res.json(failure);
    } catch (error) {
      res.status(400).json({ message: 'Validation error', errors: error.message });
    }
  }));

  // Comment routes
  router.post('/comments', asyncHandler(async (req, res) => {
    try {
      const data = req.body;
      const comment = await storage.createComment({
        ...data,
        authorId: req.user?.id || 'anonymous'
      });
      res.status(201).json(comment);
      
      // Broadcast update to WebSocket clients
      if (data.testCaseId) {
        broadcastUpdate('test-case-comments', data.testCaseId, { added: comment });
      }
    } catch (error) {
      res.status(400).json({ message: 'Validation error', errors: error.message });
    }
  }));

  router.get('/test-cases/:testCaseId/comments', asyncHandler(async (req, res) => {
    const testCaseId = parseInt(req.params.testCaseId);
    const comments = await storage.getCommentsByTestCase(testCaseId);
    res.json(comments);
  }));

  router.get('/comments/:commentId/replies', asyncHandler(async (req, res) => {
    const commentId = parseInt(req.params.commentId);
    const replies = await storage.getCommentReplies(commentId);
    res.json(replies);
  }));

  router.patch('/comments/:commentId', asyncHandler(async (req, res) => {
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

  router.delete('/comments/:commentId', asyncHandler(async (req, res) => {
    const commentId = parseInt(req.params.commentId);
    const comment = await storage.getComment(commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is the author
    if (comment.authorId !== req.user?.id && req.user?.role !== 'admin') {
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
  app.use((err, _req, res, _next) => {
    console.error(err.stack);
    
    res.status(err.status || 500).json({
      message: err.message || 'Something went wrong',
      errors: err.errors || undefined
    });
  });

  return httpServer;
}