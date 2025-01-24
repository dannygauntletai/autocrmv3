import { MessageList } from "./MessageList";
import { ReplyEditor } from "./ReplyEditor";
import { useParams } from "react-router-dom";

export const TicketDetailThread = () => {
  const { id: ticketId } = useParams<{ id: string }>();

  if (!ticketId) {
    return <div>Invalid ticket ID</div>;
  }

  return <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">
          Ticket Thread
        </h1>
        <div className="mt-1 text-sm text-gray-500">
          View and respond to ticket messages
        </div>
      </div>
      <div className="p-6">
        <MessageList ticketId={ticketId} />
      </div>
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <ReplyEditor />
      </div>
    </div>;
};