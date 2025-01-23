import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "./lib/supabaseClient";

interface Team {
  id: string;
  name: string;
}

interface Props {
  onClose: () => void;
}

export const AddSkillForm = ({
  onClose
}: Props) => {
  const [skillName, setSkillName] = useState("");
  const [team, setTeam] = useState<Team | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSupervisorTeam();
  }, []);

  const fetchSupervisorTeam = async () => {
    try {
      // Get current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get supervisor's team where they are a supervisor
      const { data, error } = await supabase
        .from('employee_teams')
        .select('team:team_id(id, name)')
        .eq('employee_id', user.id)
        .eq('role', 'supervisor')
        .single();

      if (error) throw error;
      if (!data?.team) throw new Error('No team found for supervisor');
      
      setTeam({
        id: data.team.id,
        name: data.team.name
      });
    } catch (err) {
      console.error('Error fetching supervisor team:', err);
      alert('Failed to load team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim() || !team) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('team_skills')
        .insert({ 
          skill_name: skillName.trim(),
          team_id: team.id
        });

      if (error) throw error;
      onClose();
    } catch (err) {
      console.error('Error adding skill:', err);
      alert('Failed to add skill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6">
        Loading team...
      </div>
    </div>;
  }

  if (!team) {
    return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6">
        You don't have permission to add skills. Only supervisors can add skills to their team.
      </div>
    </div>;
  }

  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Team Skill</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team
            </label>
            <input
              type="text"
              value={team.name}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skill Name
            </label>
            <input 
              type="text" 
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              placeholder="e.g., Technical Troubleshooting" 
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Skill'}
            </button>
          </div>
        </form>
      </div>
    </div>;
};