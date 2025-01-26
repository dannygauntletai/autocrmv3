import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { supabase } from "./lib/supabaseClient";

export const TeamOverview = () => {
  const [teamMemberCount, setTeamMemberCount] = useState<number>(0);

  useEffect(() => {
    fetchTeamMemberCount();
  }, []);

  const fetchTeamMemberCount = async () => {
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

      // Then count all members in that team
      const { count, error } = await supabase
        .from('employee_teams')
        .select('*', { count: 'exact' })
        .eq('team_id', employeeTeam.team_id);

      if (error) throw error;
      setTeamMemberCount(count || 0);
    } catch (err) {
      console.error('Error fetching team member count:', err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center gap-4">
        <Users className="h-6 w-6 text-blue-600" />
        <div>
          <h3 className="text-2xl font-semibold text-gray-900">
            {teamMemberCount}
          </h3>
          <p className="text-sm text-gray-500">Team Members</p>
        </div>
      </div>
    </div>
  );
};