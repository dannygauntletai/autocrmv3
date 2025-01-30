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
      console.log("[SupportAgent] Processing input:", userInput);

      // Check for YOLO mode
      if (userInput.toLowerCase().includes('yolo')) {
        console.log("[SupportAgent] YOLO mode activated");
        return this.ticketAnalyzer.analyze();
      }

      // Create agent executor for normal operation
      const executor = await initializeAgentExecutorWithOptions(this.tools, this.model, {
        agentType: "openai-functions",
        verbose: true,
        maxIterations: 3,
        returnIntermediateSteps: true,
      });

      // Define the task based on user input
      const task = `
        You are an AI support employee working on ticket ${this.config.ticketId}.
        The user (your supervisor) has given you this instruction: "${userInput}"
        
        First, determine if this is:
        1. A general conversation (like greetings, questions, or casual chat)
        2. A specific request to take action on the ticket
        
        If it's general conversation:
        - Respond naturally without using any tools
        - Keep responses professional but friendly
        - If they ask about capabilities, explain what you can do
        
        If it's a specific request for ticket actions:
        1. First, understand what action is being requested
        2. If needed, use read_ticket to get current ticket information
        3. Take the appropriate action using the available tools
        4. Explain your reasoning and actions clearly
        
        Available actions (use ONLY when explicitly requested):
        - Read ticket details (use read_ticket)
        - Update ticket status (use update_ticket_status)
        - Update ticket priority (use update_ticket_priority)
        
        Important:
        - Only use tools when explicitly asked to take action on the ticket
        - Be precise and specific in your actions
        - If the request is unclear, ask for clarification
        
        Process the user's request appropriately.
      `;

      console.log("[SupportAgent] Executing task");
      const result = await executor.call({ input: task });
      console.log("[SupportAgent] Task complete:", result);

      // Ensure we have a valid result
      if (!result) {
        throw new Error("No result returned from executor");
      }

      // Handle the case where output might be undefined
      const output = result.output || "I understood your message but I'm not sure how to respond. Could you please clarify what you'd like me to do?";

      return {
        success: true,
        output,
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