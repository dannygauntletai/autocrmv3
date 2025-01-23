import React from "react";
import { TeamOverview } from "./TeamOverview";
import { AgentsList } from "./AgentsList";
export const TeamManagementConsole = () => {
  return <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Technical Support Team
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your team members and their skills
          </p>
        </div>
      </div>
      <TeamOverview />
      <AgentsList />
    </div>;
};