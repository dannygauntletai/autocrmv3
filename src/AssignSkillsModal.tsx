import { useState, useEffect } from "react";
import { X, Star, StarOff } from "lucide-react";
import { supabase } from "./lib/supabaseClient";

interface Props {
  agentId: string;
  onClose: () => void;
}

interface Skill {
  id: string;
  skill_name: string;
}

export const AssignSkillsModal = ({
  agentId,
  onClose
}: Props) => {
  const [teamSkills, setTeamSkills] = useState<Skill[]>([]);
  const [employeeSkills, setEmployeeSkills] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agentId) {
      fetchSkills();
    }
  }, [agentId]);

  const fetchSkills = async () => {
    try {
      // First get the team ID for the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: employeeTeam } = await supabase
        .from('employee_teams')
        .select('team_id')
        .eq('employee_id', user.id)
        .single();

      if (!employeeTeam) return;

      // Get team skills
      const { data: teamSkillsData } = await supabase
        .from('team_skills')
        .select('*')
        .eq('team_id', employeeTeam.team_id);

      if (teamSkillsData) {
        setTeamSkills(teamSkillsData);
      }

      // Get employee's current skills
      const { data: employeeSkillsData } = await supabase
        .from('employee_skills')
        .select('skills')
        .eq('employee_id', agentId)
        .single();

      if (employeeSkillsData) {
        setEmployeeSkills(employeeSkillsData.skills);
      }
    } catch (err) {
      console.error('Error fetching skills:', err);
      setError('Failed to load skills. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkillUpdate = async (skillName: string, proficiency: number) => {
    try {
      const newSkills = {
        ...employeeSkills,
        [skillName]: proficiency
      };

      // If proficiency is 0, remove the skill
      if (proficiency === 0) {
        delete newSkills[skillName];
      }

      const { data: existingSkills } = await supabase
        .from('employee_skills')
        .select('id')
        .eq('employee_id', agentId)
        .single();

      if (existingSkills) {
        // Update existing skills
        const { error } = await supabase
          .from('employee_skills')
          .update({ skills: newSkills })
          .eq('employee_id', agentId);

        if (error) throw error;
      } else {
        // Insert new skills record
        const { error } = await supabase
          .from('employee_skills')
          .insert({
            employee_id: agentId,
            skills: newSkills
          });

        if (error) throw error;
      }

      setEmployeeSkills(newSkills);
    } catch (err) {
      console.error('Error updating skill:', err);
      setError('Failed to update skill. Please try again.');
    }
  };

  const renderStars = (skillName: string) => {
    const currentProficiency = employeeSkills[skillName] || 0;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => handleSkillUpdate(skillName, rating === currentProficiency ? 0 : rating)}
            className="focus:outline-none"
          >
            {rating <= (currentProficiency || 0) ? (
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
            ) : (
              <StarOff className="h-5 w-5 text-gray-300" />
            )}
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6">
        Loading skills...
      </div>
    </div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Assign Skills</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {teamSkills.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No skills available for this team.
            </div>
          ) : (
            teamSkills.map((skill) => (
              <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm font-medium text-gray-900">
                  {skill.skill_name}
                </span>
                {renderStars(skill.skill_name)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};