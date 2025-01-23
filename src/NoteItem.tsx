import { User, Clock } from "lucide-react";

interface Note {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

interface Props {
  note: Note;
}

export const NoteItem = ({
  note
}: Props) => {
  return (
    <div className="bg-yellow-50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <User className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-900">{note.author}</span>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          {new Date(note.timestamp).toLocaleString()}
        </div>
      </div>
      <div className="text-sm text-gray-700">{note.content}</div>
    </div>
  );
};