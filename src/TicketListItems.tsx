import React from "react";
import { TicketListItem } from "./TicketListItem";
interface Props {
  tickets: Array<{
    id: string;
    subject: string;
    status: string;
    priority: string;
    customer: string;
    lastUpdate: string;
    tags: string[];
  }>;
  selectedTickets: string[];
  onTicketSelect: (id: string) => void;
  onTicketClick: (id: string) => void;
}
export const TicketListItems = ({
  tickets,
  selectedTickets,
  onTicketSelect,
  onTicketClick
}: Props) => {
  return <div className="divide-y divide-gray-200">
      {tickets.map(ticket => <TicketListItem key={ticket.id} ticket={ticket} isSelected={selectedTickets.includes(ticket.id)} onSelect={() => onTicketSelect(ticket.id)} onClick={() => onTicketClick(ticket.id)} />)}
    </div>;
};