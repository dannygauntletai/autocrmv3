import React from "react";
import { Users, Edit2, Trash2, Settings, UserPlus } from "lucide-react";
interface TeamMetrics {
  responseTime: string;
  resolutionRate: string;
  satisfaction: string;
}
interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  tags: string[];
  metrics: TeamMetrics;
}
interface Props {
  team: Team;
  onInvite: () => void;
}
export const AdminTeamItem = ({
  team,
  onInvite
}: Props) => {
  return <div className="p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="text-lg font-medium text-gray-900">{team.name}</h4>
          <p className="mt-1 text-sm text-gray-500">{team.description}</p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-sm">
              <span className="text-gray-500">Response Time:</span>
              <span className="ml-2 text-gray-900">
                {team.metrics.responseTime}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Resolution Rate:</span>
              <span className="ml-2 text-gray-900">
                {team.metrics.resolutionRate}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Satisfaction:</span>
              <span className="ml-2 text-gray-900">
                {team.metrics.satisfaction}
              </span>
            </div>
          </div>
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
          <button onClick={onInvite} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Agent
          </button>
          <button className="p-2 text-gray-600 hover:text-blue-600 rounded-md">
            <Settings className="h-4 w-4" />
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