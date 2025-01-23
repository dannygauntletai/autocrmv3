import React, { useState } from "react";
import { Plus } from "lucide-react";
import { TemplateList } from "./TemplateList";
import { CreateTemplateModal } from "./CreateTemplateModal";
export const TemplateManagementPanel = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Response Templates
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your quick response templates and macros
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus className="h-5 w-5 mr-2" />
          New Template
        </button>
      </div>
      <TemplateList />
      {isModalOpen && <CreateTemplateModal onClose={() => setIsModalOpen(false)} />}
    </div>;
};