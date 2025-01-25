export type TicketStatus = 'open' | 'pending' | 'resolved';
export type TicketPriority = 'high' | 'medium' | 'low';

// We'll keep TicketCategory for backward compatibility but make it a string
export type TicketCategory = string;

export interface Ticket {
  id: string;
  created_at: string;
  updated_at: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  team_id: string;
  title: string;
  description: string;
  tags: string[];
  custom_fields: Record<string, any>;
}

export interface TicketListItemType {
  id: string;
  subject: string;
  customer: string;
  status: TicketStatus;
  priority: TicketPriority;
  lastUpdate: string;
}

export interface TicketHistory {
  id: string;
  ticket_id: string;
  changed_by: string;
  changes: {
    field: string;
    old_value: any;
    new_value: any;
  };
  created_at: string;
}

export interface SchemaDefinition {
  id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'date' | 'boolean';
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  action_type: 'SCHEMA_UPDATE' | 'TICKET_CREATE' | 'TICKET_UPDATE';
  action_details: Record<string, any>;
  performed_by: string;
  created_at: string;
}

export interface Employee {
  id: string;
  name: string;
}
