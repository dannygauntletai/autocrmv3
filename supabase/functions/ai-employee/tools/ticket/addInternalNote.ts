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
      // Parse the input as JSON if it's a JSON string
      let note: string;
      try {
        const parsed = JSON.parse(input);
        note = parsed.note;
      } catch {
        // If not JSON, use the raw input
        note = input.trim();
      }

      if (!note) {
        throw new Error('Note content is required');
      }

      const result = await this.addNote(note);
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

  private async addNote(note: string): Promise<TicketToolResult> {
    // Add the internal note as a ticket message
    const { data: message, error: messageError } = await this.supabase
      .from('ticket_messages')
      .insert({
        ticket_id: this.config.ticketId,
        message_body: note,
        sender_type: 'employee',
        sender_id: this.config.aiEmployeeId,
        is_internal: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Add to ticket history
    const { error: historyError } = await this.supabase
      .from('ticket_history')
      .insert({
        ticket_id: this.config.ticketId,
        changed_by: this.config.aiEmployeeId,
        changes: {
          type: 'internal_note',
          note: {
            id: message.id,
            content: note
          }
        },
        created_at: new Date().toISOString()
      });

    if (historyError) throw historyError;

    return {
      success: true,
      data: message,
      context: {
        ticketId: this.config.ticketId,
        userId: this.config.aiEmployeeId,
        timestamp: Date.now(),
        metadata: {
          messageType: 'internal',
          messageId: message.id
        }
      }
    };
  }
} 