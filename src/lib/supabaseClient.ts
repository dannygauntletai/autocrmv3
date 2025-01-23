import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

// Database Types
export type Ticket = {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'open' | 'pending' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  tags: string[];
  custom_fields: Record<string, any>;
};

export type TicketHistory = {
  id: string;
  ticket_id: string;
  changed_by: string;
  changes: {
    field: string;
    old_value: any;
    new_value: any;
  };
  created_at: string;
};

export type SchemaDefinition = {
  id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  is_required: boolean;
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  action_type: 'SCHEMA_UPDATE' | 'TICKET_CREATE' | 'TICKET_UPDATE';
  action_details: Record<string, any>;
  performed_by: string;
  created_at: string;
};

export type ApiKey = {
  id: string;
  key_value: string;
  description: string;
  permissions: Record<string, boolean>;
  created_at: string;
  updated_at: string;
};

export type Webhook = {
  id: string;
  url: string;
  event_types: string[];
  secret?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ApiLog = {
  id: string;
  api_key_id: string;
  endpoint_accessed: string;
  request_payload?: Record<string, any>;
  response_code: number;
  created_at: string;
}; 