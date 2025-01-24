import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  ticketId: string;
}

export const CustomerRichTextEditor = ({ ticketId }: Props) => {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setSending(true);
    setError(null);
    
    try {
      console.log('Starting message submission...');
      const customerEmail = sessionStorage.getItem('customerEmail');
      if (!customerEmail) throw new Error('Customer email not found');
      
      console.log('Sending message with data:', {
        ticket_id: ticketId,
        message_body: content,
        customer_email: customerEmail
      });

      // Call the edge function to add the message
      const { data, error: functionError } = await supabase.functions.invoke('add-customer-message', {
        body: {
          ticket_id: ticketId,
          message_body: content,
          customer_email: customerEmail
        }
      });

      console.log('Edge function response:', { data, error: functionError });

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw functionError;
      }

      console.log('Message sent successfully:', data);
      setContent('');
    } catch (err: any) {
      console.error('Detailed error:', {
        message: err.message,
        error: err,
        stack: err.stack
      });
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <textarea 
        className="w-full px-4 py-3 border border-gray-300 rounded-md min-h-[150px] resize-y" 
        placeholder="Type your message..." 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={sending}
      />
      
      {error && (
        <div className="text-red-600 text-sm">
          Error sending message: {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={sending || !content.trim()}
          className={`px-4 py-2 text-sm text-white rounded-md ${
            sending || !content.trim() 
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {sending ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </div>
  );
};