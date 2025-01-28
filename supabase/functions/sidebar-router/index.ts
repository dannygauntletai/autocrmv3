import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4";
import { traceable } from "npm:langsmith@0.1.41/traceable";
import { wrapOpenAI } from "npm:langsmith@0.1.41/wrappers";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  query: string;
  email: string;
}

// Define available routes and their descriptions
const routes = {
  '/dashboard': {
    description: 'Main dashboard showing performance metrics and overview',
    roles: ['agent', 'supervisor', 'admin']
  },
  '/tickets': {
    description: 'List of all tickets in the queue',
    roles: ['agent', 'supervisor', 'admin']
  },
  '/templates': {
    description: 'Response templates management',
    roles: ['agent', 'supervisor', 'admin']
  },
  '/team': {
    description: 'Team management console',
    roles: ['supervisor', 'admin']
  },
  '/team-documents': {
    description: 'Team documentation and knowledge base',
    roles: ['supervisor', 'admin']
  },
  '/skills': {
    description: 'Agent skillsets management',
    roles: ['supervisor', 'admin']
  },
  '/load-balancing': {
    description: 'Ticket load balancing settings',
    roles: ['supervisor', 'admin']
  },
  '/admin/teams': {
    description: 'Team administration panel',
    roles: ['admin']
  },
  '/routing': {
    description: 'Ticket routing rules configuration',
    roles: ['admin']
  },
  '/schema': {
    description: 'Database schema definitions manager',
    roles: ['admin']
  },
  '/audit': {
    description: 'System audit log viewer',
    roles: ['admin']
  },
  '/create-ticket': {
    description: 'Create a new support ticket',
    roles: ['agent', 'supervisor', 'admin']
  }
};

type RoutePath = keyof typeof routes;

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        }
      }
    );

    // Check OpenAI configuration
    const openai = wrapOpenAI(new OpenAI({ 
      apiKey: Deno.env.get('OPENAI_API_KEY')
    }));

    if (!openai.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    // Parse request
    const { query, email } = await req.json() as RequestBody;
    
    console.log('Received request:', { query, email });

    // Get user's role from employees table
    const { data: employeeData, error: employeeError } = await supabaseClient
      .from('employees')
      .select('role')
      .eq('email', email)
      .single();

    if (employeeError || !employeeData) {
      console.error('Error fetching employee role:', employeeError);
      return new Response(
        JSON.stringify({ 
          route: null,
          message: "No employee record found. Please contact your administrator to set up your account properly.",
          error: employeeError
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      );
    }

    const userRole = employeeData.role;
    console.log('Found employee role:', userRole);

    // Get available routes for user's role
    const availableRoutes = Object.entries(routes)
      .filter(([_, info]) => info.roles.includes(userRole))
      .reduce((acc, [path, info]) => {
        acc[path as RoutePath] = info;
        return acc;
      }, {} as typeof routes);

    console.log('Available routes for role:', { userRole, routes: Object.keys(availableRoutes) });

    // Generate response using GPT
    const response = await traceable(
      async function routeUser() {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are a routing assistant in a customer support application. You excel at understanding natural, conversational language.

Your task is to extract navigation intent from user messages, even when they are casual, informal, or part of a larger conversation.

Available routes for this user (${userRole}):
${Object.entries(availableRoutes)
  .map(([path, info]) => `${path}: ${info.description}`)
  .join('\n')}

Examples of how users might express navigation:
- "time to start the day! let's go to tickets"  -> /tickets
- "ugh, need to update some templates..."       -> /templates
- "hey can you show me my performance?"         -> /dashboard
- "i should probably check the team docs"       -> /team-documents

Extract the navigation intent and respond with ONLY the route path. If there's no navigation intent, or if they request a route they don't have access to, respond with "NO_ROUTE".`
            },
            {
              role: "user",
              content: query
            }
          ],
          temperature: 0
        });

        return completion.choices[0]?.message?.content?.trim() || "NO_ROUTE";
      },
      {
        name: "Route Determination",
        inputs: {
          query,
          userRole,
          availableRoutes: Object.keys(availableRoutes)
        },
        metadata: {
          model: "gpt-4",
          temperature: 0
        }
      }
    )();

    console.log('GPT response:', { response });

    // Check if the route exists in our available routes
    const routeExists = Object.prototype.hasOwnProperty.call(availableRoutes, response);
    
    // Handle non-routing requests or invalid routes
    if (response === "NO_ROUTE" || !routeExists) {
      console.log('Route rejected because:', {
        isNoRoute: response === "NO_ROUTE",
        routeExists,
        response,
        availableRoutes: Object.keys(availableRoutes)  // Log available routes for debugging
      });
      return new Response(
        JSON.stringify({ 
          route: null,
          message: "I can't help you with that route."
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        route: response,
        message: null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
}); 
