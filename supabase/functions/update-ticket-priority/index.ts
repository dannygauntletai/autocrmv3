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
  priority: 'low' | 'medium' | 'high' | 'urgent';
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
    const { ticketId, priority, reason } = await req.json() as RequestBody

    if (!ticketId || !priority) {
      throw new Error('Missing required fields: ticketId and priority')
    }

    // Validate priority value
    const validPriorities = ['low', 'medium', 'high', 'urgent']
    if (!validPriorities.includes(priority)) {
      throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`)
    }

    // Get service role key from request header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }
    const serviceRoleKey = authHeader.replace('Bearer ', '')

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
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
    const { data: currentTicket, error: fetchError } = await supabaseClient
      .from('tickets')
      .select('priority')
      .eq('id', ticketId)
      .single()

    if (fetchError) throw fetchError
    if (!currentTicket) throw new Error('Ticket not found')

    // Update ticket priority
    const { data: ticket, error: updateError } = await supabaseClient
      .from('tickets')
      .update({ 
        priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single()

    if (updateError) throw updateError

    // Add to ticket history
    const { error: historyError } = await supabaseClient
      .from('ticket_history')
      .insert({
        ticket_id: ticketId,
        changed_by: 'system',  // Since this is a system operation
        changes: {
          priority: {
            old: currentTicket.priority,
            new: priority
          },
          reason: reason || 'AI Employee update'
        },
        created_at: new Date().toISOString()
      })

    if (historyError) throw historyError

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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/update-ticket-priority' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
