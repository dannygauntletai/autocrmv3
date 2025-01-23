import { MessageList } from "./MessageList";
import { ReplyEditor } from "./ReplyEditor";
export const TicketDetailThread = () => {
  return <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">
          Unable to access dashboard
        </h1>
        <div className="mt-1 text-sm text-gray-500">
          Ticket #1234 • Created 2 days ago
        </div>
      </div>
      <div className="p-6">
        <MessageList />
      </div>
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <ReplyEditor />
      </div>
    </div>;
};