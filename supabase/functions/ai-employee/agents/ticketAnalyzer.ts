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
import { SupportAgentConfig } from "./supportAgent.ts";
import { MODEL_CONFIGS } from "../types.ts";

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

  async analyze(): Promise<AnalyzerResult> {
    try {
      const messages: string[] = [];
      messages.push("Starting autonomous analysis for ticket: " + this.config.ticketId);
      
      // Step 1: Gather ticket data for analysis
      messages.push("Gathering ticket data for analysis...");
      const ticketData = await this.readTicket();
      
      if (!ticketData.success || !ticketData.data?.ticket) {
        throw new Error(`Failed to read ticket data for analysis. Ticket ID: ${this.config.ticketId}`);
      }

      messages.push("Successfully retrieved ticket data");

      // Step 2: Analyze the ticket and determine required actions
      messages.push("Analyzing ticket to determine required actions...");
      const executor = await initializeAgentExecutorWithOptions([this.tools[0]], this.model, {
        agentType: "openai-functions",
        verbose: true,
        maxIterations: 10,
        returnIntermediateSteps: true
      });

      const analysisTask = `
        Analyze this ticket and determine what actions need to be taken. Consider:
        1. Ticket priority based on content and customer impact
        2. Required skills and expertise for resolution
        3. Current status and if it needs updating
        4. Whether it needs reassignment

        Provide your analysis in a structured format:
        {
          "reasoning": "explanation of your analysis",
          "actions": [
            {
              "tool": "name of the tool to use",
              "reason": "why this action is needed",
              "input": "what input to provide to the tool"
            }
          ]
        }
      `;

      const analysis = await executor.call({ input: analysisTask });
      let actionPlan;
      try {
        actionPlan = JSON.parse(analysis.output);
      } catch (e) {
        messages.push("Failed to parse analysis output, using raw output");
        // Check if error is due to max iterations
        const isMaxIterations = analysis.output.includes('max iterations');
        actionPlan = {
          reasoning: isMaxIterations ? 
            "Analysis stopped due to max iterations. Here are the partial results:" : 
            "Failed to structure analysis",
          actions: isMaxIterations ? 
            analysis.intermediateSteps?.map((step: AgentStep) => ({
              tool: step.action.tool,
              reason: "Action from partial analysis",
              input: step.action.toolInput
            })) || [] : []
        };
      }

      messages.push("Analysis complete. Reasoning: " + actionPlan.reasoning);

      // Step 3: Execute the determined actions
      messages.push("Executing determined actions...");
      const toolResults = [];
      
      for (const action of actionPlan.actions) {
        const tool = this.tools.find(t => t.name === action.tool);
        if (!tool) {
          messages.push(`Warning: Tool ${action.tool} not found, skipping action`);
          continue;
        }

        messages.push(`Executing action: ${action.tool} - ${action.reason}`);
        try {
          const result = await tool.call(action.input);
          toolResults.push({
            tool: action.tool,
            input: action.input,
            output: result,
            reason: action.reason
          });
          messages.push(`Action completed successfully`);
        } catch (error) {
          messages.push(`Failed to execute action: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Step 4: Summarize actions taken
      const summary = `
        Analysis complete for ticket ${this.config.ticketId}
        
        Reasoning:
        ${actionPlan.reasoning}
        
        Actions Taken:
        ${toolResults.map(result => 
          `- ${result.tool}: ${result.reason}\n  Result: ${result.output}`
        ).join('\n')}
      `;

      return {
        success: true,
        output: summary,
        toolCalls: toolResults,
        context: {
          ticketId: this.config.ticketId,
          timestamp: Date.now()
        }
      };

    } catch (error) {
      console.error("[TicketAnalyzer] Error during analysis:", error);
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
