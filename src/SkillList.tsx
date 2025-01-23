import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "./lib/supabaseClient";

interface Skill {
  id: string;
  skill_name: string;
}

interface Team {
  id: string;
  name: string;
}

export const SkillList = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSupervisorTeam();
  }, []);

  useEffect(() => {
    if (team) {
      fetchSkills();
      
      // Set up real-time subscription
      const channel = supabase.channel('team_skills_changes');
      
      const subscription = channel
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'team_skills',
            filter: `team_id=eq.${team.id}`
          }, 
          (payload) => {
            // Add new skill immediately
            setSkills(currentSkills => [...currentSkills, payload.new as Skill].sort((a, b) => 
              a.skill_name.localeCompare(b.skill_name)
            ));
          }
        )
        .on('postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'team_skills',
            filter: `team_id=eq.${team.id}`
          },
          (payload) => {
            // Remove deleted skill immediately
            setSkills(currentSkills => 
              currentSkills.filter(skill => skill.id !== payload.old.id)
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [team]);

  const fetchSupervisorTeam = async () => {
    try {
      // Get current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get supervisor's team where they are a supervisor
      const { data: employeeTeam } = await supabase
        .from('employee_teams')
        .select('team_id')
        .eq('employee_id', user.id)
        .eq('role', 'supervisor')
        .single();

      if (!employeeTeam) throw new Error('No team found for supervisor');

      const { data: teamData } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', employeeTeam.team_id)
        .single();

      if (!teamData) throw new Error('Team not found');
      
      setTeam({
        id: teamData.id,
        name: teamData.name
      });
    } catch (err) {
      console.error('Error fetching supervisor team:', err);
      setIsLoading(false);
    }
  };

  const fetchSkills = async () => {
    if (!team) return;

    try {
      const { data, error } = await supabase
        .from('team_skills')
        .select('*')
        .eq('team_id', team.id)
        .order('skill_name');

      if (error) throw error;
      setSkills(data || []);
    } catch (err) {
      console.error('Error fetching skills:', err);
      alert('Failed to fetch skills. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('team_skills')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting skill:', err);
      alert('Failed to delete skill. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="text-gray-500 p-4">Loading skills...</div>;
  }

  if (!team) {
    return <div className="text-gray-500 p-4 bg-gray-50 rounded-lg">
      You don't have permission to view skills. Only supervisors can manage team skills.
    </div>;
  }

  return (
    <div className="bg-white p-6">
      <div className="space-y-2">
        {skills.length === 0 ? (
          <div className="text-gray-500 text-center py-6 bg-gray-50 rounded-lg border border-gray-100">
            No skills added yet.
          </div>
        ) : (
          skills.map((skill) => (
            <div
              key={skill.id}
              className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-md border border-gray-100 hover:border-gray-200 hover:bg-gray-100 transition-all group"
            >
              <span className="text-sm font-medium text-gray-900">{skill.skill_name}</span>
              <button
                onClick={() => handleDelete(skill.id)}
                className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                title="Delete skill"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};