import React from 'react';
import { Route, Switch } from 'wouter';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import TestCasesDemo from './pages/manual/TestCasesDemo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: any) {
  // In a real implementation, this would check for authentication
  // and redirect to a login page if not authenticated
  return <Component {...rest} />;
}

function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="text-xl text-gray-600 mt-4">Page not found</p>
        <p className="text-gray-500 mt-2">The page you're looking for doesn't exist or has been moved.</p>
        <a href="/" className="mt-6 inline-block px-6 py-2 bg-primary text-white rounded-lg">
          Go back home
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Sidebar />
        <div className="p-4 sm:ml-64 pt-20">
          <Switch>
            <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
            {/* Demo component */}
            <Route path="/demo" component={TestCasesDemo} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;