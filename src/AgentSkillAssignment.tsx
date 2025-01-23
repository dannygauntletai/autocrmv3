import { X, Search } from "lucide-react";
interface Props {
  onClose: () => void;
}
export const AgentSkillAssignment = ({
  onClose
}: Props) => {
  const agents = [{
    id: "1",
    name: "John Doe",
    role: "Support Agent",
    skills: ["Technical Support", "Customer Service"]
  }, {
    id: "2",
    name: "Jane Smith",
    role: "Senior Agent",
    skills: ["Product Knowledge", "Leadership"]
  }];
  const availableSkills = [{
    id: "1",
    name: "Technical Troubleshooting",
    category: "Technical"
  }, {
    id: "2",
    name: "Customer Communication",
    category: "Soft Skills"
  }, {
    id: "3",
    name: "Product Knowledge",
    category: "Technical"
  }];
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Assign Skills to Agents</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input type="text" placeholder="Search agents..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {/* Available Skills */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Available Skills
            </h4>
            <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
              {availableSkills.map(skill => <div key={skill.id} className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">
                        {skill.name}
                      </h5>
                      <span className="text-xs text-gray-500">
                        {skill.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select className="text-sm border border-gray-300 rounded px-2 py-1">
                        <option value="1">⭐</option>
                        <option value="2">⭐⭐</option>
                        <option value="3">⭐⭐⭐</option>
                        <option value="4">⭐⭐⭐⭐</option>
                        <option value="5">⭐⭐⭐⭐⭐</option>
                      </select>
                      <button className="px-2 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                        Assign
                      </button>
                    </div>
                  </div>
                </div>)}
            </div>
          </div>
          {/* Agents */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Agent Skills
            </h4>
            <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
              {agents.map(agent => <div key={agent.id} className="p-3">
                  <div className="mb-2">
                    <h5 className="text-sm font-medium text-gray-900">
                      {agent.name}
                    </h5>
                    <span className="text-xs text-gray-500">{agent.role}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {agent.skills.map((skill, index) => <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {skill}
                        <button className="ml-1 text-blue-600 hover:text-blue-800">
                          ×
                        </button>
                      </span>)}
                  </div>
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>;
};