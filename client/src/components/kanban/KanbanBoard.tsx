import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Plus, Trash } from 'lucide-react';
import { Spinner } from '../ui/spinner';

type KanbanItem = {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  createdById?: string;
  createdAt: Date;
  updatedAt: Date;
};

type KanbanColumn = {
  id: string;
  title: string;
  items: KanbanItem[];
};

type KanbanBoardProps = {
  resourceType: 'failures' | 'test-cases';
  onItemClick?: (item: KanbanItem) => void;
  onAddItem?: (columnId: string) => void;
  customColumns?: KanbanColumn[];
  isReadOnly?: boolean;
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  resourceType,
  onItemClick,
  onAddItem,
  customColumns,
  isReadOnly = false,
}) => {
  const [columns, setColumns] = useState<KanbanColumn[]>(
    customColumns || [
      { id: 'new', title: 'New', items: [] },
      { id: 'in-progress', title: 'In Progress', items: [] },
      { id: 'blocked', title: 'Blocked', items: [] },
      { id: 'resolved', title: 'Resolved', items: [] },
    ]
  );

  const { isLoading } = useQuery({
    queryKey: [`/api/${resourceType}`],
    onSuccess: (data: KanbanItem[]) => {
      if (!customColumns) {
        // Group items by status
        const newColumns = [...columns];
        
        // Reset items
        newColumns.forEach(column => {
          column.items = [];
        });
        
        // Distribute items to columns
        data.forEach(item => {
          const columnIndex = newColumns.findIndex(col => col.id === item.status);
          if (columnIndex !== -1) {
            newColumns[columnIndex].items.push(item);
          } else {
            // Add to first column if status doesn't match any column
            newColumns[0].items.push(item);
          }
        });
        
        setColumns(newColumns);
      }
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return fetch(`/api/${resourceType}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update item');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${resourceType}`] });
    },
  });

  const onDragEnd = (result: any) => {
    if (isReadOnly) return;
    
    const { destination, source, draggableId } = result;

    // If there's no destination or it's the same as source, do nothing
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Find source and destination columns
    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);
    
    if (!sourceColumn || !destColumn) return;

    // Copy the arrays to avoid mutation
    const newColumns = [...columns];
    const sourceItems = [...sourceColumn.items];
    
    // Remove the item from the source column
    const [movedItem] = sourceItems.splice(source.index, 1);
    
    // Different destination
    if (source.droppableId !== destination.droppableId) {
      // Update the status of the moved item
      movedItem.status = destination.droppableId;
      
      // Update in the database
      updateItemMutation.mutate({
        id: movedItem.id,
        status: destination.droppableId,
      });
      
      const destItems = [...destColumn.items];
      destItems.splice(destination.index, 0, movedItem);
      
      // Update the columns state
      newColumns.forEach(col => {
        if (col.id === source.droppableId) {
          col.items = sourceItems;
        } else if (col.id === destination.droppableId) {
          col.items = destItems;
        }
      });
    } else {
      // Same column, just reorder
      sourceItems.splice(destination.index, 0, movedItem);
      
      // Update the column
      newColumns.forEach(col => {
        if (col.id === source.droppableId) {
          col.items = sourceItems;
        }
      });
    }
    
    setColumns(newColumns);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 min-h-[400px]">
          {columns.map(column => (
            <div key={column.id} className="w-72 flex-shrink-0">
              <div className="bg-gray-100 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-700">
                    {column.title} ({column.items.length})
                  </h3>
                  {!isReadOnly && onAddItem && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onAddItem(column.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="min-h-[300px]"
                    >
                      {column.items.map((item, index) => (
                        <Draggable
                          key={item.id.toString()}
                          draggableId={item.id.toString()}
                          index={index}
                          isDragDisabled={isReadOnly}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="mb-2"
                            >
                              <Card 
                                className="p-3 shadow-sm hover:shadow cursor-pointer"
                                onClick={() => onItemClick?.(item)}
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium text-sm mb-1 text-gray-900 truncate">
                                      {item.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(item.priority)}`}>
                                    {item.priority}
                                  </span>
                                  
                                  {item.assignedTo && (
                                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                                      {item.assignedTo.substring(0, 1).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};