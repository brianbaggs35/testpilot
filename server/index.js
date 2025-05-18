import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { testDatabaseConnection, initializeDatabase, fetchTestCases, fetchTestRuns, fetchUserByUsername } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Create an HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

// Set up WebSocket handlers
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  ws.on('message', (message) => {
    console.log('Received message:', message);
    // Echo the message back
    ws.send(`Echo: ${message}`);
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Middleware for JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve API endpoints
app.get('/api/test-cases', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const testCases = await fetchTestCases(limit);
    res.json(testCases);
  } catch (error) {
    console.error('Error fetching test cases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/test-runs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const testRuns = await fetchTestRuns(limit);
    res.json(testRuns);
  } catch (error) {
    console.error('Error fetching test runs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve main dashboard page
app.get('/', async (req, res) => {
  // Get real data from the database
  let testCases = [];
  let testRuns = [];
  let dbConnected = false;
  
  try {
    dbConnected = await testDatabaseConnection();
    if (dbConnected) {
      testCases = await fetchTestCases(5);
      testRuns = await fetchTestRuns(5);
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TestPilot - QA Platform</title>
      <style>
        :root {
          --primary-color: #2563eb;
          --primary-dark: #1e40af;
          --secondary-color: #10b981;
          --accent-color: #6366f1;
          --warning-color: #f59e0b;
          --danger-color: #ef4444;
          --success-color: #10b981;
          --neutral-50: #f9fafb;
          --neutral-100: #f3f4f6;
          --neutral-200: #e5e7eb;
          --neutral-300: #d1d5db;
          --neutral-400: #9ca3af;
          --neutral-500: #6b7280;
          --neutral-600: #4b5563;
          --neutral-700: #374151;
          --neutral-800: #1f2937;
          --neutral-900: #111827;
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: var(--neutral-800);
          background-color: var(--neutral-100);
        }
        
        .layout {
          display: grid;
          grid-template-columns: 250px 1fr;
          grid-template-rows: 60px 1fr;
          grid-template-areas:
            "header header"
            "sidebar main";
          height: 100vh;
        }
        
        header {
          grid-area: header;
          background-color: white;
          border-bottom: 1px solid var(--neutral-200);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          z-index: 10;
        }
        
        .logo {
          display: flex;
          align-items: center;
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--primary-color);
        }
        
        .logo svg {
          margin-right: 0.5rem;
        }
        
        .user-menu {
          display: flex;
          align-items: center;
        }
        
        .user-menu .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: var(--primary-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-left: 1rem;
        }
        
        .sidebar {
          grid-area: sidebar;
          background-color: white;
          border-right: 1px solid var(--neutral-200);
          padding: 1.5rem 0;
          overflow-y: auto;
        }
        
        .sidebar-section {
          margin-bottom: 1.5rem;
          padding: 0 1.5rem;
        }
        
        .sidebar-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--neutral-500);
          margin-bottom: 0.75rem;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          padding: 0.5rem 1.5rem;
          color: var(--neutral-600);
          text-decoration: none;
          border-left: 3px solid transparent;
          transition: all 0.2s;
        }
        
        .nav-item:hover {
          background-color: var(--neutral-100);
          color: var(--primary-color);
        }
        
        .nav-item.active {
          background-color: var(--primary-color);
          color: white;
          border-left-color: var(--primary-dark);
        }
        
        .nav-item svg {
          margin-right: 0.75rem;
        }
        
        main {
          grid-area: main;
          padding: 1.5rem;
          overflow-y: auto;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--neutral-900);
        }
        
        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 1rem;
          font-weight: 500;
          border-radius: 0.375rem;
          background-color: var(--primary-color);
          color: white;
          cursor: pointer;
          border: none;
          transition: background-color 0.2s;
          text-decoration: none;
        }
        
        .button svg {
          margin-right: 0.5rem;
        }
        
        .button:hover {
          background-color: var(--primary-dark);
        }
        
        .button.secondary {
          background-color: white;
          color: var(--neutral-700);
          border: 1px solid var(--neutral-300);
        }
        
        .button.secondary:hover {
          background-color: var(--neutral-100);
        }
        
        .button.success {
          background-color: var(--success-color);
        }
        
        .button.warning {
          background-color: var(--warning-color);
        }
        
        .button.danger {
          background-color: var(--danger-color);
        }
        
        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .stat-card {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: var(--neutral-500);
          margin-bottom: 0.5rem;
        }
        
        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--neutral-900);
        }
        
        .stat-secondary {
          font-size: 0.875rem;
          color: var(--neutral-500);
          margin-top: 0.25rem;
        }
        
        .chart-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .chart-card {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .chart-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--neutral-800);
          margin-bottom: 1rem;
        }
        
        .table-section {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          margin-bottom: 1.5rem;
        }
        
        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .table-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--neutral-800);
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th {
          text-align: left;
          padding: 0.75rem 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--neutral-500);
          border-bottom: 1px solid var(--neutral-200);
        }
        
        td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--neutral-200);
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          border-radius: 9999px;
        }
        
        .status-pass {
          background-color: rgba(16, 185, 129, 0.1);
          color: var(--success-color);
        }
        
        .status-fail {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--danger-color);
        }
        
        .status-pending {
          background-color: rgba(245, 158, 11, 0.1);
          color: var(--warning-color);
        }
        
        .status-todo {
          background-color: rgba(107, 114, 128, 0.1);
          color: var(--neutral-500);
        }
        
        .status-blocked {
          background-color: rgba(99, 102, 241, 0.1);
          color: var(--accent-color);
        }
        
        .table-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
          font-size: 0.875rem;
          color: var(--neutral-500);
        }
        
        .pagination {
          display: flex;
          align-items: center;
        }
        
        .pagination-item {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 0.375rem;
          margin: 0 0.25rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .pagination-item:hover {
          background-color: var(--neutral-100);
        }
        
        .pagination-item.active {
          background-color: var(--primary-color);
          color: white;
        }
        
        .donut-chart {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: conic-gradient(
            var(--success-color) 0% ${testRuns[0]?.passed_tests / testRuns[0]?.total_tests * 100 || 87.5}%,
            var(--danger-color) ${testRuns[0]?.passed_tests / testRuns[0]?.total_tests * 100 || 87.5}% ${(testRuns[0]?.passed_tests + testRuns[0]?.failed_tests) / testRuns[0]?.total_tests * 100 || 95.8}%,
            var(--neutral-400) ${(testRuns[0]?.passed_tests + testRuns[0]?.failed_tests) / testRuns[0]?.total_tests * 100 || 95.8}% 100%
          );
          position: relative;
          margin: 1rem auto;
        }
        
        .donut-chart::before {
          content: "";
          width: 100px;
          height: 100px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 25px;
          left: 25px;
        }
        
        .donut-chart::after {
          content: "${testRuns[0]?.passed_tests || 105}/${testRuns[0]?.total_tests || 120}";
          position: absolute;
          top: 0;
          left: 0;
          width: 150px;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.25rem;
        }
        
        .chart-legend {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 1rem;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          margin: 0 0.75rem 0.5rem;
          font-size: 0.875rem;
        }
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 0.5rem;
        }
        
        .legend-passed {
          background-color: var(--success-color);
        }
        
        .legend-failed {
          background-color: var(--danger-color);
        }
        
        .legend-skipped {
          background-color: var(--neutral-400);
        }
        
        .test-progress {
          background-color: var(--neutral-200);
          height: 20px;
          border-radius: 10px;
          overflow: hidden;
          margin: 1rem 0;
        }
        
        .progress-bar {
          height: 100%;
          display: flex;
          align-items: center;
          transition: width 0.3s ease;
        }
        
        .progress-passed {
          background-color: var(--success-color);
          width: ${testRuns[0]?.passed_tests / testRuns[0]?.total_tests * 100 || 87.5}%;
        }
        
        .progress-failed {
          background-color: var(--danger-color);
          width: ${testRuns[0]?.failed_tests / testRuns[0]?.total_tests * 100 || 8.3}%;
        }
        
        .progress-skipped {
          background-color: var(--neutral-400);
          width: ${testRuns[0]?.skipped_tests / testRuns[0]?.total_tests * 100 || 4.2}%;
        }
        
        .notifications {
          position: relative;
        }
        
        .notifications-count {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background-color: var(--danger-color);
          color: white;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .connection-status {
          background-color: ${dbConnected ? 'var(--success-color)' : 'var(--danger-color)'};
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          display: inline-block;
          margin-left: 1rem;
          font-size: 0.75rem;
        }
        
        .websocket-panel {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          margin-top: 1.5rem;
        }
        
        .websocket-messages {
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid var(--neutral-200);
          padding: 0.75rem;
          border-radius: 0.375rem;
          margin: 0.75rem 0;
          background-color: var(--neutral-50);
        }
        
        .message {
          font-family: monospace;
          margin-bottom: 0.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--neutral-200);
        }
        
        .message:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        
        .message-time {
          color: var(--neutral-500);
          font-size: 0.75rem;
        }
        
        .input-group {
          display: flex;
          margin-top: 1rem;
        }
        
        .input-group input {
          flex: 1;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--neutral-300);
          border-radius: 0.375rem 0 0 0.375rem;
          font-size: 0.875rem;
        }
        
        .input-group button {
          padding: 0.5rem 1rem;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 0 0.375rem 0.375rem 0;
          font-weight: 500;
          cursor: pointer;
        }
        
        .input-group button:hover {
          background-color: var(--primary-dark);
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .layout {
            grid-template-columns: 1fr;
            grid-template-rows: 60px auto 1fr;
            grid-template-areas:
              "header"
              "sidebar"
              "main";
          }
          
          .sidebar {
            display: none;
          }
          
          .chart-section {
            grid-template-columns: 1fr;
          }
        }
        
        .mobile-menu-toggle {
          display: none;
        }
        
        @media (max-width: 768px) {
          .mobile-menu-toggle {
            display: block;
            margin-right: 1rem;
          }
          
          .sidebar.active {
            display: block;
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 20;
          }
        }
      </style>
    </head>
    <body>
      <div class="layout">
        <header>
          <div class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5L18 6Z"></path>
              <path d="M12 13v9"></path>
              <path d="M12 2v4"></path>
            </svg>
            TestPilot
            <span class="connection-status">
              ${dbConnected ? 'Connected to DB' : 'DB Not Connected'}
            </span>
          </div>
          
          <div class="user-menu">
            <div class="notifications">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
              </svg>
              <span class="notifications-count">3</span>
            </div>
            <div class="avatar">
              A
            </div>
          </div>
        </header>
        
        <aside class="sidebar">
          <div class="sidebar-section">
            <div class="sidebar-title">Main Menu</div>
            <a href="#" class="nav-item active">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                <line x1="3" x2="21" y1="9" y2="9"></line>
                <line x1="9" x2="9" y1="21" y2="9"></line>
              </svg>
              Dashboard
            </a>
            <a href="#" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m15 7-5 5 5 5"></path>
              </svg>
              Automated Tests
            </a>
            <a href="#" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
              </svg>
              Manual Tests
            </a>
            <a href="#" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              Test Suites
            </a>
            <a href="#" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 7 3 5l2-2"></path>
                <path d="M9 5h1a6 6 0 0 1 0 12h-1"></path>
                <path d="M14 5h1a6 6 0 0 1 0 12h-1"></path>
                <path d="M5 19l-2 2 2 2"></path>
              </svg>
              Test Plans
            </a>
          </div>
          
          <div class="sidebar-section">
            <div class="sidebar-title">Defect Tracking</div>
            <a href="#" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <path d="M9 14v1"></path>
                <path d="M9 19v2"></path>
                <path d="M9 3v2"></path>
                <path d="M9 9v1"></path>
                <path d="M15 14v1"></path>
                <path d="M15 19v2"></path>
                <path d="M15 3v2"></path>
                <path d="M15 9v1"></path>
              </svg>
              Kanban Board
            </a>
            <a href="#" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <path d="M12 9v4"></path>
                <path d="M12 17h.01"></path>
              </svg>
              Failed Tests
            </a>
          </div>
          
          <div class="sidebar-section">
            <div class="sidebar-title">Reporting</div>
            <a href="#" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 22h14"></path>
                <path d="M5 2h14"></path>
                <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path>
                <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path>
              </svg>
              Test Reports
            </a>
            <a href="#" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="8" height="14" x="8" y="6" rx="2"></rect>
                <path d="m19 8-5-2-1 1"></path>
                <path d="M5 8a2 2 0 0 1 3.917.422L5 16"></path>
              </svg>
              PDF Generator
            </a>
          </div>
          
          <div class="sidebar-section">
            <div class="sidebar-title">Settings</div>
            <a href="#" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M16 13H8"></path>
                <path d="M16 17H8"></path>
                <path d="M10 9H8"></path>
              </svg>
              User Management
            </a>
            <a href="#" class="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              System Settings
            </a>
          </div>
        </aside>
        
        <main>
          <div class="page-header">
            <h1 class="page-title">Dashboard</h1>
            <div>
              <button class="button secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" x2="12" y1="8" y2="16"></line>
                  <line x1="8" x2="16" y1="12" y2="12"></line>
                </svg>
                Import Results
              </button>
              <button class="button">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 12H3"></path>
                  <path d="M16 6H3"></path>
                  <path d="M16 18H3"></path>
                  <path d="M18 9v6"></path>
                  <path d="M21 12h-6"></path>
                </svg>
                New Test Run
              </button>
            </div>
          </div>
          
          <div class="dashboard-stats">
            <div class="stat-card">
              <div class="stat-label">Total Test Cases</div>
              <div class="stat-value">${testCases.length || 5}</div>
              <div class="stat-secondary">+2 added this week</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Test Runs</div>
              <div class="stat-value">${testRuns.length || 1}</div>
              <div class="stat-secondary">Last run: ${testRuns[0]?.created_at ? new Date(testRuns[0].created_at).toLocaleString() : new Date().toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Pass Rate</div>
              <div class="stat-value">${testRuns[0]?.passed_tests ? ((testRuns[0].passed_tests / testRuns[0].total_tests) * 100).toFixed(1) : 87.5}%</div>
              <div class="stat-secondary">+2.1% from last run</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Pending Failures</div>
              <div class="stat-value">${testRuns[0]?.failed_tests || 10}</div>
              <div class="stat-secondary">3 high priority</div>
            </div>
          </div>
          
          <div class="chart-section">
            <div class="chart-card">
              <div class="chart-title">Latest Test Run Results</div>
              <div class="donut-chart"></div>
              <div class="chart-legend">
                <div class="legend-item">
                  <div class="legend-color legend-passed"></div>
                  <div>Passed (${testRuns[0]?.passed_tests || 105})</div>
                </div>
                <div class="legend-item">
                  <div class="legend-color legend-failed"></div>
                  <div>Failed (${testRuns[0]?.failed_tests || 10})</div>
                </div>
                <div class="legend-item">
                  <div class="legend-color legend-skipped"></div>
                  <div>Skipped (${testRuns[0]?.skipped_tests || 5})</div>
                </div>
              </div>
            </div>
            
            <div class="chart-card">
              <div class="chart-title">Test Progress</div>
              <div>
                <div class="test-progress">
                  <div class="progress-bar progress-passed"></div>
                </div>
                <div class="test-progress">
                  <div class="progress-bar progress-failed"></div>
                </div>
                <div class="test-progress">
                  <div class="progress-bar progress-skipped"></div>
                </div>
              </div>
              <div class="chart-legend">
                <div class="legend-item">
                  <div class="legend-color legend-passed"></div>
                  <div>Passed (${testRuns[0]?.passed_tests ? ((testRuns[0].passed_tests / testRuns[0].total_tests) * 100).toFixed(1) : 87.5}%)</div>
                </div>
                <div class="legend-item">
                  <div class="legend-color legend-failed"></div>
                  <div>Failed (${testRuns[0]?.failed_tests ? ((testRuns[0].failed_tests / testRuns[0].total_tests) * 100).toFixed(1) : 8.3}%)</div>
                </div>
                <div class="legend-item">
                  <div class="legend-color legend-skipped"></div>
                  <div>Skipped (${testRuns[0]?.skipped_tests ? ((testRuns[0].skipped_tests / testRuns[0].total_tests) * 100).toFixed(1) : 4.2}%)</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="table-section">
            <div class="table-header">
              <div class="table-title">Recent Test Cases</div>
              <a href="#" class="button secondary">View All</a>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                ${testCases.map(tc => `
                  <tr>
                    <td>${tc.id}</td>
                    <td>${tc.title}</td>
                    <td>${tc.type}</td>
                    <td>${tc.priority || 'Medium'}</td>
                    <td>
                      <span class="status-badge ${tc.status === 'active' ? 'status-pass' : 'status-todo'}">
                        ${tc.status || 'Active'}
                      </span>
                    </td>
                    <td>${new Date(tc.created_at).toLocaleDateString()}</td>
                  </tr>
                `).join('') || `
                  <tr>
                    <td>1</td>
                    <td>Login functionality</td>
                    <td>Manual</td>
                    <td>High</td>
                    <td><span class="status-badge status-pass">Active</span></td>
                    <td>${new Date().toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>User registration</td>
                    <td>Manual</td>
                    <td>High</td>
                    <td><span class="status-badge status-pass">Active</span></td>
                    <td>${new Date().toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td>Password reset</td>
                    <td>Manual</td>
                    <td>Medium</td>
                    <td><span class="status-badge status-pass">Active</span></td>
                    <td>${new Date().toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td>4</td>
                    <td>Search functionality</td>
                    <td>Manual</td>
                    <td>Medium</td>
                    <td><span class="status-badge status-pass">Active</span></td>
                    <td>${new Date().toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td>5</td>
                    <td>API Authentication</td>
                    <td>Automated</td>
                    <td>High</td>
                    <td><span class="status-badge status-pass">Active</span></td>
                    <td>${new Date().toLocaleDateString()}</td>
                  </tr>
                `}
              </tbody>
            </table>
            <div class="table-footer">
              <div>Showing 1-${testCases.length || 5} of ${testCases.length || 5} test cases</div>
              <div class="pagination">
                <div class="pagination-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                </div>
                <div class="pagination-item active">1</div>
                <div class="pagination-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m9 18 6-6-6-6"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div class="websocket-panel">
            <div class="chart-title">Real-time Updates</div>
            <div>Test the WebSocket connection for real-time notifications and updates:</div>
            <div class="websocket-messages" id="messages">
              <div class="message">
                <span class="message-time">[${new Date().toLocaleTimeString()}]</span> Connected to WebSocket server
              </div>
            </div>
            <div class="input-group">
              <input type="text" id="message-input" placeholder="Type a message...">
              <button id="send-button">Send</button>
            </div>
          </div>
        </main>
      </div>
      
      <script>
        // WebSocket connection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = \`\${protocol}//\${window.location.host}/ws\`;
        let socket;
        
        function connectWebSocket() {
          socket = new WebSocket(wsUrl);
          
          socket.onopen = function() {
            console.log('WebSocket connected');
            addMessage('Connected to WebSocket server');
          };
          
          socket.onmessage = function(event) {
            console.log('Message received:', event.data);
            addMessage(\`Received: \${event.data}\`);
          };
          
          socket.onclose = function() {
            console.log('WebSocket disconnected');
            addMessage('Disconnected from WebSocket server');
            // Try to reconnect after a delay
            setTimeout(connectWebSocket, 3000);
          };
          
          socket.onerror = function(error) {
            console.error('WebSocket error:', error);
            addMessage('WebSocket connection error');
          };
        }
        
        function addMessage(text) {
          const messages = document.getElementById('messages');
          const message = document.createElement('div');
          message.className = 'message';
          
          const time = document.createElement('span');
          time.className = 'message-time';
          time.textContent = \`[\${new Date().toLocaleTimeString()}]\`;
          
          message.appendChild(time);
          message.appendChild(document.createTextNode(' ' + text));
          
          messages.appendChild(message);
          messages.scrollTop = messages.scrollHeight;
        }
        
        // Connect when the page loads
        window.addEventListener('load', connectWebSocket);
        
        // Send message button
        document.getElementById('send-button').addEventListener('click', function() {
          const input = document.getElementById('message-input');
          const message = input.value.trim();
          
          if (message && socket && socket.readyState === WebSocket.OPEN) {
            socket.send(message);
            addMessage(\`Sent: \${message}\`);
            input.value = '';
          } else if (!socket || socket.readyState !== WebSocket.OPEN) {
            addMessage('Cannot send message: WebSocket not connected');
          }
        });
        
        // Enter key to send message
        document.getElementById('message-input').addEventListener('keypress', function(event) {
          if (event.key === 'Enter') {
            document.getElementById('send-button').click();
          }
        });
        
        // Mobile menu toggle
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (mobileMenuToggle) {
          mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
          });
        }
      </script>
    </body>
    </html>
  `);
});

// Start the server
async function startServer() {
  try {
    // First, initialize the database
    await initializeDatabase();
    
    // Then start the server
    server.listen(port, '0.0.0.0', () => {
      console.log(`TestPilot QA Platform running at http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();