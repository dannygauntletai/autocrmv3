import { useState } from 'react';
import { ArrowLeft, Clock, ChevronDown } from "lucide-react";
import { InteractionLog } from "./InteractionLog";
import { RichTextEditor } from "./RichTextEditor";
import { useTicket } from "./hooks/useTicket";
import { TicketStatus, TicketPriority } from './types/common';

interface Props {
  ticketId: string;
  onClose: () => void;
}

const STATUS_OPTIONS: TicketStatus[] = ['open', 'pending', 'resolved'];
const PRIORITY_OPTIONS: TicketPriority[] = ['low', 'medium', 'high'];

export const TicketDetailCenterSection = ({
  ticketId,
  onClose
}: Props) => {
  const { ticket, loading, error, updateTicketStatus, updateTicketPriority } = useTicket(ticketId);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-lg max-h-screen overflow-hidden">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-lg max-h-screen overflow-hidden">
        <div className="p-6 text-red-600">
          Error loading ticket: {error || 'Ticket not found'}
        </div>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: TicketStatus) => {
    try {
      setUpdating(true);
      await updateTicketStatus(newStatus);
      setShowStatusDropdown(false);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    try {
      setUpdating(true);
      await updateTicketPriority(newPriority);
      setShowPriorityDropdown(false);
    } catch (err) {
      console.error('Failed to update priority:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-lg max-h-screen overflow-hidden">
      {/* Header Section */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 truncate">
              {ticket.title}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <span className="truncate">Ticket #{ticketId}</span>
              <span className="flex-shrink-0">•</span>
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Created {new Date(ticket.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              disabled={updating}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                ticket.status.toLowerCase() === 'open' ? 'bg-yellow-100 text-yellow-800' :
                ticket.status.toLowerCase() === 'pending' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              } hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {ticket.status}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showStatusDropdown && (
              <div className="absolute mt-1 w-32 bg-white rounded-md shadow-lg z-10">
                <div className="py-1">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={updating}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 capitalize"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
              disabled={updating}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                ticket.priority.toLowerCase() === 'high' ? 'bg-red-100 text-red-800' :
                ticket.priority.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              } hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {ticket.priority}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showPriorityDropdown && (
              <div className="absolute mt-1 w-32 bg-white rounded-md shadow-lg z-10">
                <div className="py-1">
                  {PRIORITY_OPTIONS.map((priority) => (
                    <button
                      key={priority}
                      onClick={() => handlePriorityChange(priority)}
                      disabled={updating}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 capitalize"
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interaction Log Section - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <InteractionLog ticketId={ticketId} />
      </div>

      {/* Rich Text Editor Section - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 p-6">
        <RichTextEditor ticketId={ticketId} />
      </div>
    </div>
  );
};