import { useState } from "react";
import { QueueFilterBar } from "./QueueFilterBar";
import { TicketListItems } from "./TicketListItems";
import { BulkOperationsToolbar } from "./BulkOperationsToolbar";
import { TicketDetailView } from "./TicketDetailView";
import { useAssignedTickets } from "./hooks/useAssignedTickets";
import { useTeamTickets } from "./hooks/useTeamTickets";
import { useEmployeeRole } from "./hooks/useEmployeeRole";

export const TicketQueueList = () => {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const { role, loading: roleLoading } = useEmployeeRole();
  const { tickets: personalTickets, loading: personalTicketsLoading, error: personalTicketsError } = useAssignedTickets();
  const { tickets: teamTickets, loading: teamTicketsLoading, error: teamTicketsError } = useTeamTickets();

  if (selectedTicketId) {
    return <TicketDetailView ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />;
  }

  if (roleLoading) {
    return <div className="p-4 text-gray-500">Loading...</div>;
  }

  const isSupervisor = role === 'supervisor';
  const tickets = isSupervisor ? teamTickets : personalTickets;
  const loading = isSupervisor ? teamTicketsLoading : personalTicketsLoading;
  const error = isSupervisor ? teamTicketsError : personalTicketsError;
  const queueTitle = isSupervisor ? 'Team Queue' : 'My Tickets';

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Ticket Queue</h2>
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{tickets.length}</span> tickets
        </div>
      </div>
      <QueueFilterBar />
      {selectedTickets.length > 0 && (
        <BulkOperationsToolbar 
          selectedCount={selectedTickets.length} 
          onClearSelection={() => setSelectedTickets([])} 
        />
      )}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">{queueTitle}</h3>
        <div className="bg-white rounded-lg border border-gray-200">
          {error ? (
            <div className="p-4 text-red-600">Error: {error}</div>
          ) : loading ? (
            <div className="p-4 text-gray-500">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="p-4 text-gray-500">
              {isSupervisor ? 'No tickets assigned to your team' : 'No tickets assigned to you'}
            </div>
          ) : (
            <TicketListItems 
              tickets={tickets} 
              selectedTickets={selectedTickets}
              queueType={isSupervisor ? 'team' : 'personal'}
              onTicketSelect={id => {
                setSelectedTickets(prev => 
                  prev.includes(id) 
                    ? prev.filter(ticketId => ticketId !== id) 
                    : [...prev, id]
                );
              }} 
              onTicketClick={setSelectedTicketId} 
            />
          )}
        </div>
      </div>
    </div>
  );
};