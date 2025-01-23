import { ArrowLeft, Clock } from "lucide-react";
import { InteractionLog } from "./InteractionLog";
import { RichTextEditor } from "./RichTextEditor";

interface Props {
  ticketId: string;
  onClose: () => void;
}

export const TicketDetailCenterSection = ({
  ticketId,
  onClose
}: Props) => {
  return (
    <div className="flex-1 min-w-0 flex flex-col bg-white border border-gray-200 rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Unable to access dashboard
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <span>Ticket #{ticketId}</span>
              <span>•</span>
              <Clock className="h-4 w-4" />
              <span>Created 2 days ago</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Open
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            High Priority
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <InteractionLog />
      </div>
      <div className="border-t border-gray-200 bg-gray-50 p-6">
        <RichTextEditor />
      </div>
    </div>
  );
}; 