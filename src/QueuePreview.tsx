import { Clock } from "lucide-react";
import { useAssignedTickets } from "./hooks/useAssignedTickets";

interface Props {
  currentTicketId: string;
  onTicketSelect: (id: string) => void;
}

export const QueuePreview = ({
  currentTicketId,
  onTicketSelect
}: Props) => {
  const { tickets, loading, error } = useAssignedTickets();

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900">Your Queue</h2>
        </div>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900">Your Queue</h2>
        </div>
        <div className="p-4 text-red-600">
          Error loading queue: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-900">Your Queue</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {tickets.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No tickets assigned to you
          </div>
        ) : (
          tickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => onTicketSelect(ticket.id)}
              className={`w-full text-left p-3 hover:bg-gray-50 transition-colors
                ${ticket.id === currentTicketId ? "bg-blue-50" : ""}`}
            >
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                {ticket.subject}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${ticket.priority.toLowerCase() === "high" ? "bg-red-100 text-red-800" : ""}
                    ${ticket.priority.toLowerCase() === "medium" ? "bg-yellow-100 text-yellow-800" : ""}
                    ${ticket.priority.toLowerCase() === "low" ? "bg-green-100 text-green-800" : ""}`}
                >
                  {ticket.priority}
                </span>
                <span className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(ticket.updated_at).toLocaleString()}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};