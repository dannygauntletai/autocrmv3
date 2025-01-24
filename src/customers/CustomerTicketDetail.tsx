import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { MessageList } from "../MessageList";
import { CustomerRichTextEditor } from "./CustomerRichTextEditor";
export const CustomerTicketDetail = () => {
  const {
    id
  } = useParams();
  const ticket = {
    id,
    subject: "Unable to access dashboard",
    status: "Open",
    created: "2023-07-20 10:30:00",
    lastUpdate: "2023-07-20 11:15:00"
  };
  return <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/customer" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {ticket.subject}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <span>Ticket #{ticket.id}</span>
            <span>•</span>
            <Clock className="h-4 w-4" />
            <span>Created {ticket.created}</span>
          </div>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${ticket.status === "Open" ? "bg-green-100 text-green-800" : ""}
                ${ticket.status === "Closed" ? "bg-gray-100 text-gray-800" : ""}
                ${ticket.status === "Pending" ? "bg-yellow-100 text-yellow-800" : ""}`}>
              {ticket.status}
            </span>
          </div>
        </div>
        <div className="p-6">
          <MessageList />
        </div>
        {ticket.status !== "Closed" && <div className="p-6 border-t border-gray-200 bg-gray-50">
            <CustomerRichTextEditor />
          </div>}
      </div>
    </div>;
};