import { useState } from 'react';
import { useTeamEmployees } from './hooks/useTeamEmployees';
import { supabase } from './lib/supabaseClient';

interface Props {
  ticketId: string;
}

export const EmployeeAssignmentPanel = ({ ticketId }: Props) => {
  const { employees, loading, error } = useTeamEmployees();
  const [assigningEmployee, setAssigningEmployee] = useState<string | null>(null);

  const handleAssign = async (employeeId: string) => {
    setAssigningEmployee(employeeId);
    try {
      // First, unassign any current assignments
      await supabase
        .from('employee_ticket_assignments')
        .update({ unassigned_at: new Date().toISOString() })
        .eq('ticket_id', ticketId)
        .is('unassigned_at', null);

      // Create new assignment
      await supabase
        .from('employee_ticket_assignments')
        .insert({
          ticket_id: ticketId,
          employee_id: employeeId,
          assigned_at: new Date().toISOString(),
        });
    } catch (err) {
      console.error('Error assigning ticket:', err);
    } finally {
      setAssigningEmployee(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg h-[30vh]">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Assign Ticket</h3>
        </div>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg h-[30vh]">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Assign Ticket</h3>
        </div>
        <div className="p-4 text-red-600">
          Error loading team members: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg h-[30vh]">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Assign Ticket</h3>
      </div>
      <div className="overflow-y-auto h-[calc(30vh-4rem)]">
        {employees.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No team members available for assignment
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium text-gray-900">{employee.name}</div>
                  <div className="text-sm text-gray-500">{employee.email}</div>
                  <div className="text-xs text-gray-400">{employee.role}</div>
                </div>
                <button
                  onClick={() => handleAssign(employee.id)}
                  disabled={assigningEmployee === employee.id}
                  className={`px-3 py-2 text-sm rounded-md transition-colors
                    ${
                      assigningEmployee === employee.id
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                >
                  {assigningEmployee === employee.id ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 