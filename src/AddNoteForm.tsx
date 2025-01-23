import React from "react";
export const AddNoteForm = () => {
  return <form className="space-y-3">
      <textarea placeholder="Add an internal note..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
      <div className="flex justify-end">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Add Note
        </button>
      </div>
    </form>;
};