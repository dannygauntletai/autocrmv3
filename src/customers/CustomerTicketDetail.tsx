import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { MessageList } from "../MessageList";
import { CustomerRichTextEditor } from "./CustomerRichTextEditor";
import { supabase } from "../lib/supabase";

interface TicketDetail {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  email: string;
}

export const CustomerTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        const customerEmail = sessionStorage.getItem('customerEmail');
        if (!customerEmail) {
          throw new Error('No customer email found');
        }

        // Fetch ticket details
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', id)
          .eq('email', customerEmail)
          .single();

        if (ticketError) throw ticketError;
        if (!ticketData) {
          throw new Error('Ticket not found');
        }

        setTicket(ticketData);
      } catch (err: any) {
        console.error('Error fetching ticket:', err);
        setError(err.message);
        if (err.message === 'Ticket not found') {
          navigate('/customer');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-gray-500">Loading ticket details...</div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-red-600">Error loading ticket: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/customer" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {ticket.title}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <span>Ticket #{ticket.id}</span>
            <span>•</span>
            <Clock className="h-4 w-4" />
            <span>Created {new Date(ticket.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${ticket.status === "open" ? "bg-green-100 text-green-800" : ""}
                ${ticket.status === "closed" ? "bg-red-100 text-red-800" : ""}
                ${ticket.status === "pending" ? "bg-yellow-100 text-yellow-800" : ""}`}>
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </span>
          </div>
        </div>
        <div className="p-6">
          <MessageList ticketId={ticket.id} />
        </div>
        {ticket.status !== "closed" && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <CustomerRichTextEditor ticketId={ticket.id} />
          </div>
        )}
      </div>
    </div>
  );
};