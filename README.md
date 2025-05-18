# TestPilot QA Platform

A comprehensive QA platform with automated and manual testing capabilities, role-based access, PDF reporting, rich test case management, and notification systems.

## Features

- **Dual Testing Support**: Automated and manual testing workflows with integrated dashboards
- **Test Case Management**: Create, organize, and execute test cases with rich text editing
- **Real-time Collaboration**: Comment on test cases and share feedback with team members
- **Kanban Board**: Visual management of test case status and assignments
- **PDF Reporting**: Generate detailed test reports with customizable templates
- **Authentication**: Role-based access control (test managers and test runners)
- **Data Visualization**: Charts and insights for monitoring test progress
- **JUnit XML Support**: Parse and store test results with support for up to 6000 tests per file
- **Failure Analysis**: Track and manage test failures with customizable workflows

## Tech Stack

- **Frontend**: React, TailwindCSS, React Query
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Real-time Updates**: WebSockets
- **UI Components**: Custom components built with TailwindCSS

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- npm or yarn

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=postgresql://username:password@hostname:port/database
SESSION_SECRET=your-random-session-secret
REPLIT_DOMAINS=your-replit-domain.repl.co
REPL_ID=your-repl-id
```

### Database Setup

1. **Create Database Tables**

   Run the Drizzle migration to set up your database schema:

   ```bash
   npm run db:push
   ```

   This will create all the necessary tables in your PostgreSQL database based on the schema defined in `shared/schema.ts`.

### Installation

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Set Up the Frontend**

   Install the frontend dependencies:

   ```bash
   cd client
   npm install
   ```

3. **Development Mode**

   Start the development server:

   ```bash
   npm run dev
   ```

   This will start both the backend Express.js server and the frontend Vite development server.

4. **Production Build**

   To build for production:

   ```bash
   npm run build
   ```

   Then start the production server:

   ```bash
   npm start
   ```

## Project Structure

```
├── client/                   # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/           # Basic UI components
│   │   │   ├── layout/       # Layout components (Navbar, Sidebar)
│   │   │   ├── editor/       # Rich text editor components
│   │   │   ├── kanban/       # Kanban board components
│   │   │   └── comments/     # Comment section components
│   │   ├── pages/            # Page components
│   │   ├── lib/              # Utilities and helpers
│   │   ├── hooks/            # Custom React hooks
│   │   ├── App.tsx           # Main application component
│   │   └── main.tsx          # Application entry point
│   └── index.html            # HTML template
├── server/                   # Backend Express.js application
│   ├── routes/               # API route handlers
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # API route definitions
│   ├── storage.ts            # Database operations
│   ├── db.ts                 # Database connection
│   ├── vite.ts               # Vite integration for development
│   └── replitAuth.ts         # Authentication with Replit
├── shared/                   # Shared code between frontend and backend
│   └── schema.ts             # Database schema definition using Drizzle
└── drizzle.config.ts         # Drizzle ORM configuration
```

## User Guide

### Dashboard

The dashboard provides an overview of your testing activities, including:

- Key metrics (total tests, passing/failing tests, etc.)
- Recent test runs
- Active test plans
- Quick access to reports and features

### Automated Testing

1. **Upload Results**:
   - Upload JUnit XML test results
   - View parsing results and statistics

2. **Test Cases**:
   - View all automated test cases
   - Organize test cases into suites
   - Track test case history

3. **Failure Analysis**:
   - View and manage failing tests using the Kanban board
   - Assign issues to team members
   - Track resolution progress

### Manual Testing

1. **Test Plans**:
   - Create test plans with multiple test cases
   - Assign test cases to team members
   - Track execution progress

2. **Test Execution**:
   - Execute manual test cases
   - Record results and observations
   - Attach screenshots or evidence

3. **Reports**:
   - Generate PDF reports of test results
   - Preview reports before downloading
   - Customize report templates

### Administration

1. **User Management**:
   - Manage user accounts and roles
   - Set permissions for different user groups

2. **Settings**:
   - Configure platform settings
   - Customize notifications and preferences

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

MIT License - See LICENSE file for details.