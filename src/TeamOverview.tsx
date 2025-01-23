import { useEffect, useState } from "react";
import { Users, Clock, CheckCircle } from "lucide-react";
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

  const metrics = [{
    icon: <Users className="h-6 w-6 text-blue-600" />,
    label: "Team Members",
    value: teamMemberCount.toString(),
  }, {
    icon: <Clock className="h-6 w-6 text-green-600" />,
    label: "Average Response Time",
    value: "45m",
    subtext: "Last 24 hours"
  }, {
    icon: <CheckCircle className="h-6 w-6 text-purple-600" />,
    label: "Resolution Rate",
    value: "92%",
    subtext: "This week"
  }];

  return <div className="grid grid-cols-3 gap-6">
      {metrics.map((metric, index) => <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">{metric.icon}</div>
          <div className="mt-4">
            <h3 className="text-2xl font-semibold text-gray-900">
              {metric.value}
            </h3>
            <p className="text-sm text-gray-500">{metric.label}</p>
            {metric.subtext && (
              <p className="text-xs text-gray-400 mt-1">{metric.subtext}</p>
            )}
          </div>
        </div>)}
    </div>;
};