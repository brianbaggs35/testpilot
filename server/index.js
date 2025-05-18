import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

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

// Test database connection if DATABASE_URL is available
async function testDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set, skipping database connection test');
    return;
  }
  
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      console.log('Database connection successful. Current time:', result.rows[0].now);
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

// Middleware for JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static HTML for now to show progress
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TestPilot QA Platform</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          background-color: #f5f7fa;
          color: #333;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #e0e0e0;
          margin-bottom: 30px;
        }
        h1 {
          color: #2563eb;
          margin: 0;
        }
        .feature-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .feature-item {
          background-color: #f8fafc;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          border-radius: 4px;
        }
        .feature-item h3 {
          margin-top: 0;
          color: #1e40af;
        }
        .status {
          margin-top: 30px;
          padding: 15px;
          background-color: #ecfdf5;
          border-radius: 4px;
        }
        .status h2 {
          margin-top: 0;
          color: #047857;
        }
        .connection-status {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 4px;
          font-weight: bold;
        }
        .connected {
          background-color: #dcfce7;
          color: #166534;
        }
        .disconnected {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        .websocket-test {
          margin-top: 20px;
          padding: 15px;
          background-color: #eff6ff;
          border-radius: 4px;
        }
        button {
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        button:hover {
          background-color: #2563eb;
        }
        #messages {
          margin-top: 10px;
          padding: 10px;
          background-color: #f8fafc;
          border-radius: 4px;
          min-height: 100px;
          max-height: 200px;
          overflow-y: auto;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>TestPilot QA Platform</h1>
          <div>
            <button id="login-btn">Log In</button>
          </div>
        </header>
        
        <div class="feature-list">
          <div class="feature-item">
            <h3>Automated Testing</h3>
            <p>Parse JUnit XML results and visualize test execution with detailed failure analysis.</p>
          </div>
          <div class="feature-item">
            <h3>Manual Testing</h3>
            <p>Create and organize test cases with rich text editor, attachments and collaborative comments.</p>
          </div>
          <div class="feature-item">
            <h3>Kanban Boards</h3>
            <p>Track test failures and bugs with customizable Kanban-style boards.</p>
          </div>
          <div class="feature-item">
            <h3>Test Suites & Plans</h3>
            <p>Organize test cases into hierarchical suites and execution plans.</p>
          </div>
          <div class="feature-item">
            <h3>PDF Reporting</h3>
            <p>Generate customizable PDF reports with preview functionality.</p>
          </div>
          <div class="feature-item">
            <h3>Replit Authentication</h3>
            <p>Secure login with role-based access control using Replit authentication.</p>
          </div>
        </div>
        
        <div class="status">
          <h2>System Status</h2>
          <p>
            Database Connection: 
            <span class="connection-status ${process.env.DATABASE_URL ? 'connected' : 'disconnected'}">
              ${process.env.DATABASE_URL ? 'Connected' : 'Not Connected'}
            </span>
          </p>
        </div>
        
        <div class="websocket-test">
          <h2>WebSocket Test</h2>
          <p>Send a message to test the WebSocket connection:</p>
          <div>
            <input type="text" id="message-input" placeholder="Type a message">
            <button id="send-btn">Send</button>
          </div>
          <div id="messages">
            <p>WebSocket messages will appear here...</p>
          </div>
        </div>
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
            document.getElementById('messages').innerHTML += '<p><strong>Status:</strong> Connected to WebSocket server</p>';
          };
          
          socket.onmessage = function(event) {
            console.log('Message received:', event.data);
            document.getElementById('messages').innerHTML += \`<p><strong>Received:</strong> \${event.data}</p>\`;
          };
          
          socket.onclose = function() {
            console.log('WebSocket disconnected');
            document.getElementById('messages').innerHTML += '<p><strong>Status:</strong> Disconnected from WebSocket server</p>';
            // Try to reconnect after a delay
            setTimeout(connectWebSocket, 3000);
          };
          
          socket.onerror = function(error) {
            console.error('WebSocket error:', error);
            document.getElementById('messages').innerHTML += '<p><strong>Error:</strong> WebSocket connection error</p>';
          };
        }
        
        // Connect when the page loads
        window.addEventListener('load', connectWebSocket);
        
        // Send message button
        document.getElementById('send-btn').addEventListener('click', function() {
          const message = document.getElementById('message-input').value;
          if (message && socket && socket.readyState === WebSocket.OPEN) {
            socket.send(message);
            document.getElementById('messages').innerHTML += \`<p><strong>Sent:</strong> \${message}</p>\`;
            document.getElementById('message-input').value = '';
          } else {
            document.getElementById('messages').innerHTML += '<p><strong>Error:</strong> WebSocket not connected</p>';
          }
        });
        
        // Login button
        document.getElementById('login-btn').addEventListener('click', function() {
          window.location.href = '/api/login';
        });
      </script>
    </body>
    </html>
  `);
});

// Path for API routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start the server
server.listen(port, '0.0.0.0', async () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
  await testDatabaseConnection();
});