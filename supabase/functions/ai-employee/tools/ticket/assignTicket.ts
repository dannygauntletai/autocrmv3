import { Tool } from 'langchain/tools';
import { z } from 'zod';
import { BaseToolConfig, TicketToolResult } from './types.ts';
import type { Database } from '../../../../../types/database.types';

type TicketAssignment = Database['public']['Tables']['ticket_assignments']['Insert'];

export class AssignTicketTool extends Tool {
  name = "assign_ticket";
  description = "Assign a ticket to an employee. Input should be the employee_id (UUID) or a JSON string containing employee_id field.";
  
  override returnDirect = false;
  
  private config: BaseToolConfig;

  constructor(config: BaseToolConfig) {
    super();
    this.config = config;
  }

  /** @ignore */
  protected override async _call(input: string | { input: string }): Promise<string> {
    try {
      console.log("[AssignTicketTool] Received input:", input);
      
      // Get the employee ID from input
      let employeeId: string;
      try {
        const parsed = JSON.parse(typeof input === 'string' ? input : input.input);
        employeeId = parsed.employee_id;
      } catch {
        // If not JSON, use the raw input
        employeeId = (typeof input === 'string' ? input : input.input).trim();
      }
      
      console.log("[AssignTicketTool] Using employee ID:", employeeId);
      
      if (!employeeId?.trim()) {
        throw new Error("Employee ID is required");
      }

      if (!this.config.ticketId) {
        throw new Error("Ticket ID is required but not provided in tool configuration");
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
    const assignment: TicketAssignment = {
      ticket_id: this.config.ticketId,
      employee_id: employeeId,
      assigned_at: new Date().toISOString()
    };

    const response = await fetch(`${this.config.supabaseUrl}/functions/v1/assign-ticket-employee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.supabaseKey}`
      },
      body: JSON.stringify({
        ticketId: this.config.ticketId,
        employeeId: employeeId,
        reason: 'AI Employee assignment'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to assign ticket: ${error}`);
    }

    const result = await response.json();

    return {
      success: true,
      data: result.data,
      context: {
        ticketId: this.config.ticketId,
        userId: this.config.aiEmployeeId,
        timestamp: Date.now(),
        metadata: {
          assignedEmployee: result.data.employee
        }
      }
    };
  }
} 
