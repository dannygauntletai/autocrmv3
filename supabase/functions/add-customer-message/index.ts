// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface MessageData {
  ticket_id: string
  message_body: string
  customer_email: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const messageData: MessageData = await req.json()

    // Validate required fields
    if (!messageData.ticket_id || !messageData.message_body || !messageData.customer_email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Get customer ID from email
    const { data: customer, error: customerError } = await supabaseClient
      .from('customers')
      .select('id')
      .eq('email', messageData.customer_email)
      .single()

    if (customerError) throw customerError
    if (!customer) throw new Error('Customer not found')

    // Verify the ticket belongs to this customer
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('tickets')
      .select('id')
      .eq('id', messageData.ticket_id)
      .eq('email', messageData.customer_email)
      .single()

    if (ticketError) throw ticketError
    if (!ticket) throw new Error('Ticket not found or access denied')

    // Add the message
    const { data: message, error: messageError } = await supabaseClient
      .from('ticket_messages')
      .insert({
        ticket_id: messageData.ticket_id,
        message_body: messageData.message_body,
        sender_id: customer.id,
        sender_type: 'customer'
      })
      .select('id')
      .single()

    if (messageError) throw messageError

    return new Response(
      JSON.stringify({
        message_id: message.id,
        message: 'Message added successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/add-customer-message' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
