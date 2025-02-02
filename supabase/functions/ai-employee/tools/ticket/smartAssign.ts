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
  employee_skills?: Array<{
    skill_name: string;
    proficiency_level: number;
  }>;
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

      // Get all employees with their metrics and skills
      console.log("[SmartAssignTicketTool] Fetching employee data");
      const employeesResponse = await this.supabase
        .from('employees')
        .select(`
          *,
          employee_metrics (
            assigned_tickets_count,
            avg_resolution_time,
            resolved_tickets_count,
            satisfaction_score
          ),
          employee_skills (
            skill_name,
            proficiency_level
          )
        `)
        .eq('status', 'active'); // Only consider active employees

      if (employeesResponse.error) {
        console.error("[SmartAssignTicketTool] Error fetching employees:", employeesResponse.error);
        throw new Error(`Failed to fetch employees: ${employeesResponse.error.message}`);
      }

      if (!employeesResponse.data?.length) {
        throw new Error('No active employees found');
      }

      const employees = employeesResponse.data as unknown as Employee[];

      // Determine if input is a specific skill requirement
      const requiredSkill = parsedInput.toLowerCase().trim();
      console.log("[SmartAssignTicketTool] Required skill or context:", requiredSkill);

      // Score each employee based on:
      // 1. Skill match
      // 2. Current workload
      // 3. Average resolution time
      // 4. Role suitability
      // 5. Recent performance
      // 6. Customer satisfaction
      console.log("[SmartAssignTicketTool] Scoring employees");
      const scoredEmployees = employees.map(employee => {
        let score = 100; // Start with base score
        
        // Check for skill match if a specific skill is required
        const hasSkill = employee.employee_skills?.some(skill => 
          skill.skill_name.toLowerCase().includes(requiredSkill) ||
          requiredSkill.includes(skill.skill_name.toLowerCase())
        );

        // If a specific skill is required and employee doesn't have it, significantly reduce score
        if (requiredSkill && !hasSkill) {
          score *= 0.1; // Heavily penalize missing required skill
        } else if (hasSkill) {
          // Boost score based on skill proficiency
          const skillMatch = employee.employee_skills?.find(skill => 
            skill.skill_name.toLowerCase().includes(requiredSkill) ||
            requiredSkill.includes(skill.skill_name.toLowerCase())
          );
          if (skillMatch) {
            score *= (1 + skillMatch.proficiency_level * 0.5);
          }
        }
        
        const metrics = employee.employee_metrics?.[0];
        if (metrics) {
          // Reduce score based on current workload
          const assignedTickets = metrics.assigned_tickets_count || 0;
          score = score / (1 + assignedTickets * 0.2);

          // Boost score for faster resolution times
          if (metrics.avg_resolution_time) {
            score = score * (1 + (1 / metrics.avg_resolution_time));
          }

          // Consider resolved tickets count (experience)
          if (metrics.resolved_tickets_count) {
            score *= (1 + Math.log(metrics.resolved_tickets_count) * 0.1);
          }

          // Factor in customer satisfaction
          if (metrics.satisfaction_score) {
            score *= (1 + (metrics.satisfaction_score - 3) * 0.2); // Assuming 1-5 scale
          }
        }

        // Consider employee role and status
        if (employee.role === 'support' || employee.role === 'agent') {
          score *= 1.2; // Boost score for support roles
        }

        // Only consider active employees, inactive ones get zero score
        if (employee.status !== 'active') {
          score = 0;
        }

        // Use workload as availability indicator instead of status
        const currentWorkload = metrics?.assigned_tickets_count || 0;
        if (currentWorkload > 5) { // High workload
          score *= 0.5;
        } else if (currentWorkload > 3) { // Medium workload
          score *= 0.7;
        }

        return {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          status: employee.status,
          metrics: employee.employee_metrics,
          skills: employee.employee_skills,
          score,
          hasRequiredSkill: hasSkill
        };
      });

      // Sort by score and get the best match
      const bestMatch = scoredEmployees
        .filter(e => requiredSkill ? e.hasRequiredSkill : true) // Only consider employees with required skill if specified
        .sort((a, b) => b.score - a.score)[0];

      if (!bestMatch) {
        throw new Error('No suitable employee found for assignment');
      }

      console.log("[SmartAssignTicketTool] Found best match:", {
        name: bestMatch.name,
        email: bestMatch.email,
        score: bestMatch.score,
        role: bestMatch.role,
        status: bestMatch.status,
        skills: bestMatch.skills
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
            metrics: bestMatch.metrics?.[0]
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
