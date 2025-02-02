import { Tool } from 'langchain/tools';
import { createClient } from '@supabase/supabase-js';
import { BaseToolConfig, AssignmentType, AssignmentAction, AssignmentResult } from '../../types.ts';
import type { Database } from '../../../../../types/database.types';

interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

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
  description = "Assign a ticket to a team. Input should be a JSON string containing {type: 'team', target: string, reason?: string}. Available teams are: General Support, Technical Support.";
  
  override returnDirect = false;
  
  private config: BaseToolConfig;
  private supabase;
  private availableTeams: Map<string, Team> = new Map();

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

      // First, load available teams if not already loaded
      if (this.availableTeams.size === 0) {
        await this.loadAvailableTeams();
      }

      // Try to find the team by name or ID
      const targetTeam = await this.findTeam(action.target);
      if (!targetTeam) {
        const availableTeamNames = Array.from(this.availableTeams.values())
          .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
          .map(t => t.name)
          .join(', ');
        throw new Error(`Team not found: "${action.target}". Available teams are: ${availableTeamNames}`);
      }

      console.log("[AssignTeamTool] Found team:", targetTeam);

      // Assign the ticket to the team
      const result = await this.assignTicketToTeam(targetTeam.id, action.reason);
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

  private async loadAvailableTeams(): Promise<void> {
    console.log("[AssignTeamTool] Loading available teams");
    
    type TeamResponse = {
      id: string;
      name: string;
      description: string | null;
      created_at: string;
      updated_at: string;
    };

    const { data: teams, error } = await this.supabase
      .from('teams')
      .select('*')
      .order('name')
      .returns<TeamResponse[]>();

    if (error) {
      console.error("[AssignTeamTool] Error loading teams:", error);
      throw new Error(`Failed to load available teams: ${error.message}`);
    }

    if (!teams?.length) {
      throw new Error('No teams found in the system');
    }

    // Clear and reload the teams map
    this.availableTeams.clear();
    teams.forEach(team => {
      this.availableTeams.set(team.id, team);
      this.availableTeams.set(team.name.toLowerCase(), team);
    });

    console.log("[AssignTeamTool] Loaded teams:", 
      Array.from(this.availableTeams.values())
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
        .map(t => t.name)
    );
  }

  private async findTeam(target: string): Promise<Team | null> {
    const normalizedTarget = target.toLowerCase().trim();
    
    // First try exact matches
    const exactMatch = this.availableTeams.get(normalizedTarget);
    if (exactMatch) return exactMatch;

    // Then try partial matches
    for (const [key, value] of this.availableTeams.entries()) {
      if (key.includes(normalizedTarget) || normalizedTarget.includes(key)) {
        return value;
      }
    }

    return null;
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

      // Add to ticket history
      const { error: historyError } = await this.supabase
        .from('ticket_history')
        .insert({
          ticket_id: this.config.ticketId,
          changed_by: this.config.aiEmployeeId,
          changes: {
            type: 'team_assignment',
            team: {
              id: assignment.team.id,
              name: assignment.team.name
            },
            reason: reason || 'AI Employee assignment'
          },
          created_at: new Date().toISOString()
        });

      if (historyError) {
        console.error("[AssignTeamTool] Error adding to history:", historyError);
        // Don't throw here, as the assignment was successful
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
            reason,
            availableTeams: Array.from(this.availableTeams.values())
              .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
              .map(t => t.name)
          }
        }
      };
    } catch (error) {
      console.error("[AssignTeamTool] Assignment failed:", error);
      throw error; // Re-throw to be handled by the main try-catch
    }
  }
} 
