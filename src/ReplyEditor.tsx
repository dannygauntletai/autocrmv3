import { TextEditorToolbar } from "./TextEditorToolbar";
import { QuickResponsesDropdown } from "./QuickResponsesDropdown";
export const ReplyEditor = () => {
  return <div className="space-y-3">
      <div className="flex items-center justify-between">
        <TextEditorToolbar />
        <QuickResponsesDropdown />
      </div>
      <textarea placeholder="Type your reply..." rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
      <div className="flex justify-between items-center">
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-sm text-gray-700">Add as internal note</span>
        </label>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
            Save Draft
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Send Reply
          </button>
        </div>
      </div>
    </div>;
};