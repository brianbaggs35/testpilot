import React, { useState } from 'react';
import StatusBadge from '../ui/StatusBadge';
import { Clock, MoreHorizontal, User, ChevronDown } from 'lucide-react';

// Define types for our kanban items
interface KanbanItem {
  id: number | string;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: string;
}

interface Column {
  id: string;
  title: string;
  items: KanbanItem[];
}

interface KanbanBoardProps {
  initialColumns?: Column[];
  onItemMove?: (itemId: number | string, fromColumn: string, toColumn: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  initialColumns = [
    { 
      id: 'new', 
      title: 'New', 
      items: [] 
    },
    { 
      id: 'in-progress', 
      title: 'In Progress', 
      items: [] 
    },
    { 
      id: 'blocked', 
      title: 'Blocked', 
      items: [] 
    },
    { 
      id: 'resolved', 
      title: 'Resolved', 
      items: [] 
    },
  ],
  onItemMove
}) => {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [draggedItem, setDraggedItem] = useState<KanbanItem | null>(null);
  const [sourceColumn, setSourceColumn] = useState<string>('');

  const handleDragStart = (item: KanbanItem, columnId: string) => {
    setDraggedItem(item);
    setSourceColumn(columnId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    // Don't do anything if dropping in the same column
    if (sourceColumn === columnId) return;
    
    // Update columns state
    const updatedColumns = columns.map(column => {
      // Remove from source column
      if (column.id === sourceColumn) {
        return {
          ...column,
          items: column.items.filter(item => item.id !== draggedItem.id)
        };
      }
      
      // Add to target column
      if (column.id === columnId) {
        const updatedItem = { ...draggedItem, status: columnId };
        return {
          ...column,
          items: [...column.items, updatedItem]
        };
      }
      
      return column;
    });
    
    setColumns(updatedColumns);
    
    // Call the callback if provided
    if (onItemMove) {
      onItemMove(draggedItem.id, sourceColumn, columnId);
    }
    
    setDraggedItem(null);
    setSourceColumn('');
  };

  // Function to get color based on priority
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="kanban-board flex gap-4 overflow-x-auto pb-4">
      {columns.map(column => (
        <div 
          key={column.id}
          className="kanban-column min-w-[320px] bg-gray-50 rounded-md shadow-sm"
          onDragOver={e => handleDragOver(e, column.id)}
          onDrop={e => handleDrop(e, column.id)}
        >
          <div className="column-header p-3 bg-gray-100 border-b rounded-t-md">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{column.title}</h3>
              <span className="text-xs text-gray-500 px-2 py-1 bg-white rounded-full">
                {column.items.length}
              </span>
            </div>
          </div>
          
          <div className="column-body p-2 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {column.items.map(item => (
              <div 
                key={item.id}
                className="kanban-item bg-white p-3 rounded-md shadow-sm border border-gray-200 cursor-move"
                draggable
                onDragStart={() => handleDragStart(item, column.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(item.priority)}`}>
                    {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
                
                <h4 className="font-medium mb-1 text-sm">{item.title}</h4>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                
                <div className="flex justify-between items-center text-xs text-gray-500">
                  {item.assignee && (
                    <div className="flex items-center">
                      <User size={14} className="mr-1" />
                      <span>{item.assignee}</span>
                    </div>
                  )}
                  
                  {item.dueDate && (
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      <span>{item.dueDate}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {column.items.length === 0 && (
              <div className="empty-column text-center py-6 text-gray-400 text-sm">
                Drop items here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;