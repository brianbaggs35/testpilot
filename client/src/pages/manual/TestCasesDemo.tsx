import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../components/ui/card';
import RichTextEditor from '../../components/editor/RichTextEditor';
import KanbanBoard from '../../components/kanban/KanbanBoard';
import CommentSection from '../../components/comments/CommentSection';
import StatusBadge from '../../components/ui/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { FileText, RefreshCw, Download, Plus } from 'lucide-react';

export default function TestCasesDemo() {
  // Sample test case data
  const [testCaseContent, setTestCaseContent] = useState(
    'This is a test case for the login functionality.\n\n' +
    '## Prerequisites\n' +
    '- User account with valid credentials\n' +
    '- Access to the login page\n\n' +
    '## Steps\n' +
    '1. Navigate to the login page\n' +
    '2. Enter valid username and password\n' +
    '3. Click the login button\n\n' +
    '## Expected Result\n' +
    '- User should be successfully logged in\n' +
    '- User should be redirected to the dashboard page\n' +
    '- User information should be correctly displayed in the UI'
  );

  // Sample kanban data
  const [kanbanColumns, setKanbanColumns] = useState([
    {
      id: 'new',
      title: 'New',
      items: [
        {
          id: 1,
          title: 'API Authentication Tests',
          description: 'Verify that API routes properly validate authentication tokens',
          status: 'new',
          priority: 'high' as const,
          assignee: 'Sarah Chen',
          dueDate: 'June 15'
        },
        {
          id: 2,
          title: 'Mobile Responsive Design',
          description: 'Test mobile responsiveness on iOS and Android devices',
          status: 'new',
          priority: 'medium' as const,
          assignee: 'James Wilson',
          dueDate: 'June 18'
        }
      ]
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      items: [
        {
          id: 3,
          title: 'Payment Gateway Integration',
          description: 'Verify credit card processing and error handling',
          status: 'in-progress',
          priority: 'critical' as const,
          assignee: 'Maria Rodriguez',
          dueDate: 'June 10'
        }
      ]
    },
    {
      id: 'blocked',
      title: 'Blocked',
      items: [
        {
          id: 4,
          title: 'Performance Testing',
          description: 'Load testing with 1000+ concurrent users',
          status: 'blocked',
          priority: 'high' as const,
          assignee: 'Alex Johnson',
          dueDate: 'June 25'
        }
      ]
    },
    {
      id: 'resolved',
      title: 'Resolved',
      items: [
        {
          id: 5,
          title: 'Login Page Validation',
          description: 'Verify form validation for login credentials',
          status: 'resolved',
          priority: 'medium' as const,
          assignee: 'David Kim',
          dueDate: 'June 5'
        },
        {
          id: 6,
          title: 'Database Backup Tests',
          description: 'Verify that database backups are properly created',
          status: 'resolved',
          priority: 'low' as const,
          assignee: 'Emily Taylor',
          dueDate: 'June 2'
        }
      ]
    }
  ]);

  // Sample comments data
  const [comments, setComments] = useState([
    {
      id: 1,
      author: {
        id: 'user1',
        name: 'Alex Johnson'
      },
      content: 'I found an edge case where the login form allows submission with an empty password field. We should add validation for this.',
      timestamp: '2 days ago',
      likes: 3,
      replies: [
        {
          id: 11,
          author: {
            id: 'user2',
            name: 'Maria Rodriguez'
          },
          content: 'Good catch! I\'ll create a ticket for this issue.',
          timestamp: '1 day ago',
          likes: 1
        }
      ]
    },
    {
      id: 2,
      author: {
        id: 'user3',
        name: 'David Kim'
      },
      content: 'We should also test the "forgot password" flow as part of this test case.',
      timestamp: '1 day ago',
      likes: 2
    }
  ]);

  // Current user for the comment section
  const currentUser = {
    id: 'user4',
    name: 'Sarah Chen'
  };

  // Handler functions
  const handleTestCaseChange = (content: string) => {
    setTestCaseContent(content);
  };

  const handleKanbanItemMove = (itemId: number | string, fromColumn: string, toColumn: string) => {
    console.log(`Moving item ${itemId} from ${fromColumn} to ${toColumn}`);
    // The KanbanBoard component already updates its internal state
  };

  const handleAddComment = (content: string) => {
    const newComment = {
      id: Date.now(),
      author: currentUser,
      content,
      timestamp: 'Just now',
      likes: 0
    };
    setComments([newComment, ...comments]);
  };

  const handleReplyComment = (commentId: string | number, content: string) => {
    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        const replies = comment.replies || [];
        return {
          ...comment,
          replies: [
            ...replies,
            {
              id: Date.now(),
              author: currentUser,
              content,
              timestamp: 'Just now',
              likes: 0
            }
          ]
        };
      }
      return comment;
    });
    setComments(updatedComments);
  };

  const handleLikeComment = (commentId: string | number) => {
    // Implementation simplified for demo purposes
    // Find and update the comment or reply with the given ID
    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, likes: comment.likes + 1 };
      }
      
      if (comment.replies) {
        const updatedReplies = comment.replies.map(reply => {
          if (reply.id === commentId) {
            return { ...reply, likes: reply.likes + 1 };
          }
          return reply;
        });
        return { ...comment, replies: updatedReplies };
      }
      
      return comment;
    });
    
    setComments(updatedComments);
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Test Case Management Demo</h1>
        <p className="text-gray-600">
          Explore key features of our QA platform: rich text editing, kanban board for status tracking, and team collaboration.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3 on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Test Case Editor Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">Login Functionality Test</CardTitle>
                  <CardDescription>Manual test case #TC-1001</CardDescription>
                </div>
                <StatusBadge status="in-progress" />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="edit">
                <TabsList className="mb-4">
                  <TabsTrigger value="edit">Edit Test Case</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="edit">
                  <div className="mb-4">
                    <RichTextEditor 
                      initialValue={testCaseContent} 
                      onChange={handleTestCaseChange}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <button className="px-4 py-2 border rounded-md flex items-center gap-2 text-sm hover:bg-gray-50">
                      <RefreshCw size={16} />
                      <span>Reset</span>
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2 text-sm">
                      <FileText size={16} />
                      <span>Save Test Case</span>
                    </button>
                  </div>
                </TabsContent>
                
                <TabsContent value="preview">
                  <div className="border rounded-md p-4 bg-white min-h-[400px] prose max-w-none">
                    <h1>Login Functionality Test</h1>
                    <div className="whitespace-pre-line">{testCaseContent}</div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-4">
                    <button className="px-4 py-2 border rounded-md flex items-center gap-2 text-sm hover:bg-gray-50">
                      <Download size={16} />
                      <span>Export as PDF</span>
                    </button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Comment Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Team Collaboration</CardTitle>
              <CardDescription>Comments and feedback on this test case</CardDescription>
            </CardHeader>
            <CardContent>
              <CommentSection 
                comments={comments} 
                currentUser={currentUser}
                onAddComment={handleAddComment}
                onReply={handleReplyComment}
                onLike={handleLikeComment}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Right column (1/3 on large screens) */}
        <div className="space-y-6">
          {/* Status Board */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Status Board</CardTitle>
                <button className="p-1 rounded-md hover:bg-gray-100">
                  <Plus size={18} />
                </button>
              </div>
              <CardDescription>Track test case status with kanban</CardDescription>
            </CardHeader>
            <CardContent className="-mx-6">
              <div className="overflow-auto px-6">
                <KanbanBoard 
                  initialColumns={kanbanColumns}
                  onItemMove={handleKanbanItemMove}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Test Metrics</CardTitle>
              <CardDescription>Current sprint progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span className="font-medium">Test Cases Execution</span>
                    <span>65%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span className="font-medium">Pass Rate</span>
                    <span>82%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span className="font-medium">Defects Resolved</span>
                    <span>48%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '48%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="border rounded-md p-3 bg-blue-50">
                  <div className="text-sm text-gray-600">Total Test Cases</div>
                  <div className="text-xl font-bold">245</div>
                </div>
                
                <div className="border rounded-md p-3 bg-green-50">
                  <div className="text-sm text-gray-600">Passed</div>
                  <div className="text-xl font-bold">198</div>
                </div>
                
                <div className="border rounded-md p-3 bg-red-50">
                  <div className="text-sm text-gray-600">Failed</div>
                  <div className="text-xl font-bold">42</div>
                </div>
                
                <div className="border rounded-md p-3 bg-amber-50">
                  <div className="text-sm text-gray-600">Blocked</div>
                  <div className="text-xl font-bold">5</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}