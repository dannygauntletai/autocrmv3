// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Follow this setup guide to integrate the Deno runtime with your functions:
// https://supabase.com/docs/guides/functions/connect-to-supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from Functions!")

interface TicketData {
  email: string
  title: string
  description: string
  category: 'technical_support' | 'billing' | 'feature_request' | 'general_inquiry'
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'pending' | 'resolved'
  tags: string[]
  custom_fields: Record<string, any>
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

    const ticketData: TicketData = await req.json()

    // Validate required fields
    if (!ticketData.email || !ticketData.title || !ticketData.description) {
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

    // Get customer ID
    const { data: customer, error: customerError } = await supabaseClient
      .from('customers')
      .select('id')
      .eq('email', ticketData.email)
      .single()

    if (customerError) throw customerError
    if (!customer) throw new Error('Customer not found')

    // Insert the ticket
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('tickets')
      .insert([ticketData])
      .select('id')
      .single()

    if (ticketError) throw ticketError

    // Get team ID based on category name
    const { data: team, error: teamError } = await supabaseClient
      .from('teams')
      .select('id')
      .eq('name', ticketData.category)
      .single()

    if (teamError) throw teamError
    if (!team) throw new Error('Team not found for category')

    // Create team ticket assignment
    const { error: assignmentError } = await supabaseClient
      .from('team_ticket_assignments')
      .insert({
        team_id: team.id,
        ticket_id: ticket.id
      })

    if (assignmentError) throw assignmentError

    // Create the initial message
    const { error: messageError } = await supabaseClient
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        message_body: ticketData.description,
        sender_id: customer.id,
        sender_type: 'customer'
      })

    if (messageError) throw messageError

    // Create audit log entry
    await supabaseClient
      .from('audit_logs')
      .insert([
        {
          action_type: 'TICKET_CREATE',
          action_details: { ticket_id: ticket.id },
          performed_by: ticketData.email
        }
      ])

    return new Response(
      JSON.stringify({
        ticket_id: ticket.id,
        message: 'Ticket created successfully'
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-ticket' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
