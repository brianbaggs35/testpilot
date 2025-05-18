import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { 
  BarChart3, 
  PieChart, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Calendar, 
  ListChecks,
  LayoutDashboard,
  Workflow,
  FileCode2,
  Settings,
  Loader2
} from 'lucide-react';
import { useAuth, useUserPreferences } from '../hooks/useAuth';

interface DashboardProps {
  type?: 'manual' | 'automated';
}

const Dashboard: React.FC<DashboardProps> = ({ type = 'manual' }) => {
  const { user } = useAuth();
  const { defaultDashboard } = useUserPreferences();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<any[]>([]);
  const [failuresByType, setFailuresByType] = useState<any[]>([]);
  const [testPassingTrend, setTestPassingTrend] = useState<any[]>([]);

  // Load dashboard data based on type
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call to get dashboard data
    setTimeout(() => {
      if (type === 'manual') {
        setStats([
          { name: 'Manual Test Cases', value: '854', change: '+5.3%', trend: 'up' },
          { name: 'Test Suites', value: '42', change: '+12.5%', trend: 'up' },
          { name: 'Execution Pass Rate', value: '84%', change: '-2.1%', trend: 'down' },
          { name: 'Avg Execution Time', value: '9.2m', change: '-1.8%', trend: 'up' },
        ]);
        
        setRecentRuns([
          { id: 1, name: 'User Login Flow', date: '3 hours ago', status: 'passed', results: '19/22 passed' },
          { id: 2, name: 'Registration Form', date: '6 hours ago', status: 'failed', results: '12/15 passed' },
          { id: 3, name: 'Checkout Process', date: 'Yesterday', status: 'passed', results: '27/27 passed' },
          { id: 4, name: 'Profile Settings', date: '2 days ago', status: 'failed', results: '14/18 passed' },
        ]);
        
        setUpcomingTests([
          { id: 1, name: 'Mobile App Flow', due: 'Tomorrow', status: 'scheduled', assignee: 'Maria S.' },
          { id: 2, name: 'User Management', due: 'In 2 days', status: 'draft', assignee: 'John D.' },
          { id: 3, name: 'Dashboard Features', due: 'In 3 days', status: 'scheduled', assignee: 'Alex K.' },
        ]);
      } else {
        setStats([
          { name: 'Automated Test Cases', value: '389', change: '+28.1%', trend: 'up' },
          { name: 'Latest Build Status', value: 'Passed', change: '+0', trend: 'up' },
          { name: 'Success Rate', value: '92%', change: '+4.3%', trend: 'up' },
          { name: 'Test Duration', value: '4.5m', change: '-12%', trend: 'up' },
        ]);
        
        setRecentRuns([
          { id: 1, name: 'API Integration Suite', date: '2 hours ago', status: 'passed', results: '42/45 passed' },
          { id: 2, name: 'Authentication Tests', date: '12 hours ago', status: 'passed', results: '18/18 passed' },
          { id: 3, name: 'Payment Processing', date: '1 day ago', status: 'passed', results: '31/31 passed' },
          { id: 4, name: 'Admin Dashboard API', date: '2 days ago', status: 'failed', results: '27/34 passed' },
        ]);
        
        setFailuresByType([
          { name: 'Network Timeout', value: 12 },
          { name: 'Assertion Error', value: 8 },
          { name: 'Exception', value: 6 },
          { name: 'Setup Failure', value: 3 },
        ]);
        
        setTestPassingTrend([
          { date: '7 days ago', value: 89 },
          { date: '6 days ago', value: 91 },
          { date: '5 days ago', value: 87 },
          { date: '4 days ago', value: 90 },
          { date: '3 days ago', value: 92 },
          { date: '2 days ago', value: 93 },
          { date: 'Yesterday', value: 94 },
        ]);
      }
      
      setIsLoading(false);
    }, 1000);
  }, [type]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'blocked':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {type === 'manual' ? 'Manual Testing Dashboard' : 'Automated Testing Dashboard'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Overview of your {type === 'manual' ? 'manual' : 'automated'} testing activities
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href={type === 'manual' ? '/dashboard/automated' : '/dashboard/manual'}>
            <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <LayoutDashboard className="h-4 w-4 mr-2 text-gray-500" />
              Switch to {type === 'manual' ? 'Automated' : 'Manual'} Dashboard
            </button>
          </Link>
          <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="truncate">
                  <p className="text-sm font-medium text-gray-500 truncate">{stat.name}</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-50 text-blue-600">
                  {stat.name.includes('Pass') || stat.name.includes('Success') ? 
                    <PieChart className="h-6 w-6" /> : 
                    stat.name.includes('Duration') || stat.name.includes('Time') ?
                    <Clock className="h-6 w-6" /> :
                    <BarChart3 className="h-6 w-6" />
                  }
                </div>
              </div>
              {stat.change !== '+0' && (
                <div className="mt-4 flex items-center">
                  {getTrendIcon(stat.trend)}
                  <span className={`text-sm ml-2 ${
                    (stat.trend === 'up' && !stat.name.includes('Time') && !stat.name.includes('Duration')) || 
                    (stat.trend === 'down' && (stat.name.includes('Time') || stat.name.includes('Duration'))) 
                      ? 'text-green-500' 
                      : 'text-red-500'}`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">from last month</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Recent test runs */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Test Runs</h2>
            <Link href="/test-runs">
              <a className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Link>
          </div>
          <div className="px-5 py-3">
            <ul className="divide-y divide-gray-200">
              {recentRuns.map((run) => (
                <li key={run.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${run.status === 'passed' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {run.status === 'passed' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{run.name}</p>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 text-gray-500 mr-1" />
                          <p className="text-xs text-gray-500">{run.date}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
                        {run.status}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">{run.results}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Conditional content based on dashboard type */}
        {type === 'manual' ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Upcoming Tests</h2>
              <Link href="/test-plans">
                <a className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center">
                  View all plans
                  <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Link>
            </div>
            <div className="px-5 py-3">
              <ul className="divide-y divide-gray-200">
                {upcomingTests.map((test) => (
                  <li key={test.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <ListChecks className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{test.name}</p>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 text-gray-500 mr-1" />
                            <p className="text-xs text-gray-500">{test.due}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                          {test.status}
                        </span>
                        <span className="ml-2 text-sm text-gray-600">{test.assignee}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Failure Analysis</h2>
              <Link href="/failures">
                <a className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center">
                  View kanban board
                  <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Link>
            </div>
            <div className="px-5 py-3">
              <ul className="divide-y divide-gray-200">
                {failuresByType.map((failure, index) => (
                  <li key={index} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{failure.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{failure.value}</span>
                        <span className="ml-1 text-sm text-gray-500">instances</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Additional charts for automated testing */}
      {type === 'automated' && (
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Pass Rate Trend (Last 7 Days)</h2>
          </div>
          <div className="p-5 h-64 flex items-center justify-center">
            <p className="text-gray-500">Chart showing pass rate trend would display here</p>
            {/* In a real implementation, we would render a Chart.js chart here */}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-6 bg-white shadow rounded-lg">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <button className="p-4 border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex flex-col items-center">
              <ListChecks className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-gray-900">Create Test Case</span>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex flex-col items-center">
              <Workflow className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-gray-900">Start Test Run</span>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex flex-col items-center">
              <FileCode2 className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-gray-900">Generate Report</span>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex flex-col items-center">
              <Settings className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-gray-900">Edit Preferences</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;