import React from "react";
import { X } from "lucide-react";
interface Props {
  onClose: () => void;
}
export const CreateTemplateModal = ({
  onClose
}: Props) => {
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Create Response Template</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name
            </label>
            <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g., General Greeting" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option>General</option>
              <option>Technical Support</option>
              <option>Billing</option>
              <option>Feature Request</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Content
            </label>
            <textarea rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter template content. Use {{variables}} for dynamic content." />
            <p className="mt-1 text-sm text-gray-500">
              Available variables: {"{"}
              {"{"}
              <span className="font-mono">customer.name</span>
              {"}"}
              {"}"}, {"{"}
              {"{"}
              <span className="font-mono">ticket.id</span>
              {"}"}
              {"}"}, {"{"}
              {"{"}
              <span className="font-mono">agent.name</span>
              {"}"}
              {"}"}
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Create Template
            </button>
          </div>
        </form>
      </div>
    </div>;
};