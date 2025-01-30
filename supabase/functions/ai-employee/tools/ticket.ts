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
  private aiEmployeeId = '00000000-0000-0000-0000-000000000000'; // Default AI employee UUID

  constructor(
    ticketId: string,
    supabaseUrl: string,
    supabaseKey: string,
    aiEmployeeId?: string
  ) {
    super();
    this.ticketId = ticketId;
    this.supabase = createClient(supabaseUrl, supabaseKey);
    if (aiEmployeeId) {
      this.aiEmployeeId = aiEmployeeId;
    }
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
      const validStatuses = ['new', 'open', 'pending', 'resolved', 'closed'];
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
        changed_by: this.aiEmployeeId,
        changes: params,
        created_at: new Date().toISOString()
      });

    if (historyError) throw historyError;

    return {
      success: true,
      data: ticket,
      context: {
        ticketId: this.ticketId,
        userId: this.aiEmployeeId,
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
    const { data: newMessage, error: messageError } = await this.supabase
      .from('ticket_messages')
      .insert({
        ticket_id: this.ticketId,
        message_body: comment,
        sender_type: 'employee',
        is_internal: true,
        sender_id: this.aiEmployeeId,
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
        changed_by: this.aiEmployeeId,
        changes: { message: comment },
        created_at: new Date().toISOString()
      });

    if (historyError) throw historyError;

    return {
      success: true,
      data: newMessage,
      context: {
        ticketId: this.ticketId,
        userId: this.aiEmployeeId,
        timestamp: Date.now(),
        metadata: {
          messageId: newMessage.id,
          messageType: 'internal',
          hasHistory: true
        }
      }
    };
  }

  private async addMessage(message: string, isInternal: boolean): Promise<ToolResult> {
    const { data: newMessage, error: messageError } = await this.supabase
      .from('ticket_messages')
      .insert({
        ticket_id: this.ticketId,
        message_body: message,
        sender_type: 'employee',
        is_internal: isInternal,
        sender_id: this.aiEmployeeId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (messageError) throw messageError;

    return {
      success: true,
      data: newMessage,
      context: {
        ticketId: this.ticketId,
        userId: this.aiEmployeeId,
        timestamp: Date.now(),
        metadata: {
          messageId: newMessage.id,
          messageType: isInternal ? 'internal' : 'customer',
          isInternal
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
        customerMessage?: string;
        internalNote?: string;
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

      // Primary action checks
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

      // Enhanced message generation based on ticket context
      const lastCustomerMessage = timeline
        .filter((item: TimelineItem) => item.type === 'message' && item.sender_type === 'customer')
        .pop();

      // Generate appropriate messages based on context
      if (lastCustomerMessage?.message_body) {
        if (lastCustomerMessage.message_body.toLowerCase().includes('refund')) {
          actions.internalNote = "Customer requesting refund. Escalating for review.";
          actions.customerMessage = "Thank you for your refund request. I've escalated this to our billing team for review. They will get back to you within 24 hours.";
          actions.priority = 'high';
        } else if (lastCustomerMessage.message_body.toLowerCase().includes('bug') || 
                  lastCustomerMessage.message_body.toLowerCase().includes('error')) {
          actions.internalNote = "Potential technical issue reported. Needs technical review.";
          actions.customerMessage = "I understand you're experiencing technical difficulties. Our engineering team has been notified and will investigate this issue. We'll keep you updated on our progress.";
          actions.priority = 'high';
        } else if (daysSinceLastActivity >= 1 && !hasCustomerResponse) {
          actions.customerMessage = "I noticed there hasn't been any recent activity on your ticket. Are you still experiencing this issue? Please let us know if you need further assistance.";
        }
      }

      // Ensure at least one action is taken in YOLO mode
      if (Object.keys(actions).length === 0) {
        console.log("[TicketTool] No primary actions needed, applying YOLO mode default actions");
        
        // Default message actions
        actions.internalNote = "YOLO mode activated - Performing routine check on ticket.";
        
        if (ticket.status === 'new') {
          actions.status = 'open';
          actions.customerMessage = "Thank you for reaching out to us. I'm reviewing your request and will get back to you shortly.";
        } else if (ticket.status === 'open' && daysSinceLastActivity >= 1) {
          actions.status = 'pending';
          actions.customerMessage = "I'm following up on your request. Could you please confirm if you still need assistance with this matter?";
        }
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

        // Add internal note if needed
        if (actions.internalNote) {
          console.log("[TicketTool] Adding internal note:", actions.internalNote);
          const internalResult = await this.addMessage(actions.internalNote, true);
          results.push(internalResult);
        }

        // Add customer message if needed
        if (actions.customerMessage) {
          console.log("[TicketTool] Adding customer message:", actions.customerMessage);
          const customerResult = await this.addMessage(actions.customerMessage, false);
          results.push(customerResult);
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
          userId: this.aiEmployeeId,
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
          userId: this.aiEmployeeId,
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
