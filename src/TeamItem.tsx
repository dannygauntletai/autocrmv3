import { Users, Edit2, Trash2 } from "lucide-react";
interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  tags: string[];
}
interface Props {
  team: Team;
  onAssignEmployee: () => void;
}
export const TeamItem = ({
  team,
  onAssignEmployee
}: Props) => {
  return <div className="p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="text-lg font-medium text-gray-900">{team.name}</h4>
          <p className="mt-1 text-sm text-gray-500">{team.description}</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              {team.memberCount} members
            </div>
            <div className="flex gap-1">
              {team.tags.map(tag => <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {tag}
                </span>)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onAssignEmployee} className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100">
            Assign Employee
          </button>
          <button className="p-2 text-gray-600 hover:text-blue-600 rounded-md">
            <Edit2 className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-600 hover:text-red-600 rounded-md">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>;
};