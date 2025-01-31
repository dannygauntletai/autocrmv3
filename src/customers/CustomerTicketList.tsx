import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, MessageSquare } from "lucide-react";
import { supabase } from "../lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

interface Ticket {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export const CustomerTicketList = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      const customerEmail = sessionStorage.getItem('customerEmail');
      if (!customerEmail) {
        throw new Error('No customer email found');
      }

      const { data, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          id,
          title,
          status,
          created_at,
          updated_at,
          messages:ticket_messages(count)
        `)
        .eq('email', customerEmail)
        .order('updated_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      // Transform the data to match our interface
      const formattedTickets: Ticket[] = data.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        message_count: ticket.messages?.[0]?.count || 0
      }));

      setTickets(formattedTickets);
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    // Set up real-time subscription
    const customerEmail = sessionStorage.getItem('customerEmail');
    if (!customerEmail) return;

    const channel: RealtimeChannel = supabase
      .channel('customer-tickets')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'tickets',
          filter: `email=eq.${customerEmail}`,
        },
        () => {
          // Refetch tickets when any changes occur
          fetchTickets();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=in.(${tickets.map(t => t.id).join(',')})`,
        },
        () => {
          // Refetch tickets when messages change
          fetchTickets();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      channel.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-6 text-center text-gray-500">
        Loading tickets...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 text-center text-red-600">
        Error loading tickets: {error}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="mt-6 text-center text-gray-500">
        No tickets found. Create a new ticket to get started.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {tickets.map(ticket => (
        <button
          key={ticket.id}
          onClick={() => navigate(`/customer/tickets/${ticket.id}`)}
          className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-900">
                {ticket.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(ticket.updated_at).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {ticket.message_count} messages
                </span>
              </div>
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
              ${ticket.status === "open" ? "bg-green-100 text-green-800" : ""}
              ${ticket.status === "closed" ? "bg-gray-100 text-gray-800" : ""}
              ${ticket.status === "pending" ? "bg-yellow-100 text-yellow-800" : ""}`}
            >
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};