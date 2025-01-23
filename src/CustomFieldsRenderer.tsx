import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import type { SchemaDefinition } from './types/common';

interface CustomFieldsRendererProps {
  formData: {
    custom_fields: Record<string, any>;
  };
  onChange: (customFields: Record<string, any>) => void;
}

export const CustomFieldsRenderer = ({ formData, onChange }: CustomFieldsRendererProps) => {
  const [schemaDefinitions, setSchemaDefinitions] = useState<SchemaDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSchemaDefinitions = async () => {
      try {
        const { data, error } = await supabase
          .from('schema_definitions')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setSchemaDefinitions(data || []);
      } catch (error) {
        console.error('Error fetching schema definitions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchemaDefinitions();
  }, []);

  const handleFieldChange = (fieldName: string, value: any) => {
    onChange({
      ...formData.custom_fields,
      [fieldName]: value
    });
  };

  if (isLoading) {
    return <div className="text-gray-500">Loading custom fields...</div>;
  }

  if (schemaDefinitions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 border-t border-gray-200 pt-4">
      <h3 className="text-lg font-medium text-gray-900">Custom Fields</h3>
      {schemaDefinitions.map(field => (
        <div key={field.id}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.field_name}
            {field.is_required && <span className="text-red-500">*</span>}
          </label>
          {field.field_type === 'text' && (
            <input
              type="text"
              value={formData.custom_fields[field.field_name] || ''}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder={`Enter ${field.field_name.toLowerCase()}`}
            />
          )}
          {field.field_type === 'number' && (
            <input
              type="number"
              value={formData.custom_fields[field.field_name] || ''}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          )}
          {field.field_type === 'date' && (
            <input
              type="date"
              value={formData.custom_fields[field.field_name] || ''}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          )}
          {field.field_type === 'boolean' && (
            <input
              type="checkbox"
              checked={formData.custom_fields[field.field_name] || false}
              onChange={(e) => handleFieldChange(field.field_name, e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
          )}
        </div>
      ))}
    </div>
  );
};