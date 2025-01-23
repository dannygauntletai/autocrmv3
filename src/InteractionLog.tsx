import { User, Clock } from "lucide-react";
import { useTicketMessages } from "./hooks/useTicketMessages";

interface Props {
  ticketId: string;
}

export const InteractionLog = ({ ticketId }: Props) => {
  const { messages, loading, error } = useTicketMessages(ticketId);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        Error loading messages: {error}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No messages in this ticket yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {messages.map(message => (
        <div 
          key={message.id} 
          className={`flex ${message.sender_type === "employee" ? "justify-end" : "justify-start"}`}
        >
          <div 
            className={`max-w-2xl rounded-lg p-4 ${
              message.sender_type === "employee" ? "bg-blue-50" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-900">
                {message.sender_name}
              </span>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                {new Date(message.created_at).toLocaleString()}
              </div>
            </div>
            <div className="text-gray-700 prose prose-sm max-w-none">
              {message.message_body}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};