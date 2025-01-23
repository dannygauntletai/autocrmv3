import React from "react";
import { SchemaDefinitionItem } from "./SchemaDefinitionItem";
export const SchemaDefinitionsList = () => {
  // Example schema fields - in real app, this would come from your backend
  const schemaFields = [{
    id: 1,
    name: "Title",
    type: "string",
    required: true
  }, {
    id: 2,
    name: "Description",
    type: "text",
    required: true
  }, {
    id: 3,
    name: "Priority",
    type: "enum",
    required: true
  }, {
    id: 4,
    name: "Status",
    type: "enum",
    required: true
  }];
  return <div className="bg-white rounded-lg border border-gray-200">
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 bg-gray-50">
        <div className="font-medium text-gray-700">Field Name</div>
        <div className="font-medium text-gray-700">Type</div>
        <div className="font-medium text-gray-700">Required</div>
        <div className="font-medium text-gray-700">Actions</div>
      </div>
      {schemaFields.map(field => <SchemaDefinitionItem key={field.id} field={field} />)}
    </div>;
};