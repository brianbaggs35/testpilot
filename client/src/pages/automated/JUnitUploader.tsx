import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'wouter';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Search,
  Filter, 
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Database,
  BarChart,
  PlusCircle,
  RefreshCw
} from 'lucide-react';
import { queryClient } from '../../lib/queryClient';
import { useAuth } from '../../hooks/useAuth';

interface TestResult {
  id: number;
  testRunId: number;
  testCaseId: number;
  className: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
  executedById?: string;
  createdAt: string;
}

interface TestRun {
  id: number;
  name: string;
  status: string;
  environment?: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  startedAt: string;
  completedAt?: string;
  createdById: string;
  createdAt: string;
  xmlData?: string;
}

// Skeleton loader component for tables
const TableSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-10 bg-gray-200 rounded mb-4"></div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
    ))}
  </div>
);

const JUnitUploader: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for file upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [runName, setRunName] = useState('');
  const [environment, setEnvironment] = useState('');
  
  // State for test results table
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  
  // Lazy loading for test runs
  const [isRunsVisible, setIsRunsVisible] = useState(false);
  
  // Set visible after component mounts and slight delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRunsVisible(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);
  
  // Fetch recent test runs
  const { 
    data: recentRuns,
    isLoading: isLoadingRuns,
    error: runsError,
    refetch: refetchRuns
  } = useQuery<TestRun[]>({
    queryKey: ['/api/test-runs'],
    refetchOnWindowFocus: false,
    enabled: isRunsVisible,
  });
  
  // Fetch test results for the selected run
  const {
    data: testResults,
    isLoading: isLoadingResults,
    error: resultsError
  } = useQuery<TestResult[]>({
    queryKey: ['/api/test-runs', selectedResult?.testRunId, 'results'],
    enabled: !!selectedResult?.testRunId,
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/test-runs', {
        method: 'POST',
        body: formData,
        headers: {
          // No Content-Type header, browser will set it with boundary for FormData
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload JUnit XML file');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-runs'] });
      setSelectedFile(null);
      setUploadProgress(0);
      setRunName('');
      setEnvironment('');
      
      // Show success notification
      showNotification('Test run uploaded successfully!', 'success');
    },
    onError: (error: Error) => {
      console.error('Upload error:', error);
      showNotification(`Error uploading test run: ${error.message}`, 'error');
    }
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Generate default run name from file name
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      setRunName(`Run: ${fileName} (${new Date().toLocaleDateString()})`);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !runName.trim()) {
      showNotification('Please select a file and provide a run name', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('xmlFile', selectedFile);
    formData.append('name', runName);
    
    if (environment) {
      formData.append('environment', environment);
    }

    // Fake progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + 5;
        return newProgress >= 90 ? 90 : newProgress;
      });
    }, 200);

    try {
      await uploadMutation.mutateAsync(formData);
      setUploadProgress(100);
    } finally {
      clearInterval(progressInterval);
    }
  };

  // Handle row click to view test details
  const handleRowClick = (result: TestResult) => {
    setSelectedResult(result);
    setShowResultModal(true);
  };

  // Toggle sort direction or change sort field
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle pagination
  const totalPages = Math.ceil((filteredResults?.length || 0) / pageSize);
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Show notification (would be replaced with proper toast component)
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    alert(`${type.toUpperCase()}: ${message}`);
  };

  // Computed properties for table display
  const filteredResults = testResults
    ? testResults.filter(result => {
        const matchesSearch = !searchQuery || 
          result.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (result.errorMessage && result.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesStatus = !statusFilter || result.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
    : [];

  // Sort results
  const sortedResults = [...filteredResults].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'className') {
      comparison = a.className.localeCompare(b.className);
    } else if (sortField === 'status') {
      comparison = a.status.localeCompare(b.status);
    } else if (sortField === 'duration') {
      comparison = a.duration - b.duration;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Paginate results
  const paginatedResults = sortedResults.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Format milliseconds to human-readable time
  const formatDuration = (milliseconds: number) => {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else {
      const seconds = (milliseconds / 1000).toFixed(2);
      return `${seconds}s`;
    }
  };

  // Get status badge class
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'skipped':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'skipped':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-purple-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automated Testing</h1>
          <p className="text-sm text-gray-600 mt-1">
            Upload JUnit XML files, view results, and track failures
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/failure-analysis')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <BarChart className="h-4 w-4 mr-2 text-gray-500" />
            Failure Analysis
          </button>
          
          <button
            onClick={() => navigate('/automated-report')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>
      
      {/* Upload Section */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Upload JUnit XML Test Results</h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload your JUnit XML files to track automated test results
          </p>
        </div>
        
        <div className="p-5">
          {!isAuthenticated ? (
            <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>Please log in to upload test results.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Run Name
                  </label>
                  <input
                    type="text"
                    value={runName}
                    onChange={(e) => setRunName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Daily API Tests - May 18, 2025"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Environment (Optional)
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Environment</option>
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    JUnit XML File
                  </label>
                  <div className="flex items-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".xml"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Browse Files
                    </button>
                    {selectedFile && (
                      <span className="ml-3 text-sm text-gray-500">
                        {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={!selectedFile || !runName.trim() || uploadMutation.isPending}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload Test Results'}
                  </button>
                </div>
              </div>
              
              {uploadMutation.isPending && (
                <div className="flex flex-col justify-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    {uploadProgress < 100
                      ? `Uploading and processing: ${uploadProgress}%`
                      : 'Processing complete!'}
                  </p>
                  
                  {uploadProgress >= 90 && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-green-600 font-medium">
                        {uploadProgress >= 100 
                          ? 'Test run uploaded successfully!' 
                          : 'Finalizing upload...'
                        }
                      </p>
                      {uploadProgress >= 100 && (
                        <p className="text-xs text-gray-500 mt-1">
                          You can now view the results in the Recent Test Runs section below.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Test Runs */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Recent Test Runs</h2>
            <p className="text-sm text-gray-500">View and analyze your test execution results</p>
          </div>
          
          <button 
            onClick={() => refetchRuns()}
            className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoadingRuns}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingRuns ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          {isLoadingRuns || !isRunsVisible ? (
            <div className="p-5">
              <TableSkeleton />
            </div>
          ) : runsError ? (
            <div className="p-5 bg-red-50 text-red-700 flex items-center">
              <XCircle className="h-5 w-5 mr-2" />
              <span>Failed to load test runs. Please try again later.</span>
            </div>
          ) : recentRuns && recentRuns.length > 0 ? (
            <div className="min-w-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Environment
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tests
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentRuns.map(run => (
                    <tr 
                      key={run.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                      onClick={() => navigate(`/automated-results/${run.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{run.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(run.status)}`}>
                          {getStatusIcon(run.status)}
                          <span className="ml-1">{run.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{run.environment || 'Not specified'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          <span className="text-green-600 font-medium">{run.passedTests}</span>
                          <span className="mx-1">/</span>
                          <span>{run.totalTests}</span>
                          {run.failedTests > 0 && (
                            <span className="ml-2 text-red-600">
                              ({run.failedTests} failed)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDuration(run.duration)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(run.startedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/automated-results/${run.id}`)
                            }}
                          >
                            View Details
                          </button>
                          
                          <button 
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/failure-analysis?runId=${run.id}`)
                            }}
                          >
                            Track Failures
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination for large result sets */}
              {recentRuns.length > 10 && (
                <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">1</span> to <span className="font-medium">{recentRuns.length}</span> of{' '}
                      <span className="font-medium">{recentRuns.length}</span> results
                    </div>
                    <div className="flex items-center space-x-2">
                      <select 
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={10}
                        onChange={(e) => console.log('Change page size', e.target.value)}
                      >
                        <option value={10}>10 rows</option>
                        <option value={25}>25 rows</option>
                        <option value={50}>50 rows</option>
                      </select>
                      
                      <nav className="relative z-0 inline-flex shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          onClick={() => {}} // First page
                        >
                          <span className="sr-only">First</span>
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          1
                        </button>
                        <button
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          onClick={() => {}} // Last page
                        >
                          <span className="sr-only">Last</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-10 text-center text-gray-500">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No test runs found</h3>
              <p className="text-gray-500 mb-4">Upload your first JUnit XML file to get started</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Upload Test Results
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal for Test Result Details */}
      {showResultModal && selectedResult && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      {getStatusIcon(selectedResult.status)}
                      <span className="ml-2">{selectedResult.name}</span>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedResult.status)}`}>
                        {selectedResult.status}
                      </span>
                    </h3>
                    
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Class Name</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedResult.className}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Duration</dt>
                          <dd className="mt-1 text-sm text-gray-900">{formatDuration(selectedResult.duration)}</dd>
                        </div>
                        
                        {selectedResult.status === 'failed' && selectedResult.errorMessage && (
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Error Message</dt>
                            <dd className="mt-1 text-sm text-red-600 bg-red-50 p-3 rounded font-mono whitespace-pre-wrap">
                              {selectedResult.errorMessage}
                            </dd>
                          </div>
                        )}
                        
                        {selectedResult.status === 'failed' && selectedResult.stackTrace && (
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Stack Trace</dt>
                            <dd className="mt-1 text-sm">
                              <div className="bg-gray-800 text-gray-200 p-3 rounded max-h-80 overflow-auto">
                                <pre className="font-mono text-xs">{selectedResult.stackTrace}</pre>
                              </div>
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => navigate(`/failures/new?testResultId=${selectedResult.id}`)}
                >
                  Track Failure
                </button>
                
                <button
                  type="button"
                  className="mt-3 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowResultModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JUnitUploader;