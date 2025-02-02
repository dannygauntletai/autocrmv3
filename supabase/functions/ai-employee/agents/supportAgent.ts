import { ChatOpenAI } from "langchain/chat_models/openai";
import { Tool } from "langchain/tools";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { AgentStep, BaseMessage, AIMessage, HumanMessage } from "langchain/schema";
import { 
  BaseToolConfig, 
  MODEL_CONFIGS, 
  ModelType,
  AssignmentAction,
  AssignmentType,
  SupportAgentConfig as AgentConfig
} from "../types.ts";
import { 
  ReadTicketTool, 
  UpdateTicketStatusTool, 
  UpdateTicketPriorityTool,
  AssignTicketTool,
  AssignTeamTool,
  AddInternalNoteTool,
  AddToKnowledgebaseTool,
  SmartAssignTicketTool
} from "../tools/ticket/index.ts";
import { MemoryManagementTool } from "../tools/memory.ts";
import { SearchTool } from "../tools/search.ts";
import { MessageTool } from "../tools/message.ts";
import { TicketAnalyzer } from "./ticketAnalyzer.ts";
import { FunctionsAgent } from "./functionsAgent.ts";

export interface SupportAgentConfig extends BaseToolConfig {
  openAiKey: string;
  model?: ModelType;
  temperature?: number;
  ticketId: string;
  supabaseUrl: string;
  supabaseKey: string;
  aiEmployeeId: string;
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
  private functionsAgent: FunctionsAgent;
  private chatHistory: BaseMessage[] = [];

  constructor(config: SupportAgentConfig, functionsAgent: FunctionsAgent) {
    this.config = config;
    this.functionsAgent = functionsAgent;
    
    // Initialize tools
    this.tools = [
      new ReadTicketTool(config),
      new UpdateTicketStatusTool(config),
      new UpdateTicketPriorityTool(config),
      new AssignTicketTool(config),
      new AssignTeamTool(config),
      new AddInternalNoteTool(config),
      new AddToKnowledgebaseTool(config),
      new SmartAssignTicketTool(config),
      new MemoryManagementTool(config.ticketId, config.supabaseUrl, config.supabaseKey),
      new SearchTool(config.supabaseUrl, config.supabaseKey),
      new MessageTool(config.ticketId, config.supabaseUrl, config.supabaseKey, config.aiEmployeeId)
    ];

    // Initialize model with appropriate configuration based on operation complexity
    const modelConfig = MODEL_CONFIGS[this.determineModelComplexity()];
    this.model = new ChatOpenAI({
      openAIApiKey: config.openAiKey,
      modelName: modelConfig.modelName,
      temperature: config.temperature || modelConfig.temperature,
    });

    // Initialize YOLO mode analyzer
    this.ticketAnalyzer = new TicketAnalyzer(config);
  }

  static async create(config: SupportAgentConfig): Promise<SupportAgent> {
    const tools = [
      new ReadTicketTool(config),
      new UpdateTicketStatusTool(config),
      new UpdateTicketPriorityTool(config),
      new AssignTicketTool(config),
      new AssignTeamTool(config),
      new AddInternalNoteTool(config),
      new AddToKnowledgebaseTool(config),
      new SmartAssignTicketTool(config),
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
        messages.push("YOLO mode activated - implementing autonomous analysis");
        
        // Use the ticket analyzer directly with the functions agent's tools
        const analysis = await this.ticketAnalyzer.analyzeWithTools(
          this.tools,
          this.functionsAgent
        );

        if (!analysis.success) {
          throw new Error("Failed to analyze ticket: " + analysis.error);
        }

        // Filter out execution messages from the output
        if (analysis.output) {
          analysis.output = analysis.output.replace(/Executing Action \d+\.\.\.(\n|\r\n)?/g, '');
        }

        return analysis;
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

  async handleAssignment(input: string): Promise<string> {
    try {
      // Parse the input to determine assignment type
      const isTeamAssignment = input.toLowerCase().includes('team:') || 
                              input.toLowerCase().includes('team=') ||
                              input.toLowerCase().includes('team/') ||
                              input.toLowerCase().includes('_team');

      const action: AssignmentAction = {
        type: isTeamAssignment ? 'team' : 'employee',
        target: input
          .replace(/^(team|employee)[:=-]/i, '')  // Remove prefix if present
          .replace(/^(team|employee)\//i, '')     // Remove forward slash prefix if present
          .replace(/_team$/i, '')                 // Remove _team suffix if present
          .trim()
      };

      // Format the input as a proper JSON string for the appropriate tool
      const formattedInput = JSON.stringify(action);
      
      // Log the assignment attempt
      console.log("[SupportAgent] Attempting assignment:", {
        originalInput: input,
        parsedAction: action,
        formattedInput
      });

      // Use the appropriate tool based on assignment type
      const toolName = action.type === 'team' ? 'assign_team' : 'assign_ticket';
      console.log(`[SupportAgent] Using ${toolName} tool`);

      const result = await this.functionsAgent.processInput(
        `${toolName} ${formattedInput}`
      );

      return JSON.stringify(result);
    } catch (error) {
      console.error("[SupportAgent] Assignment failed:", error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to handle assignment",
        context: {
          timestamp: Date.now(),
          metadata: {
            error: true,
            errorType: error instanceof Error ? error.name : 'Unknown'
          }
        }
      });
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
    return 'complex'; // Always use complex model for support agent
  }
} 