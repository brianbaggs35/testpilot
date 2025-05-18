// Simple script to start the server in a controlled manner
import { spawn } from 'child_process';
import readline from 'readline';

console.log('Starting TestPilot QA Platform...');

// Start the server process
const server = spawn('node', ['server/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe', 'ipc']
});

// Handle server output
server.stdout.on('data', (data) => {
  console.log(`${data}`);
});

server.stderr.on('data', (data) => {
  console.error(`${data}`);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\nServer is running. Press CTRL+C to stop.');

// Keep the process alive to maintain the server
process.on('SIGINT', () => {
  console.log('Stopping server...');
  server.kill();
  rl.close();
  process.exit(0);
});