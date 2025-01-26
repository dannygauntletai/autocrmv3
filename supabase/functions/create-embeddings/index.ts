import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TicketMessage {
  id: string
  ticket_id: string
  message_body: string
  sender_type: 'employee' | 'customer' | 'system'
}

interface Team {
  name: string
}

interface TeamAssignment {
  team_id: string
  teams: Team
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting embedding generation process...')
    
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

    console.log('Environment variables:')
    console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL'))
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

    if (!Deno.env.get('SUPABASE_URL') || !Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      throw new Error('Missing required environment variables for database connection')
    }

    // Configure OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    })

    if (!openai.apiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    console.log('OpenAI API key exists:', !!openai.apiKey)

    // Get existing message IDs that already have embeddings
    console.log('Fetching existing embeddings...')
    const { data: existingEmbeddings } = await supabaseClient
      .from('ticket_message_embeddings')
      .select('message_id')

    const existingMessageIds = existingEmbeddings?.map(e => e.message_id) || []
    console.log(`Found ${existingMessageIds.length} existing embeddings`)

    // Get all ticket messages from resolved tickets that don't have embeddings yet
    console.log('Fetching messages from resolved tickets...')
    const { data: messages, error: messagesError } = await supabaseClient
      .from('ticket_messages')
      .select(`
        id,
        ticket_id,
        message_body,
        sender_type,
        tickets!inner (
          status
        )
      `)
      .eq('tickets.status', 'resolved')

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      throw messagesError
    }

    console.log('Found messages:', messages)

    // Filter out messages that already have embeddings
    const messagesToProcess = messages?.filter(
      message => !existingMessageIds.includes(message.id)
    ) || []

    if (!messagesToProcess.length) {
      console.log('No new messages to process')
      return new Response(
        JSON.stringify({ message: 'No new messages to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${messagesToProcess.length} messages to process`)

    // Process messages in batches to avoid rate limits
    const batchSize = 10
    const batches = []
    for (let i = 0; i < messagesToProcess.length; i += batchSize) {
      batches.push(messagesToProcess.slice(i, i + batchSize))
    }

    console.log(`Processing messages in ${batches.length} batches of ${batchSize}`)

    for (const batch of batches) {
      console.log(`Processing batch of ${batch.length} messages...`)
      const embeddings = await Promise.all(
        batch.map(async (message: TicketMessage) => {
          // Get team assignment for metadata
          const { data: teamAssignment, error: teamError } = await supabaseClient
            .from('team_ticket_assignments')
            .select(`
              team_id,
              teams (
                name
              )
            `)
            .eq('ticket_id', message.ticket_id)
            .is('unassigned_at', null)
            .maybeSingle() as { data: TeamAssignment | null, error: any }

          if (teamError) {
            console.error(`Error fetching team assignment for message ${message.id}:`, teamError)
            throw teamError
          }

          // Create embedding using OpenAI
          console.log(`Generating embedding for message ${message.id}...`)
          const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: message.message_body,
          })

          if (!embeddingResponse.data?.[0]?.embedding) {
            throw new Error(`Failed to generate embedding for message ${message.id}`)
          }

          const [{ embedding }] = embeddingResponse.data

          return {
            message_id: message.id,
            ticket_id: message.ticket_id,
            embedding,
            metadata: {
              team_id: teamAssignment?.team_id,
              team_name: teamAssignment?.teams?.name,
              sender_type: message.sender_type,
              message_length: message.message_body.length,
            },
          }
        })
      )

      // Store embeddings in the database
      console.log(`Storing ${embeddings.length} embeddings in the database...`)
      const { error: insertError } = await supabaseClient
        .from('ticket_message_embeddings')
        .insert(embeddings)

      if (insertError) {
        console.error('Error inserting embeddings:', insertError)
        throw insertError
      }
    }

    console.log('Successfully completed embedding generation process')
    return new Response(
      JSON.stringify({ 
        message: `Successfully processed ${messagesToProcess.length} messages`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in embedding generation process:', error)
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