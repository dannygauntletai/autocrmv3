import { supabase } from '../lib/supabase';
import { TicketStatus, TicketPriority } from '../types/common';

export const useBulkTicketOperations = () => {
  const updateTicketsStatus = async (ticketIds: string[], status: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', ticketIds);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating tickets status:', err);
      throw err;
    }
  };

  const updateTicketsPriority = async (ticketIds: string[], priority: TicketPriority) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          priority,
          updated_at: new Date().toISOString()
        })
        .in('id', ticketIds);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating tickets priority:', err);
      throw err;
    }
  };

  const assignTicketsToEmployee = async (ticketIds: string[], employeeId: string) => {
    try {
      // First unassign any existing assignments for these tickets
      await supabase
        .from('employee_ticket_assignments')
        .update({ unassigned_at: new Date().toISOString() })
        .in('ticket_id', ticketIds)
        .is('unassigned_at', null);

      // If not unassigning, create new assignments
      if (employeeId !== 'unassigned') {
        const assignments = ticketIds.map(ticketId => ({
          ticket_id: ticketId,
          employee_id: employeeId,
          assigned_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('employee_ticket_assignments')
          .insert(assignments);

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error assigning tickets:', err);
      throw err;
    }
  };

  return {
    updateTicketsStatus,
    updateTicketsPriority,
    assignTicketsToEmployee
  };
}; 