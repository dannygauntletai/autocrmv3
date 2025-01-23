import React from "react";
import { NoteItem } from "./NoteItem";
import { AddNoteForm } from "./AddNoteForm";
export const InternalNotesPanel = () => {
  const notes = [{
    id: 1,
    author: "Jane Smith",
    content: "Customer reported similar issue last month. Checking previous resolution.",
    timestamp: "2023-07-20 10:32:00"
  }, {
    id: 2,
    author: "Mike Johnson",
    content: "Escalated to engineering team for investigation.",
    timestamp: "2023-07-20 10:40:00"
  }];
  return <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Internal Notes</h3>
      </div>
      <div className="p-4 space-y-4">
        {notes.map(note => <NoteItem key={note.id} note={note} />)}
      </div>
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <AddNoteForm />
      </div>
    </div>;
};