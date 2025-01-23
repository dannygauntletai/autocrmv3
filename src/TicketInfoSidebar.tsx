import { StatusPriorityTags } from "./StatusPriorityTags";
import { TicketCustomFields } from "./TicketCustomFields";
export const TicketInfoSidebar = () => {
  return <div className="w-80 space-y-6">
      <StatusPriorityTags />
      <TicketCustomFields />
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Assigned To</h3>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
          <option>Jane Smith</option>
          <option>John Doe</option>
          <option>Unassigned</option>
        </select>
      </div>
    </div>;
};