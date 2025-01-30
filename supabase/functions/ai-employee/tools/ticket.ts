import { Tool } from 'langchain/tools';
import { createClient } from '@supabase/supabase-js';
import { ToolResult } from '../types.ts';
import { z } from "zod";

interface TicketMessage {
  id: string;
  message_body: string;
  sender_type: string;
  created_at: string;
  metadata?: Record<string, any>;
}

interface TicketComment {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
}

interface TicketHistory {
  id: string;
  ticket_id: string;
  action: string;
  changes: Record<string, any>;
  created_at: string;
}

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
    // Get ticket with related data
    const { data: ticket, error: ticketError } = await this.supabase
      .from('tickets')
      .select(`
        *,
        employee_ticket_assignments!left(
          employee:employees(*)
        ),
        ticket_messages(
          id,
          message_body,
          sender_type,
          created_at,
          metadata
        ),
        ticket_comments(
          id,
          content,
          created_at,
          created_by
        )
      `)
      .eq('id', this.ticketId)
      .is('employee_ticket_assignments.unassigned_at', null)
      .single();

    if (ticketError) throw ticketError;

    // Get ticket history
    const { data: history, error: historyError } = await this.supabase
      .from('ticket_history')
      .select('id, ticket_id, changed_by, changes, created_at')
      .eq('ticket_id', this.ticketId)
      .order('created_at', { ascending: true });

    if (historyError) throw historyError;

    // Format messages chronologically
    const messages = ticket.ticket_messages || [];
    const comments = ticket.ticket_comments || [];
    const timeline = [
      ...messages.map((m: TicketMessage) => ({
        type: 'message',
        ...m,
        timestamp: m.created_at
      })),
      ...comments.map((c: TicketComment) => ({
        type: 'comment',
        ...c,
        timestamp: c.created_at
      })),
      ...history.map((h: TicketHistory) => ({
        type: 'history',
        ...h,
        timestamp: h.created_at
      }))
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      success: true,
      data: {
        ticket: {
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
          email: ticket.email,
          assignee: ticket.employee_ticket_assignments?.[0]?.employee || null,
          tags: ticket.tags
        },
        timeline,
        stats: {
          messageCount: messages.length,
          commentCount: comments.length,
          historyCount: history.length,
          lastActivity: timeline[timeline.length - 1]?.timestamp
        }
      },
      context: {
        ticketId: this.ticketId,
        userId: ticket.employee_ticket_assignments?.[0]?.employee?.id || null,
        timestamp: Date.now(),
        metadata: {
          status: ticket.status,
          priority: ticket.priority,
          hasMessages: messages.length > 0,
          hasComments: comments.length > 0,
          hasHistory: history.length > 0
        }
      }
    };
  }

  private async updateTicket(params: Record<string, any>): Promise<ToolResult> {
    // Validate status changes
    if (params.status) {
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(params.status)) {
        throw new Error(`Invalid status: ${params.status}. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Validate priority changes
    if (params.priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(params.priority)) {
        throw new Error(`Invalid priority: ${params.priority}. Must be one of: ${validPriorities.join(', ')}`);
      }
    }

    // Update the ticket
    const { data: ticket, error: updateError } = await this.supabase
      .from('tickets')
      .update({
        ...params,
        updated_at: new Date().toISOString()
      })
      .eq('id', this.ticketId)
      .select(`
        *,
        employee_ticket_assignments!left(
          employee:employees(*)
        )
      `)
      .single();

    if (updateError) throw updateError;

    // Add to ticket history
    const { error: historyError } = await this.supabase
      .from('ticket_history')
      .insert({
        ticket_id: this.ticketId,
        changed_by: 'ai-employee',  // Since this is the AI making the change
        changes: params,
        created_at: new Date().toISOString()
      });

    if (historyError) throw historyError;

    return {
      success: true,
      data: ticket,
      context: {
        ticketId: this.ticketId,
        userId: ticket.employee_ticket_assignments?.[0]?.employee?.id || null,
        timestamp: Date.now(),
        metadata: {
          status: ticket.status,
          priority: ticket.priority,
          updatedFields: Object.keys(params)
        }
      }
    };
  }

  private async addComment(comment: string): Promise<ToolResult> {
    // Add the comment
    const { data: newComment, error: commentError } = await this.supabase
      .from('ticket_comments')
      .insert({
        ticket_id: this.ticketId,
        content: comment,
        type: 'internal',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (commentError) throw commentError;

    // Add to ticket history
    const { error: historyError } = await this.supabase
      .from('ticket_history')
      .insert({
        ticket_id: this.ticketId,
        action: 'comment',
        changes: { comment },
        created_at: new Date().toISOString()
      });

    if (historyError) throw historyError;

    return {
      success: true,
      data: newComment,
      context: {
        ticketId: this.ticketId,
        userId: newComment.created_by,
        timestamp: Date.now(),
        metadata: {
          commentId: newComment.id,
          commentType: 'internal',
          hasHistory: true
        }
      }
    };
  }
} 
