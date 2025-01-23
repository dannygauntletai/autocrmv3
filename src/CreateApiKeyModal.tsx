import { X } from "lucide-react";
import { useState } from "react";
import { supabase } from "./lib/supabaseClient";
import type { ApiPermission } from "./types/common";

interface Props {
  onClose: () => void;
}

export const CreateApiKeyModal = ({ onClose }: Props) => {
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Record<ApiPermission, boolean>>({
    read_tickets: false,
    create_tickets: false,
    update_tickets: false,
    delete_tickets: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const key_value = crypto.randomUUID();
      const { error } = await supabase
        .from('api_keys')
        .insert({
          key_value,
          description,
          permissions,
        });

      if (error) throw error;
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const handlePermissionChange = (permission: ApiPermission) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Create API Key</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., Production API Key"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Permissions
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="read_tickets"
                  checked={permissions.read_tickets}
                  onChange={() => handlePermissionChange('read_tickets')}
                  className="mr-2"
                />
                <label htmlFor="read_tickets" className="text-sm text-gray-700">
                  Read tickets
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="create_tickets"
                  checked={permissions.create_tickets}
                  onChange={() => handlePermissionChange('create_tickets')}
                  className="mr-2"
                />
                <label htmlFor="create_tickets" className="text-sm text-gray-700">
                  Create tickets
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="update_tickets"
                  checked={permissions.update_tickets}
                  onChange={() => handlePermissionChange('update_tickets')}
                  className="mr-2"
                />
                <label htmlFor="update_tickets" className="text-sm text-gray-700">
                  Update tickets
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="delete_tickets"
                  checked={permissions.delete_tickets}
                  onChange={() => handlePermissionChange('delete_tickets')}
                  className="mr-2"
                />
                <label htmlFor="delete_tickets" className="text-sm text-gray-700">
                  Delete tickets
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};