import { useTicket } from './hooks/useTicket';

interface Props {
  ticketId: string;
}

export const CustomFieldsPanel = ({ ticketId }: Props) => {
  const { ticket, loading, error } = useTicket(ticketId);

  // Helper function to format custom field values
  const formatCustomFieldValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Don't render anything if there are no custom fields
  if (!ticket?.custom_fields || Object.keys(ticket.custom_fields).length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Custom Fields</h3>
        </div>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Custom Fields</h3>
        </div>
        <div className="p-4 text-red-600">
          Error loading custom fields: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Custom Fields</h3>
      </div>
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="divide-y divide-gray-200">
            {Object.entries(ticket.custom_fields).map(([key, value]) => (
              <tr key={key}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50 w-1/2">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </td>
                <td className="px-4 py-3 whitespace-normal text-sm text-gray-900 w-1/2">
                  {formatCustomFieldValue(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 