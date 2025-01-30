import { Tool } from 'langchain/tools';
import { createClient } from '@supabase/supabase-js';
import { ToolResult } from '../types.ts';
import { z } from "zod";

interface TicketMessage {
  id: string;
  message_body: string;
  sender_type: string;
  created_at: string;
  is_internal: boolean;
  sender_id: string;
  ticket_id: string;
}

interface TicketHistory {
  id: string;
  ticket_id: string;
  action: string;
  changes: Record<string, any>;
  created_at: string;
}

interface TimelineItem {
  type: 'message' | 'history';
  message_body?: string;
  sender_type?: string;
  timestamp: string;
}

export class TicketManagementTool extends Tool {
  name = "ticket_management";
  description = `Manage ticket operations including reading details, updating status/priority, and adding comments. 
For reading ticket details, use 'read'.
For updating ticket details, use 'update' followed by the status or priority.
For adding comments, use 'comment' followed by your message.
For analyzing the ticket (YOLO mode), use 'analyze'.`;
  
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
      const [action, ...args] = input.trim().split(' ');
      const updateParams: Record<string, any> = {};
      
      let result: string;
      switch (action) {
        case 'read':
          result = JSON.stringify(await this.readTicket(), (_, value) => {
            if (value === undefined) return null;
            if (value instanceof Error) return value.message;
            return value;
          });
          break;
        case 'update':
          if (args[0] === 'status') updateParams.status = args[1];
          if (args[0] === 'priority') updateParams.priority = args[1];
          result = JSON.stringify(await this.updateTicket(updateParams), (_, value) => {
            if (value === undefined) return null;
            if (value instanceof Error) return value.message;
            return value;
          });
          break;
        case 'comment':
          result = JSON.stringify(await this.addComment(args.join(' ')), (_, value) => {
            if (value === undefined) return null;
            if (value instanceof Error) return value.message;
            return value;
          });
          break;
        case 'analyze':
          result = JSON.stringify(await this.analyzeAndActOnTicket(), (_, value) => {
            if (value === undefined) return null;
            if (value instanceof Error) return value.message;
            return value;
          });
          break;
        default:
          throw new Error(`Unknown action: ${action}. Use 'read', 'update', 'comment', or 'analyze'.`);
      }
      return result;
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred"
      }, (_, value) => {
        if (value === undefined) return null;
        if (value instanceof Error) return value.message;
        return value;
      });
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
          is_internal,
          sender_id
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
    const timeline = [
      ...messages.map((m: TicketMessage) => ({
        type: 'message',
        ...m,
        timestamp: m.created_at
      })),
      ...history.map((h: TicketHistory) => ({
        type: 'history',
        ...h,
        timestamp: h.created_at
      }))
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Calculate stats
    const stats = {
      messageCount: messages.length,
      lastActivity: timeline.length > 0 ? timeline[timeline.length - 1].timestamp : ticket.created_at,
      customerMessageCount: messages.filter((m: TicketMessage) => m.sender_type === 'customer').length,
      internalMessageCount: messages.filter((m: TicketMessage) => m.sender_type === 'internal').length
    };

    return {
      success: true,
      data: {
        ticket,
        timeline,
        stats
      },
      context: {
        ticketId: this.ticketId,
        userId: 'ai-employee',
        timestamp: Date.now(),
        metadata: {
          hasMessages: messages.length > 0,
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
    // Add the comment as a message
    const { data: newMessage, error: messageError } = await this.supabase
      .from('ticket_messages')
      .insert({
        ticket_id: this.ticketId,
        message_body: comment,
        sender_type: 'internal',
        is_internal: true,
        sender_id: 'ai-employee',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Add to ticket history
    const { error: historyError } = await this.supabase
      .from('ticket_history')
      .insert({
        ticket_id: this.ticketId,
        changed_by: 'ai-employee',
        changes: { message: comment },
        created_at: new Date().toISOString()
      });

    if (historyError) throw historyError;

    return {
      success: true,
      data: newMessage,
      context: {
        ticketId: this.ticketId,
        userId: 'ai-employee',
        timestamp: Date.now(),
        metadata: {
          messageId: newMessage.id,
          messageType: 'internal',
          hasHistory: true
        }
      }
    };
  }

  private async analyzeAndActOnTicket(): Promise<ToolResult> {
    try {
      console.log("[TicketTool] Starting ticket analysis");
      
      // First, get all ticket data
      const ticketData = await this.readTicket();
      console.log("[TicketTool] Read ticket data:", JSON.stringify({
        success: ticketData.success,
        ticketInfo: {
          status: ticketData.data?.ticket?.status,
          priority: ticketData.data?.ticket?.priority,
          messageCount: ticketData.data?.stats?.messageCount,
          lastActivity: ticketData.data?.stats?.lastActivity
        }
      }, null, 2));

      if (!ticketData.success || !ticketData.data) {
        console.error("[TicketTool] Failed to read ticket data:", ticketData);
        throw new Error("Failed to read ticket data for analysis");
      }

      if (!ticketData.data.ticket) {
        console.error("[TicketTool] Ticket data missing ticket object:", ticketData.data);
        throw new Error("Ticket data is incomplete");
      }

      if (!ticketData.data.timeline) {
        console.error("[TicketTool] Ticket data missing timeline:", ticketData.data);
        throw new Error("Timeline data is missing");
      }

      if (!ticketData.data.stats) {
        console.error("[TicketTool] Ticket data missing stats:", ticketData.data);
        throw new Error("Stats data is missing");
      }

      const ticket = ticketData.data.ticket;
      const timeline = ticketData.data.timeline;
      const stats = ticketData.data.stats;

      // Initialize actions to take
      const actions: {
        status?: string;
        priority?: string;
        comment?: string;
      } = {};

      console.log("[TicketTool] Analyzing ticket state:", JSON.stringify({
        currentStatus: ticket.status,
        currentPriority: ticket.priority,
        messageCount: stats.messageCount,
        lastActivity: stats.lastActivity
      }, null, 2));

      // Analyze resolution status
      const lastActivity = new Date(stats.lastActivity);
      const daysSinceLastActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      
      // Check if ticket can be resolved
      const hasCustomerResponse = timeline
        .slice()
        .reverse()
        .some((item: TimelineItem) => item.type === 'message' && item.sender_type === 'customer');
      
      console.log("[TicketTool] Activity analysis:", {
        daysSinceLastActivity,
        hasCustomerResponse,
        timelineLength: timeline.length
      });

      if (!hasCustomerResponse && daysSinceLastActivity > 2 && ticket.status !== 'resolved') {
        actions.status = 'resolved';
        actions.comment = "Automatically resolving ticket due to no customer response for over 2 days.";
        console.log("[TicketTool] Deciding to resolve ticket due to inactivity");
      }

      // Analyze priority
      const urgentKeywords = ['urgent', 'emergency', 'critical', 'asap', 'broken'];
      const hasUrgentKeywords = timeline.some((item: TimelineItem) => 
        item.type === 'message' && 
        item.message_body?.toLowerCase().includes(urgentKeywords.join('|'))
      );

      console.log("[TicketTool] Priority analysis:", {
        currentPriority: ticket.priority,
        hasUrgentKeywords,
        keywords: urgentKeywords
      });

      if (hasUrgentKeywords && ticket.priority !== 'urgent') {
        actions.priority = 'urgent';
        actions.comment = (actions.comment || '') + "\nEscalating priority to urgent based on message content.";
        console.log("[TicketTool] Deciding to escalate priority due to urgent keywords");
      }

      // Take actions
      const results: ToolResult[] = [];
      console.log("[TicketTool] Planned actions:", actions);
      
      if (Object.keys(actions).length > 0) {
        // Update ticket if needed
        if (actions.status || actions.priority) {
          console.log("[TicketTool] Applying ticket updates:", {
            newStatus: actions.status,
            newPriority: actions.priority
          });
          
          const updateResult = await this.updateTicket({
            status: actions.status,
            priority: actions.priority
          });
          results.push(updateResult);
        }

        // Add comment if needed
        if (actions.comment) {
          console.log("[TicketTool] Adding comment:", actions.comment);
          const commentResult = await this.addComment(actions.comment);
          results.push(commentResult);
        }
      } else {
        console.log("[TicketTool] No actions needed for this ticket");
      }

      const finalResult = {
        success: true,
        data: {
          analysis: {
            currentStatus: ticket.status,
            currentPriority: ticket.priority,
            daysSinceLastActivity,
            hasCustomerResponse,
            messageCount: stats.messageCount
          },
          actions: actions,
          results: results
        },
        context: {
          ticketId: this.ticketId,
          userId: 'ai_employee',
          timestamp: Date.now(),
          metadata: {
            actionsCount: Object.keys(actions).length,
            changedFields: Object.keys(actions)
          }
        }
      };

      console.log("[TicketTool] Analysis complete:", finalResult);
      return finalResult;
    } catch (error) {
      console.error("[TicketTool] Error during analysis:", JSON.stringify({
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          raw: error
        }
      }, null, 2));

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        context: {
          ticketId: this.ticketId,
          userId: 'ai_employee',
          timestamp: Date.now(),
          metadata: {
            errorType: error instanceof Error ? error.name : typeof error,
            hasStack: error instanceof Error && !!error.stack
          }
        }
      };
    }
  }
} 
