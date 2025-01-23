import React, { useState } from "react";
import { Plus } from "lucide-react";
import { TeamsOverview } from "./TeamsOverview";
import { TeamsList } from "./TeamsList";
import { CreateTeamModal } from "./CreateTeamModal";
export const AdminTeamManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Teams</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage all support teams and their configurations
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus className="h-5 w-5 mr-2" />
          Create Team
        </button>
      </div>
      <TeamsOverview />
      <TeamsList />
      {isModalOpen && <CreateTeamModal onClose={() => setIsModalOpen(false)} />}
    </div>;
};