import { Tool } from 'langchain/tools';
import { BaseToolConfig, TicketPriority, TicketToolResult } from './types.ts';

export class UpdateTicketPriorityTool extends Tool {
  name = "update_ticket_priority";
  description = "Update the priority of a ticket. Valid priorities are: low, medium, high, urgent.";
  
  private config: BaseToolConfig;

  constructor(config: BaseToolConfig) {
    super();
    this.config = config;
  }

  /** @ignore */
  async _call(input: string): Promise<string> {
    try {
      // Parse the input as JSON if it's a JSON string
      let priority: string;
      try {
        const parsed = JSON.parse(input);
        priority = parsed.priority;
      } catch {
        // If not JSON, use the raw input
        priority = input.trim().toLowerCase();
      }

      const result = await this.updatePriority(priority);
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

  private async updatePriority(priority: string): Promise<TicketToolResult> {
    // Validate priority
    const validPriorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority as TicketPriority)) {
      throw new Error(`Invalid priority: ${priority}. Must be one of: ${validPriorities.join(', ')}`);
    }

    // Call the edge function
    const response = await fetch(`${this.config.supabaseUrl}/functions/v1/update-ticket-priority`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.supabaseKey}`
      },
      body: JSON.stringify({
        ticketId: this.config.ticketId,
        priority: priority,
        reason: 'AI Employee update'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update ticket priority');
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
          oldPriority: result.data.priority,
          newPriority: priority,
          updatedVia: 'edge-function'
        }
      }
    };
  }
} 