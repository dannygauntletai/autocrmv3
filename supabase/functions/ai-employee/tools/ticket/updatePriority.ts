import { Tool } from 'langchain/tools';
import { BaseToolConfig, TicketPriority, TicketToolResult } from './types.ts';
import { createClient } from '@supabase/supabase-js';

export class UpdateTicketPriorityTool extends Tool {
  name = "update_ticket_priority";
  description = "Update the priority of a ticket. Valid priorities are: low, medium, high, urgent.";
  
  private config: BaseToolConfig;
  private supabase;

  constructor(config: BaseToolConfig) {
    super();
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /** @ignore */
  async _call(input: string): Promise<string> {
    try {
      console.log("[UpdateTicketPriorityTool] Received input:", input);
      
      // Parse the input as JSON if it's a JSON string
      let priority: string;
      let reason: string | undefined;
      try {
        const parsed = JSON.parse(input);
        priority = parsed.priority;
        reason = parsed.reason;
      } catch {
        // If not JSON, use the raw input
        priority = input.trim().toLowerCase();
      }

      console.log("[UpdateTicketPriorityTool] Parsed priority:", priority);
      
      const result = await this.updatePriority(priority, reason);
      console.log("[UpdateTicketPriorityTool] Update result:", result);
      
      return JSON.stringify(result);
    } catch (error) {
      console.error("[UpdateTicketPriorityTool] Error:", error);
      if (error instanceof Error) {
        console.error("[UpdateTicketPriorityTool] Error stack:", error.stack);
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

  private async updatePriority(priority: string, reason?: string): Promise<TicketToolResult> {
    try {
      // Validate priority
      const validPriorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(priority as TicketPriority)) {
        throw new Error(`Invalid priority: ${priority}. Must be one of: ${validPriorities.join(', ')}`);
      }

      console.log("[UpdateTicketPriorityTool] Getting current ticket priority");
      
      // Get current ticket priority first
      const { data: currentTicket, error: fetchError } = await this.supabase
        .from('tickets')
        .select('priority')
        .eq('id', this.config.ticketId)
        .single();

      if (fetchError) {
        console.error("[UpdateTicketPriorityTool] Fetch error:", fetchError);
        throw fetchError;
      }

      if (!currentTicket) {
        console.error("[UpdateTicketPriorityTool] Ticket not found:", this.config.ticketId);
        throw new Error(`Ticket not found with ID: ${this.config.ticketId}`);
      }

      const oldPriority = currentTicket.priority;

      console.log("[UpdateTicketPriorityTool] Updating ticket priority");
      
      // Update ticket priority directly with Supabase client
      const { data: updatedTicket, error: updateError } = await this.supabase
        .from('tickets')
        .update({ 
          priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.config.ticketId)
        .select()
        .single();

      if (updateError) {
        console.error("[UpdateTicketPriorityTool] Update error:", updateError);
        throw updateError;
      }

      if (!updatedTicket) {
        throw new Error('Failed to update ticket priority');
      }

      // Add to ticket history
      const { error: historyError } = await this.supabase
        .from('ticket_history')
        .insert({
          ticket_id: this.config.ticketId,
          changed_by: this.config.aiEmployeeId,
          changes: {
            priority: {
              old: oldPriority,
              new: priority
            },
            reason: reason || 'AI Employee update'
          },
          created_at: new Date().toISOString()
        });

      if (historyError) {
        console.error("[UpdateTicketPriorityTool] History error:", historyError);
        // Don't throw here, as the priority update was successful
      }

      return {
        success: true,
        data: updatedTicket,
        context: {
          ticketId: this.config.ticketId,
          userId: this.config.aiEmployeeId,
          timestamp: Date.now(),
          metadata: {
            oldPriority,
            newPriority: priority,
            reason,
            updatedVia: 'supabase-client'
          }
        }
      };
    } catch (error) {
      console.error("[UpdateTicketPriorityTool] Update priority error:", error);
      throw error; // Re-throw to be handled by the main try-catch
    }
  }
} 