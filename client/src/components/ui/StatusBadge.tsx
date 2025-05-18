import React from 'react';

type StatusType = 'passed' | 'failed' | 'blocked' | 'skipped' | 'pending' | 'in-progress' | 'not-run';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const getStatusStyles = (status: StatusType) => {
  switch (status) {
    case 'passed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'blocked':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'skipped':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'in-progress':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'not-run':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const baseStyles = 'px-2.5 py-0.5 rounded-full text-xs font-medium border';
  const statusStyles = getStatusStyles(status);
  
  return (
    <span className={`${baseStyles} ${statusStyles} ${className}`}>
      {status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
    </span>
  );
};

export default StatusBadge;