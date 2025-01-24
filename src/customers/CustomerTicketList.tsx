import { useNavigate } from "react-router-dom";
import { Clock, MessageSquare } from "lucide-react";
export const CustomerTicketList = () => {
  const navigate = useNavigate();
  // Example tickets - in a real app, this would come from your API
  const tickets = [{
    id: "1",
    subject: "Unable to access dashboard",
    status: "Open",
    lastUpdate: "2023-07-20 10:30:00",
    messageCount: 3
  }, {
    id: "2",
    subject: "Billing inquiry",
    status: "Closed",
    lastUpdate: "2023-07-19 15:45:00",
    messageCount: 5
  }];
  return <div className="mt-6 space-y-4">
      {tickets.map(ticket => <button key={ticket.id} onClick={() => navigate(`/customer/tickets/${ticket.id}`)} className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-900">
                {ticket.subject}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {ticket.lastUpdate}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {ticket.messageCount} messages
                </span>
              </div>
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${ticket.status === "Open" ? "bg-green-100 text-green-800" : ""}
                ${ticket.status === "Closed" ? "bg-gray-100 text-gray-800" : ""}
                ${ticket.status === "Pending" ? "bg-yellow-100 text-yellow-800" : ""}`}>
              {ticket.status}
            </span>
          </div>
        </button>)}
    </div>;
};