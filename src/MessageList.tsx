import React from "react";
import { MessageBubble } from "./MessageBubble";
export const MessageList = () => {
  const messages = [{
    id: 1,
    sender: "John Doe",
    type: "customer",
    content: "Hi, I'm unable to access my dashboard. Getting a 404 error.",
    timestamp: "2023-07-20 10:30:00"
  }, {
    id: 2,
    sender: "Jane Smith",
    type: "agent",
    content: "Hi John, I'll help you with that. Can you please confirm when this started happening?",
    timestamp: "2023-07-20 10:35:00"
  }];
  return <div className="space-y-6">
      {messages.map(message => <MessageBubble key={message.id} message={message} />)}
    </div>;
};