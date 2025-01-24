import { useState } from 'react';
import { BulkActionButton } from "./BulkActionButton";
import { BulkSelectionIndicator } from "./BulkSelectionIndicator";
import { useBulkTicketOperations } from './hooks/useBulkTicketOperations';
import { useEmployees } from './hooks/useEmployees';
import { TicketStatus, TicketPriority } from './types/common';

interface Props {
  selectedTicketIds: string[];
  onClearSelection: () => void;
  onOperationComplete: () => void;
}

export const BulkOperationsToolbar = ({
  selectedTicketIds,
  onClearSelection,
  onOperationComplete
}: Props) => {
  const [loading, setLoading] = useState(false);
  const { updateTicketsStatus, updateTicketsPriority, assignTicketsToEmployee } = useBulkTicketOperations();
  const { employees } = useEmployees();

  const handleStatusChange = async (status: string) => {
    setLoading(true);
    try {
      await updateTicketsStatus(selectedTicketIds, status.toLowerCase() as TicketStatus);
      onOperationComplete();
      onClearSelection();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityChange = async (priority: string) => {
    setLoading(true);
    try {
      await updateTicketsPriority(selectedTicketIds, priority.toLowerCase() as TicketPriority);
      onOperationComplete();
      onClearSelection();
    } catch (error) {
      console.error('Failed to update priority:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentChange = async (employeeId: string) => {
    setLoading(true);
    try {
      await assignTicketsToEmployee(selectedTicketIds, employeeId);
      onOperationComplete();
      onClearSelection();
    } catch (error) {
      console.error('Failed to assign tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedTicketIds.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <BulkSelectionIndicator count={selectedTicketIds.length} onClear={onClearSelection} />
        <div className="flex gap-2">
          <BulkActionButton 
            label="Status" 
            options={["Open", "Pending", "Resolved"]} 
            onSelect={handleStatusChange}
            disabled={loading}
          />
          <BulkActionButton 
            label="Priority" 
            options={["High", "Medium", "Low"]} 
            onSelect={handlePriorityChange}
            disabled={loading}
          />
          <BulkActionButton 
            label="Assign" 
            options={[
              ...employees.map((emp: { id: string, name: string }) => ({ 
                value: emp.id, 
                label: emp.name 
              })),
              { value: 'unassigned', label: 'Unassigned' }
            ]} 
            onSelect={handleAssignmentChange}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
};