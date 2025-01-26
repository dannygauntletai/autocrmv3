import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'openai'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const openAIConfig = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })
    const openai = new OpenAIApi(openAIConfig)

    // Get all ticket messages from resolved tickets that don't have embeddings yet
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
      .eq('tickets.status', 'resolved')  // Only get messages from resolved tickets
      .not('id', 'in', (
        supabaseClient
          .from('ticket_message_embeddings')
          .select('message_id')
      ))

    if (messagesError) throw messagesError
    if (!messages?.length) {
      return new Response(
        JSON.stringify({ message: 'No new messages to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process messages in batches to avoid rate limits
    const batchSize = 10
    const batches = []
    for (let i = 0; i < messages.length; i += batchSize) {
      batches.push(messages.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      const embeddings = await Promise.all(
        batch.map(async (message: TicketMessage) => {
          // Get team assignment for metadata
          const { data: teamAssignment } = await supabaseClient
            .from('team_ticket_assignments')
            .select(`
              team_id,
              teams!inner (
                name
              )
            `)
            .eq('ticket_id', message.ticket_id)
            .is('unassigned_at', null)
            .single() as { data: TeamAssignment | null }

          // Create embedding using OpenAI
          const embeddingResponse = await openai.createEmbedding({
            model: 'text-embedding-ada-002',
            input: message.message_body,
          })

          const [{ embedding }] = embeddingResponse.data.data

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
      const { error: insertError } = await supabaseClient
        .from('ticket_message_embeddings')
        .insert(embeddings)

      if (insertError) throw insertError
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully processed ${messages.length} messages`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
}) 