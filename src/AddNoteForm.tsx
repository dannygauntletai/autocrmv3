import { useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { useAuth } from './hooks/useAuth';

interface Props {
  ticketId: string;
}

export const AddNoteForm = ({ ticketId }: Props) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setLoading(true);
    try {
      // Get the employee ID for the current user
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('email', user.email)
        .single();

      if (employeeError) throw employeeError;

      // Add the internal note
      const { error: noteError } = await supabase
        .from('ticket_messages')
        .insert([{
          ticket_id: ticketId,
          sender_id: employeeData.id,
          sender_type: 'employee',
          message_body: content,
          is_internal: true
        }]);

      if (noteError) throw noteError;

      // Clear the form
      setContent('');
    } catch (err) {
      console.error('Error adding internal note:', err);
      alert('Failed to add note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        placeholder="Add an internal note..."
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        disabled={loading}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          disabled={loading || !content.trim()}
        >
          {loading ? 'Adding...' : 'Add Note'}
        </button>
      </div>
    </form>
  );
};