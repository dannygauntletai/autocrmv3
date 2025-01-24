import { useState } from 'react';
import { useTeamEmployees } from './hooks/useTeamEmployees';
import { useTicketAssignment } from './hooks/useTicketAssignment';
import { useEmployeeRole } from './hooks/useEmployeeRole';
import { supabase } from './lib/supabaseClient';

interface Props {
  ticketId: string;
}

export const EmployeeAssignmentPanel = ({ ticketId }: Props) => {
  const { role, loading: roleLoading } = useEmployeeRole();
  const { employees, loading: employeesLoading, error: employeesError } = useTeamEmployees();
  const { assignments, loading: assignmentsLoading, error: assignmentsError } = useTicketAssignment(ticketId);
  const [assigningEmployee, setAssigningEmployee] = useState<string | null>(null);

  // Hide panel if not a supervisor
  if (roleLoading) return null;
  if (role !== 'supervisor' && role !== 'admin') return null;

  const handleAssignToggle = async (employeeId: string) => {
    setAssigningEmployee(employeeId);
    try {
      const isCurrentlyAssigned = assignments[employeeId];

      if (isCurrentlyAssigned) {
        // Unassign the employee
        await supabase
          .from('employee_ticket_assignments')
          .update({ unassigned_at: new Date().toISOString() })
          .eq('ticket_id', ticketId)
          .eq('employee_id', employeeId)
          .is('unassigned_at', null);
      } else {
        // Check if there's an existing record
        const { data: existingAssignment } = await supabase
          .from('employee_ticket_assignments')
          .select('id')
          .eq('ticket_id', ticketId)
          .eq('employee_id', employeeId)
          .single();

        if (existingAssignment) {
          // Re-assign by setting unassigned_at to null
          await supabase
            .from('employee_ticket_assignments')
            .update({ unassigned_at: null })
            .eq('ticket_id', ticketId)
            .eq('employee_id', employeeId);
        } else {
          // Create new assignment
          await supabase
            .from('employee_ticket_assignments')
            .insert({
              ticket_id: ticketId,
              employee_id: employeeId,
              assigned_at: new Date().toISOString(),
            });
        }

        // Unassign any other employees
        await supabase
          .from('employee_ticket_assignments')
          .update({ unassigned_at: new Date().toISOString() })
          .eq('ticket_id', ticketId)
          .neq('employee_id', employeeId)
          .is('unassigned_at', null);
      }
    } catch (err) {
      console.error('Error toggling assignment:', err);
    } finally {
      setAssigningEmployee(null);
    }
  };

  const loading = employeesLoading || assignmentsLoading;
  const error = employeesError || assignmentsError;

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
            {employees.map((employee) => {
              const isAssigned = assignments[employee.id] || false;
              return (
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
                    onClick={() => handleAssignToggle(employee.id)}
                    disabled={assigningEmployee === employee.id}
                    className={`px-3 py-2 text-sm rounded-md transition-colors
                      ${assigningEmployee === employee.id
                        ? 'bg-gray-100 text-gray-400'
                        : isAssigned
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                  >
                    {assigningEmployee === employee.id
                      ? 'Processing...'
                      : isAssigned
                        ? 'Unassign'
                        : 'Assign'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}; 