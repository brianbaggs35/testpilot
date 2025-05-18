import React, { useState } from 'react';
import { 
  Send, 
  Reply, 
  ThumbsUp, 
  MoreVertical, 
  Edit, 
  Trash, 
  EyeOff
} from 'lucide-react';

interface User {
  id: string | number;
  name: string;
  avatar?: string;
}

interface Comment {
  id: string | number;
  author: User;
  content: string;
  timestamp: string;
  likes: number;
  replies?: Comment[];
}

interface CommentSectionProps {
  comments: Comment[];
  currentUser: User;
  onAddComment?: (content: string) => void;
  onReply?: (commentId: string | number, content: string) => void;
  onLike?: (commentId: string | number) => void;
  onEdit?: (commentId: string | number, content: string) => void;
  onDelete?: (commentId: string | number) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  currentUser,
  onAddComment,
  onReply,
  onLike,
  onEdit,
  onDelete
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleAddComment = () => {
    if (newComment.trim() && onAddComment) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  const handleReply = (commentId: string | number) => {
    if (replyContent.trim() && onReply) {
      onReply(commentId, replyContent);
      setReplyingTo(null);
      setReplyContent('');
    }
  };

  const handleEdit = (commentId: string | number) => {
    if (editContent.trim() && onEdit) {
      onEdit(commentId, editContent);
      setEditingId(null);
      setEditContent('');
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingId === comment.id;
    
    return (
      <div key={comment.id} className={`comment ${isReply ? 'ml-10' : 'border-b pb-4'} mb-4`}>
        <div className="flex">
          {/* Avatar */}
          <div className="flex-shrink-0 mr-3">
            {comment.author.avatar ? (
              <img 
                src={comment.author.avatar} 
                alt={comment.author.name} 
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
                {getInitials(comment.author.name)}
              </div>
            )}
          </div>
          
          {/* Comment Content */}
          <div className="flex-grow">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between">
                <div className="font-medium text-sm">{comment.author.name}</div>
                <div className="text-xs text-gray-500">{comment.timestamp}</div>
              </div>
              
              {isEditing ? (
                <div className="mt-2">
                  <textarea
                    className="w-full border rounded-md p-2 text-sm"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      className="px-3 py-1 text-xs bg-gray-200 rounded-md"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md"
                      onClick={() => handleEdit(comment.id)}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm mt-1">{comment.content}</p>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-4 mt-2 text-xs">
              <button 
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                onClick={() => onLike && onLike(comment.id)}
              >
                <ThumbsUp size={14} />
                <span>{comment.likes > 0 ? comment.likes : ''} Like</span>
              </button>
              
              <button 
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
                <Reply size={14} />
                <span>Reply</span>
              </button>
              
              {comment.author.id === currentUser.id && !isEditing && (
                <div className="relative group ml-auto">
                  <button className="text-gray-500 hover:text-gray-700">
                    <MoreVertical size={14} />
                  </button>
                  <div className="absolute right-0 top-6 bg-white shadow-md rounded-md py-1 w-32 hidden group-hover:block z-10">
                    <button 
                      className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 w-full text-left"
                      onClick={() => startEditing(comment)}
                    >
                      <Edit size={14} />
                      <span>Edit</span>
                    </button>
                    <button 
                      className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 w-full text-left text-red-600"
                      onClick={() => onDelete && onDelete(comment.id)}
                    >
                      <Trash size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2 items-start">
                <div className="flex-shrink-0">
                  {currentUser.avatar ? (
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name} 
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                      {getInitials(currentUser.name)}
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <textarea
                    className="w-full border rounded-md p-2 text-sm"
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={2}
                  />
                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      className="px-3 py-1 text-xs bg-gray-200 rounded-md"
                      onClick={() => setReplyingTo(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md flex items-center gap-1"
                      onClick={() => handleReply(comment.id)}
                    >
                      <Send size={12} />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Replies */}
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

  return (
    <div className="comments-section">
      <h3 className="text-lg font-medium mb-4">Comments</h3>
      
      {/* Add Comment */}
      <div className="mb-6 flex gap-3 items-start">
        <div className="flex-shrink-0">
          {currentUser.avatar ? (
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
              {getInitials(currentUser.name)}
            </div>
          )}
        </div>
        <div className="flex-grow">
          <textarea
            className="w-full border rounded-md p-3 text-sm"
            placeholder="Add a comment or feedback on this test case..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium flex items-center gap-1"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              <Send size={16} />
              <span>Comment</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Comments List */}
      <div className="space-y-1">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <EyeOff className="mx-auto h-8 w-8 mb-2 text-gray-400" />
            <p>No comments yet. Be the first to add a comment!</p>
          </div>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
};

export default CommentSection;