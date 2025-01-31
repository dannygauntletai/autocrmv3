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
      const parsedInput = typeof input === 'string' ? input : input.input;
      if (!parsedInput) {
        throw new Error('Input is required for knowledge base addition');
      }

      // Get service role key from environment
      const serviceRoleKey = this.config.supabaseKey;
      if (!serviceRoleKey) {
        throw new Error('Service role key is required for knowledge base operations');
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
          ticketId: this.config.ticketId
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("[AddToKnowledgebaseTool] Error response:", error);
        throw new Error(`Failed to add to knowledge base: ${error}`);
      }

      const result = await response.json();
      console.log("[AddToKnowledgebaseTool] Successfully added to knowledge base:", result);

      return JSON.stringify({
        success: true,
        data: result,
        context: {
          ticketId: this.config.ticketId,
          userId: this.config.aiEmployeeId,
          timestamp: Date.now(),
          metadata: {
            addedToKnowledgebase: true,
            articleId: result.id
          }
        }
      });
    } catch (error) {
      console.error("[AddToKnowledgebaseTool] Error:", error);
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