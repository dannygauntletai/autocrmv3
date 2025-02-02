import { Tool } from 'langchain/tools';
import { createClient } from '@supabase/supabase-js';
import { BaseToolConfig, TicketToolResult } from './types.ts';

export class AddInternalNoteTool extends Tool {
  name = "add_internal_note";
  description = "Add an internal note to a ticket. This note will only be visible to employees, not customers.";
  
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
      console.log("[AddInternalNoteTool] Received input:", input);
      
      // Parse the input as JSON if it's a JSON string
      let note: string;
      
      try {
        const parsed = JSON.parse(input);
        note = parsed.note || parsed.message || parsed;
      } catch {
        // If not JSON, use the raw input
        note = input.trim();
      }

      console.log("[AddInternalNoteTool] Parsed note:", { note });

      if (!note || typeof note !== 'string' || note.trim().length === 0) {
        throw new Error('Note content is required and must be a non-empty string');
      }

      // Validate note length
      if (note.length > 10000) {
        throw new Error('Note content is too long. Maximum length is 10000 characters.');
      }

      const result = await this.addNote(note.trim());
      console.log("[AddInternalNoteTool] Add note result:", result);
      
      return JSON.stringify(result);
    } catch (error) {
      console.error("[AddInternalNoteTool] Error:", error);
      if (error instanceof Error) {
        console.error("[AddInternalNoteTool] Error stack:", error.stack);
      }
      
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
        context: {
          ticketId: this.config.ticketId,
          userId: this.config.aiEmployeeId,
          timestamp: Date.now(),
          metadata: {
            source: 'ai_employee',
            messageType: 'internal_note',
            error: true,
            errorType: error instanceof Error ? error.name : 'Unknown',
            errorStack: error instanceof Error ? error.stack : undefined
          }
        }
      });
    }
  }

  private async addNote(note: string): Promise<TicketToolResult> {
    try {
      console.log("[AddInternalNoteTool] Adding internal note");
      
      // Add the internal note as a ticket message
      const { data: message, error: messageError } = await this.supabase
        .from('ticket_messages')
        .insert({
          ticket_id: this.config.ticketId,
          message_body: note,
          sender_type: 'employee',
          sender_id: this.config.employeeId || this.config.aiEmployeeId,
          is_internal: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (messageError) {
        console.error("[AddInternalNoteTool] Message error:", messageError);
        throw messageError;
      }

      return {
        success: true,
        data: {
          message: message,
          ticketId: this.config.ticketId
        },
        context: {
          ticketId: this.config.ticketId,
          userId: this.config.employeeId || this.config.aiEmployeeId,
          timestamp: Date.now(),
          metadata: {
            source: 'ai_employee',
            messageType: 'internal_note'
          }
        }
      };
    } catch (error) {
      console.error("[AddInternalNoteTool] Error adding note:", error);
      throw error;
    }
  }
} 