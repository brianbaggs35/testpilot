import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { CheckCircle, AlertCircle, Clock, User, Calendar, Tag, 
  MoreHorizontal, ChevronDown, Search, Filter, XCircle } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';

interface KanbanItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  dueDate?: string;
  tags?: string[];
  type: 'manual' | 'automated';
  testCaseId?: number;
  testResultId?: number;
  errorMessage?: string;
  stackTrace?: string;
}

interface Column {
  id: string;
  title: string;
  itemIds: string[];
}

type ColumnsType = {
  [key: string]: Column;
};

interface KanbanBoardProps {
  boardType: 'manual' | 'automated';
  initialItems?: KanbanItem[];
  initialColumns?: ColumnsType;
  onItemMove?: (itemId: string, source: string, destination: string) => Promise<void>;
  onItemClick?: (item: KanbanItem) => void;
  isLoading?: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  boardType = 'manual',
  initialItems = [],
  initialColumns,
  onItemMove,
  onItemClick,
  isLoading = false
}) => {
  // State for kanban items and columns
  const [items, setItems] = useState<KanbanItem[]>(initialItems);
  const [columns, setColumns] = useState<ColumnsType>(initialColumns || {
    'to-do': {
      id: 'to-do',
      title: 'To Do',
      itemIds: []
    },
    'in-progress': {
      id: 'in-progress',
      title: 'In Progress',
      itemIds: []
    },
    'blocked': {
      id: 'blocked',
      title: 'Blocked',
      itemIds: []
    },
    'fixed': {
      id: 'fixed',
      title: boardType === 'manual' ? 'Passed' : 'Fixed',
      itemIds: []
    },
    'failed': {
      id: 'failed',
      title: 'Failed',
      itemIds: []
    }
  });
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  
  // Modal state for item details
  const [selectedItem, setSelectedItem] = useState<KanbanItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Update the board when initialItems change
  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setItems(initialItems);
      
      // Reorganize items into columns
      const newColumns = { ...columns };
      
      // Reset all column itemIds
      Object.keys(newColumns).forEach(columnId => {
        newColumns[columnId].itemIds = [];
      });
      
      // Assign items to columns based on their status
      initialItems.forEach(item => {
        if (newColumns[item.status]) {
          newColumns[item.status].itemIds.push(item.id);
        } else {
          // Default to to-do if status doesn't match any column
          newColumns['to-do'].itemIds.push(item.id);
        }
      });
      
      setColumns(newColumns);
    }
  }, [initialItems]);

  // Filter items based on search and filters
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.errorMessage && item.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPriority = !priorityFilter || item.priority === priorityFilter;
    
    const matchesAssignee = !assigneeFilter || 
      (item.assignee && item.assignee.id === assigneeFilter);
    
    const matchesTag = !tagFilter || 
      (item.tags && item.tags.includes(tagFilter));
    
    return matchesSearch && matchesPriority && matchesAssignee && matchesTag;
  });

  // Function to handle drag end
  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    
    // If there's no destination or the item was dropped back in the same place
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    // Get the source and destination columns
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    
    // Remove from source column
    const newSourceItemIds = Array.from(sourceColumn.itemIds);
    newSourceItemIds.splice(source.index, 1);
    
    // Add to destination column
    const newDestItemIds = Array.from(destColumn.itemIds);
    newDestItemIds.splice(destination.index, 0, draggableId);
    
    // Create new column objects
    const newSourceColumn = {
      ...sourceColumn,
      itemIds: newSourceItemIds
    };
    
    const newDestColumn = {
      ...destColumn,
      itemIds: newDestItemIds
    };
    
    // Update columns state
    const newColumns = {
      ...columns,
      [newSourceColumn.id]: newSourceColumn,
      [newDestColumn.id]: newDestColumn
    };
    
    setColumns(newColumns);
    
    // Update item status
    const updatedItems = items.map(item => 
      item.id === draggableId 
        ? { ...item, status: destination.droppableId }
        : item
    );
    
    setItems(updatedItems);
    
    // Call the callback if provided
    if (onItemMove) {
      try {
        await onItemMove(draggableId, source.droppableId, destination.droppableId);
      } catch (error) {
        console.error('Error moving item:', error);
        // Revert back to original state on error
        setColumns({
          ...columns,
          [sourceColumn.id]: sourceColumn,
          [destColumn.id]: destColumn
        });
      }
    }
  };

  // Function to handle item click
  const handleItemClick = (item: KanbanItem) => {
    setSelectedItem(item);
    setShowModal(true);
    if (onItemClick) {
      onItemClick(item);
    }
  };

  // Function to get color based on priority
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'to-do':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'blocked':
        return 'bg-yellow-100 text-yellow-800';
      case 'fixed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-lg text-gray-600">Loading kanban board...</span>
      </div>
    );
  }

  return (
    <div className="kanban-board">
      {/* Filter bar */}
      <div className="mb-6 p-4 bg-white shadow rounded-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <XCircle className="h-5 w-5 text-gray-400 hover:text-gray-500" />
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={priorityFilter || ''}
                onChange={(e) => setPriorityFilter(e.target.value || null)}
                className="pl-4 pr-10 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <div className="relative">
              <select
                value={assigneeFilter || ''}
                onChange={(e) => setAssigneeFilter(e.target.value || null)}
                className="pl-4 pr-10 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Assignees</option>
                {/* This would be populated with actual users in a real implementation */}
                <option value="user1">User One</option>
                <option value="user2">User Two</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <button
              onClick={() => {
                setSearchQuery('');
                setPriorityFilter(null);
                setAssigneeFilter(null);
                setTagFilter(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Kanban board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {Object.values(columns).map((column) => (
            <div key={column.id} className="flex flex-col bg-gray-100 rounded-lg">
              <div className="p-3 font-medium text-gray-700 bg-gray-200 rounded-t-lg flex justify-between items-center">
                <span>{column.title}</span>
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                  {column.itemIds.length}
                </span>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-h-[200px] p-2 ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : ''
                    }`}
                    style={{ height: 'calc(100vh - 280px)', overflowY: 'auto' }}
                  >
                    {column.itemIds
                      .map(itemId => items.find(item => item.id === itemId))
                      .filter(Boolean)
                      .filter(item => {
                        if (!item) return false;
                        
                        const matchesSearch = !searchQuery || 
                          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.errorMessage && item.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()));
                        
                        const matchesPriority = !priorityFilter || item.priority === priorityFilter;
                        
                        const matchesAssignee = !assigneeFilter || 
                          (item.assignee && item.assignee.id === assigneeFilter);
                        
                        const matchesTag = !tagFilter || 
                          (item.tags && item.tags.includes(tagFilter));
                        
                        return matchesSearch && matchesPriority && matchesAssignee && matchesTag;
                      })
                      .map((item, index) => {
                        if (!item) return null;
                        
                        return (
                          <Draggable
                            key={item.id}
                            draggableId={item.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-2 p-3 bg-white rounded-md shadow-sm hover:shadow ${
                                  snapshot.isDragging ? 'shadow-md' : ''
                                }`}
                                onClick={() => handleItemClick(item)}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                    {item.title}
                                  </h3>
                                  <span 
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}
                                  >
                                    {item.priority}
                                  </span>
                                </div>
                                
                                {item.description && (
                                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                                
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.tags?.map((tag, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                
                                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                                  {item.assignee && (
                                    <div className="flex items-center">
                                      <User className="h-3 w-3 mr-1" />
                                      <span>{item.assignee.name}</span>
                                    </div>
                                  )}
                                  
                                  {item.dueDate && (
                                    <div className="flex items-center">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      <span>{item.dueDate}</span>
                                    </div>
                                  )}
                                  
                                  {boardType === 'automated' && item.errorMessage && (
                                    <div className="flex items-center">
                                      <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                                      <span className="truncate max-w-[120px]">{item.errorMessage}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      
      {/* Item detail modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">{selectedItem.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedItem.priority)}`}>
                      {selectedItem.priority}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedItem.status)}`}>
                      {columns[selectedItem.status]?.title || selectedItem.status}
                    </span>
                  </div>
                </div>
                
                {selectedItem.description && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Description</h4>
                    <p className="mt-1 text-sm text-gray-500">{selectedItem.description}</p>
                  </div>
                )}
                
                {/* Additional details section */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {selectedItem.assignee && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Assignee</h4>
                      <div className="mt-1 flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                          {selectedItem.assignee.avatar ? (
                            <img 
                              src={selectedItem.assignee.avatar} 
                              alt={selectedItem.assignee.name}
                              className="h-8 w-8 rounded-full object-cover" 
                            />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <span className="ml-2 text-sm text-gray-900">{selectedItem.assignee.name}</span>
                      </div>
                    </div>
                  )}
                  
                  {selectedItem.dueDate && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Due Date</h4>
                      <div className="mt-1 flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                        <span>{selectedItem.dueDate}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Tags */}
                {selectedItem.tags && selectedItem.tags.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Tags</h4>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedItem.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Automated test specific info */}
                {boardType === 'automated' && (
                  <>
                    {selectedItem.errorMessage && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700">Error Message</h4>
                        <div className="mt-1 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-800 font-mono whitespace-pre-wrap">
                          {selectedItem.errorMessage}
                        </div>
                      </div>
                    )}
                    
                    {selectedItem.stackTrace && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700">Stack Trace</h4>
                        <div className="mt-1 overflow-auto max-h-60 p-3 bg-gray-800 text-gray-200 font-mono text-xs rounded">
                          <pre>{selectedItem.stackTrace}</pre>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowModal(false)}
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

export default KanbanBoard;