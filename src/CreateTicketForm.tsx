import { useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { TicketFieldInputs } from "./TicketFieldInputs";
import { CustomFieldsRenderer } from "./CustomFieldsRenderer";
import { FormValidationErrors } from "./FormValidationErrors";
import type { Ticket, TicketCategory } from './types/common';

export const CreateTicketForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    title: '',
    description: '',
    category: 'technical_support' as TicketCategory,
    priority: 'low' as const,
    status: 'open' as const,
    tags: [] as string[],
    custom_fields: {} as Record<string, any>
  });

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
      
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setIsSubmitting(false);
        return;
      }

      // Create ticket
      const { data, error } = await supabase
        .from('tickets')
        .insert([{
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await supabase
        .from('audit_logs')
        .insert([{
          action_type: 'TICKET_CREATE',
          action_details: { ticket_id: data.id },
          performed_by: formData.email, // Using email as performer for now
          created_at: new Date().toISOString(),
        }]);

      // Reset form
      setFormData({
        email: '',
        title: '',
        description: '',
        category: 'technical_support' as TicketCategory,
        priority: 'low',
        status: 'open',
        tags: [],
        custom_fields: {}
      });

      // Show success message or redirect
      alert('Ticket created successfully!');
    } catch (error) {
      console.error('Error creating ticket:', error);
      setErrors(['Failed to create ticket. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
              category: 'technical_support' as TicketCategory,
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