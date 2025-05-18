import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { User, MessageSquare, Send, Trash2, Edit2, Clock, Reply } from 'lucide-react';
import { queryClient } from '../../lib/queryClient';
import { useAuth } from '../../hooks/useAuth';

interface Author {
  id: string;
  name: string;
  profileImageUrl?: string;
}

interface Comment {
  id: number;
  content: string;
  testCaseId: number;
  parentId?: number;
  author: Author;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

interface CommentSectionProps {
  testCaseId: number;
  className?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  testCaseId,
  className = '',
}) => {
  const { user, isAuthenticated } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  // Fetch comments
  const {
    data: comments,
    isLoading,
    isError,
    error,
  } = useQuery<Comment[]>({
    queryKey: ['/api/test-cases', testCaseId, 'comments'],
    enabled: !!testCaseId,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string; testCaseId: number; parentId?: number }) => {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-cases', testCaseId, 'comments'] });
      setCommentText('');
      setReplyText('');
      setReplyToId(null);
    },
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: async (data: { id: number; content: string }) => {
      const response = await fetch(`/api/comments/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: data.content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to edit comment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-cases', testCaseId, 'comments'] });
      setEditingCommentId(null);
      setEditText('');
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-cases', testCaseId, 'comments'] });
    },
  });

  const handleAddComment = () => {
    if (!commentText.trim() || !isAuthenticated) return;
    
    addCommentMutation.mutate({
      content: commentText,
      testCaseId,
    });
  };

  const handleAddReply = () => {
    if (!replyText.trim() || !replyToId || !isAuthenticated) return;
    
    addCommentMutation.mutate({
      content: replyText,
      testCaseId,
      parentId: replyToId,
    });
  };

  const handleEditComment = () => {
    if (!editText.trim() || !editingCommentId || !isAuthenticated) return;
    
    editCommentMutation.mutate({
      id: editingCommentId,
      content: editText,
    });
  };

  const handleDeleteComment = (commentId: number) => {
    if (!isAuthenticated) return;
    
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const startReplying = (commentId: number) => {
    setReplyToId(commentId);
    setReplyText('');
  };

  const cancelReplying = () => {
    setReplyToId(null);
    setReplyText('');
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingCommentId === comment.id;
    const isReplying = replyToId === comment.id;
    const canModify = isAuthenticated && user?.id === comment.author.id;

    return (
      <div key={comment.id} className={`${isReply ? 'ml-10 mt-3' : 'mb-6'}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {comment.author.profileImageUrl ? (
              <img
                src={comment.author.profileImageUrl}
                alt={comment.author.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-6 w-6 text-gray-500" />
              </div>
            )}
          </div>
          
          <div className="ml-3 flex-1">
            <div className={`bg-white p-3 rounded-lg shadow-sm ${isReply ? 'border border-gray-100' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">{comment.author.name}</span>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{formatDate(comment.createdAt)}</span>
                </div>
              </div>
              
              {isEditing ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                  <div className="mt-2 flex justify-end space-x-2">
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1 text-xs text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEditComment}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      disabled={editCommentMutation.isPending}
                    >
                      {editCommentMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 whitespace-pre-line">{comment.content}</p>
              )}
            </div>
            
            {!isEditing && (
              <div className="mt-1 flex items-center space-x-4">
                <button
                  onClick={() => startReplying(comment.id)}
                  className="text-xs text-gray-500 flex items-center hover:text-gray-700"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </button>
                
                {canModify && (
                  <>
                    <button
                      onClick={() => startEditing(comment)}
                      className="text-xs text-gray-500 flex items-center hover:text-gray-700"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs text-red-500 flex items-center hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
            
            {isReplying && (
              <div className="mt-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    onClick={cancelReplying}
                    className="px-3 py-1 text-xs text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddReply}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    disabled={addCommentMutation.isPending || !replyText.trim()}
                  >
                    {addCommentMutation.isPending ? 'Sending...' : 'Reply'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Render replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">
                {comment.replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Organize comments and replies
  const organizedComments = React.useMemo(() => {
    if (!comments) return [];
    
    // Find top-level comments
    const topLevelComments = comments.filter(comment => !comment.parentId);
    
    // Collect replies for each top-level comment
    return topLevelComments.map(comment => {
      const replies = comments.filter(reply => reply.parentId === comment.id);
      return {
        ...comment,
        replies
      };
    });
  }, [comments]);

  return (
    <div className={`comment-section bg-gray-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center mb-6">
        <MessageSquare className="h-5 w-5 text-gray-500 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Comments</h3>
        <span className="ml-2 text-sm text-gray-500">
          {organizedComments?.length || 0} comments
        </span>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading comments. Please try again later.
        </div>
      ) : (
        <>
          {/* Add comment form */}
          {isAuthenticated ? (
            <div className="mb-6">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleAddComment}
                  disabled={addCommentMutation.isPending || !commentText.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 bg-blue-50 text-blue-700 px-4 py-3 rounded">
              Please sign in to add comments.
            </div>
          )}
          
          {/* Comments list */}
          <div className="space-y-6">
            {organizedComments.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              organizedComments.map(comment => renderComment(comment))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CommentSection;