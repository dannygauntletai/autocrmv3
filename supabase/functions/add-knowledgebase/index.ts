import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  ticketId: string;
}

interface TicketMessage {
  sender_type: string;
  message_body: string;
  created_at: string;
}

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Get request data
    const { ticketId } = await req.json() as RequestBody;
    console.log('Processing ticket:', ticketId);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize clients
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        }
      }
    );

    const openai = new OpenAI({ 
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    // Get ticket and messages
    console.log('Fetching ticket data...');
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('tickets')
      .select(`
        *,
        ticket_messages!inner (
          id,
          message_body,
          sender_type,
          created_at
        )
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('Ticket fetch error:', ticketError);
      throw new Error('Failed to fetch ticket');
    }

    console.log('Found ticket:', ticket.title);
    console.log('Message count:', ticket.ticket_messages?.length);

    // Sort messages by creation date
    const messages = ticket.ticket_messages.sort(
      (a: TicketMessage, b: TicketMessage) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Generate article content using GPT-4
    console.log('Generating article content...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a technical writer creating comprehensive knowledge base articles from support ticket conversations.
Your goal is to create detailed, well-structured articles that will help both customers and support agents.

When analyzing the conversation:
1. Focus on the specific problem and solution discussed
2. Include any technical details or steps mentioned
3. Add relevant context and background information
4. Consider edge cases and variations of the issue
5. Include any troubleshooting steps if mentioned

Format your response using these headers:

### Title
[Write a specific, problem-focused title that clearly indicates what issue is being solved]

### Content
[Write detailed markdown content including:
- Problem Description: Clear explanation of the issue
- Root Cause (if identified): What causes this issue
- Solution Steps: Detailed step-by-step resolution
- Technical Details: Any relevant system requirements, versions, or technical context
- Troubleshooting Tips: Common variations and how to handle them
- Prevention: How to avoid this issue in the future (if applicable)
Use proper markdown formatting including headers (##), lists, and code blocks where appropriate]

### Category
[Choose ONE category from: General, Account Management, Billing, Technical Support, Product Features, Security, or Integration]

### Tags
[Add 3-5 specific, relevant tags, comma-separated. Include both general and specific terms]`
        },
        {
          role: "user",
          content: `Ticket Title: ${ticket.title}

Full Conversation:
${messages.map((m: TicketMessage) => 
  `[${m.sender_type.toUpperCase()} - ${new Date(m.created_at).toLocaleString()}]
${m.message_body}
---`
).join('\n')}`
        }
      ],
      temperature: 0.5, // Reduced for more focused, consistent output
      max_tokens: 2000, // Increased for longer, more detailed responses
    });

    console.log('Got completion response');
    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.error('No content in completion response');
      throw new Error('Failed to generate article content');
    }
    console.log('Raw response:', response);

    // Parse the response into sections
    const sections = response.split('###').reduce((acc: any, section: string) => {
      const [name, ...content] = section.trim().split('\n');
      if (name && content.length) {
        acc[name.trim().toLowerCase()] = content.join('\n').trim();
      }
      return acc;
    }, {});

    console.log('Parsed sections:', sections);

    // Validate required sections
    const requiredSections = ['title', 'content', 'category', 'tags'];
    const missingSections = requiredSections.filter(section => !sections[section]);
    
    if (missingSections.length > 0) {
      console.error('Missing required sections:', {
        missing: missingSections,
        received: Object.keys(sections),
        rawResponse: response
      });
      throw new Error(`Missing required sections: ${missingSections.join(', ')}`);
    }

    // Validate section content and check for insufficient information
    if (!sections.title.trim()) {
      throw new Error('Title cannot be empty');
    }
    if (!sections.content.trim()) {
      throw new Error('Content cannot be empty');
    }
    if (!sections.category.trim()) {
      throw new Error('Category cannot be empty');
    }
    if (!sections.tags.trim()) {
      throw new Error('Tags cannot be empty');
    }

    // Get or create category
    console.log('Processing category:', sections.category);
    const { data: existingCategory, error: categoryError } = await supabaseClient
      .from('kb_categories')
      .select('id')
      .eq('name', sections.category)
      .single();

    if (categoryError && categoryError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Category fetch error:', categoryError);
      throw new Error('Failed to fetch category');
    }

    let categoryId;
    if (existingCategory) {
      categoryId = existingCategory.id;
      console.log('Using existing category:', categoryId);
    } else {
      console.log('Creating new category:', sections.category);
      const { data: newCategory, error: createCategoryError } = await supabaseClient
        .from('kb_categories')
        .insert({ name: sections.category })
        .select('id')
        .single();

      if (createCategoryError) {
        console.error('Category creation error:', createCategoryError);
        throw new Error('Failed to create category');
      }
      
      categoryId = newCategory?.id;
      if (!categoryId) {
        throw new Error('Failed to get created category ID');
      }
      console.log('Created new category:', categoryId);
    }

    // Get employee ID from auth
    console.log('Getting user from auth...');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('User auth error:', userError);
      throw new Error('Failed to get user');
    }

    // Create knowledge base article
    console.log('Creating knowledge base article...');
    const { data: kbArticle, error: kbError } = await supabaseClient
      .from('kb_articles')
      .insert({
        title: sections.title,
        content: sections.content,
        tags: sections.tags.split(',').map((tag: string) => tag.trim()),
        category_id: categoryId,
        ticket_id: ticketId,
        created_by: user.id
      })
      .select()
      .single();

    if (kbError) {
      console.error('KB article creation error:', kbError);
      throw new Error(`Failed to create knowledge base article: ${kbError.message}`);
    }

    if (!kbArticle) {
      throw new Error('Knowledge base article was not created');
    }

    console.log('Successfully created article:', kbArticle.id);
    return new Response(
      JSON.stringify(kbArticle),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error details:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error instanceof Error ? {
          stack: error.stack,
          type: error.name
        } : undefined,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
}); 
