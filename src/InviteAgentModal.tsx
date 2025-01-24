import { X } from "lucide-react";
import { useState, FormEvent } from "react";

interface Props {
  onClose: () => void;
  teamId?: string;
}

interface InviteFormData {
  name: string;
  email: string;
  role: "agent" | "supervisor";
}

export const InviteAgentModal = ({
  onClose,
  teamId
}: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<InviteFormData>({
    name: "",
    email: "",
    role: "agent"
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!teamId) {
      setError("Team ID is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-agent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            teamId: teamId,
            role: formData.role
          })
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite agent');
      }

      onClose();
    } catch (err) {
      console.error("Error inviting agent:", err);
      setError(err instanceof Error ? err.message : "Failed to invite agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Invite Team Member</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              placeholder="John Doe"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              placeholder="agent@company.com"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select 
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as "agent" | "supervisor" }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="agent">Agent</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </div>
          <div className="pt-4 border-t border-gray-200 mt-6">
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>;
};