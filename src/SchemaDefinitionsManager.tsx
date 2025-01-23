import React, { useState } from "react";
import { Plus } from "lucide-react";
import { SchemaDefinitionsList } from "./SchemaDefinitionsList";
import { AddSchemaFieldModal } from "./AddSchemaFieldModal";
export const SchemaDefinitionsManager = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Schema Definitions
        </h2>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus className="h-5 w-5 mr-2" />
          Add Field
        </button>
      </div>
      <SchemaDefinitionsList />
      {isModalOpen && <AddSchemaFieldModal onClose={() => setIsModalOpen(false)} />}
    </div>;
};