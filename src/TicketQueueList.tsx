import { useState } from "react";
import { QueueFilterBar } from "./QueueFilterBar";
import { TicketListItems } from "./TicketListItems";
import { BulkOperationsToolbar } from "./BulkOperationsToolbar";
import { TicketDetailView } from "./TicketDetailView";
import { useAssignedTickets } from "./hooks/useAssignedTickets";
import { useTeamTickets } from "./hooks/useTeamTickets";
import { useEmployeeRole } from "./hooks/useEmployeeRole";
import type { TicketListItemType } from "./types/common";

export const TicketQueueList = () => {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [ticketIdFilter, setTicketIdFilter] = useState("");

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

  const filteredTickets = tickets.filter((ticket: TicketListItemType) => {
    // If there's a ticket ID filter, only match exact ID
    if (ticketIdFilter) {
      return ticket.id === ticketIdFilter;
    }
    
    // Otherwise, apply regular filters
    const matchesSearch = !searchQuery || 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || ticket.status === statusFilter;
    const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Ticket Queue</h2>
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{filteredTickets.length}</span> tickets
        </div>
      </div>
      
      <div className="space-y-4">
        <QueueFilterBar 
          onSearchChange={setSearchQuery}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
          onTicketIdChange={setTicketIdFilter}
        />
        {selectedTickets.length > 0 && (
          <BulkOperationsToolbar 
            selectedTicketIds={selectedTickets}
            onClearSelection={() => setSelectedTickets([])}
            onOperationComplete={() => {
              // Refresh tickets after bulk operation
              window.location.reload();
            }}
          />
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">{queueTitle}</h3>
        <div className="bg-white rounded-lg border border-gray-200">
          {error ? (
            <div className="p-4 text-red-600">Error: {error}</div>
          ) : loading ? (
            <div className="p-4 text-gray-500">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-4 text-gray-500">
              {isSupervisor ? 'No tickets found' : 'No tickets found'}
            </div>
          ) : (
            <TicketListItems
              tickets={filteredTickets}
              selectedTickets={selectedTickets}
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