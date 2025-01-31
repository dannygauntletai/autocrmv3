import { TicketStatus, TicketPriority } from '../types/common';

export function getStatusStyles(status: TicketStatus) {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-yellow-100 text-yellow-800';
    case 'pending':
      return 'bg-blue-100 text-blue-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getPriorityStyles(priority: TicketPriority) {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
} 