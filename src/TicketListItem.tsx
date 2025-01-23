import { Clock, Tag } from "lucide-react";
import type { TicketStatus, TicketPriority } from "./types/common";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  customer: string;
  lastUpdate: string;
  tags: string[];
}

interface Props {
  ticket: Ticket;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
}

const getStatusStyle = (status: string) => {
  switch(status.toLowerCase()) {
    case 'open':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'resolved':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityStyle = (priority: string) => {
  switch(priority.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-blue-100 text-blue-800';
    case 'low':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const TicketListItem = ({
  ticket,
  isSelected,
  onSelect,
  onClick
}: Props) => {
  return <div className={`p-4 hover:bg-gray-50 ${isSelected ? "bg-blue-50" : ""} cursor-pointer`} onClick={onClick}>
      <div className="flex items-center gap-4">
        <input type="checkbox" checked={isSelected} onChange={e => {
        e.stopPropagation();
        onSelect();
      }} className="h-4 w-4 text-blue-600 rounded border-gray-300" />
        <div className="flex-1">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              {ticket.subject}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              {ticket.lastUpdate}
            </div>
          </div>
          <div className="mt-1 flex items-center gap-4">
            <div className="text-sm text-gray-500">
              From: <span className="text-gray-900">{ticket.customer}</span>
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(ticket.status)}`}>
              {ticket.status}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityStyle(ticket.priority)}`}>
              {ticket.priority}
            </span>
            <div className="flex items-center gap-1">
              <Tag className="h-4 w-4 text-gray-400" />
              {ticket.tags.map((tag, index) => <span key={index} className="text-sm text-gray-500">
                  {tag}
                  {index < ticket.tags.length - 1 ? ", " : ""}
                </span>)}
            </div>
          </div>
        </div>
      </div>
    </div>;
};