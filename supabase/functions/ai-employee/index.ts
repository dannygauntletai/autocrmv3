import { createClient } from '@supabase/supabase-js';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { AgentExecutor, initializeAgentExecutorWithOptions } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from 'langchain/prompts';
import { AIEmployeeConfig, AIEmployeeState } from './types.ts';
import { 
  SystemMessage,
  HumanMessage,
  AIMessage
} from 'langchain/schema';
import { corsHeaders } from './_shared/cors.ts';

import { TicketManagementTool } from './tools/ticket.ts';
import { MemoryManagementTool } from './tools/memory.ts';
import { SearchTool } from './tools/search.ts';
import { MessageTool } from './tools/message.ts';

// Initialize LangSmith tracing
const LANGCHAIN_TRACING_V2 = Deno.env.get('LANGCHAIN_TRACING_V2') ?? 'true';
const LANGCHAIN_ENDPOINT = Deno.env.get('LANGCHAIN_ENDPOINT') ?? 'https://api.smith.langchain.com';
const LANGCHAIN_API_KEY = Deno.env.get('LANGCHAIN_API_KEY') ?? '';
const LANGCHAIN_PROJECT = Deno.env.get('LANGCHAIN_PROJECT') ?? 'autocrm-ai-employee';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize OpenAI
console.log("[AI-Employee] Environment check:", {
  openai_key_exists: !!Deno.env.get('OPENAI_API_KEY'),
  openai_key_length: Deno.env.get('OPENAI_API_KEY')?.length ?? 0,
  env_keys: Object.keys(Deno.env.toObject())
});

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
if (!openAIApiKey) {
  console.error("[AI-Employee] OpenAI API key not found. Available environment variables:", Object.keys(Deno.env.toObject()));
  throw new Error('OpenAI API key not found in environment variables');
}

const model = new ChatOpenAI({ 
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  openAIApiKey,
  configuration: {
    baseOptions: {
      headers: {
        'x-langsmith-enable-tracing': LANGCHAIN_TRACING_V2,
        'x-langsmith-endpoint': LANGCHAIN_ENDPOINT,
        'x-langsmith-api-key': LANGCHAIN_API_KEY,
        'x-langsmith-project': LANGCHAIN_PROJECT
      }
    }
  }
});

// Define the agent's prompt
const systemMessage = new SystemMessage(`You are an AI Employee working in a customer service team. 
You have access to various tools to help you manage tickets, communicate with customers,
and maintain context of conversations. Always think carefully about each action before taking it.

Your capabilities include:
- Reading and updating ticket details
- Managing ticket priority and status
- Adding internal notes
- Sending messages to customers
- Searching through relevant documentation
- Maintaining conversation context

IMPORTANT: When asked about ticket information (status, priority, assignee, etc.):
1. ALWAYS check if contextLoaded is true in your input parameters
2. When contextLoaded is true, use these values directly from your input:
   - status: Current ticket status
   - priority: Current ticket priority
   - customerEmail: Customer's email
   - assignee: Current ticket assignee
   - messageCount: Number of messages in the ticket

HOW TO RESPOND:
1. For ticket status/details queries:
   - If contextLoaded is true, respond with "Ticket [ticketId] has status: [status], priority: [priority]" etc.
   - Include all relevant context information you have
   - DO NOT say you can't access the information when you have it
   - DO NOT mention simulation, constraints, or technical details
2. For other queries:
   - Use the appropriate tool only if needed
   - Respond clearly and directly with the information

Before taking any action:
1. Check if contextLoaded is true in your input
2. If true, use the data directly from your input parameters
3. If false or missing:
   - Use the ticket_management tool to read the ticket with the provided ticketId
4. Consider the appropriate tool for additional actions
5. Think through potential implications
6. Execute with precision

Remember to:
- Maintain a professional tone and follow company policies
- Reference ticket history when relevant
- Be proactive in identifying potential issues
- Suggest appropriate next actions based on context
- Keep internal notes for important decisions or observations`);

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
  console.log("[AI-Employee] Received request:", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log("[AI-Employee] Handling CORS preflight request");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    console.log("[AI-Employee] Request body:", body);
    
    const { input, ticketId, config } = JSON.parse(body);
    console.log("[AI-Employee] Parsed request:", { input, ticketId, config });
    
    console.log("[AI-Employee] Environment variables:", {
      openai_key_exists: !!Deno.env.get('OPENAI_API_KEY'),
      openai_key_length: Deno.env.get('OPENAI_API_KEY')?.length ?? 0,
      supabase_url_exists: !!Deno.env.get('SUPABASE_URL'),
      supabase_key_exists: !!Deno.env.get('SUPABASE_ANON_KEY'),
      env_keys: Object.keys(Deno.env.toObject())
    });
    
    // First load ticket context
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        employee_ticket_assignments!left(
          employee:employees(*)
        ),
        ticket_messages(*)
      `)
      .eq('id', ticketId)
      .is('employee_ticket_assignments.unassigned_at', null)
      .single();

    if (ticketError) {
      console.error("[AI-Employee] Error loading ticket:", ticketError);
      throw new Error(`Failed to load ticket context: ${ticketError.message}`);
    }

    console.log("[AI-Employee] Loaded ticket context:", {
      ticketId,
      status: ticketData.status,
      priority: ticketData.priority,
      messageCount: ticketData.ticket_messages?.length
    });
    
    // Initialize tools with ticket context
    console.log("[AI-Employee] Initializing tools...");
    let tools;
    try {
      tools = [
        new TicketManagementTool(ticketId, supabaseUrl, supabaseAnonKey),
        new MemoryManagementTool(ticketId, supabaseUrl, supabaseAnonKey),
        new SearchTool(supabaseUrl, supabaseAnonKey),
        new MessageTool(ticketId, supabaseUrl, supabaseAnonKey)
      ];
      console.log("[AI-Employee] Tools initialized successfully");
    } catch (toolError) {
      console.error("[AI-Employee] Error initializing tools:", toolError);
      throw toolError;
    }

    // Create the agent executor with enhanced context
    console.log("[AI-Employee] Creating agent executor...");
    let executor;
    try {
      executor = await initializeAgentExecutorWithOptions(tools, model, {
        agentType: "chat-zero-shot-react-description",
        verbose: true,
        agentArgs: {
          prefix: systemMessage.content
        },
        tags: ["autocrm", "ai-employee", ticketId],
        metadata: {
          ticketId,
          ticketStatus: ticketData.status,
          ticketPriority: ticketData.priority,
          timestamp: new Date().toISOString()
        }
      });
      console.log("[AI-Employee] Agent executor created successfully with context:", {
        ticketId,
        ticketStatus: ticketData.status,
        ticketPriority: ticketData.priority,
        hasAssignee: !!ticketData.employee_ticket_assignments?.[0]?.employee
      });
    } catch (executorError) {
      console.error("[AI-Employee] Error creating agent executor:", executorError);
      throw executorError;
    }

    // Execute the agent with ticket context
    console.log("[AI-Employee] Executing agent...");
    let result;
    try {
      result = await executor.invoke({
        input,
        ticketId,
        status: ticketData.status,
        priority: ticketData.priority,
        customerEmail: ticketData.email,
        assignee: ticketData.employee_ticket_assignments?.[0]?.employee || null,
        messageCount: ticketData.ticket_messages?.length,
        contextLoaded: true,  // Renamed to avoid confusion with other potential 'loaded' flags
        config
      });
      console.log("[AI-Employee] Agent execution completed:", result);
    } catch (invokeError) {
      console.error("[AI-Employee] Error executing agent:", invokeError);
      throw invokeError;
    }

    const response = new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 200 
      }
    );
    
    console.log("[AI-Employee] Sending response:", {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: result
    });
    
    return response;

  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[AI-Employee] Error:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    const errorResponse = new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 500 
      }
    );
    
    console.log("[AI-Employee] Sending error response:", {
      status: errorResponse.status,
      headers: Object.fromEntries(errorResponse.headers.entries()),
      error: error.message
    });
    
    return errorResponse;
  }
}); 
