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

  private constructor(
    config: FunctionsAgentConfig, 
    tools: Tool[], 
    executor: AgentExecutor
  ) {
    this.config = config;
    this.tools = tools;
    this.executor = executor;
    
    // Initialize model with function calling
    this.model = new ChatOpenAI({
      openAIApiKey: config.openAiKey,
      modelName: config.model || "gpt-4-1106-preview",
      temperature: config.temperature || 0.2,
    });
  }

  static async create(config: FunctionsAgentConfig, tools: Tool[]): Promise<FunctionsAgent> {
    const model = new ChatOpenAI({
      openAIApiKey: config.openAiKey,
      modelName: config.model || "gpt-4-1106-preview",
      temperature: config.temperature || 0.2,
    });

    // Create the prompt for the agent
    const prompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `You are an AI support agent handling ticket ${config.ticketId}.
Your goal is to assist users by taking appropriate actions based on their requests.
Think carefully about each action before executing it.
Explain your reasoning clearly and verify the results of each action.`
      ),
      new MessagesPlaceholder("chat_history"),
      HumanMessagePromptTemplate.fromTemplate("{input}"),
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    // Create the OpenAI functions agent
    const executor = await initializeAgentExecutorWithOptions(tools, model, {
      agentType: "openai-functions",
      verbose: true,
      returnIntermediateSteps: true,
      agentArgs: {
        prefix: prompt.toString(),
      },
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
        output: result.output,
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
