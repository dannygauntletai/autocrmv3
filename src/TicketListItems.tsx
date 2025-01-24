import { TicketListItem } from "./TicketListItem";
import type { TicketListItemType } from "./types/common";
import { useEmployeeRole } from "./hooks/useEmployeeRole";

interface Props {
  tickets: TicketListItemType[];
  selectedTickets: string[];
  onTicketSelect: (id: string) => void;
  onTicketClick: (id: string) => void;
  queueType: 'personal' | 'team';
}

export const TicketListItems = ({
  tickets,
  selectedTickets,
  onTicketSelect,
  onTicketClick,
  queueType
}: Props) => {
  const { role, loading } = useEmployeeRole();

  if (loading) return null;

  // Only show personal queue to agents
  if (queueType === 'personal' && role === 'supervisor') return null;

  // Only show team queue to supervisors
  if (queueType === 'team' && role === 'agent') return null;

  return (
    <div className="divide-y divide-gray-200">
      {tickets.map(ticket => (
        <TicketListItem 
          key={ticket.id} 
          ticket={ticket} 
          isSelected={selectedTickets.includes(ticket.id)} 
          onSelect={() => onTicketSelect(ticket.id)} 
          onClick={() => onTicketClick(ticket.id)}
          queueType={queueType}
        />
      ))}
    </div>
  );
};