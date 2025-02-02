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
      let metadata: Record<string, any> = {};
      
      try {
        const parsed = JSON.parse(input);
        note = parsed.note || parsed.message || parsed;
        metadata = parsed.metadata || {};
      } catch {
        // If not JSON, use the raw input
        note = input.trim();
      }

      console.log("[AddInternalNoteTool] Parsed note:", { note, metadata });

      if (!note || typeof note !== 'string' || note.trim().length === 0) {
        throw new Error('Note content is required and must be a non-empty string');
      }

      // Validate note length
      if (note.length > 10000) {
        throw new Error('Note content is too long. Maximum length is 10000 characters.');
      }

      const result = await this.addNote(note.trim(), metadata);
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
            error: true,
            errorType: error instanceof Error ? error.name : 'Unknown',
            errorStack: error instanceof Error ? error.stack : undefined
          }
        }
      });
    }
  }

  private async addNote(note: string, metadata: Record<string, any> = {}): Promise<TicketToolResult> {
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
          metadata: {
            ...metadata,
            source: 'ai_employee',
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (messageError) {
        console.error("[AddInternalNoteTool] Message error:", messageError);
        throw messageError;
      }

      if (!message) {
        throw new Error('Failed to create internal note');
      }

      console.log("[AddInternalNoteTool] Adding to ticket history");
      
      // Add to ticket history
      const { error: historyError } = await this.supabase
        .from('ticket_history')
        .insert({
          ticket_id: this.config.ticketId,
          changed_by: this.config.employeeId || this.config.aiEmployeeId,
          changes: {
            type: 'internal_note',
            note: {
              id: message.id,
              content: note
            },
            metadata
          },
          created_at: new Date().toISOString()
        });

      if (historyError) {
        console.error("[AddInternalNoteTool] History error:", historyError);
        // Don't throw here, as the note was successfully added
      }

      return {
        success: true,
        data: message,
        context: {
          ticketId: this.config.ticketId,
          userId: this.config.employeeId || this.config.aiEmployeeId,
          timestamp: Date.now(),
          metadata: {
            messageType: 'internal',
            messageId: message.id,
            ...metadata
          }
        }
      };
    } catch (error) {
      console.error("[AddInternalNoteTool] Add note error:", error);
      throw error; // Re-throw to be handled by the main try-catch
    }
  }
} 