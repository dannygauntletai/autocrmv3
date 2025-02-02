import { ChatOpenAI } from "langchain/chat_models/openai";
import { Tool } from "langchain/tools";
import { AgentStep } from "langchain/schema";
import { 
  BaseToolConfig, 
  MODEL_CONFIGS,
  TicketAnalyzerConfig,
  AnalyzerResult,
  ToolResult
} from "../types.ts";
import { 
  ReadTicketTool, 
  UpdateTicketStatusTool, 
  UpdateTicketPriorityTool,
  AssignTicketTool,
  AddInternalNoteTool 
} from "../tools/ticket/index.ts";
import { createClient } from "@supabase/supabase-js";
import { FunctionsAgent } from "./functionsAgent.ts";

export class TicketAnalyzer {
  private config: TicketAnalyzerConfig;
  private tools: Tool[];
  private model: ChatOpenAI;
  private supabase;
  private readTicketTool: ReadTicketTool;

  constructor(config: TicketAnalyzerConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    
    // Initialize tools with proper typing
    this.readTicketTool = new ReadTicketTool(config);
    this.tools = [
      this.readTicketTool,
      new UpdateTicketStatusTool(config),
      new UpdateTicketPriorityTool(config),
      new AssignTicketTool(config),
      new AddInternalNoteTool(config)
    ];

    const modelConfig = MODEL_CONFIGS[this.determineModelComplexity()];
    this.model = new ChatOpenAI({
      openAIApiKey: config.openAiKey,
      modelName: config.model || modelConfig.modelName,
      temperature: config.temperature || modelConfig.temperature,
    });
  }

  private determineModelComplexity(): 'simple' | 'complex' {
    // Ticket analysis is typically a complex operation
    // as it requires understanding context and making nuanced decisions
    return 'complex';
  }

  async analyzeWithTools(tools: Tool[], functionsAgent: FunctionsAgent): Promise<AnalyzerResult> {
    try {
      // Step 1: Gather ticket data for analysis
      const ticketData = await this.readTicket();
      
      if (!ticketData.success || !ticketData.data?.ticket) {
        throw new Error(`Failed to read ticket data for analysis. Ticket ID: ${this.config.ticketId}`);
      }

      // Step 2: Use the functions agent to analyze and execute actions
      const analysisTask = `
        Analyze this ticket and determine what actions need to be taken. Consider:
        1. Ticket priority based on content and customer impact
        2. Required skills and expertise for resolution
        3. Current status and if it needs updating
        4. Whether it needs reassignment

        Then, execute the necessary actions using the available tools.
        
        Ticket Data:
        ${JSON.stringify(ticketData.data.ticket, null, 2)}
      `;

      // Use the functions agent to both analyze and execute actions
      const result = await functionsAgent.processInput(analysisTask);

      // Log the completion of analysis
      await this.addMessage(`Analysis completed for ticket ${this.config.ticketId}`, true);

      return {
        success: true,
        output: result.output,
        steps: result.intermediateSteps,
        toolCalls: result.toolCalls?.map(call => ({
          tool: call.tool,
          input: call.input,
          output: call.output
        })),
        context: {
          ticketId: this.config.ticketId,
          timestamp: Date.now()
        }
      };

    } catch (error) {
      console.error("[TicketAnalyzer] Error during analysis:", error);
      
      // Log the error internally
      await this.addMessage(`Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`, true);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
        context: {
          ticketId: this.config.ticketId,
          timestamp: Date.now()
        }
      };
    }
  }

  private async readTicket(): Promise<ToolResult> {
    try {
      const result = await this.readTicketTool._call('');
      return JSON.parse(result);
    } catch (error) {
      console.error("[TicketAnalyzer] Error reading ticket:", error);
      throw new Error(`Failed to read ticket: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async addMessage(message: string, isInternal: boolean): Promise<void> {
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
