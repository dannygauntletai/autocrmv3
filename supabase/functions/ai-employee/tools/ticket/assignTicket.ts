import { Tool } from 'langchain/tools';
import { z } from 'zod';
import { BaseToolConfig, TicketToolResult } from './types.ts';
import type { Database } from '../../../../../types/database.types';
import { createClient } from '@supabase/supabase-js';

type TicketAssignment = Database['public']['Tables']['ticket_assignments']['Insert'];

export class AssignTicketTool extends Tool {
  name = "assign_ticket";
  description = "Assign a ticket to an employee. Input should be the employee_id (UUID) or email address.";
  
  override returnDirect = false;
  
  private config: BaseToolConfig;
  private supabase;

  constructor(config: BaseToolConfig) {
    super();
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /** @ignore */
  protected override async _call(input: string | { input: string }): Promise<string> {
    try {
      console.log("[AssignTicketTool] Received input:", input);
      
      // Get the employee ID or email from input
      let employeeIdOrEmail: string;
      try {
        const parsed = JSON.parse(typeof input === 'string' ? input : input.input);
        employeeIdOrEmail = parsed.employee_id;
      } catch {
        // If not JSON, use the raw input
        employeeIdOrEmail = (typeof input === 'string' ? input : input.input).trim();
      }
      
      console.log("[AssignTicketTool] Using employee ID or email:", employeeIdOrEmail);
      
      if (!employeeIdOrEmail?.trim()) {
        throw new Error("Employee ID or email is required");
      }

      if (!this.config.ticketId) {
        throw new Error("Ticket ID is required but not provided in tool configuration");
      }

      // If input looks like an email, look up the employee ID
      let employeeId = employeeIdOrEmail;
      if (employeeIdOrEmail.includes('@')) {
        console.log("[AssignTicketTool] Input appears to be an email, looking up employee ID");
        const { data: employee, error: employeeError } = await this.supabase
          .from('employees')
          .select('id')
          .eq('email', employeeIdOrEmail.toLowerCase().trim())
          .single();

        if (employeeError || !employee) {
          console.error("[AssignTicketTool] Employee lookup failed:", employeeError);
          throw new Error(`Employee not found with email: ${employeeIdOrEmail}`);
        }
        employeeId = employee.id;
        console.log("[AssignTicketTool] Found employee ID:", employeeId);
      }

      console.log("[AssignTicketTool] Assigning ticket to employee:", employeeId);
      const result = await this.assignTicket(employeeId);
      console.log("[AssignTicketTool] Assignment result:", result);
      
      return JSON.stringify(result);
    } catch (error) {
      console.error("[AssignTicketTool] Error:", error);
      if (error instanceof Error) {
        console.error("[AssignTicketTool] Error stack:", error.stack);
      }
      
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
        context: {
          ticketId: this.config.ticketId,
          userId: this.config.aiEmployeeId,
          timestamp: Date.now(),
          metadata: {
            error: true,
            errorType: error instanceof Error ? error.name : 'Unknown',
            errorStack: error instanceof Error ? error.stack : undefined
          }
        }
      });
    }
  }

  private async assignTicket(employeeId: string): Promise<TicketToolResult> {
    try {
      // First unassign any current assignments
      console.log("[AssignTicketTool] Unassigning current assignments");
      const { error: unassignError } = await this.supabase
        .from('employee_ticket_assignments')
        .update({ unassigned_at: new Date().toISOString() })
        .eq('ticket_id', this.config.ticketId)
        .is('unassigned_at', null);

      if (unassignError) {
        console.error("[AssignTicketTool] Error unassigning current assignments:", unassignError);
        throw new Error(`Failed to unassign current assignments: ${unassignError.message}`);
      }

      // Create new assignment
      console.log("[AssignTicketTool] Creating new assignment");
      const { data: assignment, error: assignError } = await this.supabase
        .from('employee_ticket_assignments')
        .insert([{
          ticket_id: this.config.ticketId,
          employee_id: employeeId,
          assigned_at: new Date().toISOString()
        }])
        .select('*, employee:employees(*)')
        .single();

      if (assignError) {
        console.error("[AssignTicketTool] Error creating assignment:", assignError);
        throw new Error(`Failed to create assignment: ${assignError.message}`);
      }

      console.log("[AssignTicketTool] Assignment created successfully:", assignment);

      return {
        success: true,
        data: assignment,
        context: {
          ticketId: this.config.ticketId,
          userId: this.config.aiEmployeeId,
          timestamp: Date.now(),
          metadata: {
            assignedEmployee: assignment.employee
          }
        }
      };
    } catch (error) {
      console.error("[AssignTicketTool] Assignment failed:", error);
      throw error; // Let the _call method handle the error formatting
    }
  }
} 
