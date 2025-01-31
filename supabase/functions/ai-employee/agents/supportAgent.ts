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
  AddInternalNoteTool,
  AddToKnowledgebaseTool
} from "../tools/ticket/index.ts";
import { MemoryManagementTool } from "../tools/memory.ts";
import { SearchTool } from "../tools/search.ts";
import { MessageTool } from "../tools/message.ts";
import { TicketAnalyzer } from "./ticketAnalyzer.ts";
import { FunctionsAgent } from "./functionsAgent.ts";
import { BaseMessage, AIMessage, HumanMessage } from "langchain/schema";
import { MODEL_CONFIGS, ModelType } from "../types.ts";

export interface SupportAgentConfig extends BaseToolConfig {
  openAiKey: string;
  model?: string;
  temperature?: number;
  ticketId: string;
  supabaseUrl: string;
  supabaseKey: string;
  aiEmployeeId: string;
  operation?: string;
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
  private functionsAgent!: FunctionsAgent;
  private chatHistory: BaseMessage[] = [];

  private constructor(
    config: SupportAgentConfig,
    functionsAgent: FunctionsAgent
  ) {
    this.config = config;
    
    // Initialize tools
    this.tools = [
      new ReadTicketTool(config),
      new UpdateTicketStatusTool(config),
      new UpdateTicketPriorityTool(config),
      new AssignTicketTool(config),
      new AddInternalNoteTool(config),
      new AddToKnowledgebaseTool(config),
      new MemoryManagementTool(config.ticketId, config.supabaseUrl, config.supabaseKey),
      new SearchTool(config.supabaseUrl, config.supabaseKey),
      new MessageTool(config.ticketId, config.supabaseUrl, config.supabaseKey, config.aiEmployeeId)
    ];

    // Initialize model with appropriate configuration based on operation complexity
    const modelConfig = MODEL_CONFIGS[this.determineModelComplexity()];
    this.model = new ChatOpenAI({
      openAIApiKey: config.openAiKey,
      modelName: config.model || modelConfig.modelName,
      temperature: config.temperature || modelConfig.temperature,
    });

    // Initialize YOLO mode analyzer
    this.ticketAnalyzer = new TicketAnalyzer(config);

    // Set Functions Agent
    this.functionsAgent = functionsAgent;
  }

  static async create(config: SupportAgentConfig): Promise<SupportAgent> {
    const tools = [
      new ReadTicketTool(config),
      new UpdateTicketStatusTool(config),
      new UpdateTicketPriorityTool(config),
      new AssignTicketTool(config),
      new AddInternalNoteTool(config),
      new AddToKnowledgebaseTool(config),
      new MemoryManagementTool(config.ticketId, config.supabaseUrl, config.supabaseKey),
      new SearchTool(config.supabaseUrl, config.supabaseKey),
      new MessageTool(config.ticketId, config.supabaseUrl, config.supabaseKey, config.aiEmployeeId)
    ];

    const functionsAgent = await FunctionsAgent.create(config, tools);
    return new SupportAgent(config, functionsAgent);
  }

  async processInput(userInput: string): Promise<AgentResult> {
    try {
      const messages: string[] = [];
      messages.push("Processing input: " + userInput);

      // Check for YOLO mode
      if (userInput.toLowerCase().includes('yolo')) {
        messages.push("YOLO mode activated - implementing reason + act structure");
        
        // Step 1: Analyze the ticket first
        const analysis = await this.ticketAnalyzer.analyze();
        if (!analysis.success) {
          throw new Error("Failed to analyze ticket: " + analysis.error);
        }
        messages.push("Initial analysis complete");

        // Step 2: Use Functions Agent to handle the analysis results
        const result = await this.functionsAgent.processInput(
          `Based on this ticket analysis, determine and execute appropriate actions: ${analysis.output}`,
          this.chatHistory
        );

        // Update chat history with the interaction
        if (result.success && result.output) {
          this.chatHistory.push(new HumanMessage(userInput));
          this.chatHistory.push(new AIMessage(result.output));
        }

        return result;
      }

      // For normal operations, use Functions Agent directly
      const result = await this.functionsAgent.processInput(userInput, this.chatHistory);
      
      // Update chat history
      if (result.success && result.output) {
        this.chatHistory.push(new HumanMessage(userInput));
        this.chatHistory.push(new AIMessage(result.output));
      }

      return result;

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

  private determineModelComplexity(): 'simple' | 'complex' {
    // Simple operations:
    // - Reading ticket info
    // - Updating ticket status/priority
    // - Adding internal notes
    const simpleOperations = ['read', 'status', 'priority', 'note'];
    
    // Complex operations:
    // - Content generation
    // - Multi-step reasoning
    // - Customer communication
    // - Search and analysis
    const operation = this.config.operation?.toLowerCase() || '';
    return simpleOperations.some(op => operation.includes(op)) ? 'simple' : 'complex';
  }
} 