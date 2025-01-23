import { useState } from "react";
import { TeamsOverview } from "./TeamsOverview";
import { AdminTeamsList } from "./AdminTeamsList";
import { InviteAgentModal } from "./InviteAgentModal";
export const TeamAdminPanel = () => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  return <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Teams Administration
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage all support teams and their configurations
          </p>
        </div>
      </div>
      <TeamsOverview />
      <AdminTeamsList onInviteAgent={() => setIsInviteModalOpen(true)} />
      {isInviteModalOpen && <InviteAgentModal onClose={() => setIsInviteModalOpen(false)} />}
    </div>;
};