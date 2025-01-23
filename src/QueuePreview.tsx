import { Clock } from "lucide-react";
interface Props {
  currentTicketId: string;
  onTicketSelect: (id: string) => void;
}
export const QueuePreview = ({
  currentTicketId,
  onTicketSelect
}: Props) => {
  // Example tickets - in a real app, this would be filtered to show only relevant tickets
  const tickets = [{
    id: "1",
    subject: "Unable to access dashboard",
    status: "Open",
    priority: "High",
    lastUpdate: "2 hours ago"
  }, {
    id: "2",
    subject: "Feature request: Export to PDF",
    status: "Pending",
    priority: "Medium",
    lastUpdate: "3 hours ago"
  }, {
    id: "3",
    subject: "Billing issue with subscription",
    status: "Open",
    priority: "High",
    lastUpdate: "4 hours ago"
  }];
  return <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-900">Your Queue</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {tickets.map(ticket => <button key={ticket.id} onClick={() => onTicketSelect(ticket.id)} className={`w-full text-left p-3 hover:bg-gray-50 transition-colors
              ${ticket.id === currentTicketId ? "bg-blue-50" : ""}`}>
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
              {ticket.subject}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                  ${ticket.priority === "High" ? "bg-red-100 text-red-800" : ""}
                  ${ticket.priority === "Medium" ? "bg-yellow-100 text-yellow-800" : ""}
                  ${ticket.priority === "Low" ? "bg-green-100 text-green-800" : ""}`}>
                {ticket.priority}
              </span>
              <span className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {ticket.lastUpdate}
              </span>
            </div>
          </button>)}
      </div>
    </div>;
};