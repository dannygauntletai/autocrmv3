import { useState } from "react";
import { X, Search, Star } from "lucide-react";
interface Props {
  agentId: string | null;
  onClose: () => void;
}
export const AssignSkillsModal = ({
  agentId,
  onClose
}: Props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [skillLevels, setSkillLevels] = useState<Record<string, number>>({});
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
  const handleStarClick = (skillId: string, level: number) => {
    setSkillLevels(prev => ({
      ...prev,
      [skillId]: level
    }));
  };
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Assign Skills to Agent</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input type="text" placeholder="Search skills..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {availableSkills.filter(skill => skill.name.toLowerCase().includes(searchTerm.toLowerCase()) || skill.category.toLowerCase().includes(searchTerm.toLowerCase())).map(skill => <div key={skill.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{skill.name}</h4>
                    <span className="text-sm text-gray-500">
                      {skill.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map(level => <button key={level} onClick={() => handleStarClick(skill.id, level)} className="focus:outline-none">
                          <Star className={`h-5 w-5 ${level <= (skillLevels[skill.id] || 0) ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
                        </button>)}
                    </div>
                    <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Assign
                    </button>
                  </div>
                </div>
              </div>)}
        </div>
      </div>
    </div>;
};