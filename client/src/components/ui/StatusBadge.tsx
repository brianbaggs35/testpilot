import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, Play, Pause } from 'lucide-react';

export type StatusType = 
  // Test statuses
  | 'passed'
  | 'failed'
  | 'pending'
  | 'running'
  | 'blocked'
  | 'skipped'
  | 'untested'
  | 'flaky'
  // Test plan statuses
  | 'draft'
  | 'active'
  | 'completed'
  | 'archived'
  // Failure tracking statuses
  | 'new'
  | 'in-progress'
  | 'resolved'
  | 'cannot-reproduce'
  | 'wont-fix';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
}

export function StatusBadge({
  status,
  className = '',
  size = 'md',
  showIcon = true,
  showText = true,
}: StatusBadgeProps) {
  let bgColor = '';
  let textColor = '';
  let icon = null;
  let text = '';

  // Set colors based on status
  switch (status) {
    case 'passed':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      icon = <CheckCircle className="h-4 w-4" />;
      text = 'Passed';
      break;
    case 'failed':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      icon = <XCircle className="h-4 w-4" />;
      text = 'Failed';
      break;
    case 'pending':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      icon = <Clock className="h-4 w-4" />;
      text = 'Pending';
      break;
    case 'running':
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      icon = <Play className="h-4 w-4" />;
      text = 'Running';
      break;
    case 'blocked':
      bgColor = 'bg-orange-100';
      textColor = 'text-orange-800';
      icon = <Pause className="h-4 w-4" />;
      text = 'Blocked';
      break;
    case 'skipped':
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      icon = <AlertCircle className="h-4 w-4" />;
      text = 'Skipped';
      break;
    case 'untested':
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-600';
      icon = <Clock className="h-4 w-4" />;
      text = 'Untested';
      break;
    case 'flaky':
      bgColor = 'bg-amber-100';
      textColor = 'text-amber-800';
      icon = <AlertCircle className="h-4 w-4" />;
      text = 'Flaky';
      break;
    case 'draft':
      bgColor = 'bg-indigo-100';
      textColor = 'text-indigo-800';
      icon = <AlertCircle className="h-4 w-4" />;
      text = 'Draft';
      break;
    case 'active':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      icon = <Play className="h-4 w-4" />;
      text = 'Active';
      break;
    case 'completed':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      icon = <CheckCircle className="h-4 w-4" />;
      text = 'Completed';
      break;
    case 'archived':
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      icon = <AlertCircle className="h-4 w-4" />;
      text = 'Archived';
      break;
    case 'new':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      icon = <AlertCircle className="h-4 w-4" />;
      text = 'New';
      break;
    case 'in-progress':
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      icon = <Play className="h-4 w-4" />;
      text = 'In Progress';
      break;
    case 'resolved':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      icon = <CheckCircle className="h-4 w-4" />;
      text = 'Resolved';
      break;
    case 'cannot-reproduce':
      bgColor = 'bg-amber-100';
      textColor = 'text-amber-800';
      icon = <AlertCircle className="h-4 w-4" />;
      text = 'Cannot Reproduce';
      break;
    case 'wont-fix':
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      icon = <XCircle className="h-4 w-4" />;
      text = 'Won\'t Fix';
      break;
    default:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      icon = <AlertCircle className="h-4 w-4" />;
      text = status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ');
  }

  // Set size-based classes
  let sizeClasses = '';
  switch (size) {
    case 'sm':
      sizeClasses = 'text-xs px-2 py-0.5';
      break;
    case 'md':
      sizeClasses = 'text-sm px-2.5 py-1';
      break;
    case 'lg':
      sizeClasses = 'text-base px-3 py-1.5';
      break;
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${bgColor} ${textColor} ${sizeClasses} ${className}`}
    >
      {showIcon && <span className="mr-1.5">{icon}</span>}
      {showText && text}
    </span>
  );
}