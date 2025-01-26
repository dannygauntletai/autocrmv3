import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const HTML_RESPONSE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Your Feedback</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      max-width: 500px;
    }
    h1 { color: #2563eb; }
    p { color: #666; line-height: 1.6; }
    .stars {
      color: #fbbf24;
      font-size: 24px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Thank You!</h1>
    <div class="stars">★ ★ ★ ★ ★</div>
    <p>Your feedback has been recorded. We appreciate you taking the time to help us improve our service.</p>
  </div>
</body>
</html>
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get feedback_id and rating from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const feedback_id = pathParts[pathParts.length - 2];
    const rating = parseInt(pathParts[pathParts.length - 1]);

    if (!feedback_id || isNaN(rating) || rating < 1 || rating > 5) {
      throw new Error('Invalid feedback ID or rating')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update feedback record
    const { error: updateError } = await supabaseClient
      .from('feedback')
      .update({
        rating,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', feedback_id)
      .eq('status', 'sent')
      .single()

    if (updateError) {
      console.error('Error updating feedback:', updateError)
      throw new Error('Failed to record feedback')
    }

    // Return HTML response
    return new Response(
      HTML_RESPONSE.replace('★ ★ ★ ★ ★', '★ '.repeat(rating)),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/html'
        }
      }
    )

  } catch (error) {
    console.error('Error in handle-feedback-submission:', error)
    
    return new Response(
      `<!DOCTYPE html>
      <html>
        <body>
          <h1>Error</h1>
          <p>${error instanceof Error ? error.message : 'An unknown error occurred'}</p>
        </body>
      </html>`,
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/html'
        } 
      }
    )
  }
}) 