import { ChatOpenAI } from "langchain/chat_models/openai";
import { Tool } from "langchain/tools";
import { 
  AgentExecutor, 
  initializeAgentExecutorWithOptions 
} from "langchain/agents";
import { 
  ChatPromptTemplate, 
  HumanMessagePromptTemplate, 
  SystemMessagePromptTemplate,
  MessagesPlaceholder
} from "langchain/prompts";
import { 
  AgentStep,
  BaseMessage,
  AIMessage,
  HumanMessage,
  FunctionMessage
} from "langchain/schema";
import { BaseToolConfig } from "../tools/ticket/types.ts";
import { SupportAgentConfig } from "./supportAgent.ts";
import { MODEL_CONFIGS } from "../types.ts";

export interface FunctionsAgentConfig extends BaseToolConfig {
  openAiKey: string;
  model?: string;
  temperature?: number;
  ticketId: string;
  supabaseUrl: string;
  supabaseKey: string;
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

export class FunctionsAgent {
  private config: FunctionsAgentConfig;
  private tools: Tool[];
  private model: ChatOpenAI;
  private executor: AgentExecutor;

  constructor(config: FunctionsAgentConfig, tools: Tool[], executor: AgentExecutor) {
    this.config = config;
    this.tools = tools;
    this.executor = executor;

    const modelConfig = MODEL_CONFIGS[this.determineModelComplexity()];
    this.model = new ChatOpenAI({
      openAIApiKey: config.openAiKey,
      modelName: config.model || modelConfig.modelName,
      temperature: config.temperature || modelConfig.temperature,
    });
  }

  private determineModelComplexity(): 'simple' | 'complex' {
    // Functions agent typically handles complex operations
    // as it's responsible for multi-step reasoning and tool selection
    return 'complex';
  }

  static async create(config: FunctionsAgentConfig, tools: Tool[]): Promise<FunctionsAgent> {
    const modelConfig = MODEL_CONFIGS['complex']; // Functions agent always uses complex model
    const model = new ChatOpenAI({
      openAIApiKey: config.openAiKey,
      modelName: config.model || modelConfig.modelName,
      temperature: config.temperature || modelConfig.temperature,
    });

    const executor = await initializeAgentExecutorWithOptions(tools, model, {
      agentType: "openai-functions",
      verbose: true,
      returnIntermediateSteps: true,
      maxIterations: 10,
    });

    return new FunctionsAgent(config, tools, executor);
  }

  async processInput(input: string, chatHistory: BaseMessage[] = []): Promise<AgentResult> {
    try {
      const result = await this.executor.invoke({
        input,
        chat_history: chatHistory,
      });

      return {
        success: true,
        output: result.output + (result.output.includes('max iterations') ? 
          '\n\nPartial actions completed before max iterations:\n' + 
          result.intermediateSteps?.map((step: AgentStep) => 
            `- Tool: ${step.action.tool}\n  Input: ${step.action.toolInput}\n  Result: ${step.observation}`
          ).join('\n') : ''),
        steps: result.intermediateSteps,
        toolCalls: result.intermediateSteps?.map((step: AgentStep) => ({
          tool: step.action.tool,
          input: step.action.toolInput,
          output: step.observation,
        })),
        context: {
          ticketId: this.config.ticketId,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      // Check if error is due to max iterations and include partial results
      const isMaxIterations = error instanceof Error && error.message.includes('max iterations');
      const steps = (this.executor as any).intermediateSteps as AgentStep[] | undefined;
      if (isMaxIterations && steps?.length) {
        return {
          success: true,
          output: "Reached maximum iterations. Here are the actions completed:\n" +
            steps.map((step: AgentStep) => 
              `- Tool: ${step.action.tool}\n  Input: ${step.action.toolInput}\n  Result: ${step.observation}`
            ).join('\n'),
          steps: steps,
          toolCalls: steps.map((step: AgentStep) => ({
            tool: step.action.tool,
            input: step.action.toolInput,
            output: step.observation,
          })),
          context: {
            ticketId: this.config.ticketId,
            timestamp: Date.now(),
          },
        };
      }

      console.error("[FunctionsAgent] Error processing input:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
        context: {
          ticketId: this.config.ticketId,
          timestamp: Date.now(),
        },
      };
    }
  }
} 
