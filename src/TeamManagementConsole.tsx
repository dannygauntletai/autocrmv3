import { useState, useEffect } from "react";
import { AgentsList } from "./AgentsList";
import { supabase } from "./lib/supabaseClient";

export const TeamManagementConsole = () => {
  const [teamName, setTeamName] = useState("Loading...");

  useEffect(() => {
    const fetchTeamName = async () => {
      try {
        // Get current user's ID and team
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // First get the user's team
        const { data: employeeTeam } = await supabase
          .from('employee_teams')
          .select('team_id')
          .eq('employee_id', user.id)
          .single();

        if (!employeeTeam) return;

        // Then get the team name
        const { data: team } = await supabase
          .from('teams')
          .select('name')
          .eq('id', employeeTeam.team_id)
          .single();

        if (team) {
          setTeamName(team.name);
        }
      } catch (err) {
        console.error('Error fetching team name:', err);
        setTeamName("Your Team");
      }
    };

    fetchTeamName();
  }, []);

  return <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {teamName}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your team members and their skills
          </p>
        </div>
      </div>
      <AgentsList />
    </div>;
};