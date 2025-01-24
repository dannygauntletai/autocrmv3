import { useState, useEffect } from "react";
import { Plus, Users, Trash2, UserPlus } from "lucide-react";
import { CreateTeamModal } from "./CreateTeamModal";
import { InviteAgentModal } from "./InviteAgentModal";
import { supabase } from "./lib/supabase";
import type { Team, TeamWithStats } from "./types/supabase";

export const AdminTeamsList = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First fetch teams with basic info
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("*");

      if (teamsError) throw teamsError;

      // For each team, fetch the counts separately
      const teamsWithStats = await Promise.all((teamsData || []).map(async (team: Team) => {
        // Get member count
        const { count: memberCount, error: memberError } = await supabase
          .from("employee_teams")
          .select("*", { count: 'exact', head: true })
          .eq("team_id", team.id);

        if (memberError) throw memberError;

        // Get active tickets count
        const { count: activeTickets, error: ticketError } = await supabase
          .from("team_ticket_assignments")
          .select("*", { count: 'exact', head: true })
          .eq("team_id", team.id)
          .is("unassigned_at", null);

        if (ticketError) throw ticketError;

        // Calculate average response time (mock for now)
        const avgResponseTime = "1h 30m"; // This would need to be calculated from actual data

        return {
          ...team,
          memberCount: memberCount || 0,
          activeTickets: activeTickets || 0,
          avgResponseTime
        };
      }));

      setTeams(teamsWithStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch teams");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Support Teams</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage and configure support teams
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Team
        </button>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="p-6 text-center text-gray-500">Loading teams...</div>
      ) : teams.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No teams created yet. Create your first team to get started.
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {teams.map(team => (
            <div key={team.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">
                    {team.name}
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">{team.description}</p>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {team.memberCount} members
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {team.activeTickets} active tickets
                    </div>
                    <div className="text-sm text-gray-600">
                      Avg. response: {team.avgResponseTime}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setIsInviteModalOpen(true);
                    }} 
                    className="p-2 text-gray-600 hover:text-blue-600 rounded-md"
                    title="Invite Agent"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-red-600 rounded-md">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <CreateTeamModal
          onClose={() => setIsCreateModalOpen(false)}
          onTeamCreated={fetchTeams}
        />
      )}

      {isInviteModalOpen && (
        <InviteAgentModal
          teamId={selectedTeamId || undefined}
          onClose={() => {
            setIsInviteModalOpen(false);
            setSelectedTeamId(null);
          }}
        />
      )}
    </div>
  );
};