import React from "react";
import { User, Clock } from "lucide-react";
interface Message {
  id: number;
  sender: string;
  type: "customer" | "agent";
  content: string;
  timestamp: string;
}
interface Props {
  message: Message;
}
export const MessageBubble = ({
  message
}: Props) => {
  const isAgent = message.type === "agent";
  return <div className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-2xl ${isAgent ? "bg-blue-50" : "bg-gray-50"} rounded-lg p-4`}>
        <div className="flex items-center gap-2 mb-2">
          <User className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-900">{message.sender}</span>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            {message.timestamp}
          </div>
        </div>
        <div className="text-gray-700 whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </div>;
};