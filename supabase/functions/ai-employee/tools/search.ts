import { Tool } from 'langchain/tools';
import { createClient } from '@supabase/supabase-js';
import { ToolResult } from '../types.ts';
import type { Database } from "../../../../types/database.types.ts";

type TicketMessage = Database['public']['Tables']['ticket_messages']['Row'];

export class SearchTool extends Tool {
  name = "search";
  description = "Search through ticket history and messages. Input should be a JSON string with 'query' and optional 'filters' like date range.";
  
  private supabase;
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(
    supabaseUrl: string,
    supabaseKey: string
  ) {
    super();
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
    console.log("[SearchTool] Initialized with URL:", this.supabaseUrl);
  }

  /** @ignore */
  async _call(input: string): Promise<string> {
    try {
      console.log("[SearchTool] Received input:", input);
      const parsed = JSON.parse(input);
      console.log("[SearchTool] Parsed input:", parsed);
      const result = await this.searchMessages(parsed.query, parsed.filters);
      console.log("[SearchTool] Search result:", result);
      return JSON.stringify(result);
    } catch (error) {
      console.error("[SearchTool] Error in _call:", error);
      if (error instanceof Error) {
        return JSON.stringify({
          success: false,
          error: error.message
        });
      }
      return JSON.stringify({
        success: false,
        error: "An unknown error occurred"
      });
    }
  }

  private isTicketMessage(message: unknown): message is TicketMessage {
    const isValid = (
      message !== null &&
      typeof message === 'object' &&
      'id' in message &&
      'message_body' in message &&
      'created_at' in message &&
      'ticket_id' in message
    );
    console.log("[SearchTool] Message validation result:", { message, isValid });
    return isValid;
  }

  private async searchMessages(
    query: string,
    filters?: {
      dateRange?: { start: string; end: string };
    }
  ): Promise<ToolResult> {
    console.log("[SearchTool] Starting message search with:", { query, filters });

    const { data: messages, error: messageError } = await this.supabase
      .from('ticket_messages')
      .select(`
        id,
        message_body,
        created_at,
        updated_at,
        is_internal,
        sender_id,
        sender_type,
        ticket_id,
        tickets (
          title,
          status,
          priority,
          category
        )
      `)
      .textSearch('message_body', query)
      .eq('is_internal', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (messageError) {
      console.error("[SearchTool] Database error:", messageError);
      throw messageError;
    }

    console.log("[SearchTool] Raw messages from DB:", messages);

    if (!messages || !Array.isArray(messages)) {
      console.log("[SearchTool] No messages found or invalid response");
      return {
        success: true,
        data: [],
        context: {
          ticketId: 'global',
          userId: 'system',
          timestamp: Date.now(),
          metadata: {
            searchType: 'message',
            messagesFound: 0,
            filters: filters ?? 'none'
          }
        }
      };
    }

    // Filter valid messages
    const validMessages = messages.filter(this.isTicketMessage);
    console.log("[SearchTool] Valid messages after type check:", validMessages.length);

    let filteredMessages = validMessages;
    if (filters?.dateRange) {
      console.log("[SearchTool] Applying date range filter:", filters.dateRange);
      filteredMessages = filteredMessages.filter(message => {
        const isInRange = message.created_at && 
          message.created_at >= filters.dateRange!.start && 
          message.created_at <= filters.dateRange!.end;
        console.log("[SearchTool] Message date check:", { 
          messageId: message.id, 
          date: message.created_at, 
          isInRange 
        });
        return isInRange;
      });
    }

    const result = {
      success: true,
      data: filteredMessages,
      context: {
        ticketId: 'global',
        userId: 'system',
        timestamp: Date.now(),
        metadata: {
          searchType: 'message',
          messagesFound: filteredMessages.length,
          filters: filters ?? 'none'
        }
      }
    };

    console.log("[SearchTool] Final result:", result);
    return result;
  }
} 
