import { Tool } from 'langchain/tools';
import { createClient } from '@supabase/supabase-js';
import { ToolResult } from '../types.ts';

export class TicketAssignmentTool extends Tool {
  name = "ticket_assignment";
  description = "Assign tickets to agents using their email address.";
  
  private ticketId: string;
  private supabaseUrl: string;
  private supabaseKey: string;
  private supabase;
  private aiEmployeeId: string;

  constructor(
    ticketId: string,
    supabaseUrl: string,
    supabaseKey: string,
    aiEmployeeId = '00000000-0000-0000-0000-000000000000'
  ) {
    super();
    this.ticketId = ticketId;
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.aiEmployeeId = aiEmployeeId;
  }

  /** @ignore */
  async _call(input: string): Promise<string> {
    try {
      console.log("[TicketAssignmentTool] Starting ticket assignment for ticket ID:", this.ticketId);
      console.log("[TicketAssignmentTool] Raw input:", input);

      // Handle both direct email input and JSON input formats
      let agentEmail: string;
      try {
        const jsonInput = JSON.parse(input);
        agentEmail = jsonInput.employee_id || jsonInput.input?.employee_id;
        if (!agentEmail) {
          throw new Error("No email found in JSON input");
        }
      } catch (e) {
        // If JSON parsing fails, assume direct email input
        agentEmail = input.trim();
      }

      console.log("[TicketAssignmentTool] Parsed email:", agentEmail);

      const result = await this.assignTicket(agentEmail);
      return JSON.stringify(result, (_, value) => {
        if (value === undefined) return null;
        if (value instanceof Error) return value.message;
        return value;
      });
    } catch (error) {
      console.error("[TicketAssignmentTool] Error during assignment:", error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
        context: {
          ticketId: this.ticketId,
          userId: this.aiEmployeeId,
          timestamp: Date.now(),
          metadata: {
            error: true,
            errorType: error instanceof Error ? error.name : 'Unknown',
            rawInput: input
          }
        }
      });
    }
  }

  private async assignTicket(agentEmail: string): Promise<ToolResult> {
    try {
      console.log("[TicketAssignmentTool] Looking up employee with email:", agentEmail);
      
      if (!agentEmail || typeof agentEmail !== 'string') {
        throw new Error(`Invalid email format: ${agentEmail}`);
      }

      const normalizedEmail = agentEmail.toLowerCase().trim();
      console.log("[TicketAssignmentTool] Normalized email for lookup:", normalizedEmail);

      // First, get all employees to debug
      const { data: allEmployees, error: listError } = await this.supabase
        .from('employees')
        .select('id, email, name');
      
      console.log("[TicketAssignmentTool] All employees:", allEmployees);

      // Then, get the specific employee
      const { data: employee, error: employeeError } = await this.supabase
        .from('employees')
        .select('id, email, name')
        .eq('email', normalizedEmail)
        .single();

      console.log("[TicketAssignmentTool] Query result:", { employee, error: employeeError });

      if (employeeError) {
        console.error("[TicketAssignmentTool] Employee lookup failed:", employeeError);
        if (employeeError.code === 'PGRST116') {
          // This is the "not found" error code from PostgREST
          throw new Error(`Employee not found with email: ${agentEmail}. Available emails: ${allEmployees?.map(e => e.email).join(', ')}`);
        }
        throw new Error(`Employee lookup failed: ${employeeError.message}`);
      }

      if (!employee || !employee.id) {
        console.error("[TicketAssignmentTool] No employee found or missing ID:", employee);
        throw new Error(`Employee not found with email: ${agentEmail}`);
      }

      console.log("[TicketAssignmentTool] Found employee:", {
        id: employee.id,
        email: employee.email,
        name: employee.name
      });

      // Unassign any current assignments
      console.log("[TicketAssignmentTool] Unassigning current assignments");
      const { error: unassignError } = await this.supabase
        .from('employee_ticket_assignments')
        .update({ unassigned_at: new Date().toISOString() })
        .eq('ticket_id', this.ticketId)
        .is('unassigned_at', null);

      if (unassignError) {
        console.error("[TicketAssignmentTool] Error unassigning current assignments:", unassignError);
        throw unassignError;
      }

      // Create new assignment
      console.log("[TicketAssignmentTool] Creating new assignment");
      const { data: assignment, error: assignmentError } = await this.supabase
        .from('employee_ticket_assignments')
        .insert([
          {
            employee_id: employee.id,
            ticket_id: this.ticketId,
            assigned_at: new Date().toISOString(),
            assigned_by: this.aiEmployeeId
          }
        ])
        .select()
        .single();

      if (assignmentError) {
        console.error("[TicketAssignmentTool] Error creating assignment:", assignmentError);
        throw assignmentError;
      }

      console.log("[TicketAssignmentTool] Assignment successful:", assignment);

      return {
        success: true,
        data: {
          assignment,
          message: `Ticket successfully assigned to ${employee.name} (${agentEmail})`
        },
        context: {
          ticketId: this.ticketId,
          userId: this.aiEmployeeId,
          timestamp: Date.now(),
          metadata: {
            assignedTo: agentEmail,
            assignedToName: employee.name,
            assignmentId: assignment.id
          }
        }
      };
    } catch (error) {
      console.error("[TicketAssignmentTool] Assignment failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign ticket',
        context: {
          ticketId: this.ticketId,
          userId: this.aiEmployeeId,
          timestamp: Date.now(),
          metadata: {
            error: true,
            attempted_email: agentEmail
          }
        }
      };
    }
  }
} 
