import { X } from "lucide-react";
interface Props {
  onClose: () => void;
}
export const CreateTeamModal = ({
  onClose
}: Props) => {
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Create New Team</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Name
            </label>
            <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g., Technical Support" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={3} placeholder="Describe the team's purpose and responsibilities" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Lead
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Select Team Lead</option>
              <option>John Doe</option>
              <option>Jane Smith</option>
            </select>
          </div>
          <div className="pt-4 border-t border-gray-200 mt-6">
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Create Team
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>;
};