export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
        };
      };
      employee_teams: {
        Row: {
          id: string;
          employee_id: string;
          team_id: string;
          role: 'team_lead' | 'agent';
          created_at: string;
        };
      };
      team_ticket_assignments: {
        Row: {
          id: string;
          ticket_id: string;
          team_id: string;
          assigned_at: string;
          unassigned_at: string | null;
        };
      };
    };
  };
}

export type Team = Database['public']['Tables']['teams']['Row'];

export interface TeamWithStats extends Team {
  memberCount: number;
  activeTickets: number;
  avgResponseTime: string;
} 