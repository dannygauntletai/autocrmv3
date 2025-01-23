import { useState } from "react";
import { QueueFilterBar } from "./QueueFilterBar";
import { TicketListItems } from "./TicketListItems";
import { BulkOperationsToolbar } from "./BulkOperationsToolbar";
import { TicketDetailView } from "./TicketDetailView";
import { useAssignedTickets } from "./hooks/useAssignedTickets";

export const TicketQueueList = () => {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const { tickets: personalTickets, loading: personalTicketsLoading, error: personalTicketsError } = useAssignedTickets();

  const teamTickets = [{
    id: "1",
    subject: "Unable to access dashboard",
    status: "Open",
    priority: "High",
    customer: "John Doe",
    lastUpdate: "2023-07-20 10:30:00",
    tags: ["bug", "dashboard"]
  }, {
    id: "2",
    subject: "Feature request: Export to PDF",
    status: "Pending",
    priority: "Medium",
    customer: "Jane Smith",
    lastUpdate: "2023-07-20 09:15:00",
    tags: ["feature-request"]
  }];

  if (selectedTicketId) {
    return <TicketDetailView ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />;
  }

  return <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Ticket Queue</h2>
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">24</span> tickets
        </div>
      </div>
      <QueueFilterBar />
      {selectedTickets.length > 0 && <BulkOperationsToolbar selectedCount={selectedTickets.length} onClearSelection={() => setSelectedTickets([])} />}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Team Queue</h3>
          <div className="bg-white rounded-lg border border-gray-200">
            <TicketListItems tickets={teamTickets} selectedTickets={selectedTickets} onTicketSelect={id => {
            setSelectedTickets(prev => prev.includes(id) ? prev.filter(ticketId => ticketId !== id) : [...prev, id]);
          }} onTicketClick={setSelectedTicketId} />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">My Tickets</h3>
          <div className="bg-white rounded-lg border border-gray-200">
            {personalTicketsError ? (
              <div className="p-4 text-red-600">Error: {personalTicketsError}</div>
            ) : personalTicketsLoading ? (
              <div className="p-4 text-gray-500">Loading your assigned tickets...</div>
            ) : personalTickets.length === 0 ? (
              <div className="p-4 text-gray-500">No tickets assigned to you</div>
            ) : (
              <TicketListItems 
                tickets={personalTickets} 
                selectedTickets={selectedTickets} 
                onTicketSelect={id => {
                  setSelectedTickets(prev => prev.includes(id) ? prev.filter(ticketId => ticketId !== id) : [...prev, id]);
                }} 
                onTicketClick={setSelectedTicketId} 
              />
            )}
          </div>
        </div>
      </div>
    </div>;
};