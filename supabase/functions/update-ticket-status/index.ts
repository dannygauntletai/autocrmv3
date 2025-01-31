// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from Functions!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  ticketId: string;
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed';
  reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request
    if (!req.body) {
      throw new Error('Missing request body')
    }

    // Parse request body
    const { ticketId, status, reason } = await req.json() as RequestBody

    if (!ticketId || !status) {
      throw new Error('Missing required fields: ticketId and status')
    }

    // Validate status value
    const validStatuses = ['new', 'open', 'pending', 'resolved', 'closed']
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
    }

    // Get service role key from request header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }
    const serviceRoleKey = authHeader.replace('Bearer ', '')

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get current ticket status
    const { data: currentTicket, error: fetchError } = await supabaseAdmin
      .from('tickets')
      .select('status')
      .eq('id', ticketId)
      .single()

    if (fetchError) throw fetchError
    if (!currentTicket) throw new Error('Ticket not found')

    // Update ticket status
    const { data: ticket, error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single()

    if (updateError) throw updateError

    // Add to ticket history
    const { error: historyError } = await supabaseAdmin
      .from('ticket_history')
      .insert({
        ticket_id: ticketId,
        changed_by: 'ai-employee',
        changes: {
          status: {
            old: currentTicket.status,
            new: status
          },
          reason: reason || 'AI Employee update'
        },
        created_at: new Date().toISOString()
      })

    if (historyError) {
      console.error('Error adding ticket history:', historyError)
      // Don't throw here as the status update was successful
    }

    // Broadcast the change to all connected clients
    const channel = supabaseAdmin.channel('ticket_updates')
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'ticket_update',
          payload: {
            ticket_id: ticketId,
            status: status,
            updated_at: new Date().toISOString()
          }
        })
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: ticket
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred'
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/update-ticket-status' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
