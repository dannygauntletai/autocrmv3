import { QueuePreview } from "./QueuePreview";
import { InternalNotesPanel } from "./InternalNotesPanel";
import { CustomFieldsPanel } from "./CustomFieldsPanel";
import { EmployeeAssignmentPanel } from "./EmployeeAssignmentPanel";
import { TicketDetailCenterSection } from "./TicketDetailCenterSection";
import { useState } from "react";
import { AIChatbot } from "./AIChatbot";

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
  const [showAIChat, setShowAIChat] = useState(false);

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
      
      {/* AI Chatbot with context */}
      {showAIChat && (
        <AIChatbot 
          onClose={() => setShowAIChat(false)}
          currentView={{
            type: 'ticket_detail',
            data: {
              ticketId: currentTicketId
            }
          }}
        />
      )}
    </div>
  );
};