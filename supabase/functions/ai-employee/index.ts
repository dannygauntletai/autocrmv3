import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from './_shared/cors.ts';
import { SupportAgent } from './agents/index.ts';

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
    
    // Initialize the support agent
    console.log("[AI-Employee] Initializing support agent...");
    const agent = new SupportAgent({
      ticketId,
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
      aiEmployeeId: '00000000-0000-0000-0000-000000000000',
      openAiKey: openAIApiKey,
      model: 'gpt-4-turbo-preview',
      temperature: 0.7
    });

    // Process the user input
    console.log("[AI-Employee] Processing input with support agent...");
    const result = await agent.processInput(input);
    console.log("[AI-Employee] Support agent result:", result);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          output: result.output,
          toolCalls: result.toolCalls
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error("[AI-Employee] Error processing request:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred"
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
}); 
