// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Hello from Functions!")

interface RequestBody {
  ticketId: string;
  draftResponse?: string;
}

interface TicketMessage {
  message_body: string;
  sender_type: string;
  created_at: string;
}

interface SimilarMessage {
  message_body: string;
  metadata: {
    sender_type: string;
    message_length: number;
  };
  similarity: number;
}

interface RelevantDocument {
  content: string;
  metadata: {
    filename: string;
    team_id: string;
  };
  similarity: number;
}

// Lower similarity threshold for document matches
const SIMILARITY_THRESHOLD = 0.2;
const MAX_TOKENS = 1000;
const TEMPERATURE = 0.7;

interface Database {
  public: {
    Tables: {
      tickets: {
        Row: {
          id: string;
          title: string;
          category: string;
          status: string;
          priority: string;
          email: string;
          created_at: string;
        };
      };
      ticket_messages: {
        Row: {
          id: string;
          ticket_id: string;
          message_body: string;
          sender_type: string;
          created_at: string;
        };
      };
      team_ticket_assignments: {
        Row: {
          id: string;
          ticket_id: string;
          team_id: string;
          teams: {
            name: string;
          } | null;
        };
      };
      employees: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: string;
        };
      };
      customers: {
        Row: {
          id: string;
          email: string;
          name: string;
        };
      };
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Request received:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries())
    });

    if (!req.body) {
      console.error('Missing request body');
      return new Response(
        JSON.stringify({ 
          error: 'Request body is required',
          help: 'Please provide a JSON body with ticketId'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const rawBody = await req.text()
    console.log('Raw request body:', rawBody);

    let parsedBody: RequestBody
    try {
      parsedBody = JSON.parse(rawBody)
      console.log('Parsed request body:', parsedBody);
    } catch (e) {
      console.error('JSON parse error:', e);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          received: rawBody,
          parseError: e instanceof Error ? e.message : 'Unknown parsing error'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const { ticketId, draftResponse } = parsedBody
    console.log('Processing request for ticket:', ticketId);
    console.log('Draft response:', draftResponse);

    // Check OpenAI configuration
    const openai = new OpenAI({ 
      apiKey: Deno.env.get('OPENAI_API_KEY')
    })
    console.log('OpenAI API key configured:', !!openai.apiKey);

    if (!openai.apiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    // Extract JWT and set up Supabase client
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    const jwt = authHeader.replace('Bearer ', '');

    // Check Supabase configuration
    console.log('Supabase URL configured:', !!Deno.env.get('SUPABASE_URL'));
    console.log('Supabase Anon Key configured:', !!Deno.env.get('SUPABASE_ANON_KEY'));

    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        global: {
          headers: { Authorization: `Bearer ${jwt}` }
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get employee data for response context
    const { data: employeeData, error: employeeError } = await supabaseClient
      .from('employees')
      .select('name')
      .limit(1)
      .maybeSingle();

    if (employeeError || !employeeData) {
      console.error('Error fetching employee data:', employeeError);
      throw new Error('Could not get employee data');
    }

    // Fetch ticket data
    console.log('Fetching ticket data...');
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('tickets')
      .select(`
        *,
        ticket_messages (
          id,
          message_body,
          sender_type,
          created_at
        ),
        team_ticket_assignments (
          team_id,
          teams (
            name
          )
        )
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError) {
      console.error('Error fetching ticket:', ticketError);
      throw ticketError;
    }

    // Get customer info from email
    const { data: customerData, error: customerError } = await supabaseClient
      .from('customers')
      .select('name')
      .eq('email', ticket.email)
      .single();

    if (customerError) {
      console.error('Error fetching customer:', customerError);
      // Continue without customer name
    }

    console.log('Ticket data retrieved:', {
      id: ticket.id,
      messageCount: ticket.ticket_messages?.length,
      hasTeamAssignment: !!ticket.team_ticket_assignments?.[0]
    });

    // Process latest message
    const latestMessage = ticket.ticket_messages.sort(
      (a: Database['public']['Tables']['ticket_messages']['Row'], 
       b: Database['public']['Tables']['ticket_messages']['Row']) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    if (!latestMessage) {
      console.error('No messages found for ticket:', ticketId);
      throw new Error('No messages found for this ticket');
    }
    console.log('Latest message:', {
      id: latestMessage.id,
      sender_type: latestMessage.sender_type,
      length: latestMessage.message_body.length
    });

    // Generate embedding
    console.log('Generating embedding...');
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: latestMessage.message_body,
    })

    if (!embeddingResponse.data?.[0]?.embedding) {
      console.error('Failed to generate embedding:', embeddingResponse);
      throw new Error('Failed to generate embedding')
    }
    console.log('Embedding generated successfully');

    const embedding = embeddingResponse.data[0].embedding;

    // Store embedding
    console.log('Storing embedding...');
    try {
      const { error: storeError } = await supabaseClient
        .from('ticket_message_embeddings')
        .insert({
          message_id: latestMessage.id,
          ticket_id: ticketId,
          embedding,
          metadata: {
            sender_type: latestMessage.sender_type,
            message_length: latestMessage.message_body.length
          }
        });

      if (storeError) {
        console.error('Error storing embedding:', storeError);
      } else {
        console.log('Embedding stored successfully');
      }
    } catch (error) {
      console.error('Error storing embedding:', error);
    }

    // Find similar messages
    let similarMessages = [];
    let relevantDocs = [];

    console.log('Finding similar messages...');
    try {
      const { data: similarData, error: similarError } = await supabaseClient.rpc(
        'match_ticket_messages',
        {
          query_embedding: embedding,
          match_threshold: SIMILARITY_THRESHOLD,
          match_count: 5
        }
      )

      if (similarError) {
        console.error('Error in match_ticket_messages:', similarError);
      } else {
        similarMessages = similarData || [];
        console.log('Similar messages found:', similarMessages.length);
      }
    } catch (error) {
      console.error('Error finding similar messages:', error);
    }

    console.log('Finding relevant documents...');
    try {
      const { data: docsData, error: docsError } = await supabaseClient.rpc(
        'match_document_chunks',
        {
          query_embedding: embedding,
          match_threshold: SIMILARITY_THRESHOLD,
          match_count: 3,
          team_id: ticket.team_ticket_assignments[0]?.team_id
        }
      )

      if (docsError) {
        console.error('Error in match_document_chunks:', docsError);
      } else {
        relevantDocs = docsData || [];
        console.log('Relevant documents found:', relevantDocs.length);
      }
    } catch (error) {
      console.error('Error finding relevant documents:', error);
    }

    // Prepare context
    console.log('Preparing context for GPT...');
    const conversationHistory = ticket.ticket_messages
      .sort((a: Database['public']['Tables']['ticket_messages']['Row'], 
             b: Database['public']['Tables']['ticket_messages']['Row']) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((msg: Database['public']['Tables']['ticket_messages']['Row']) => 
        `${msg.sender_type.toUpperCase()}: ${msg.message_body}`)
      .join('\n\n')

    const similarMessagesContext = similarMessages.length > 0
      ? `\nSimilar past conversations:\n${similarMessages
          .map((m: SimilarMessage) => `- ${m.message_body} (Similarity: ${m.similarity.toFixed(2)})`)
          .join('\n')}`
      : ''

    const relevantDocsContext = relevantDocs.length > 0
      ? `\nRelevant team documents:\n${relevantDocs
          .map((d: RelevantDocument) => `- From "${d.metadata.filename}": ${d.content} (Similarity: ${d.similarity.toFixed(2)})`)
          .join('\n')}`
      : ''

    // Generate response
    console.log('Generating GPT response...');
    const messages = [
      {
        role: "system" as const,
        content: `You are ${employeeData.name}, a customer support agent for ${ticket.team_ticket_assignments[0]?.teams?.name || 'our'} team.
You are writing a response to ${customerData?.name || 'the customer'} (${ticket.email}).
Use the conversation history, similar past conversations, and relevant team documents to provide accurate and helpful responses.
When using information from team documents, acknowledge the source in a natural way.
Maintain a professional and friendly tone.
Always sign your response with your name: ${employeeData.name}`
      },
      {
        role: "user" as const,
        content: `Ticket Information:
Title: ${ticket.title}
Category: ${ticket.category}
Status: ${ticket.status}
Priority: ${ticket.priority}

Conversation History:
${conversationHistory}
${similarMessagesContext}
${relevantDocsContext}

${draftResponse ? `I've started drafting this response: ${draftResponse}` : 'Please generate a response to the latest message.'}`
      }
    ]

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
    })

    const generatedText = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response at this time."
    console.log('Response generated successfully');

    return new Response(
      JSON.stringify({
        response: generatedText,
        sources: {
          similarMessages: similarMessages || [],
          relevantDocuments: relevantDocs || []
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Function error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }

    const errorResponse = {
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      details: error instanceof Error ? error.stack : undefined
    }

    return new Response(
      JSON.stringify(errorResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-response' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
