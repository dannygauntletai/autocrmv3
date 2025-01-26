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
    team_name?: string;
    sender_type: string;
  };
  similarity: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log request details for debugging
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    console.log('Request method:', req.method)
    
    // Check if request has a body
    if (!req.body) {
      throw new Error('Request has no body')
    }

    // Get the raw body and log it
    const rawBody = await req.text()
    console.log('Raw request body:', rawBody)

    // Validate the raw body
    if (!rawBody || rawBody.trim() === '') {
      return new Response(
        JSON.stringify({ 
          error: 'Request body is empty',
          help: 'Please provide a JSON body with ticketId'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Try to parse the JSON
    let parsedBody: RequestBody
    try {
      parsedBody = JSON.parse(rawBody)
      console.log('Parsed request body:', parsedBody)
    } catch (e) {
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

    // Validate required fields
    const { ticketId, draftResponse } = parsedBody
    if (!ticketId) {
      return new Response(
        JSON.stringify({ 
          error: 'ticketId is required',
          received: parsedBody
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Initialize clients
    const openai = new OpenAI({ 
      apiKey: Deno.env.get('OPENAI_API_KEY')
    })

    if (!openai.apiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    if (!Deno.env.get('SUPABASE_URL') || !Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      throw new Error('Missing required environment variables for database connection')
    }

    // Get current ticket messages for context
    const { data: ticketMessages, error: messagesError } = await supabaseClient
      .from('ticket_messages')
      .select('message_body, sender_type, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching ticket messages:', messagesError)
      throw messagesError
    }

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('tickets')
      .select('title, description, category, status, priority')
      .eq('id', ticketId)
      .single()

    if (ticketError) {
      console.error('Error fetching ticket:', ticketError)
      throw ticketError
    }

    // Create embedding for the current context
    const contextForEmbedding = draftResponse || ticket.description || ''
    console.log('Generating embedding for context:', contextForEmbedding)
    
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: contextForEmbedding,
    })

    if (!embeddingResponse.data?.[0]?.embedding) {
      throw new Error('Failed to generate embedding for context')
    }

    const embedding = embeddingResponse.data[0].embedding

    // Query similar messages using vector similarity search
    console.log('Querying similar messages...')
    const { data: similarMessages, error: similarError } = await supabaseClient.rpc(
      'match_ticket_messages',
      {
        query_embedding: embedding,
        match_threshold: 0.78, // Increased threshold for better matches
        match_count: 5
      }
    )

    if (similarError) {
      console.error('Error matching similar messages:', similarError)
      throw similarError
    }

    console.log(`Found ${similarMessages?.length || 0} similar messages`)

    // Prepare conversation context
    const conversationContext = (ticketMessages as TicketMessage[])
      ?.map(msg => `${msg.sender_type.toUpperCase()} (${new Date(msg.created_at).toLocaleString()}): ${msg.message_body}`)
      .join('\n') || ''

    // Prepare similar messages context with metadata
    const similarMessagesContext = (similarMessages as SimilarMessage[])
      ?.map(msg => {
        const teamContext = msg.metadata?.team_name ? ` (handled by ${msg.metadata.team_name})` : ''
        const similarityScore = Math.round(msg.similarity * 100)
        return `Similar resolved ticket${teamContext} (${similarityScore}% match): ${msg.message_body}`
      })
      .join('\n') || ''

    // Generate response using OpenAI
    const messages = [
      {
        role: "system" as const,
        content: `You are a helpful customer service representative. You have access to:
1. The current ticket's conversation history and details
2. Similar resolved tickets for reference (with similarity scores)
3. The agent's draft response (if provided)

Guidelines:
- Be professional, empathetic, and accurate
- If a draft response is provided, enhance it while maintaining its core message
- If no draft is provided, generate a new response based on the context
- Use similar resolved tickets as reference for tone and solution patterns
- Maintain consistency with previous responses in the conversation
- Be concise but thorough`
      },
      {
        role: "user" as const,
        content: `Ticket Information:
Title: ${ticket.title}
Category: ${ticket.category}
Priority: ${ticket.priority}
Status: ${ticket.status}
Description: ${ticket.description}

Current Conversation:
${conversationContext}

Similar Resolved Tickets:
${similarMessagesContext}

${draftResponse ? `Agent's Draft Response:
${draftResponse}

Please enhance this draft response while maintaining its core message.` : 'Please generate a new response based on the context.'}`
      }
    ]

    console.log('Generating response...')
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    })

    const generatedText = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response at this time."

    console.log('Response generated successfully')
    return new Response(
      JSON.stringify({ response: generatedText }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in generate-response:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : 'Unknown',
      raw: error
    })
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error instanceof Error ? error.stack : undefined,
        raw: JSON.stringify(error)
      }),
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
