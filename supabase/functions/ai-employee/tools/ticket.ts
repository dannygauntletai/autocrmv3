import { Tool } from "@langchain/core/tools";
import { createClient } from "@supabase/supabase-js";
import { ToolResult } from "../types.ts";
import { z } from "zod";

export class TicketManagementTool extends Tool {
  name = "ticket_management";
  description = "Manage ticket operations including reading details, updating status/priority, and adding comments. Input should be a JSON string with 'action' ('read', 'update', or 'comment') and optional 'params'.";
  
  private ticketId: string;
  private supabase;

  constructor(
    ticketId: string,
    supabaseUrl: string,
    supabaseKey: string
  ) {
    super();
    this.ticketId = ticketId;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /** @ignore */
  async _call(input: string): Promise<string> {
    try {
      const parsed = JSON.parse(input);
      const result = await this.executeAction(parsed);
      return JSON.stringify(result);
    } catch (error) {
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

  private async executeAction(args: { action: 'read' | 'update' | 'comment', params?: Record<string, any> }): Promise<ToolResult> {
    switch (args.action) {
      case 'read':
        return await this.readTicket();
      case 'update':
        return await this.updateTicket(args.params ?? {});
      case 'comment':
        if (!args.params?.comment) throw new Error("Comment text is required");
        return await this.addComment(args.params.comment);
      default:
        throw new Error(`Unknown action: ${args.action}`);
    }
  }

  private async readTicket(): Promise<ToolResult> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select(`
        *,
        customer:customer_id(*),
        assignee:assignee_id(*),
        messages(*)
      `)
      .eq('id', this.ticketId)
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      context: {
        ticketId: this.ticketId,
        userId: data.assignee_id,
        timestamp: Date.now(),
        metadata: {
          status: data.status,
          priority: data.priority
        }
      }
    };
  }

  private async updateTicket(params: Record<string, any>): Promise<ToolResult> {
    const { data, error } = await this.supabase
      .from('tickets')
      .update(params)
      .eq('id', this.ticketId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      context: {
        ticketId: this.ticketId,
        userId: data.assignee_id,
        timestamp: Date.now(),
        metadata: {
          status: data.status,
          priority: data.priority,
          updatedFields: Object.keys(params)
        }
      }
    };
  }

  private async addComment(comment: string): Promise<ToolResult> {
    const { data, error } = await this.supabase
      .from('ticket_comments')
      .insert({
        ticket_id: this.ticketId,
        content: comment,
        type: 'internal'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      context: {
        ticketId: this.ticketId,
        userId: data.created_by,
        timestamp: Date.now(),
        metadata: {
          commentId: data.id,
          commentType: 'internal'
        }
      }
    };
  }
} 
