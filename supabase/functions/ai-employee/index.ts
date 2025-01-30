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

TOOL USAGE:
1. Ticket Management:
   - Read ticket: "read"
   - Update status: "update status [new_status]"
   - Update priority: "update priority [new_priority]"
   - Add comment: "comment [your message]"
   - Analyze ticket: "analyze"

2. Messages:
   - Send message: "send customer/internal [message]"
   - Generate response: "generate customer/internal [context]"
   - Analyze message: "analyze [message]"

3. Search:
   - Basic search: "search [query]"
   - Date range search: "search [query] from [date] to [date]"

4. Memory Management:
   - Read memory: "read short_term" or "read working"
   - Write memory: "write short_term [message]" or "write working KEY=VALUE"
   - Clear memory: "clear short_term" or "clear working"

SPECIAL COMMANDS:
- "YOLO": When a user types "YOLO", you will:
  1. Use the ticket_management tool with the command "analyze"
  2. This will trigger autonomous analysis and actions:
     - Ticket resolution status updates
     - Priority adjustments
     - Internal notes addition
  3. Review and report the actions taken

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
      // Check for YOLO mode
      const isYoloMode = input.trim().toLowerCase() === "yolo";
      console.log("[AI-Employee] YOLO mode:", isYoloMode);
      
      const agentInput = isYoloMode 
        ? `Use the ticket_management tool with the command "analyze" to perform a comprehensive analysis of this ticket and take autonomous actions.` 
        : input;
      
      console.log("[AI-Employee] Preparing agent input:", JSON.stringify({
        isYoloMode,
        agentInput,
        ticketId,
        status: ticketData.status,
        priority: ticketData.priority,
        messageCount: ticketData.ticket_messages?.length,
        config
      }, null, 2));

      result = await executor.invoke({
        input: agentInput,
        ticketId,
        status: ticketData.status,
        priority: ticketData.priority,
        customerEmail: ticketData.email,
        assignee: ticketData.employee_ticket_assignments?.[0]?.employee || null,
        messageCount: ticketData.ticket_messages?.length,
        contextLoaded: true,
        config: {
          ...config,
          isYoloMode
        }
      });

      // Log the raw result before processing
      console.log("[AI-Employee] Raw agent execution result:", JSON.stringify({
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : null,
        resultOutput: result?.output,
        resultError: result?.error,
        fullResult: result
      }, null, 2));

      // If YOLO mode and result indicates failure, log more details
      if (isYoloMode && (!result?.output || result?.output.includes("unsuccessful"))) {
        console.error("[AI-Employee] YOLO mode execution potentially failed:", JSON.stringify({
          output: result?.output,
          error: result?.error,
          intermediateSteps: result?.intermediateSteps,
          tools: tools.map(t => ({ name: t.name, description: t.description }))
        }, null, 2));

        // Try to extract error from intermediate steps
        if (result?.intermediateSteps) {
          const lastStep = result.intermediateSteps[result.intermediateSteps.length - 1];
          if (lastStep?.observation && typeof lastStep.observation === 'string') {
            try {
              const observation = JSON.parse(lastStep.observation);
              if (!observation.success && observation.error) {
                console.error("[AI-Employee] Found error in last step:", JSON.stringify(observation, null, 2));
                result.error = observation.error;
              }
            } catch (e) {
              console.log("[AI-Employee] Could not parse last step observation:", lastStep.observation);
            }
          }
        }
      }

      console.log("[AI-Employee] Agent execution completed:", JSON.stringify(result, null, 2));
    } catch (invokeError) {
      console.error("[AI-Employee] Error executing agent:", JSON.stringify({
        error: {
          name: invokeError instanceof Error ? invokeError.name : 'Unknown',
          message: invokeError instanceof Error ? invokeError.message : String(invokeError),
          stack: invokeError instanceof Error ? invokeError.stack : undefined,
          cause: invokeError instanceof Error ? invokeError.cause : undefined
        }
      }, null, 2));
      throw invokeError;
    }

    const response = new Response(
      JSON.stringify({
        success: true,
        data: result
      }, (_, value) => {
        if (value === undefined) return null;
        if (value instanceof Error) return {
          name: value.name,
          message: value.message,
          stack: value.stack
        };
        return value;
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 200 
      }
    );
    
    console.log("[AI-Employee] Sending response:", JSON.stringify({
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: result
    }, null, 2));
    
    return response;

  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[AI-Employee] Error:", JSON.stringify({
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      raw: err
    }, null, 2));
    
    const errorResponse = new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: {
          name: error.name,
          stack: error.stack,
          cause: error.cause
        }
      }, (_, value) => {
        if (value === undefined) return null;
        if (value instanceof Error) return {
          name: value.name,
          message: value.message,
          stack: value.stack
        };
        return value;
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
