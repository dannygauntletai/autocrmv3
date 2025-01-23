import { X } from "lucide-react";
import { useState } from "react";
import { supabase } from "./lib/supabaseClient";

interface Props {
  onClose: () => void;
}

export const AddSchemaFieldModal = ({
  onClose
}: Props) => {
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [isRequired, setIsRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // First, check if field name already exists
      const { data: existing } = await supabase
        .from('schema_definitions')
        .select('id')
        .eq('field_name', fieldName)
        .maybeSingle();

      if (existing) {
        throw new Error('A field with this name already exists');
      }

      // Insert new field
      const { error: insertError } = await supabase
        .from('schema_definitions')
        .insert([
          {
            field_name: fieldName,
            field_type: fieldType,
            is_required: isRequired
          }
        ]);

      if (insertError) throw insertError;

      // Log the action
      await supabase
        .from('audit_logs')
        .insert([
          {
            action_type: 'SCHEMA_UPDATE',
            action_details: {
              operation: 'create',
              field_name: fieldName,
              field_type: fieldType,
              is_required: isRequired
            },
            performed_by: 'system' // TODO: Replace with actual user ID when auth is implemented
          }
        ]);

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add schema field');
    } finally {
      setLoading(false);
    }
  };

  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Add Schema Field</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Name
          </label>
          <input
            type="text"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter field name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Type
          </label>
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="date">Date</option>
          </select>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="required"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="required" className="text-sm text-gray-700">
            Required Field
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Field'}
          </button>
        </div>
      </form>
    </div>
  </div>;
};