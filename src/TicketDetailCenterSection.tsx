import { useState } from 'react';
import { ArrowLeft, Clock, ChevronDown, BookPlus } from "lucide-react";
import { InteractionLog } from "./InteractionLog";
import { RichTextEditor } from "./RichTextEditor";
import { useTicket } from "./hooks/useTicket";
import { TicketStatus, TicketPriority } from './types/common';
import { supabase } from './lib/supabase';

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
  const [showKbConfirmation, setShowKbConfirmation] = useState(false);
  const [addingToKb, setAddingToKb] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

      // If status is resolved, trigger feedback request
      console.log('maybe xSending feedback request for ticket:', ticketId);
      if (newStatus === 'resolved') {
        console.log('Sending feedback request for ticket:', ticketId);
        
        const { data, error: functionError } = await supabase.functions.invoke('request-feedback', {
          body: {
            ticket_id: ticketId,
            customer_email: ticket.email,
            trigger_source: 'ui'
          }
        });

        if (functionError) {
          console.error('Failed to send feedback request:', {
            error: functionError,
            ticket: ticketId,
            email: ticket.email
          });
        } else {
          console.log('Feedback request sent successfully:', {
            ticket: ticketId,
            feedback_id: data?.feedback_id
          });
        }
      }

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

  const handleAddToKnowledgeBase = async () => {
    try {
      setAddingToKb(true);
      setErrorMessage(null);
      
      const response = await supabase.functions.invoke('add-knowledgebase', {
        body: { ticketId }
      });

      // Check response error
      if (response.error) {
        const error = response.error as { message: string; status?: number };
        if (error.status === 422) {
          setErrorMessage('This ticket does not contain sufficient information to create a knowledge base article.');
          return;
        }
        throw error;
      }

      // Show success message
      alert('Successfully added to knowledge base!');
      setShowKbConfirmation(false);
    } catch (err) {
      console.error('Failed to add to knowledge base:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add to knowledge base. Please try again.');
    } finally {
      setAddingToKb(false);
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
          <button
            onClick={() => setShowKbConfirmation(true)}
            className="inline-flex items-center px-3 py-1 border border-transparent rounded-full text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <BookPlus className="h-3 w-3 mr-1" />
            Add to Knowledge Base
          </button>
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

      {/* Confirmation Dialog */}
      {showKbConfirmation && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add to Knowledge Base?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              This will create a new knowledge base article based on this ticket's conversation. The content will be automatically generated and anonymized.
            </p>
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowKbConfirmation(false);
                  setErrorMessage(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={addingToKb}
              >
                Cancel
              </button>
              <button
                onClick={handleAddToKnowledgeBase}
                disabled={addingToKb}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {addingToKb ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};