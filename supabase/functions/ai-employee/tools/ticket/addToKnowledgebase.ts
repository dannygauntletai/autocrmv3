import { Tool } from 'langchain/tools';
import { createClient } from '@supabase/supabase-js';
import { BaseToolConfig, TicketToolResult } from './types.ts';
import type { Database } from '../../../../../types/database.types';

export class AddToKnowledgebaseTool extends Tool {
  name = "add_to_knowledgebase";
  description = "Add a ticket to the knowledge base for future reference. Use this when a ticket contains valuable information that could help with similar issues in the future.";
  
  override returnDirect = false;
  
  private config: BaseToolConfig;
  private supabase;

  constructor(config: BaseToolConfig) {
    super();
    this.config = config;
    this.supabase = createClient<Database>(config.supabaseUrl, config.supabaseKey);
  }

  /** @ignore */
  protected override async _call(input: string | { input: string }): Promise<string> {
    try {
      console.log("[AddToKnowledgebaseTool] Starting knowledge base addition for ticket:", this.config.ticketId);
      
      // Parse input if needed
      let parsedInput: { tags?: string[], category?: string, reason?: string } = {};
      try {
        parsedInput = JSON.parse(typeof input === 'string' ? input : input.input);
      } catch {
        // If parsing fails, use empty defaults
        console.log("[AddToKnowledgebaseTool] Using default values for non-JSON input");
      }

      // Get service role key from environment
      const serviceRoleKey = this.config.supabaseKey;
      if (!serviceRoleKey) {
        throw new Error('Service role key is required for knowledge base operations');
      }

      // First, get the ticket details
      console.log("[AddToKnowledgebaseTool] Fetching ticket details");
      const { data: ticket, error: ticketError } = await this.supabase
        .from('tickets')
        .select(`
          *,
          ticket_messages (
            message_body,
            is_internal,
            created_at
          )
        `)
        .eq('id', this.config.ticketId)
        .single();

      if (ticketError) {
        console.error("[AddToKnowledgebaseTool] Error fetching ticket:", ticketError);
        throw new Error(`Failed to fetch ticket: ${ticketError.message}`);
      }

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Call the add-knowledgebase edge function
      console.log("[AddToKnowledgebaseTool] Calling edge function");
      const response = await fetch(`${this.config.supabaseUrl}/functions/v1/add-knowledgebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({
          ticketId: this.config.ticketId,
          tags: parsedInput.tags || [],
          category: parsedInput.category,
          metadata: {
            source: 'ticket',
            sourceId: this.config.ticketId,
            addedBy: this.config.aiEmployeeId,
            reason: parsedInput.reason || 'AI Employee identified valuable information'
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("[AddToKnowledgebaseTool] Error response:", error);
        throw new Error(`Failed to add to knowledge base: ${error}`);
      }

      const result = await response.json();
      console.log("[AddToKnowledgebaseTool] Successfully added to knowledge base:", result);

      // Add to ticket history
      const { error: historyError } = await this.supabase
        .from('ticket_history')
        .insert({
          ticket_id: this.config.ticketId,
          changed_by: this.config.aiEmployeeId,
          changes: {
            type: 'knowledge_base_addition',
            article: {
              id: result.id,
              title: result.title
            },
            tags: parsedInput.tags,
            category: parsedInput.category,
            reason: parsedInput.reason
          },
          created_at: new Date().toISOString()
        });

      if (historyError) {
        console.error("[AddToKnowledgebaseTool] Error adding to history:", historyError);
        // Don't throw here as the main operation was successful
      }

      return JSON.stringify({
        success: true,
        data: result,
        context: {
          ticketId: this.config.ticketId,
          userId: this.config.aiEmployeeId,
          timestamp: Date.now(),
          metadata: {
            addedToKnowledgebase: true,
            articleId: result.id,
            articleTitle: result.title,
            tags: parsedInput.tags,
            category: parsedInput.category
          }
        }
      });
    } catch (error) {
      console.error("[AddToKnowledgebaseTool] Error:", error);
      if (error instanceof Error) {
        console.error("[AddToKnowledgebaseTool] Error stack:", error.stack);
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
} 