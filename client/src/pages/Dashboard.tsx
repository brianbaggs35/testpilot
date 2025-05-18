import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { BarChart, PieChart, Calendar, CheckCircle, XCircle, Circle, Clock, Users } from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';

const DashboardCard = ({ title, value, icon, trend, trendValue, link }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  link?: string;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trend && trendValue && (
              <p className={`ml-2 text-xs font-medium ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
              </p>
            )}
          </div>
        </div>
        <div className="p-2 bg-blue-50 rounded-md">
          {icon}
        </div>
      </div>
      {link && (
        <div className="mt-4">
          <Link to={link}>
            <a className="text-sm text-blue-600 hover:text-blue-800">View all →</a>
          </Link>
        </div>
      )}
    </div>
  );
};

const RecentActivity = () => {
  // This would be fetched from the API in a real implementation
  const activities = [
    { id: 1, user: 'Alex Smith', action: 'created a test case', target: 'Login Validation TC-452', time: '45 minutes ago' },
    { id: 2, user: 'Maria Garcia', action: 'executed a test run', target: 'Regression Suite TR-127', time: '2 hours ago' },
    { id: 3, user: 'John Lee', action: 'updated a test result', target: 'Payment Processing TC-301', time: '3 hours ago' },
    { id: 4, user: 'Sarah Wilson', action: 'added a comment', target: 'User Profile TC-212', time: '5 hours ago' },
    { id: 5, user: 'James Brown', action: 'created a test plan', target: 'Q2 Release TP-056', time: '1 day ago' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 border-b border-gray-100 pb-3">
            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0"></div>
            <div>
              <p className="text-sm">
                <span className="font-medium">{activity.user}</span> {activity.action} <Link to="#"><a className="text-blue-600 hover:underline">{activity.target}</a></Link>
              </p>
              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TestStatusSummary = () => {
  // This would be fetched from the API in a real implementation
  const statuses = [
    { status: 'passed', count: 352 },
    { status: 'failed', count: 47 },
    { status: 'pending', count: 128 },
    { status: 'blocked', count: 23 },
    { status: 'skipped', count: 16 }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <h3 className="text-lg font-medium mb-4">Test Status Summary</h3>
      <div className="space-y-3">
        {statuses.map((item) => (
          <div key={item.status} className="flex items-center justify-between">
            <div className="flex items-center">
              <StatusBadge status={item.status as any} size="sm" />
              <span className="ml-2 text-sm capitalize">{item.status}</span>
            </div>
            <span className="font-medium">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Dashboard() {
  // These would be fetched from the API in a real implementation
  const { data: testMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/metrics/tests'],
    // Mock data for demonstration
    initialData: {
      totalTests: 1248,
      passRate: 84.5,
      automatedTests: 742,
      testCasesLastWeek: 56
    }
  });

  const { data: failureMetrics, isLoading: failuresLoading } = useQuery({
    queryKey: ['/api/metrics/failures'],
    // Mock data for demonstration
    initialData: {
      unresolvedFailures: 47,
      criticalFailures: 12,
      avgResolutionTime: '1.8 days',
      failureRate: '3.7%'
    }
  });

  const { data: userMetrics, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/metrics/users'],
    // Mock data for demonstration
    initialData: {
      activeUsers: 34,
      testersOnline: 8,
      topTester: 'Maria Garcia',
      totalExecutions: 2567
    }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-3">
          <select className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>Last year</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            <Calendar className="h-4 w-4 mr-2" />
            Custom Date Range
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard 
          title="Total Test Cases" 
          value={testMetrics?.totalTests || 0}
          icon={<BarChart className="h-6 w-6 text-blue-600" />}
          trend="up"
          trendValue="4.2% from last week"
          link="/test-cases"
        />
        <DashboardCard 
          title="Pass Rate" 
          value={`${testMetrics?.passRate || 0}%`}
          icon={<PieChart className="h-6 w-6 text-green-600" />}
          trend="up"
          trendValue="1.8% from last week"
          link="/test-runs"
        />
        <DashboardCard 
          title="Unresolved Failures" 
          value={failureMetrics?.unresolvedFailures || 0}
          icon={<XCircle className="h-6 w-6 text-red-600" />}
          trend="down"
          trendValue="2.5% from last week"
          link="/failures"
        />
        <DashboardCard 
          title="Active Users" 
          value={userMetrics?.activeUsers || 0}
          icon={<Users className="h-6 w-6 text-purple-600" />}
          link="/users"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Test Execution Trend</h3>
              <select className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                <option>Weekly</option>
                <option>Monthly</option>
                <option>Quarterly</option>
              </select>
            </div>
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded">
              {/* Placeholder for chart */}
              <p className="text-gray-500">Chart showing test execution trends over time would appear here</p>
            </div>
          </div>
        </div>
        <div>
          <TestStatusSummary />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div>
          <div className="bg-white rounded-lg shadow-md p-5">
            <h3 className="text-lg font-medium mb-4">Critical Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Critical Failures</span>
                <span className="font-medium text-red-600">{failureMetrics?.criticalFailures}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Avg. Resolution Time</span>
                <span className="font-medium">{failureMetrics?.avgResolutionTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Test Failure Rate</span>
                <span className="font-medium">{failureMetrics?.failureRate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Automated Test %</span>
                <span className="font-medium">{Math.round((testMetrics?.automatedTests || 0) / (testMetrics?.totalTests || 1) * 100)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">New Test Cases (Week)</span>
                <span className="font-medium">{testMetrics?.testCasesLastWeek}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Top Tester</span>
                <span className="font-medium">{userMetrics?.topTester}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total Executions</span>
                <span className="font-medium">{userMetrics?.totalExecutions}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}