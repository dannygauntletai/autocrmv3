import { useState, useEffect } from 'react';
import { TicketFieldInputs } from "./TicketFieldInputs";
import { CustomFieldsRenderer } from "./CustomFieldsRenderer";
import { FormValidationErrors } from "./FormValidationErrors";
import { supabase } from './lib/supabase';
import type { Team } from './types/supabase';

interface TeamCategory {
  name: string;
  id: string;
}

export const CreateTicketForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [teams, setTeams] = useState<TeamCategory[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    title: '',
    description: '',
    category: '',
    team_id: '', // We'll use this for team_ticket_assignments
    priority: 'low' as const,
    status: 'open' as const,
    tags: [] as string[],
    custom_fields: {} as Record<string, any>
  });

  useEffect(() => {
    const fetchTeams = async () => {
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select('id, name');

      if (error) {
        console.error('Error fetching teams:', error);
        return;
      }

      setTeams(teamsData || []);
      // Set the first team as default if available
      if (teamsData && teamsData.length > 0) {
        setFormData(prev => ({
          ...prev,
          category: teamsData[0].name,
          team_id: teamsData[0].id
        }));
      }
    };

    fetchTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);

    try {
      // Validate required fields
      const validationErrors: string[] = [];
      if (!formData.email) validationErrors.push('Email is required');
      if (!formData.title) validationErrors.push('Subject is required');
      if (!formData.description) validationErrors.push('Description is required');
      if (!formData.team_id) validationErrors.push('Category is required');
      
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setIsSubmitting(false);
        return;
      }

      // Call the create-ticket edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-ticket`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: formData.email,
            title: formData.title,
            description: formData.description,
            category: formData.category, // Use the team name directly as category
            priority: formData.priority,
            status: formData.status,
            tags: formData.tags,
            custom_fields: formData.custom_fields,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ticket');
      }

      const data = await response.json();

      // Reset form
      setFormData({
        email: '',
        title: '',
        description: '',
        category: teams[0]?.name || '',
        team_id: teams[0]?.id || '',
        priority: 'low',
        status: 'open',
        tags: [],
        custom_fields: {}
      });

      // Show success message or redirect
      alert('Ticket created successfully!');
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      setErrors([error.message || 'Failed to create ticket. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'category') {
      // Find the corresponding team_id for the selected category
      const selectedTeam = teams.find(team => team.name === value);
      setFormData(prev => ({
        ...prev,
        category: value,
        team_id: selectedTeam?.id || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Create Ticket
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <TicketFieldInputs 
          formData={formData}
          onChange={handleInputChange}
          teams={teams}
        />
        <CustomFieldsRenderer 
          formData={formData}
          onChange={(customFields) => setFormData(prev => ({
            ...prev,
            custom_fields: customFields
          }))}
        />
        {errors.length > 0 && <FormValidationErrors errors={errors} />}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={() => setFormData({
              email: '',
              title: '',
              description: '',
              category: teams[0]?.name || '',
              team_id: teams[0]?.id || '',
              priority: 'low',
              status: 'open',
              tags: [],
              custom_fields: {}
            })}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};