import type { TicketListItemType } from "./types/common";
import { useTicketAssignment } from "./hooks/useTicketAssignment";

interface Props {
  ticket: TicketListItemType;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  queueType: 'personal' | 'team';
}

export const TicketListItem = ({
  ticket,
  isSelected,
  onSelect,
  onClick,
  queueType
}: Props) => {
  const { assignments, loading } = useTicketAssignment(ticket.id);
  const isAssigned = !loading && Object.keys(assignments).length > 0;

  return (
    <div 
      className={`p-4 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('input[type="checkbox"]')) {
          onClick();
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-900">{ticket.subject}</h4>
              <div className="flex gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                  ${ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                    ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'}`}>
                  {ticket.priority}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                  ${ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                    ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'}`}>
                  {ticket.status}
                </span>
                {queueType === 'team' && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                    ${isAssigned 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-800'}`}>
                    {isAssigned ? 'Assigned' : 'Unassigned'}
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">{ticket.customer}</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {new Date(ticket.lastUpdate).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};