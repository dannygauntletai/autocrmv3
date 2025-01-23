import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface InviteAgentPayload {
  email: string;
  name: string;
  teamId: string;
  role: 'agent' | 'supervisor';
}

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      })
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get request payload
    const { email, name, teamId, role } = await req.json() as InviteAgentPayload

    // First check if user already exists in auth
    const { data: existingUser, error: searchError } = await supabaseAdmin.auth
      .admin.listUsers()

    // Find user by email
    const existingAuthUser = existingUser?.users.find(user => user.email === email)

    let userId: string
    let shouldSendInvite = false

    if (existingAuthUser) {
      // User exists in auth
      userId = existingAuthUser.id
    } else {
      // User doesn't exist, send invite
      shouldSendInvite = true
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        { 
          data: { 
            display_name: name 
          },
          options: {
            emailRedirectTo: `${Deno.env.get('APP_URL') ?? 'http://localhost:5173'}/auth/callback`
          }
        }
      )
      if (authError) throw authError
      userId = authData.user.id
    }

    // Check if employee already exists
    const { data: existingEmployee, error: employeeSearchError } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('id', userId)
      .single()

    if (employeeSearchError && employeeSearchError.message !== 'No rows found') {
      throw employeeSearchError
    }

    let employeeId: string

    if (!existingEmployee) {
      // Create employee if they don't exist
      const { data: employeeData, error: employeeError } = await supabaseAdmin
        .from('employees')
        .insert({
          id: userId,
          name: name,
          email: email,
          status: shouldSendInvite ? 'pending' : 'active',
          role: role
        })
        .select()
        .single()

      if (employeeError) throw employeeError
      employeeId = employeeData.id
    } else {
      // Update existing employee's role to match the new team role
      const { error: updateError } = await supabaseAdmin
        .from('employees')
        .update({ role: role })
        .eq('id', userId)

      if (updateError) throw updateError
      employeeId = existingEmployee.id
    }

    // Check if they're already in the team
    const { data: existingTeamMembers, error: teamSearchError } = await supabaseAdmin
      .from('employee_teams')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('team_id', teamId)

    if (teamSearchError) throw teamSearchError

    // If they have any assignments to this team
    const hasActiveAssignment = existingTeamMembers && existingTeamMembers.length > 0

    if (hasActiveAssignment) {
      // Update their role in the team if it's different
      const currentTeamMember = existingTeamMembers[0]
      if (currentTeamMember.role !== role) {
        const { error: updateTeamError } = await supabaseAdmin
          .from('employee_teams')
          .update({ role: role })
          .eq('id', currentTeamMember.id)

        if (updateTeamError) throw updateTeamError
      }
    } else {
      // Add to employee_teams table if not already there
      const { error: teamError } = await supabaseAdmin
        .from('employee_teams')
        .insert({
          employee_id: employeeId,
          team_id: teamId,
          role: role
        })

      if (teamError) throw teamError
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        isNewUser: shouldSendInvite,
        message: shouldSendInvite 
          ? 'Invitation sent and user added to team' 
          : 'Existing user added to team'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      }
    )
  }
}) 