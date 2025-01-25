import { useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { supabase } from './lib/supabaseClient';
import { useAuth } from './hooks/useAuth';

interface Props {
  ticketId: string;
}

export const RichTextEditor = ({ ticketId }: Props) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();

  const templates = [{
    id: 1,
    name: "General Greeting",
    content: "Hi, thank you for reaching out!"
  }, {
    id: 2,
    name: "Technical Issue",
    content: "I understand you're experiencing technical difficulties."
  }];

  const handleGenerateResponse = async () => {
    setGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-response`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      setContent(data.response);
    } catch (error) {
      console.error('Error generating response:', error);
      alert('Failed to generate response. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendReply = async () => {
    if (!content.trim() || !user) return;

    setSending(true);
    try {
      // Get the employee ID for the current user
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('email', user.email)
        .single();

      if (employeeError) throw employeeError;

      // Add the message
      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert([{
          ticket_id: ticketId,
          sender_id: employeeData.id,
          sender_type: 'employee',
          message_body: content,
          is_internal: false
        }]);

      if (messageError) throw messageError;

      // Clear the form
      setContent('');
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (templateContent: string) => {
    setContent(templateContent);
    setShowTemplates(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            className="p-2 text-gray-600 hover:text-gray-900 rounded disabled:opacity-50"
            onClick={handleGenerateResponse}
            disabled={generating}
          >
            <Sparkles className={`h-5 w-5 ${generating ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowTemplates(!showTemplates)} 
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Quick Templates
            <ChevronDown className="h-4 w-4" />
          </button>
          {showTemplates && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.content)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  {template.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <textarea
        className="w-full px-4 py-3 border border-gray-300 rounded-md min-h-[150px] resize-y"
        placeholder="Type your reply..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setContent('')}
          className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={sending || !content.trim()}
        >
          Clear
        </button>
        <button
          onClick={handleSendReply}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          disabled={sending || !content.trim()}
        >
          {sending ? 'Sending...' : 'Send Reply'}
        </button>
      </div>
    </div>
  );
};