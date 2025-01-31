import { getStatusStyles, getPriorityStyles } from './utils/ticketStyles';
import type { TicketListItemType } from './types/common';

interface Props {
  tickets: TicketListItemType[];
  selectedTickets: string[];
  onTicketSelect: (id: string) => void;
  onTicketClick: (id: string) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  
  // If the date is invalid, return a fallback
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  // If it's today, show time
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString(undefined, { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  // If it's this year, show month and day
  if (date.getFullYear() === today.getFullYear()) {
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // Otherwise show full date
  return date.toLocaleDateString(undefined, { 
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function TicketListItems({
  tickets,
  selectedTickets,
  onTicketSelect,
  onTicketClick
}: Props) {
  return (
    <div className="divide-y divide-gray-200">
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          className={`flex items-center px-4 py-4 hover:bg-gray-50 ${
            selectedTickets.includes(ticket.id) ? 'bg-blue-50' : ''
          }`}
        >
          <div className="flex items-center flex-1 min-w-0">
            <input
              type="checkbox"
              checked={selectedTickets.includes(ticket.id)}
              onChange={() => onTicketSelect(ticket.id)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="ml-4 flex-1 min-w-0" onClick={() => onTicketClick(ticket.id)}>
              <div className="flex items-center space-x-3">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {ticket.subject}
                </p>
                <div className="flex space-x-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityStyles(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
              </div>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <p className="truncate">
                  {ticket.customer} • Updated {formatDate(ticket.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}