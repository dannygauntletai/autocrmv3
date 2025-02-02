import { ToolResult } from '../../types.ts';

export interface TicketMessage {
  id: string;
  message_body: string;
  sender_type: string;
  created_at: string;
  is_internal: boolean;
  sender_id: string;
  ticket_id: string;
}

export interface TicketHistory {
  id: string;
  ticket_id: string;
  action: string;
  changes: Record<string, any>;
  created_at: string;
}

export interface TimelineItem {
  type: 'message' | 'history';
  message_body?: string;
  sender_type?: string;
  timestamp: string;
}

export interface BaseToolConfig {
  ticketId: string;
  supabaseUrl: string;
  supabaseKey: string;
  aiEmployeeId: string;
  employeeId?: string;
}

export type TicketStatus = 'open' | 'pending' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface TicketToolResult extends ToolResult {
  context: {
    ticketId: string;
    userId: string;
    timestamp: number;
    metadata: Record<string, any>;
  };
} 