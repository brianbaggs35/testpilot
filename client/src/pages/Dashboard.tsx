import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Link } from 'wouter';
import { 
  CheckSquare, 
  XSquare, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  ChevronRight, 
  BarChart3, 
  Terminal,
  FileText 
} from 'lucide-react';

export default function Dashboard() {
  // Sample data for the dashboard
  const metrics = [
    {
      title: 'Total Tests',
      value: '5,842',
      icon: <CheckSquare className="h-5 w-5 text-blue-500" />,
      color: 'bg-blue-50'
    },
    {
      title: 'Failed Tests',
      value: '124',
      icon: <XSquare className="h-5 w-5 text-red-500" />,
      color: 'bg-red-50'
    },
    {
      title: 'Test Time',
      value: '4h 32m',
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      color: 'bg-amber-50'
    },
    {
      title: 'Open Issues',
      value: '38',
      icon: <AlertTriangle className="h-5 w-5 text-purple-500" />,
      color: 'bg-purple-50'
    }
  ];

  const recentRuns = [
    {
      id: 1,
      name: 'Regression Test Suite',
      timestamp: '2 hours ago',
      status: 'Completed',
      totalTests: 1245,
      passedTests: 1203,
      failedTests: 42
    },
    {
      id: 2,
      name: 'Integration Test Suite',
      timestamp: '5 hours ago',
      status: 'Completed',
      totalTests: 842,
      passedTests: 791,
      failedTests: 51
    },
    {
      id: 3,
      name: 'API Test Suite',
      timestamp: '1 day ago',
      status: 'Completed',
      totalTests: 356,
      passedTests: 349,
      failedTests: 7
    }
  ];

  const manualTestPlans = [
    {
      id: 1,
      name: 'Q2 Release Test Plan',
      dueDate: 'Jun 15, 2023',
      progress: 75,
      status: 'In Progress'
    },
    {
      id: 2,
      name: 'Mobile App Test Plan',
      dueDate: 'Jun 30, 2023',
      progress: 45,
      status: 'In Progress'
    },
    {
      id: 3,
      name: 'Security Audit Plan',
      dueDate: 'Jul 15, 2023',
      progress: 10,
      status: 'Planning'
    }
  ];

  return (
    <div className="dashboard">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className={`flex items-center p-6 ${metric.color}`}>
              <div className="mr-4">
                {metric.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                <h3 className="text-2xl font-bold">{metric.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Left Column (4/7) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Test Runs */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Recent Test Runs</CardTitle>
                <Link href="/automated/test-cases">
                  <a className="text-sm text-primary hover:underline flex items-center">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </Link>
              </div>
              <CardDescription>Latest automated test execution results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRuns.map((run) => (
                  <div key={run.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{run.name}</h4>
                        <div className="text-sm text-gray-500">{run.timestamp}</div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        run.failedTests === 0 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {run.failedTests === 0 ? 'All Passed' : `${run.failedTests} Failed`}
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          run.passedTests === run.totalTests ? 'bg-green-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${(run.passedTests / run.totalTests) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <div>{run.passedTests} Passed</div>
                      <div>{run.totalTests} Total</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Demo Features */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Demo Features</CardTitle>
              <CardDescription>Explore the features we've implemented</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/demo">
                <a className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <div className="bg-violet-100 rounded-lg p-3 mr-4">
                      <Terminal className="h-6 w-6 text-violet-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Test Case Management Demo</h4>
                      <p className="text-sm text-gray-500">
                        Try out our Rich Text Editor, Kanban Board, and PDF reporting features
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 ml-auto text-gray-400" />
                  </div>
                </a>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column (3/7) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Manual Test Plans */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Manual Test Plans</CardTitle>
                <Link href="/manual/test-plans">
                  <a className="text-sm text-primary hover:underline flex items-center">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </Link>
              </div>
              <CardDescription>Active manual testing activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {manualTestPlans.map((plan) => (
                  <div key={plan.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{plan.name}</h4>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        plan.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                        plan.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {plan.status}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {plan.dueDate}</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="h-2.5 rounded-full bg-blue-500"
                        style={{ width: `${plan.progress}%` }}
                      ></div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500 text-right">
                      {plan.progress}% complete
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Reports */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Recent Reports</CardTitle>
                <Link href="/manual/reports">
                  <a className="text-sm text-primary hover:underline flex items-center">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </Link>
              </div>
              <CardDescription>Generated test reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="border rounded-lg p-3 flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Regression Test Report</h4>
                    <p className="text-xs text-gray-500">Generated 2 days ago</p>
                  </div>
                </div>
                
                <div className="border rounded-lg p-3 flex items-center">
                  <div className="bg-green-100 p-2 rounded-lg mr-3">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Performance Test Report</h4>
                    <p className="text-xs text-gray-500">Generated 5 days ago</p>
                  </div>
                </div>
                
                <div className="border rounded-lg p-3 flex items-center">
                  <div className="bg-purple-100 p-2 rounded-lg mr-3">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Monthly Test Metrics</h4>
                    <p className="text-xs text-gray-500">Generated 1 week ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}