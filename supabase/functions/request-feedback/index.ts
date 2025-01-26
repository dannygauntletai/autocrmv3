import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate a secure token using customer email and timestamp
async function generateSecureToken(email: string, timestamp: string): Promise<string> {
  const data = new TextEncoder().encode(`${email}-${timestamp}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate environment variables
    const requiredEnvVars = {
      SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      SENDGRID_API_KEY: Deno.env.get('SENDGRID_API_KEY'),
      PUBLIC_URL: Deno.env.get('PUBLIC_URL_PROD') || Deno.env.get('PUBLIC_URL_DEV')
    } as const

    for (const [key, value] of Object.entries(requiredEnvVars)) {
      if (!value) {
        throw new Error(`Missing required environment variable: ${key}`)
      }
    }

    const supabaseClient = createClient(
      requiredEnvVars.SUPABASE_URL as string,
      requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY as string
    )

    // Get request body
    const { ticket_id } = await req.json()
    if (!ticket_id) {
      throw new Error('Missing required field: ticket_id')
    }

    // Get ticket and customer email
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('tickets')
      .select('id, email')
      .eq('id', ticket_id)
      .single()

    if (ticketError || !ticket) {
      throw new Error('Ticket not found')
    }

    if (!ticket.email) {
      throw new Error('Ticket has no associated email')
    }

    // Create feedback record with expiry
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour expiry

    // Generate secure token
    const token = await generateSecureToken(ticket.email, expiresAt.toISOString())

    const { data: feedback, error: feedbackError } = await supabaseClient
      .from('feedback')
      .insert({
        ticket_id,
        customer_email: ticket.email,
        status: 'sent',
        expires_at: expiresAt.toISOString(),
        token
      })
      .select()
      .single()

    if (feedbackError || !feedback) {
      throw new Error('Failed to create feedback record')
    }

    // Generate feedback URLs that point directly to the edge function
    const feedbackBaseUrl = `${requiredEnvVars.PUBLIC_URL}/feedback/submit/${feedback.id}?token=${token}`

    // Determine environment
    const isProd = Deno.env.get('PUBLIC_URL_PROD') === requiredEnvVars.PUBLIC_URL
    const environment = isProd ? 'production' : 'development'

    // Send email via SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${requiredEnvVars.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: 'd-647cd353a8ca42ae9994b494c678df27',
        personalizations: [{
          to: [{ email: ticket.email }],
          dynamic_template_data: {
            environment,
            ticket_id,
            feedback_url: feedbackBaseUrl
          }
        }],
        from: {
          email: 'no-reply@em6530.chatgenius.rocks',
          name: 'AutoCRM Support'
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('SendGrid error:', errorData)
      throw new Error('Failed to send feedback request email')
    }

    return new Response(
      JSON.stringify({ success: true, feedback_id: feedback.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in request-feedback:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 