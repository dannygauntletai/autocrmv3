import { Tool } from 'langchain/tools';
import { z } from 'zod';
import { BaseToolConfig, TicketToolResult } from './types.ts';
import { AssignmentAction } from '../../types.ts';
import type { Database } from '../../../../../types/database.types';
import { createClient } from '@supabase/supabase-js';
import { AssignTeamTool } from './assignTeam.ts';

type TicketAssignment = Database['public']['Tables']['ticket_assignments']['Insert'];

export class AssignTicketTool extends Tool {
  name = "assign_ticket";
  description = "Assign a ticket to an employee. Input should be the employee_id (UUID) or email address.";
  
  override returnDirect = false;
  
  private config: BaseToolConfig;
  private supabase;
  private assignTeamTool: AssignTeamTool;

  constructor(config: BaseToolConfig) {
    super();
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.assignTeamTool = new AssignTeamTool(config);
  }

  /** @ignore */
  protected override async _call(input: string | { input: string }): Promise<string> {
    try {
      console.log("[AssignTicketTool] Received input:", input);
      
      // Parse the input to determine if it's a team or employee assignment
      let action: AssignmentAction;
      try {
        const parsed = JSON.parse(typeof input === 'string' ? input : input.input);
        action = {
          type: parsed.type || 'employee',
          target: parsed.target || parsed.employee_id || parsed.team_id || parsed,
          reason: parsed.reason
        };
      } catch {
        // If parsing fails, assume it's an employee assignment
        action = {
          type: 'employee',
          target: (typeof input === 'string' ? input : input.input).trim()
        };
      }

      // If this is a team assignment, redirect to AssignTeamTool
      if (action.type === 'team') {
        console.log("[AssignTicketTool] Redirecting team assignment to AssignTeamTool");
        const teamResult = await this.assignTeamTool.call(JSON.stringify(action));
        return teamResult;
      }
      
      // Handle employee assignment
      console.log("[AssignTicketTool] Handling employee assignment");
      
      if (!action.target?.trim()) {
        throw new Error("Employee ID or email is required");
      }

      if (!this.config.ticketId) {
        throw new Error("Ticket ID is required but not provided in tool configuration");
      }

      // If input looks like an email, look up the employee ID
      let employeeId = action.target;
      if (action.target.includes('@')) {
        console.log("[AssignTicketTool] Input appears to be an email, looking up employee ID");
        const { data: employee, error: employeeError } = await this.supabase
          .from('employees')
          .select('id')
          .eq('email', action.target.toLowerCase().trim())
          .single();

        if (employeeError || !employee) {
          console.error("[AssignTicketTool] Employee lookup failed:", employeeError);
          throw new Error(`Employee not found with email: ${action.target}`);
        }
        employeeId = employee.id;
        console.log("[AssignTicketTool] Found employee ID:", employeeId);
      }

      console.log("[AssignTicketTool] Assigning ticket to employee:", employeeId);
      const result = await this.assignTicket(employeeId, action.reason);
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

  private async assignTicket(employeeId: string, reason?: string): Promise<TicketToolResult> {
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
      const { data: assignment, error: assignError } = await this.supabase
        .from('employee_ticket_assignments')
        .insert([{
          ticket_id: this.config.ticketId,
          employee_id: employeeId,
          assigned_at: new Date().toISOString()
        }])
        .select('*, employee:employees(*)')
        .single();

      if (assignError || !assignment) {
        console.error("[AssignTicketTool] Error creating assignment:", assignError);
        throw new Error(`Failed to create assignment: ${assignError?.message || 'Unknown error'}`);
      }

      // Add to ticket history if reason provided
      if (reason) {
        await this.supabase
          .from('ticket_history')
          .insert({
            ticket_id: this.config.ticketId,
            action: 'assign_employee',
            changed_by: this.config.aiEmployeeId,
            changes: {
              employee: {
                id: assignment.employee.id,
                name: assignment.employee.name
              },
              reason
            },
            created_at: new Date().toISOString()
          });
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
            assignedEmployee: assignment.employee,
            reason
          }
        }
      };
    } catch (error) {
      console.error("[AssignTicketTool] Assignment failed:", error);
      throw error; // Let the _call method handle the error formatting
    }
  }
} 
