import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { AgentItem } from "./AgentItem";
import { AssignSkillsModal } from "./AssignSkillsModal";
import { InviteAgentModal } from "./InviteAgentModal";
import { supabase } from "./lib/supabaseClient";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  status: string;
}

interface EmployeeTeamWithEmployee {
  employee_id: string;
  role: string;
  employees: {
    name: string;
  };
}

export const AgentsList = () => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      // Get current user's team
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First get the user's team
      const { data: employeeTeam } = await supabase
        .from('employee_teams')
        .select('team_id')
        .eq('employee_id', user.id)
        .single();

      if (!employeeTeam) return;

      // Then get all team members with their details using a join
      const { data: members, error } = await supabase
        .from('employee_teams')
        .select(`
          employee_id,
          role,
          employees!inner (
            name
          )
        `)
        .eq('team_id', employeeTeam.team_id) as { data: EmployeeTeamWithEmployee[] | null, error: any };

      if (error) throw error;
      if (!members) return;

      // Transform the data into our TeamMember format
      const formattedMembers: TeamMember[] = members
        .filter(member => member.employees?.name)
        .map(member => ({
          id: member.employee_id,
          name: member.employees.name,
          role: member.role === 'supervisor' ? 'Supervisor' : 'Agent',
          skills: [], // We'll fetch these from employee_skills table
          status: "Online"
        }));

      // Now fetch skills for each member
      const membersWithSkills = await Promise.all(
        formattedMembers.map(async (member) => {
          const { data: skillsData } = await supabase
            .from('employee_skills')
            .select('*')
            .eq('employee_id', member.id)
            .single();

          return {
            ...member,
            skills: skillsData?.skills ? Object.keys(skillsData.skills) : []
          };
        })
      );

      setTeamMembers(membersWithSkills);
    } catch (err) {
      console.error('Error fetching team members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
      </div>
      <div className="p-6 text-gray-500">Loading team members...</div>
    </div>;
  }

  return <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
        <button 
          onClick={() => setIsInviteModalOpen(true)} 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Invite Agent
        </button>
      </div>
      <div className="divide-y divide-gray-200">
        {teamMembers.map(member => (
          <AgentItem 
            key={member.id} 
            agent={member} 
            onAssignSkills={() => {
              setSelectedAgent(member.id);
              setIsSkillsModalOpen(true);
            }} 
          />
        ))}
      </div>
      {isSkillsModalOpen && selectedAgent && (
        <AssignSkillsModal 
          agentId={selectedAgent}
          onClose={() => {
            setIsSkillsModalOpen(false);
            setSelectedAgent(null);
          }} 
        />
      )}
      {isInviteModalOpen && (
        <InviteAgentModal 
          onClose={() => setIsInviteModalOpen(false)} 
        />
      )}
    </div>;
};