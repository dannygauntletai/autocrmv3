import { ChatOpenAI } from "langchain/chat_models/openai";
import { Tool } from "langchain/tools";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { AgentStep } from "langchain/schema";
import { BaseToolConfig } from "../tools/ticket/types.ts";
import { 
  ReadTicketTool, 
  UpdateTicketStatusTool, 
  UpdateTicketPriorityTool,
  AssignTicketTool,
  AddInternalNoteTool 
} from "../tools/ticket/index.ts";
import { createClient } from "@supabase/supabase-js";

export interface TicketAnalyzerConfig extends BaseToolConfig {
  openAiKey: string;
  model?: string;
  temperature?: number;
  langSmithProjectName?: string;
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
      new AssignTicketTool(config),
      new AddInternalNoteTool(config)
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
        maxIterations: 5,
        returnIntermediateSteps: true,
        // Add tracing configuration
        callbacks: [{
          handleLLMStart: async (llm: any, prompts: string[]) => {
            console.log("[LangSmith] LLM Start:", { 
              model: llm.modelName,
              temperature: llm.temperature,
              ticketId: this.config.ticketId,
              projectName: this.config.langSmithProjectName || "autocrm-yolo"
            });
          },
          handleToolStart: async (tool: any, input: string) => {
            console.log("[LangSmith] Tool Start:", {
              tool: tool.name,
              input,
              ticketId: this.config.ticketId,
              projectName: this.config.langSmithProjectName || "autocrm-yolo"
            });
          }
        }]
      });

      // Let the AI analyze and decide actions
      const analysisResult = await executor.call({
        input: `You are in YOLO mode - full autonomous control over ticket ${this.config.ticketId}.
               Your goal is to make meaningful progress towards resolving this ticket.
               
               Available actions:
               1. Update status - Use when ticket state changes
               2. Update priority - Adjust based on urgency and impact
               3. Assign to employees - Match skills and workload
               4. Add internal notes - Document your analysis and decisions
               5. Send customer messages - Communicate updates or request info

               Analysis steps:
               1. Review ticket details and history thoroughly
               2. Assess current status and priority
               3. Evaluate if the ticket needs assignment/reassignment
               4. Document your analysis with internal notes
               5. Take appropriate actions based on analysis
               6. Update stakeholders as needed

               When adding internal notes:
               - Document your reasoning for changes
               - Note important observations
               - Highlight next steps or blockers
               - Add context for other employees

               When choosing employees, consider:
               - Current workload (assigned_tickets_count)
               - Performance metrics (avg_response_time, resolution_time)
               - Skills and proficiency levels
               - Role and expertise

               Available employees and their metrics:
               ${JSON.stringify(employeesWithSkills, null, 2)}

               Be proactive and thorough in your approach.
               Make decisions that move the ticket towards resolution.
               Document your thought process with internal notes.
               
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
    try {
      // Use ReadTicketTool directly
      const readTicketTool = this.tools.find(tool => tool.name === "read_ticket") as ReadTicketTool;
      if (!readTicketTool) {
        throw new Error("ReadTicketTool not found in tools array");
      }
      const result = await readTicketTool._call('');
      return JSON.parse(result);
    } catch (error) {
      console.error("[TicketAnalyzer] Error reading ticket:", error);
      throw new Error(`Failed to read ticket: ${error instanceof Error ? error.message : String(error)}`);
    }
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
