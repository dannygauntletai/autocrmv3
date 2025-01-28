import { useState, useEffect } from "react";
import { X, Send, Bot, Loader } from "lucide-react";
import { supabase } from './lib/supabaseClient';
import { useAuth } from './hooks/useAuth';
import { TicketStatus, TicketPriority } from './types/common';
import { useNavigate } from 'react-router-dom';

interface Props {
  onClose: () => void;
  currentView?: {
    type: 'ticket_detail' | 'ticket_list' | 'dashboard' | 'other';
    data?: {
      ticketId?: string;
      ticketStatus?: TicketStatus;
      ticketPriority?: TicketPriority;
    };
  };
}

interface Message {
  id: number;
  type: 'bot' | 'user';
  content: string;
  timestamp: string;
}

interface Ticket {
  id: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  ticket_messages?: Array<{
    id: string;
    message_body: string;
    created_at: string;
  }>;
}

export const AIChatbot = ({
  onClose,
  currentView
}: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to get contextual initial message
  const getInitialMessage = async (view?: Props['currentView']) => {
    if (!view) return "Hi! I'm your AI assistant. How can I help you?";
    
    switch (view.type) {
      case 'ticket_detail':
        if (view.data?.ticketId) {
          try {
            const ticket = await handleTicketQuery(view.data.ticketId);
            setCurrentTicket(ticket);
            return `I see you're viewing ticket "${ticket.title}". Current status is ${ticket.status} with ${ticket.priority} priority.\n\nI can help you update its status, priority, or respond to the customer. What would you like to do?`;
          } catch (error) {
            console.error('Error fetching ticket:', error);
          }
        }
        return "I see you're viewing a ticket. I can help you update its status, priority, or respond to the customer. What would you like to do?";
      case 'ticket_list':
        return "I see you're viewing the ticket list. I can help you find specific tickets or navigate to them. What would you like to do?";
      case 'dashboard':
        return "I see you're on the dashboard. I can help you view your performance metrics or navigate to specific sections. What would you like to do?";
      default:
        return "Hi! I'm your AI assistant. How can I help you?";
    }
  };

  // Initialize messages with initial greeting
  useEffect(() => {
    const initChat = async () => {
      const initialMessage = await getInitialMessage(currentView);
      setMessages([{
        id: 1,
        type: "bot",
        content: initialMessage,
        timestamp: new Date().toISOString()
      }]);
    };
    initChat();
  }, [currentView]);

  const handleNavigation = (path: string) => {
    navigate(path);
    return `Navigating to ${path}...`;
  };

  const handleTicketQuery = async (ticketId: string) => {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        ticket_messages (
          *
        )
      `)
      .eq('id', ticketId)
      .single();

    if (error) throw error;
    return ticket;
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    const { error } = await supabase
      .from('tickets')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (error) throw error;
  };

  const updateTicketPriority = async (ticketId: string, priority: TicketPriority) => {
    const { error } = await supabase
      .from('tickets')
      .update({ 
        priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (error) throw error;
  };

  const addTicketMessage = async (ticketId: string, message: string, isInternal = false) => {
    const { error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        message_body: message,
        sender_id: user?.id,
        sender_type: 'employee',
        is_internal: isInternal
      });

    if (error) throw error;
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user" as const,
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      let response = "";

      // Send every query to the routing function
      const { data: routeData, error: routeError } = await supabase.functions.invoke('sidebar-router', {
        body: {
          query: inputValue,
          email: user?.email
        }
      });

      if (routeError) throw routeError;

      // Handle routing response
      if (routeData?.route) {
        response = handleNavigation(routeData.route);
      } else if (routeData?.message) {
        response = routeData.message;
      }
      
      // If not a routing request, handle ticket-specific commands
      if (!response && currentView?.type === 'ticket_detail' && currentView.data?.ticketId) {
        const ticketId = currentView.data.ticketId;
        
        if (!currentTicket) {
          const ticket = await handleTicketQuery(ticketId);
          setCurrentTicket(ticket);
        }
        
        if (inputValue.includes('status')) {
          const status = inputValue.includes('resolved') ? 'resolved' : 
                        inputValue.includes('pending') ? 'pending' : 'open';
          await updateTicketStatus(ticketId, status as TicketStatus);
          response = `Updated ticket "${currentTicket?.title}" status from ${currentTicket?.status} to ${status}`;
          setCurrentTicket(prev => prev ? { ...prev, status } : null);
        } 
        else if (inputValue.includes('priority')) {
          const priority = inputValue.includes('high') ? 'high' : 
                          inputValue.includes('medium') ? 'medium' : 'low';
          await updateTicketPriority(ticketId, priority as TicketPriority);
          response = `Updated ticket "${currentTicket?.title}" priority from ${currentTicket?.priority} to ${priority}`;
          setCurrentTicket(prev => prev ? { ...prev, priority } : null);
        }
        else if (inputValue.includes('respond') || inputValue.includes('reply')) {
          const message = inputValue.includes('with') ? 
            inputValue.split('with')[1]?.trim() : 
            inputValue.replace(/respond|reply/i, '').trim();
          
          if (message) {
            await addTicketMessage(ticketId, message);
            response = `Added your response to ticket "${currentTicket?.title}"`;
          }
        }
        else if (inputValue.includes('summary') || inputValue.includes('details')) {
          response = currentTicket ? 
            `Ticket: "${currentTicket.title}"\nStatus: ${currentTicket.status}\nPriority: ${currentTicket.priority}\nMessages: ${currentTicket.ticket_messages?.length || 0}` :
            "Sorry, I couldn't fetch the ticket details.";
        }
      }
      
      // Default help response
      if (!response) {
        response = currentView?.type === 'ticket_detail' 
          ? "I can help you with:\n" +
            "- Update status (e.g., 'set status to resolved')\n" +
            "- Update priority (e.g., 'set priority to high')\n" +
            "- Respond (e.g., 'respond with [your message]')\n" +
            "- View summary (e.g., 'show ticket summary')"
          : "I can help you with:\n" +
            "- Navigation (just tell me where you want to go)\n" +
            "- View specific tickets\n" +
            "- Manage tickets when viewing them";
      }

      const botMessage = {
        id: messages.length + 2,
        type: "bot" as const,
        content: response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: messages.length + 2,
        type: "bot" as const,
        content: "Sorry, I encountered an error while processing your request. Please try again.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick action suggestions based on current view
  const getQuickActions = () => {
    if (currentView?.type === 'ticket_detail') {
      return [
        { label: 'Mark Resolved', action: () => setInputValue('set status to resolved') },
        { label: 'Set High Priority', action: () => setInputValue('set priority to high') }
      ];
    }
    return [
      { label: 'View Tickets', action: () => setInputValue('go to tickets') },
      { label: 'Help', action: () => setInputValue('help') }
    ];
  };

  const quickActions = getQuickActions();

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-xl flex flex-col border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h3 className="font-medium">AI Assistant</h3>
        </div>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
              <p className="text-sm whitespace-pre-line">{message.content}</p>
              <span className="text-xs mt-1 block opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <Loader className="h-5 w-5 animate-spin text-blue-600" />
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={e => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2 flex gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};