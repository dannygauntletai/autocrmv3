import { useEffect, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { supabase } from "./lib/supabase";

interface Message {
  id: number;
  sender_id: string;
  sender_type: 'customer' | 'employee';
  message_body: string;
  created_at: string;
  is_internal?: boolean;
  sender_name?: string;
}

interface Props {
  ticketId: string;
}

export const MessageList = ({ ticketId }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isCustomerView = !!sessionStorage.getItem('customerEmail');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Get messages for the ticket, filtering out internal messages for customers
        const query = supabase
          .from('ticket_messages')
          .select(`
            id,
            message_body,
            sender_id,
            sender_type,
            created_at,
            is_internal
          `)
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true });

        // If viewing as customer, filter out internal messages
        if (isCustomerView) {
          query.or('is_internal.is.null,is_internal.eq.false');
        }

        const { data: messageData, error: messagesError } = await query;

        if (messagesError) throw messagesError;
        if (!messageData) return;

        // Get employee names if there are employee messages
        let employeeNames: Record<string, string> = {};
        const employeeMessages = messageData.filter(msg => msg.sender_type === 'employee');
        
        if (employeeMessages.length > 0) {
          const employeeIds = [...new Set(employeeMessages.map(msg => msg.sender_id))];
          const { data: employees } = await supabase
            .from('employees')
            .select('id, name, email')
            .in('id', employeeIds);

          if (employees) {
            employeeNames = employees.reduce((acc, employee) => ({
              ...acc,
              [employee.id]: employee.name || employee.email
            }), {});
          }
        }

        // Combine messages with sender names
        const messagesWithNames = messageData.map(message => ({
          ...message,
          sender_name: message.sender_type === 'customer' 
            ? sessionStorage.getItem('customerName') || 'Customer'
            : employeeNames[message.sender_id]
        }));

        setMessages(messagesWithNames);
      } catch (err: any) {
        console.error('Error fetching messages:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up realtime subscription for new messages
    const subscription = supabase
      .channel(`ticket_messages:${ticketId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages',
        filter: `ticket_id=eq.${ticketId}`
      }, async (payload) => {
        // Fetch sender name for the new message
        const newMessage = payload.new as Message;
        
        // Skip internal messages for customer view
        if (isCustomerView && newMessage.is_internal) {
          return;
        }

        // For customer messages, use cached name or default to 'Customer'
        if (newMessage.sender_type === 'customer') {
          setMessages(current => [...current, {
            ...newMessage,
            sender_name: sessionStorage.getItem('customerName') || 'Customer'
          }]);
          return;
        }

        // For employee messages, fetch from database
        const { data: senderData } = await supabase
          .from('employees')
          .select('name, email')
          .eq('id', newMessage.sender_id)
          .single();

        setMessages(current => [...current, {
          ...newMessage,
          sender_name: senderData?.name || senderData?.email
        }]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [ticketId, isCustomerView]);

  if (loading) {
    return (
      <div className="text-center text-gray-500">
        Loading messages...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error loading messages: {error}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-500">
        No messages yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {messages.map(message => (
        <MessageBubble
          key={message.id}
          message={{
            id: message.id,
            sender: message.sender_name || 'Customer',
            type: message.sender_type,
            content: message.message_body,
            timestamp: new Date(message.created_at).toLocaleString()
          }}
        />
      ))}
    </div>
  );
};