import { Tool } from 'langchain/tools';
import { BaseToolConfig, TicketStatus, TicketToolResult } from './types.ts';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

export class UpdateTicketStatusTool extends Tool {
  name = "update_ticket_status";
  description = "Update the status of a ticket. Input must be a JSON string containing a 'status' field with one of these values: new, open, pending, resolved, closed. Example: {\"status\": \"open\"}";
  
  override returnDirect = false;
  
  private config: BaseToolConfig;
  private supabase;

  constructor(config: BaseToolConfig) {
    super();
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /** @ignore */
  async _call(input: string | { input: string }): Promise<string> {
    try {
      console.log("[UpdateTicketStatusTool] Received input:", input);
      
      // Handle both string and object input
      const inputStr = typeof input === 'string' ? input : input.input;
      console.log("[UpdateTicketStatusTool] Parsed input string:", inputStr);
      
      // First try to parse as JSON
      let parsedInput: { status: string };
      try {
        parsedInput = JSON.parse(inputStr);
        console.log("[UpdateTicketStatusTool] Parsed JSON:", parsedInput);
        
        if (!parsedInput.status) {
          throw new Error("Input must contain a 'status' field");
        }
      } catch (parseError) {
        console.log("[UpdateTicketStatusTool] JSON parse error:", parseError);
        // If JSON parsing fails, check if input is a valid status string
        const rawStatus = inputStr.trim().toLowerCase();
        console.log("[UpdateTicketStatusTool] Trying raw status:", rawStatus);
        
        const validStatuses: TicketStatus[] = ['new', 'open', 'pending', 'resolved', 'closed'];
        if (validStatuses.includes(rawStatus as TicketStatus)) {
          parsedInput = { status: rawStatus };
        } else {
          throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}. Input should be a JSON string like: {"status": "open"}`);
        }
      }

      const status = parsedInput.status.toLowerCase() as TicketStatus;
      console.log("[UpdateTicketStatusTool] Final status to update:", status);
      
      const result = await this.updateStatus(status);
      console.log("[UpdateTicketStatusTool] Update result:", result);
      
      return JSON.stringify(result);
    } catch (error) {
      console.error("[UpdateTicketStatusTool] Error:", error);
      if (error instanceof Error) {
        console.error("[UpdateTicketStatusTool] Error stack:", error.stack);
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
            errorDetails: error instanceof Error ? error.stack : undefined
          }
        }
      });
    }
  }

  private async updateStatus(status: string): Promise<TicketToolResult> {
    try {
      // Validate status
      const validStatuses: TicketStatus[] = ['new', 'open', 'pending', 'resolved', 'closed'];
      if (!validStatuses.includes(status as TicketStatus)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      }

      console.log("[UpdateTicketStatusTool] Making API request with:", {
        ticketId: this.config.ticketId,
        status: status
      });

      // Get current ticket status first
      const { data: currentTicket, error: fetchError } = await this.supabase
        .from('tickets')
        .select('status')
        .eq('id', this.config.ticketId)
        .single();

      if (fetchError) {
        console.error("[UpdateTicketStatusTool] Fetch error:", fetchError);
        throw fetchError;
      }
      
      if (!currentTicket) {
        console.error("[UpdateTicketStatusTool] Ticket not found:", this.config.ticketId);
        throw new Error(`Ticket not found with ID: ${this.config.ticketId}`);
      }

      const oldStatus = currentTicket.status;

      // Update ticket status directly with Supabase client
      const { data: updatedTicket, error: updateError } = await this.supabase
        .from('tickets')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.config.ticketId)
        .select()
        .single();

      if (updateError) {
        console.error("[UpdateTicketStatusTool] Update error:", updateError);
        throw updateError;
      }

      if (!updatedTicket) {
        throw new Error('Failed to update ticket status');
      }

      // Add to ticket history
      const { error: historyError } = await this.supabase
        .from('ticket_history')
        .insert({
          ticket_id: this.config.ticketId,
          changed_by: this.config.aiEmployeeId,
          changes: {
            status: {
              old: oldStatus,
              new: status
            },
            reason: 'AI Employee update'
          },
          created_at: new Date().toISOString()
        });

      if (historyError) {
        console.error("[UpdateTicketStatusTool] History error:", historyError);
        // Don't throw here, as the status update was successful
      }

      return {
        success: true,
        data: updatedTicket,
        context: {
          ticketId: this.config.ticketId,
          userId: this.config.aiEmployeeId,
          timestamp: Date.now(),
          metadata: {
            oldStatus: oldStatus,
            newStatus: status,
            updatedVia: 'supabase-client'
          }
        }
      };
    } catch (error) {
      console.error("[UpdateTicketStatusTool] Update status error:", error);
      throw error; // Re-throw to be handled by the main try-catch
    }
  }
} 
