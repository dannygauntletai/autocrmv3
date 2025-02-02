import { Tool } from 'langchain/tools';
import { createClient, PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import { BaseToolConfig, TicketToolResult } from './types.ts';
import { AssignTicketTool } from './assignTicket.ts';
import type { Database } from '../../../../../types/database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  ticket_messages: Array<{
    message_body: string;
  }>;
};

type Employee = Database['public']['Tables']['employees']['Row'] & {
  employee_metrics: Array<{
    assigned_tickets_count: number | null;
    avg_resolution_time: number | null;
    resolved_tickets_count: number | null;
    satisfaction_score: number | null;
  }>;
  employee_skills: Array<{
    skills: Record<string, number>;
  }> | null;
  status: 'pending' | 'active' | 'inactive';
};

export class SmartAssignTicketTool extends Tool {
  name = "smart_assign_ticket";
  description = "Intelligently assign a ticket to the best employee based on skills, workload and performance metrics. Input can be a specific skill requirement or general context for matching.";
  
  override returnDirect = false;
  
  private config: BaseToolConfig;
  private supabase;
  private assignTool: AssignTicketTool;

  constructor(config: BaseToolConfig) {
    super();
    this.config = config;
    this.supabase = createClient<Database>(config.supabaseUrl, config.supabaseKey);
    this.assignTool = new AssignTicketTool(config);
  }

  /** @ignore */
  protected override async _call(input: string | { input: string }): Promise<string> {
    try {
      console.log("[SmartAssignTicketTool] Starting smart assignment for ticket:", this.config.ticketId);
      
      // Parse input if needed
      const parsedInput = typeof input === 'string' ? input : input.input;
      if (!parsedInput) {
        throw new Error('Input is required for smart assignment');
      }

      // First, get the ticket details to understand the context
      console.log("[SmartAssignTicketTool] Fetching ticket details");
      const ticketResponse = await this.supabase
        .from('tickets')
        .select('*, ticket_messages(message_body)')
        .eq('id', this.config.ticketId)
        .single();

      if (ticketResponse.error) {
        console.error("[SmartAssignTicketTool] Error fetching ticket:", ticketResponse.error);
        throw new Error(`Failed to fetch ticket details: ${ticketResponse.error.message}`);
      }

      if (!ticketResponse.data) {
        throw new Error('No ticket found');
      }

      const ticket = ticketResponse.data as unknown as Ticket;

      // Get all ticket content for context
      const ticketContent = [
        ticket.title,
        ticket.description,
        ...(ticket.ticket_messages || []).map(m => m.message_body)
      ].filter(Boolean).join(' ');

      console.log("[SmartAssignTicketTool] Analyzing ticket content for assignment");

      // Get all employees with their skills
      console.log("[SmartAssignTicketTool] Fetching employee data");
      const { data: employeesResponse, error: employeesError } = await this.supabase
        .from('employees')
        .select(`
          *,
          employee_skills (
            skills
          )
        `)
        .eq('role', 'agent')
        .neq('email', 'ai@autocrm.app');

      if (employeesError) {
        throw new Error(`Failed to fetch employees: ${employeesError.message}`);
      }

      if (!employeesResponse?.length) {
        throw new Error('No human agents found for assignment');
      }

      const employees = employeesResponse as unknown as Employee[];

      // Determine if input is a specific skill requirement
      const requiredSkill = parsedInput.toLowerCase().trim();
      console.log("[SmartAssignTicketTool] Required skill or context:", requiredSkill);

      // Score each employee based on:
      // 1. Skill match (if any)
      // 2. Role suitability
      // 3. Status (active preferred)
      console.log("[SmartAssignTicketTool] Scoring employees");
      const scoredEmployees = employees.map(employee => {
        // Double check to ensure AI agent is never scored
        if (employee.email === 'ai@autocrm.app') {
          return {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            status: employee.status,
            skills: [],
            score: 0,
            hasRequiredSkill: false,
            matchReason: ['AI agent cannot be assigned tickets']
          };
        }

        let score = 100; // Start with base score
        const matchReason = ['Base score: 100'];
        
        // Consider employee status - prefer active but don't exclude others
        if (employee.status === 'active') {
          score *= 1.5; // Boost active agents
          matchReason.push('Active status bonus: score *= 1.5');
        } else if (employee.status === 'pending') {
          score *= 0.8; // Slight penalty for pending
          matchReason.push('Pending status penalty: score *= 0.8');
        } else if (employee.status === 'inactive') {
          score *= 0.5; // Larger penalty for inactive
          matchReason.push('Inactive status penalty: score *= 0.5');
        }

        // Safely parse skills from JSONB, defaulting to empty object if no skills record exists
        const skills = employee.employee_skills?.[0]?.skills || {};
        const employeeSkills = Object.entries(skills).map(([name, level]) => ({
          skill_name: name,
          proficiency_level: Number(level)
        }));
        
        // Check for skill match if a specific skill is required
        const hasSkill = requiredSkill ? employeeSkills.some(skill => 
          skill.skill_name.toLowerCase().includes(requiredSkill) ||
          requiredSkill.includes(skill.skill_name.toLowerCase())
        ) : true;

        // Adjust score based on skills
        if (requiredSkill) {
          if (!hasSkill) {
            score *= 0.5; // Reduce score for missing required skill, but don't eliminate
            matchReason.push(`Missing required skill "${requiredSkill}": score *= 0.5`);
          } else {
            const skillMatch = employeeSkills.find(skill => 
              skill.skill_name.toLowerCase().includes(requiredSkill) ||
              requiredSkill.includes(skill.skill_name.toLowerCase())
            );
            if (skillMatch) {
              const skillBoost = 1 + skillMatch.proficiency_level * 0.2;
              score *= skillBoost;
              matchReason.push(`Has required skill "${requiredSkill}" at level ${skillMatch.proficiency_level}: score *= ${skillBoost.toFixed(2)}`);
            }
          }
        }
        
        // Consider employee role
        if (employee.role === 'agent') {
          score *= 1.2;
          matchReason.push('Agent role bonus: score *= 1.2');
        }

        // Consider number of skills as a tiebreaker
        if (employeeSkills.length > 0) {
          const skillCountBonus = 1 + (employeeSkills.length * 0.05);
          score *= skillCountBonus;
          matchReason.push(`Has ${employeeSkills.length} skills: score *= ${skillCountBonus.toFixed(2)}`);
        }

        return {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          status: employee.status,
          skills: employeeSkills,
          score,
          hasRequiredSkill: hasSkill,
          matchReason
        };
      });

      // Sort by score and get the best match
      const sortedEmployees = scoredEmployees
        .sort((a, b) => b.score - a.score);

      const bestMatch = sortedEmployees[0];

      if (!bestMatch || bestMatch.score === 0) {
        throw new Error('No active employees available for assignment');
      }

      console.log("[SmartAssignTicketTool] Found best match:", {
        name: bestMatch.name,
        email: bestMatch.email,
        score: bestMatch.score,
        role: bestMatch.role,
        status: bestMatch.status,
        skills: bestMatch.skills,
        matchReason: bestMatch.matchReason
      });

      // Add to ticket history before assignment
      const { error: historyError } = await this.supabase
        .from('ticket_history')
        .insert({
          ticket_id: this.config.ticketId,
          changed_by: this.config.aiEmployeeId,
          changes: {
            type: 'smart_assignment',
            employee: {
              id: bestMatch.id,
              name: bestMatch.name,
              email: bestMatch.email,
              status: bestMatch.status
            },
            score: bestMatch.score,
            requiredSkill,
            matchedSkills: bestMatch.skills,
            matchReason: bestMatch.matchReason
          },
          created_at: new Date().toISOString()
        });

      if (historyError) {
        console.error("[SmartAssignTicketTool] Error adding to history:", historyError);
        // Don't throw, continue with assignment
      }

      // Use the existing assign tool to make the assignment
      console.log("[SmartAssignTicketTool] Calling assign tool with email:", bestMatch.email);
      const result = await this.assignTool.call(bestMatch.email);
      const assignResult = JSON.parse(result);

      return JSON.stringify({
        ...assignResult,
        context: {
          ...assignResult.context,
          metadata: {
            ...assignResult.context.metadata,
            matchScore: bestMatch.score,
            matchRole: bestMatch.role,
            matchSkills: bestMatch.skills,
            requiredSkill,
            assignmentType: 'smart'
          }
        }
      });
    } catch (error) {
      console.error("[SmartAssignTicketTool] Error:", error);
      if (error instanceof Error) {
        console.error("[SmartAssignTicketTool] Error stack:", error.stack);
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

  private async assignTicket(email: string): Promise<string> {
    return await this.assignTool.call(email);
  }
} 
