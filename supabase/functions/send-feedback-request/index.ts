import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  ticket_id: string
  customer_email: string
  trigger_source: 'database' | 'ui'
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

    const body: RequestBody = await req.json()
    const { ticket_id, customer_email } = body

    // Create feedback record
    const { data: feedback, error: feedbackError } = await supabaseClient
      .from('feedback')
      .insert({
        ticket_id,
        customer_email,
        status: 'sent',
        rating: null
      })
      .select()
      .single()

    if (feedbackError) {
      throw feedbackError
    }

    // Generate JWT token for secure feedback submission
    const token = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: customer_email,
      options: {
        redirectTo: `${Deno.env.get('PUBLIC_URL')}/feedback/${feedback.id}`,
        data: {
          feedback_id: feedback.id
        }
      }
    })

    // Send email via SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: Deno.env.get('SENDGRID_FEEDBACK_TEMPLATE_ID'),
        personalizations: [{
          to: [{ email: customer_email }],
          dynamic_template_data: {
            feedback_url: token.data.properties.action_link,
            ticket_id
          }
        }],
        from: { email: 'inbound.chatgenius.rocks' }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send email')
    }

    return new Response(
      JSON.stringify({ success: true, feedback_id: feedback.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 