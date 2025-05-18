import React from 'react';
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
  ListChecks 
} from 'lucide-react';

const Dashboard = () => {
  // Sample data for the dashboard
  const stats = [
    { name: 'Total Test Cases', value: '1,243', change: '+12.5%', trend: 'up' },
    { name: 'Manual Tests', value: '854', change: '+5.3%', trend: 'up' },
    { name: 'Automated Tests', value: '389', change: '+28.1%', trend: 'up' },
    { name: 'Overall Pass Rate', value: '86%', change: '-2.4%', trend: 'down' },
  ];

  const recentRuns = [
    { id: 1, name: 'API Integration Suite', date: '2 hours ago', status: 'passed', results: '42/45 passed' },
    { id: 2, name: 'User Login Flow', date: 'Yesterday', status: 'failed', results: '18/22 passed' },
    { id: 3, name: 'Payment Processing', date: '2 days ago', status: 'passed', results: '31/31 passed' },
    { id: 4, name: 'Admin Dashboard', date: '3 days ago', status: 'failed', results: '27/34 passed' },
  ];

  const upcomingTests = [
    { id: 1, name: 'Mobile App Regression', due: 'Tomorrow', status: 'scheduled', assignee: 'Maria S.' },
    { id: 2, name: 'E-commerce Checkout', due: 'In 2 days', status: 'draft', assignee: 'John D.' },
    { id: 3, name: 'Database Migration', due: 'In 3 days', status: 'scheduled', assignee: 'Alex K.' },
  ];

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

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-2">
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
                  {stat.name.includes('Pass') ? <PieChart className="h-6 w-6" /> : <BarChart3 className="h-6 w-6" />}
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {getTrendIcon(stat.trend)}
                <span className={`text-sm ml-2 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">from last month</span>
              </div>
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

        {/* Upcoming tests */}
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
      </div>
    </div>
  );
};

export default Dashboard;