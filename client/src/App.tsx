import React from 'react';
import { Route, Switch, useLocation, Redirect } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/not-found';

// Layout components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Hooks
import { useAuth, useUserPreferences } from './hooks/useAuth';

// Authenticated route wrapper
function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login
    setLocation('/login');
    return null;
  }

  return <Component {...rest} />;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const { defaultDashboard } = useUserPreferences();
  const [location] = useLocation();

  // Determine the default dashboard based on user preferences
  const getDashboardPath = () => {
    if (defaultDashboard === 'manual') {
      return '/dashboard/manual';
    } else {
      return '/dashboard/automated';
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        {/* Public Routes */}
        <Route path="/login">
          {isAuthenticated ? <Redirect to={getDashboardPath()} /> : <Login />}
        </Route>

        {/* Protected Routes */}
        <Route path="/">
          {!isLoading && !isAuthenticated ? <Redirect to="/login" /> : (
            <AppLayout>
              <Switch>
                <Route path="/" exact>
                  <Redirect to={getDashboardPath()} />
                </Route>
                
                {/* Dashboard Routes */}
                <Route path="/dashboard/manual" component={() => <Dashboard type="manual" />} />
                <Route path="/dashboard/automated" component={() => <Dashboard type="automated" />} />
                
                {/* Test Management Routes */}
                <Route path="/test-cases">
                  <ProtectedRoute component={() => <div>Test Cases Page</div>} />
                </Route>
                <Route path="/test-suites">
                  <ProtectedRoute component={() => <div>Test Suites Page</div>} />
                </Route>
                <Route path="/test-plans">
                  <ProtectedRoute component={() => <div>Test Plans Page</div>} />
                </Route>
                
                {/* Test Execution Routes */}
                <Route path="/test-runs">
                  <ProtectedRoute component={() => <div>Test Runs Page</div>} />
                </Route>
                <Route path="/manual-execution">
                  <ProtectedRoute component={() => <div>Manual Test Execution Page</div>} />
                </Route>
                <Route path="/automated-results">
                  <ProtectedRoute component={() => <div>Automated Test Results Page</div>} />
                </Route>
                
                {/* Analysis Routes */}
                <Route path="/failures">
                  <ProtectedRoute component={() => <div>Failure Tracking Page</div>} />
                </Route>
                <Route path="/reports">
                  <ProtectedRoute component={() => <div>Reports Page</div>} />
                </Route>
                <Route path="/metrics">
                  <ProtectedRoute component={() => <div>Metrics Page</div>} />
                </Route>
                
                {/* Settings Routes */}
                <Route path="/settings">
                  <ProtectedRoute component={() => <div>Settings Page</div>} />
                </Route>
                <Route path="/profile">
                  <ProtectedRoute component={() => <div>User Profile Page</div>} />
                </Route>
                
                {/* Not Found Route */}
                <Route component={NotFound} />
              </Switch>
            </AppLayout>
          )}
        </Route>
      </Switch>
    </QueryClientProvider>
  );
}

export default App;