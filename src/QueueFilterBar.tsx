import { Search, Filter } from "lucide-react";
import { useState } from "react";

interface FilterProps {
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onTicketIdChange?: (ticketId: string) => void;
}

export const QueueFilterBar = ({
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onTicketIdChange
}: FilterProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Remove # and whitespace
    const cleanValue = value.replace('#', '').trim();
    
    // If it's an exact UUID, use the ticket ID filter
    if (cleanValue.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      onTicketIdChange?.(cleanValue);
      onSearchChange('');
    } else {
      // For partial searches or non-UUID searches, use the regular search
      onTicketIdChange?.('');
      onSearchChange(cleanValue);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(e.target.value);
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPriorityChange(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search tickets or enter #ID..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
          />
        </div>
        <select 
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          onChange={handleStatusChange}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
        <select 
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          onChange={handlePriorityChange}
        >
          <option value="">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button 
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            showMoreFilters ? 'bg-gray-100' : ''
          }`}
        >
          <Filter className="h-5 w-5 mr-2" />
          More Filters
        </button>
      </div>
      
      {showMoreFilters && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <div className="flex gap-4">
              <input 
                type="date" 
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <input 
                type="date" 
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input 
              type="text" 
              placeholder="Filter by tags..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};