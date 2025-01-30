import { Tool } from 'langchain/tools';
import { createClient } from '@supabase/supabase-js';
import { BaseToolConfig, TicketMessage, TicketHistory, TimelineItem, TicketToolResult } from './types.ts';

export class ReadTicketTool extends Tool {
  name = "read_ticket";
  description = "Read ticket details including messages, history, and current status.";
  
  private config: BaseToolConfig;
  private supabase;

  constructor(config: BaseToolConfig) {
    super();
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /** @ignore */
  async _call(_input: string): Promise<string> {
    try {
      const result = await this.readTicket();
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

  private async readTicket(): Promise<TicketToolResult> {
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
      .eq('id', this.config.ticketId)
      .is('employee_ticket_assignments.unassigned_at', null)
      .single();

    if (ticketError) throw ticketError;

    // Get ticket history
    const { data: history, error: historyError } = await this.supabase
      .from('ticket_history')
      .select('id, ticket_id, changed_by, changes, created_at')
      .eq('ticket_id', this.config.ticketId)
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
        ticketId: this.config.ticketId,
        userId: this.config.aiEmployeeId,
        timestamp: Date.now(),
        metadata: {
          hasMessages: messages.length > 0,
          hasHistory: history.length > 0
        }
      }
    };
  }
} 