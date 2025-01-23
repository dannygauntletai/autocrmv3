import { ArrowLeft, Clock } from "lucide-react";
import { InteractionLog } from "./InteractionLog";
import { RichTextEditor } from "./RichTextEditor";
import { useTicket } from "./hooks/useTicket";

interface Props {
  ticketId: string;
  onClose: () => void;
}

export const TicketDetailCenterSection = ({
  ticketId,
  onClose
}: Props) => {
  const { ticket, loading, error } = useTicket(ticketId);

  if (loading) {
    return (
      <div className="flex-1 min-w-0 flex flex-col bg-white border border-gray-200 rounded-lg h-screen">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex-1 min-w-0 flex flex-col bg-white border border-gray-200 rounded-lg h-screen">
        <div className="p-6 text-red-600">
          Error loading ticket: {error || 'Ticket not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-white border border-gray-200 rounded-lg h-screen">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {ticket.title}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <span>Ticket #{ticketId}</span>
              <span>•</span>
              <Clock className="h-4 w-4" />
              <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            ticket.status.toLowerCase() === 'open' ? 'bg-yellow-100 text-yellow-800' :
            ticket.status.toLowerCase() === 'pending' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {ticket.status}
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            ticket.priority.toLowerCase() === 'high' ? 'bg-red-100 text-red-800' :
            ticket.priority.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {ticket.priority} Priority
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <InteractionLog ticketId={ticketId} />
      </div>
      <div className="border-t border-gray-200 bg-gray-50 p-6">
        <RichTextEditor ticketId={ticketId} />
      </div>
    </div>
  );
};