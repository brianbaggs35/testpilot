import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Reply, Edit, Trash, Send } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: number;
  content: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  parentId?: number;
  testCaseId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CommentSectionProps {
  resourceId: number;
  resourceType: 'test-case' | 'test-run' | 'failure';
}

export function CommentSection({ resourceId, resourceType }: CommentSectionProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: [`/api/${resourceType}s/${resourceId}/comments`],
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          testCaseId: resourceType === 'test-case' ? resourceId : undefined,
          testRunId: resourceType === 'test-run' ? resourceId : undefined,
          failureId: resourceType === 'failure' ? resourceId : undefined,
        }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to create comment');
        return res.json();
      });
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: [`/api/${resourceType}s/${resourceId}/comments`] });
    },
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId: number }) => {
      return fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          parentId,
          testCaseId: resourceType === 'test-case' ? resourceId : undefined,
          testRunId: resourceType === 'test-run' ? resourceId : undefined,
          failureId: resourceType === 'failure' ? resourceId : undefined,
        }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to create reply');
        return res.json();
      });
    },
    onSuccess: () => {
      setReplyingTo(null);
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: [`/api/${resourceType}s/${resourceId}/comments`] });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      return fetch(`/api/comments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
        }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update comment');
        return res.json();
      });
    },
    onSuccess: () => {
      setEditingComment(null);
      queryClient.invalidateQueries({ queryKey: [`/api/${resourceType}s/${resourceId}/comments`] });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (id: number) => {
      return fetch(`/api/comments/${id}`, {
        method: 'DELETE',
      }).then(res => {
        if (!res.ok) throw new Error('Failed to delete comment');
        return true;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${resourceType}s/${resourceId}/comments`] });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    createCommentMutation.mutate(newComment);
  };

  const handleSubmitReply = (parentId: number) => {
    if (!replyContent.trim()) return;
    createReplyMutation.mutate({ content: replyContent, parentId });
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditedContent(comment.content);
  };

  const handleUpdateComment = (id: number) => {
    if (!editedContent.trim()) return;
    updateCommentMutation.mutate({ id, content: editedContent });
  };

  const handleDeleteComment = (id: number) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(id);
    }
  };

  const toggleReply = (id: number) => {
    setReplyingTo(replyingTo === id ? null : id);
    setReplyContent('');
  };

  const formatDate = (date: Date | string) => {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  };

  // Group comments by parent/child relationships
  const topLevelComments = comments.filter((comment: Comment) => !comment.parentId);
  const commentReplies = comments.filter((comment: Comment) => comment.parentId);

  const getRepliesForComment = (commentId: number) => {
    return commentReplies.filter((reply: Comment) => reply.parentId === commentId);
  };

  if (isLoading) {
    return <div className="py-4">Loading comments...</div>;
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium mb-4">Comments ({comments.length})</h3>
      
      {/* New comment form */}
      <div className="mb-6">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] mb-2"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitComment}
            disabled={createCommentMutation.isPending || !newComment.trim()}
          >
            <Send className="w-4 h-4 mr-2" />
            {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </div>
      
      {/* Comments list */}
      <div className="space-y-4">
        {topLevelComments.map((comment: Comment) => (
          <div key={comment.id} className="comment-thread">
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <Avatar 
                  src={comment.authorAvatar} 
                  fallback={comment.authorName?.substring(0, 2) || 'U'}
                  className="h-8 w-8"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">
                        {comment.authorName || 'User ' + comment.authorId}
                      </span>
                      <span className="text-gray-500 text-xs ml-2">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    {user?.id === comment.authorId && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditComment(comment)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editingComment === comment.id ? (
                    <div className="mt-2">
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="mb-2"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingComment(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateComment(comment.id)}
                          disabled={updateCommentMutation.isPending}
                        >
                          {updateCommentMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 text-sm whitespace-pre-wrap">
                      {comment.content}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-2 ml-11">
                <button
                  onClick={() => toggleReply(comment.id)}
                  className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                </button>
              </div>
              
              {replyingTo === comment.id && (
                <div className="mt-3 ml-11">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="mb-2 min-h-[60px]"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={createReplyMutation.isPending || !replyContent.trim()}
                    >
                      {createReplyMutation.isPending ? 'Posting...' : 'Post Reply'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
            
            {/* Replies */}
            <div className="ml-8 mt-2 space-y-2">
              {getRepliesForComment(comment.id).map((reply: Comment) => (
                <Card key={reply.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <Avatar 
                      src={reply.authorAvatar} 
                      fallback={reply.authorName?.substring(0, 2) || 'U'} 
                      className="h-7 w-7"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm">
                            {reply.authorName || 'User ' + reply.authorId}
                          </span>
                          <span className="text-gray-500 text-xs ml-2">
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>
                        {user?.id === reply.authorId && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditComment(reply)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(reply.id)}
                              className="text-gray-500 hover:text-red-500"
                            >
                              <Trash className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {editingComment === reply.id ? (
                        <div className="mt-2">
                          <Textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="mb-2"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingComment(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateComment(reply.id)}
                              disabled={updateCommentMutation.isPending}
                            >
                              {updateCommentMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 text-sm whitespace-pre-wrap">
                          {reply.content}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
        
        {topLevelComments.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No comments yet. Be the first to leave a comment!
          </div>
        )}
      </div>
    </div>
  );
}