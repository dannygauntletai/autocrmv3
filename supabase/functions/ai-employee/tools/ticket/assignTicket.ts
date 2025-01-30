import { Tool } from 'langchain/tools';
import { BaseToolConfig, TicketToolResult } from './types.ts';

export class AssignTicketTool extends Tool {
  name = "assign_ticket";
  description = "Assign a ticket to an employee based on their skills and current workload. Input should be a JSON string with {employeeId: string, reason?: string}.";
  
  private config: BaseToolConfig;

  constructor(config: BaseToolConfig) {
    super();
    this.config = config;
  }

  /** @ignore */
  protected override async _call(input: string): Promise<string> {
    try {
      const params = JSON.parse(input);
      const result = await this.assignTicket(params);
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
        context: {
          ticketId: this.config.ticketId,
          userId: this.config.aiEmployeeId,
          timestamp: Date.now(),
          metadata: {
            error: true,
            errorType: error instanceof Error ? error.name : 'Unknown'
          }
        }
      });
    }
  }

  private async assignTicket(params: { employeeId: string; reason?: string }): Promise<TicketToolResult> {
    const response = await fetch(`${this.config.supabaseUrl}/functions/v1/assign-ticket-employee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.supabaseKey}`
      },
      body: JSON.stringify({
        ticketId: this.config.ticketId,
        employeeId: params.employeeId,
        reason: params.reason || 'AI Employee assignment'
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
          assignedEmployee: result.data.employee,
          reason: params.reason
        }
      }
    };
  }
} 
