import { Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import type { SchemaDefinition } from "./types/common";
import { supabase } from "./lib/supabaseClient";

interface Props {
  field: SchemaDefinition;
  onDelete?: () => void;
}

export const SchemaDefinitionItem = ({
  field,
  onDelete
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete the field "${field.field_name}"?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('schema_definitions')
        .delete()
        .eq('id', field.id);

      if (deleteError) throw deleteError;

      // Log the action
      await supabase
        .from('audit_logs')
        .insert([
          {
            action_type: 'SCHEMA_UPDATE',
            action_details: {
              operation: 'delete',
              field_name: field.field_name,
              field_type: field.field_type
            },
            performed_by: 'system' // TODO: Replace with actual user ID when auth is implemented
          }
        ]);

      onDelete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete field');
      console.error('Error deleting field:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 items-center">
        <div className="text-gray-900">{field.field_name}</div>
        <div className="text-gray-600">{field.field_type}</div>
        <div className="text-gray-600">{field.is_required ? "Yes" : "No"}</div>
        <div className="flex gap-2">
          <button 
            className="p-1 text-gray-600 hover:text-blue-600"
            title="Edit field"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button 
            className="p-1 text-gray-600 hover:text-red-600"
            onClick={handleDelete}
            disabled={loading}
            title="Delete field"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {error && (
        <div className="col-span-4 bg-red-50 text-red-600 p-2 text-sm">
          {error}
        </div>
      )}
    </>
  );
};