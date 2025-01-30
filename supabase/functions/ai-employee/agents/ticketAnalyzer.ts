import { ChatOpenAI } from "langchain/chat_models/openai";
import { Tool } from "langchain/tools";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { AgentStep } from "langchain/schema";
import { BaseToolConfig } from "../tools/ticket/types.ts";
import { 
  ReadTicketTool, 
  UpdateTicketStatusTool, 
  UpdateTicketPriorityTool,
  AssignTicketTool 
} from "../tools/ticket/index.ts";
import { createClient } from "@supabase/supabase-js";

export interface TicketAnalyzerConfig extends BaseToolConfig {
  openAiKey: string;
  model?: string;
  temperature?: number;
}

interface AnalyzerResult {
  success: boolean;
  output?: string;
  steps?: AgentStep[];
  toolCalls?: Array<{
    tool: string;
    input: string;
    output: string;
  }>;
  error?: string;
  context?: {
    ticketId: string;
    timestamp: number;
  };
}

export class TicketAnalyzer {
  private config: TicketAnalyzerConfig;
  private tools: Tool[];
  private model: ChatOpenAI;
  private supabase;

  constructor(config: TicketAnalyzerConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    
    // Initialize tools
    this.tools = [
      new ReadTicketTool(config),
      new UpdateTicketStatusTool(config),
      new UpdateTicketPriorityTool(config),
      new AssignTicketTool(config)
    ];

    // Initialize model with high temperature for creative decisions
    this.model = new ChatOpenAI({
      openAIApiKey: config.openAiKey,
      modelName: config.model || "gpt-4-1106-preview",
      temperature: config.temperature || 0.9, // High temperature for more autonomous decisions
    });
  }

  async analyze(): Promise<AnalyzerResult> {
    try {
      console.log("[TicketAnalyzer] Starting autonomous analysis for ticket:", this.config.ticketId);
      
      // First, get ticket data and employee context
      const ticketData = await this.readTicket();
      const { data: employees } = await this.supabase
        .from('employees')
        .select(`
          id,
          name,
          role,
          employee_metrics (
            assigned_tickets_count,
            closed_tickets_count,
            avg_first_response_time,
            avg_resolution_time
          ),
          employee_skills!left (
            skills
          )
        `)
        .eq('status', 'active');
      
      if (!ticketData.success || !ticketData.data?.ticket) {
        throw new Error(`Failed to read ticket data for analysis. Ticket ID: ${this.config.ticketId}`);
      }

      // Format employee data to include skills
      const employeesWithSkills = employees?.map(emp => ({
        ...emp,
        skills: emp.employee_skills?.[0]?.skills || {},
        metrics: emp.employee_metrics?.[0] || null
      }));

      // Create agent executor for autonomous decision making
      const executor = await initializeAgentExecutorWithOptions(this.tools, this.model, {
        agentType: "openai-functions",
        verbose: true,
        maxIterations: 3,
        returnIntermediateSteps: true,
      });

      // Let the AI analyze and decide actions
      const analysisResult = await executor.call({
        input: `You are in YOLO mode - full autonomous control over ticket ${this.config.ticketId}.
               Analyze the ticket and take ANY actions you deem appropriate.
               You have complete freedom to:
               1. Update status
               2. Update priority
               3. Assign to employees
               4. Send messages

               Available employees and their metrics:
               ${JSON.stringify(employeesWithSkills, null, 2)}

               When choosing an employee, consider:
               - Their current workload (assigned_tickets_count)
               - Their performance metrics (avg_response_time, resolution_time)
               - Their skills and proficiency levels
               - Their role and expertise

               Be creative but professional in your approach.
               Consider employee workload and expertise when making assignments.
               Current ticket data: ${JSON.stringify(ticketData.data)}`
      });

      // Get response for customer communication if needed
      if (analysisResult.output.toLowerCase().includes('message') || 
          analysisResult.output.toLowerCase().includes('respond')) {
        const response = await fetch(`${this.config.supabaseUrl}/functions/v1/generate-response`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.supabaseKey}`
          },
          body: JSON.stringify({
            ticketId: this.config.ticketId,
            context: {
              ticket: ticketData.data.ticket,
              timeline: ticketData.data.timeline,
              stats: ticketData.data.stats
            }
          })
        });

        if (response.ok) {
          const messageResult = await response.json();
          if (messageResult.response) {
            await this.addMessage(messageResult.response, false);
          }
        }
      }

      return {
        success: true,
        output: analysisResult.output,
        steps: analysisResult.intermediateSteps,
        toolCalls: analysisResult.intermediateSteps?.map((step: AgentStep) => ({
          tool: step.action.tool,
          input: step.action.toolInput,
          output: step.observation
        })),
        context: {
          ticketId: this.config.ticketId,
          timestamp: Date.now()
        }
      };

    } catch (error) {
      console.error("[TicketAnalyzer] Error during analysis:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        context: {
          ticketId: this.config.ticketId,
          timestamp: Date.now()
        }
      };
    }
  }

  private async readTicket() {
    const executor = await initializeAgentExecutorWithOptions(
      [this.tools[0]], // Only use ReadTicketTool
      this.model,
      {
        agentType: "openai-functions",
        verbose: true,
        maxIterations: 1
      }
    );

    const result = await executor.call({ 
      input: `Read all information about ticket ${this.config.ticketId}`
    });

    return JSON.parse(result.output);
  }

  private async updateTicket(params: Record<string, any>) {
    const executor = await initializeAgentExecutorWithOptions(
      [this.tools[1], this.tools[2]], // Use status and priority update tools
      this.model,
      {
        agentType: "openai-functions",
        verbose: true,
        maxIterations: 1
      }
    );

    const result = await executor.call({ 
      input: `Update ticket ${this.config.ticketId} with: ${JSON.stringify(params)}`
    });

    return JSON.parse(result.output);
  }

  private async addMessage(message: string, isInternal: boolean) {
    const { data: newMessage, error: messageError } = await this.supabase
      .from('ticket_messages')
      .insert({
        ticket_id: this.config.ticketId,
        message_body: message,
        sender_type: 'employee',
        is_internal: isInternal,
        sender_id: this.config.aiEmployeeId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (messageError) throw messageError;

    return {
      success: true,
      data: newMessage,
      context: {
        ticketId: this.config.ticketId,
        userId: this.config.aiEmployeeId,
        timestamp: Date.now(),
        metadata: {
          actionType: isInternal ? 'add_internal_note' : 'add_customer_message',
          input: { message, isInternal }
        }
      }
    };
  }
} 
