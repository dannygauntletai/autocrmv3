import { ChatOpenAI } from "langchain/chat_models/openai";
import { Tool } from "langchain/tools";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { AgentStep } from "langchain/schema";
import { BaseToolConfig } from "../tools/ticket/types.ts";
import { 
  ReadTicketTool, 
  UpdateTicketStatusTool, 
  UpdateTicketPriorityTool 
} from "../tools/ticket/index.ts";
import { TicketAnalyzer } from "./ticketAnalyzer.ts";

export interface SupportAgentConfig extends BaseToolConfig {
  openAiKey: string;
  model?: string;
  temperature?: number;
}

interface AgentResult {
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

export class SupportAgent {
  private config: SupportAgentConfig;
  private tools: Tool[];
  private model: ChatOpenAI;
  private ticketAnalyzer: TicketAnalyzer;

  constructor(config: SupportAgentConfig) {
    this.config = config;
    
    // Initialize tools
    this.tools = [
      new ReadTicketTool(config),
      new UpdateTicketStatusTool(config),
      new UpdateTicketPriorityTool(config)
    ];

    // Initialize model
    this.model = new ChatOpenAI({
      openAIApiKey: config.openAiKey,
      modelName: config.model || "gpt-4-1106-preview",
      temperature: config.temperature || 0.2, // Lower temperature for more deterministic responses
    });

    // Initialize YOLO mode analyzer
    this.ticketAnalyzer = new TicketAnalyzer(config);
  }

  async processInput(userInput: string): Promise<AgentResult> {
    try {
      const messages: string[] = [];
      messages.push("Processing input: " + userInput);

      // Check for YOLO mode
      if (userInput.toLowerCase().includes('yolo')) {
        messages.push("YOLO mode activated - transferring control to autonomous analyzer");
        return this.ticketAnalyzer.analyze();
      }

      messages.push("Creating agent executor for normal operation...");
      // Create agent executor for normal operation
      const executor = await initializeAgentExecutorWithOptions(this.tools, this.model, {
        agentType: "openai-functions",
        verbose: true,
        maxIterations: 3,
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

      messages.push("Analyzing user request...");
      // Define the task based on user input
      const task = `
        Support employee for ticket ${this.config.ticketId}. Instruction: "${userInput}"
        
        If general conversation: respond naturally.
        If action request: use appropriate tool(s):
        - read_ticket: Get ticket info
        - update_ticket_status: Change status
        - update_ticket_priority: Change priority
        
        Only use tools when explicitly requested. Ask for clarification if unclear.
      `;

      messages.push("Executing task...");
      const result = await executor.call({ input: task });
      messages.push("Task execution complete");

      // Ensure we have a valid result
      if (!result) {
        throw new Error("No result returned from executor");
      }

      // Handle the case where output might be undefined
      const output = result.output || "I understood your message but I'm not sure how to respond. Could you please clarify what you'd like me to do?";

      messages.push("Processing completed successfully");

      return {
        success: true,
        output: messages.join("\n") + "\n\nResponse: " + output,
        steps: result.intermediateSteps || [],
        toolCalls: result.intermediateSteps?.map((step: AgentStep) => ({
          tool: step.action.tool,
          input: step.action.toolInput,
          output: step.observation
        })) || []
      };

    } catch (error) {
      console.error("[SupportAgent] Error processing input:", error);
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
} 