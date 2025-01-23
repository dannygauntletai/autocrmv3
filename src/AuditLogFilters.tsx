import { Search } from "lucide-react";

type ActionType = 'SCHEMA_UPDATE' | 'TICKET_CREATE' | 'TICKET_UPDATE';

interface AuditLogFiltersProps {
  filters: {
    search: string;
    startDate: string;
    endDate: string;
    actionType: ActionType | '';
  };
  onFilterChange: (key: keyof AuditLogFiltersProps['filters'], value: string) => void;
}

export const AuditLogFilters = ({ filters, onFilterChange }: AuditLogFiltersProps) => {
  const actionTypes: ActionType[] = [
    'SCHEMA_UPDATE',
    'TICKET_CREATE',
    'TICKET_UPDATE'
  ];

  return (
    <div className="mb-6 space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search audit logs..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <select
          value={filters.actionType}
          onChange={(e) => onFilterChange('actionType', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md min-w-[200px]"
        >
          <option value="">All Actions</option>
          {actionTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>
    </div>
  );
};