import { createClient } from '@supabase/supabase-js';
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor } from '@langchain/core/executors';
import { createOpenAIFunctionsAgent } from '@langchain/openai/agents';
import { RunnableSequence } from '@langchain/core/runnables';
import { AIEmployeeConfig, AIEmployeeState } from '../../../src/types/agent';
import { 
  BaseMessage, 
  AIMessage, 
  HumanMessage 
} from '@langchain/core/messages';
import { 
  ChatPromptTemplate, 
  MessagesPlaceholder 
} from '@langchain/core/prompts';

import { TicketManagementTool } from './tools/ticket';
import { MemoryManagementTool } from './tools/memory';
import { SearchTool } from './tools/search';
import { MessageTool } from './tools/message';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize OpenAI
const openAIApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
const model = new ChatOpenAI({ 
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  openAIApiKey 
});

// Define the agent's prompt
const AGENT_PROMPT = ChatPromptTemplate.fromMessages([
  ["system", `You are an AI Employee working in a customer service team. 
  You have access to various tools to help you manage tickets, communicate with customers,
  and maintain context of conversations. Always think carefully about each action before taking it.
  
  Your capabilities include:
  - Reading and updating ticket details
  - Managing ticket priority and status
  - Adding internal notes
  - Sending messages to customers
  - Searching through relevant documentation
  - Maintaining conversation context
  
  Before taking any action:
  1. Review the current context
  2. Consider the appropriate tool for the task
  3. Think through potential implications
  4. Execute with precision
  
  Remember to maintain a professional tone and follow company policies.`],
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

// Initialize agent state
const initialState: AIEmployeeState = {
  currentTicket: null,
  conversationHistory: [],
  lastAction: null,
  context: {},
  memory: {
    shortTerm: [],
    workingMemory: {},
  }
};

// Define the core function
Deno.serve(async (req) => {
  try {
    const { input, ticketId, config } = await req.json();
    
    // Initialize tools
    const tools = [
      new TicketManagementTool(ticketId, supabaseUrl, supabaseAnonKey),
      new MemoryManagementTool(ticketId, supabaseUrl, supabaseAnonKey),
      new SearchTool(supabaseUrl, supabaseAnonKey),
      new MessageTool(ticketId, supabaseUrl, supabaseAnonKey)
    ];
    
    // Create the agent executor
    const agent = await createOpenAIFunctionsAgent({
      llm: model,
      tools,
      prompt: AGENT_PROMPT
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      // verbose: true // Enable for debugging
    });

    // Execute the agent
    const result = await agentExecutor.invoke({
      input,
      ticketId,
      config
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message
        }),
        { 
          headers: { 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unknown error occurred"
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
}); 
