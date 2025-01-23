import { useEffect, useState } from "react";
import { SchemaDefinitionItem } from "./SchemaDefinitionItem";
import { supabase } from "./lib/supabaseClient";
import type { SchemaDefinition } from "./types/common";

export const SchemaDefinitionsList = () => {
  const [schemaFields, setSchemaFields] = useState<SchemaDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchemaFields = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('schema_definitions')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSchemaFields(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schema definitions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemaFields();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (error) {
    return <div className="bg-red-50 text-red-600 p-4 rounded-lg">
      Error: {error}
    </div>;
  }

  return <div className="bg-white rounded-lg border border-gray-200">
    <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 bg-gray-50">
      <div className="font-medium text-gray-700">Field Name</div>
      <div className="font-medium text-gray-700">Type</div>
      <div className="font-medium text-gray-700">Required</div>
      <div className="font-medium text-gray-700">Actions</div>
    </div>
    {schemaFields.length === 0 ? (
      <div className="p-8 text-center text-gray-500">
        No schema definitions found. Click "Add Field" to create one.
      </div>
    ) : (
      schemaFields.map(field => (
        <SchemaDefinitionItem 
          key={field.id} 
          field={field} 
          onDelete={fetchSchemaFields}
        />
      ))
    )}
  </div>;
};