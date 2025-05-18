import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

// Pages
import Dashboard from './pages/Dashboard';
import NotFound from './pages/not-found';

// Layout components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Authenticated route wrapper
function ProtectedRoute({ component: Component, ...rest }: any) {
  // In a real implementation, this would check for authentication state
  // and redirect to login if the user is not authenticated
  const isAuthenticated = true; // For demo purposes

  if (!isAuthenticated) {
    // Redirect to login
    window.location.href = '/api/login';
    return null;
  }

  return <Component {...rest} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-4">
            <Switch>
              <Route path="/" component={Dashboard} />
              
              {/* Test Management Routes */}
              <Route path="/test-cases" component={() => <div>Test Cases Page</div>} />
              <Route path="/test-suites" component={() => <div>Test Suites Page</div>} />
              <Route path="/test-plans" component={() => <div>Test Plans Page</div>} />
              
              {/* Test Execution Routes */}
              <Route path="/test-runs" component={() => <div>Test Runs Page</div>} />
              <Route path="/manual-execution" component={() => <div>Manual Test Execution Page</div>} />
              <Route path="/automated-results" component={() => <div>Automated Test Results Page</div>} />
              
              {/* Analysis Routes */}
              <Route path="/failures" component={() => <div>Failure Tracking Page</div>} />
              <Route path="/reports" component={() => <div>Reports Page</div>} />
              <Route path="/metrics" component={() => <div>Metrics Page</div>} />
              
              {/* Settings Routes */}
              <Route path="/settings" component={() => <div>Settings Page</div>} />
              <Route path="/profile" component={() => <div>User Profile Page</div>} />
              
              {/* Not Found Route */}
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;