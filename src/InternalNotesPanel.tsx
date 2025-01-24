import { NoteItem } from "./NoteItem";
import { AddNoteForm } from "./AddNoteForm";
import { useInternalNotes } from "./hooks/useInternalNotes";

interface Props {
  ticketId: string;
}

export const InternalNotesPanel = ({ ticketId }: Props) => {
  const { notes, loading, error } = useInternalNotes(ticketId);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg h-[50vh]">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Internal Notes</h3>
        </div>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg h-[50vh]">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Internal Notes</h3>
        </div>
        <div className="p-4 text-red-600">
          Error loading notes: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg flex flex-col h-[50vh]">
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-lg font-medium text-gray-900">Internal Notes</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No internal notes yet.
            </div>
          ) : (
            notes.map(note => (
              <NoteItem
                key={note.id}
                note={{
                  id: note.id,
                  author: note.sender_name || 'Unknown',
                  content: note.message_body,
                  timestamp: note.created_at
                }}
              />
            ))
          )}
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <AddNoteForm ticketId={ticketId} />
      </div>
    </div>
  );
};