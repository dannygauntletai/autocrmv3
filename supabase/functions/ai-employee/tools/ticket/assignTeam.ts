import { Tool } from 'langchain/tools';
import { createClient } from '@supabase/supabase-js';
import { BaseToolConfig, AssignmentType, AssignmentAction, AssignmentResult } from '../../types.ts';
import type { Database } from '../../../../../types/database.types';

type Team = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type TeamTicketAssignment = {
  id: string;
  ticket_id: string;
  team_id: string;
  assigned_at: string;
  unassigned_at: string | null;
  team: Pick<Team, 'id' | 'name'>;
};

export class AssignTeamTool extends Tool {
  name = "assign_team";
  description = "Assign a ticket to a team. Input should be a JSON string containing {type: 'team', target: string, reason?: string}.";
  
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
      console.log("[AssignTeamTool] Received input:", input);
      
      // Parse the assignment action
      let action: AssignmentAction;
      try {
        const parsed = JSON.parse(typeof input === 'string' ? input : input.input);
        action = {
          type: parsed.type || 'team',
          target: parsed.target || parsed.team_id || parsed.team_name || parsed,
          reason: parsed.reason
        };
      } catch {
        // If parsing fails, assume the input is the team name/id
        action = {
          type: 'team',
          target: (typeof input === 'string' ? input : input.input).trim()
        };
      }
      
      // Validate the action
      if (action.type !== 'team') {
        throw new Error("Invalid assignment type. Expected 'team'");
      }
      
      if (!action.target?.trim()) {
        throw new Error("Team name or ID is required");
      }

      if (!this.config.ticketId) {
        throw new Error("Ticket ID is required but not provided in tool configuration");
      }

      console.log("[AssignTeamTool] Parsed action:", action);

      // First, look up the team
      const { data: team, error: teamError } = await this.supabase
        .from('teams')
        .select('id, name')
        .or(`id.eq.${action.target},name.ilike.%${action.target}%`)
        .single() as { data: Team | null, error: any };

      if (teamError || !team) {
        console.error("[AssignTeamTool] Team lookup failed:", teamError);
        throw new Error(`Team not found with name/id: ${action.target}`);
      }

      console.log("[AssignTeamTool] Found team:", team);

      // Assign the ticket to the team
      const result = await this.assignTicketToTeam(team.id, action.reason);
      console.log("[AssignTeamTool] Assignment result:", result);
      
      return JSON.stringify(result);
    } catch (error) {
      console.error("[AssignTeamTool] Error:", error);
      if (error instanceof Error) {
        console.error("[AssignTeamTool] Error stack:", error.stack);
      }
      
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

  private async assignTicketToTeam(teamId: string, reason?: string): Promise<AssignmentResult> {
    try {
      // First unassign any current team assignments
      console.log("[AssignTeamTool] Unassigning current team assignments");
      const { error: unassignError } = await this.supabase
        .from('team_ticket_assignments')
        .update({ unassigned_at: new Date().toISOString() })
        .eq('ticket_id', this.config.ticketId)
        .is('unassigned_at', null);

      if (unassignError) {
        console.error("[AssignTeamTool] Error unassigning current assignments:", unassignError);
        throw new Error(`Failed to unassign current assignments: ${unassignError.message}`);
      }

      // Create new team assignment
      const { data: assignment, error: assignError } = await this.supabase
        .from('team_ticket_assignments')
        .insert([{
          ticket_id: this.config.ticketId,
          team_id: teamId,
          assigned_at: new Date().toISOString()
        }])
        .select(`
          id,
          ticket_id,
          team_id,
          assigned_at,
          unassigned_at,
          team:teams (
            id,
            name
          )
        `)
        .single() as { data: TeamTicketAssignment | null, error: any };

      if (assignError || !assignment) {
        console.error("[AssignTeamTool] Error creating assignment:", assignError);
        throw new Error(`Failed to create assignment: ${assignError?.message || 'Unknown error'}`);
      }

      // Add to ticket history if reason provided
      if (reason) {
        await this.supabase
          .from('ticket_history')
          .insert({
            ticket_id: this.config.ticketId,
            action: 'assign_team',
            changed_by: this.config.aiEmployeeId,
            changes: {
              team: {
                id: assignment.team.id,
                name: assignment.team.name
              },
              reason
            },
            created_at: new Date().toISOString()
          });
      }

      console.log("[AssignTeamTool] Assignment created successfully:", assignment);

      return {
        success: true,
        data: {
          assignmentType: 'team' as AssignmentType,
          assignedTo: {
            id: assignment.team.id,
            name: assignment.team.name,
            type: 'team' as AssignmentType
          }
        },
        context: {
          ticketId: this.config.ticketId,
          userId: this.config.aiEmployeeId,
          timestamp: Date.now(),
          metadata: {
            reason
          }
        }
      };
    } catch (error) {
      console.error("[AssignTeamTool] Assignment failed:", error);
      throw error; // Let the _call method handle the error formatting
    }
  }
} 
