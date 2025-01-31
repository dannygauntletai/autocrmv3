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
      const messages: string[] = [];
      messages.push("Starting autonomous analysis for ticket: " + this.config.ticketId);
      
      // First, get all necessary data in parallel
      messages.push("Gathering ticket and employee data...");
      const [ticketData, employeesResponse] = await Promise.all([
        this.readTicket(),
        this.supabase
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
          .eq('status', 'active')
      ]);
      
      if (!ticketData.success || !ticketData.data?.ticket) {
        throw new Error(`Failed to read ticket data for analysis. Ticket ID: ${this.config.ticketId}`);
      }

      messages.push("Successfully retrieved ticket data and employee information");

      // Format employee data to include skills
      const employeesWithSkills = employeesResponse.data?.map(emp => ({
        ...emp,
        skills: emp.employee_skills?.[0]?.skills || {},
        metrics: emp.employee_metrics?.[0] || null
      }));

      messages.push("Analyzing ticket with available employee data...");

      // Create a single agent executor for all operations
      const executor = await initializeAgentExecutorWithOptions(this.tools, this.model, {
        agentType: "openai-functions",
        verbose: true,
        maxIterations: 5,
        returnIntermediateSteps: true,
        callbacks: [{
          handleLLMStart: async (llm: any, prompts: string[]) => {
            messages.push("Starting analysis with AI model...");
          },
          handleToolStart: async (tool: any, input: string) => {
            messages.push(`Using tool: ${tool.name} with input: ${input}`);
          },
          handleToolEnd: async (output: string) => {
            try {
              const result = JSON.parse(output);
              if (result.success) {
                messages.push("Tool execution successful");
              } else {
                messages.push(`Tool execution failed: ${result.error}`);
              }
            } catch {
              messages.push("Tool execution completed");
            }
          }
        }]
      });

      // Batch all analysis and actions into a single call
      messages.push("Executing comprehensive ticket analysis...");
      const analysisResult = await executor.call({
        input: `You are in YOLO mode - full autonomous control over ticket ${this.config.ticketId}.
               Your goal is to make meaningful progress towards resolving this ticket.
               
               Current ticket data: ${JSON.stringify(ticketData.data)}
               
               Available employees and their metrics:
               ${JSON.stringify(employeesWithSkills, null, 2)}
               
               Analyze the ticket and take ALL necessary actions in a single response:
               1. Assess current status and priority
               2. Evaluate assignment needs
               3. Document analysis with internal notes
               4. Update status/priority if needed
               5. Assign/reassign if needed (use format: {"employee_id": "id", "reason": "reason"})
               6. Add customer communication if needed
               
               Important:
               - When using assign_ticket tool, provide input as: {"employee_id": "employee-uuid", "reason": "reason for assignment"}
               - Do not include ticket_id in the assignment, it's handled automatically
               
               Make all decisions and take all actions in this single execution.
               Document your complete analysis and reasoning in internal notes.
               Be thorough but efficient in your approach.`
      });

      messages.push("Analysis complete. Processing results...");

      // Add analysis results to messages
      if (analysisResult.intermediateSteps) {
        messages.push("\nActions taken:");
        analysisResult.intermediateSteps.forEach((step: AgentStep) => {
          const action = step.action;
          const observation = step.observation;
          
          try {
            // Try to parse the observation as JSON for better formatting
            const parsedObservation = JSON.parse(observation);
            if (parsedObservation.success) {
              messages.push(`✓ ${action.tool}: ${action.toolInput}`);
              if (parsedObservation.data) {
                const data = parsedObservation.data;
                switch (action.tool) {
                  case 'update_ticket_status':
                    messages.push(`  → Status updated to: ${data.status}`);
                    break;
                  case 'update_ticket_priority':
                    messages.push(`  → Priority updated to: ${data.priority}`);
                    break;
                  case 'assign_ticket':
                    messages.push(`  → Assigned to: ${data.employee?.name || data.employee_id}`);
                    break;
                  case 'add_internal_note':
                    messages.push(`  → Added internal note`);
                    break;
                }
              }
            } else {
              messages.push(`✗ ${action.tool} failed: ${parsedObservation.error}`);
            }
          } catch {
            // If not JSON, just show the raw action
            messages.push(`• ${action.tool}: ${action.toolInput}`);
          }
        });
      }

      // If customer communication is needed, handle it
      if (analysisResult.output.toLowerCase().includes('message') || 
          analysisResult.output.toLowerCase().includes('respond')) {
        messages.push("Generating customer response...");
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
              stats: ticketData.data.stats,
              analysis: analysisResult.output
            }
          })
        });

        if (response.ok) {
          const messageResult = await response.json();
          if (messageResult.response) {
            await this.addMessage(messageResult.response, false);
            messages.push("Customer response sent successfully");
          }
        } else {
          messages.push("Failed to generate customer response");
        }
      }

      messages.push("YOLO mode analysis completed successfully");

      return {
        success: true,
        output: messages.join("\n"),
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

  private async addMessage(message: string, isInternal: boolean) {
    try {
      const { error } = await this.supabase
        .from('ticket_messages')
        .insert({
          ticket_id: this.config.ticketId,
          message_body: message,
          is_internal: isInternal,
          sender_type: 'system',
          sender_id: this.config.aiEmployeeId
        });

      if (error) throw error;
    } catch (error) {
      console.error("[TicketAnalyzer] Error adding message:", error);
      throw error;
    }
  }
} 
