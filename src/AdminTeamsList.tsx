import React, { useState } from "react";
import { Plus, Users, Edit2, Trash2 } from "lucide-react";
import { CreateTeamModal } from "./CreateTeamModal";
export const AdminTeamsList = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const teams = [{
    id: "1",
    name: "Technical Support",
    description: "Handle technical product issues",
    memberCount: 8,
    activeTickets: 45,
    avgResponseTime: "1h 15m"
  }, {
    id: "2",
    name: "Billing Support",
    description: "Handle billing and subscription inquiries",
    memberCount: 5,
    activeTickets: 23,
    avgResponseTime: "45m"
  }];
  return <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Support Teams</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage and configure support teams
          </p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus className="h-5 w-5 mr-2" />
          Create Team
        </button>
      </div>
      <div className="divide-y divide-gray-200">
        {teams.map(team => <div key={team.id} className="p-6">
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
                <button className="p-2 text-gray-600 hover:text-blue-600 rounded-md">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-red-600 rounded-md">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>)}
      </div>
      {isCreateModalOpen && <CreateTeamModal onClose={() => setIsCreateModalOpen(false)} />}
    </div>;
};