import { QueuePreview } from "./QueuePreview";
import { InternalNotesPanel } from "./InternalNotesPanel";
import { CustomFieldsPanel } from "./CustomFieldsPanel";
import { EmployeeAssignmentPanel } from "./EmployeeAssignmentPanel";
import { TicketDetailCenterSection } from "./TicketDetailCenterSection";
import { AgentPanel } from "./components/AgentPanel";
import { useState } from "react";
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface Props {
  ticketId: string;
  onClose: () => void;
}

export const TicketDetailView = ({
  ticketId: initialTicketId,
  onClose
}: Props) => {
  // Keep track of the currently viewed ticket
  const [currentTicketId, setCurrentTicketId] = useState(initialTicketId);
  const [showAgent, setShowAgent] = useState(false);

  const handleTicketSelect = (id: string) => {
    // Just update the current ticket ID
    setCurrentTicketId(id);
  };

  return (
    <div className="w-full h-full flex gap-4 py-6">
      <div className="w-64 flex-shrink-0">
        <QueuePreview currentTicketId={currentTicketId} onTicketSelect={handleTicketSelect} />
      </div>
      <TicketDetailCenterSection ticketId={currentTicketId} onClose={onClose} />
      <div className="w-80 flex-shrink-0 space-y-4">
        <EmployeeAssignmentPanel ticketId={currentTicketId} />
        <InternalNotesPanel ticketId={currentTicketId} />
        <CustomFieldsPanel ticketId={currentTicketId} />
      </div>

      {/* Chat Bubble Toggle */}
      <button
        onClick={() => setShowAgent(!showAgent)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform hover:scale-110"
        aria-label={showAgent ? 'Hide AI Assistant' : 'Show AI Assistant'}
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
      </button>

      {/* Agent Panel */}
      {showAgent && (
        <AgentPanel 
          ticketId={currentTicketId}
          onClose={() => setShowAgent(false)}
        />
      )}
    </div>
  );
};