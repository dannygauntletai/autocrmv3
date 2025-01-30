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
  employeeId: string;
  reason?: string;
}

interface EmployeeAssignment {
  id: string;
  employee: {
    name: string;
  };
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
    const { ticketId, employeeId, reason } = await req.json() as RequestBody

    if (!ticketId || !employeeId) {
      throw new Error('Missing required fields: ticketId and employeeId')
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

    // Verify employee exists
    const { data: employee, error: employeeError } = await supabaseClient
      .from('employees')
      .select('id, name, role')
      .eq('id', employeeId)
      .single()

    if (employeeError) throw employeeError
    if (!employee) throw new Error('Employee not found')

    // Get current assignment if any
    const { data: currentAssignment, error: currentError } = await supabaseClient
      .from('employee_ticket_assignments')
      .select('id, employee:employees(name)')
      .eq('ticket_id', ticketId)
      .is('unassigned_at', null)
      .single() as { data: EmployeeAssignment | null, error: any }

    // Unassign current employee if exists
    if (currentAssignment) {
      const { error: unassignError } = await supabaseClient
        .from('employee_ticket_assignments')
        .update({ 
          unassigned_at: new Date().toISOString()
        })
        .eq('id', currentAssignment.id)

      if (unassignError) throw unassignError
    }

    // Create new assignment
    const { data: assignment, error: assignError } = await supabaseClient
      .from('employee_ticket_assignments')
      .insert({
        ticket_id: ticketId,
        employee_id: employeeId,
        assigned_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (assignError) throw assignError

    // Add to ticket history
    const { error: historyError } = await supabaseClient
      .from('ticket_history')
      .insert({
        ticket_id: ticketId,
        action: 'assign_employee',
        changed_by: 'system',  // Since this is a system operation
        changes: {
          employee: {
            old: currentAssignment ? currentAssignment.employee.name : null,
            new: employee.name
          },
          reason
        },
        created_at: new Date().toISOString()
      })

    if (historyError) throw historyError

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          assignmentId: assignment.id,
          employee: {
            id: employee.id,
            name: employee.name,
            role: employee.role
          }
        }
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/assign-ticket-employee' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
