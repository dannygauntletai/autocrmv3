import { X } from "lucide-react";
interface Props {
  onClose: () => void;
}
export const CreateWebhookModal = ({
  onClose
}: Props) => {
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Webhook</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endpoint URL
            </label>
            <input type="url" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="https://your-domain.com/webhook" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Events
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input type="checkbox" id="ticket.created" className="mr-2" />
                <label htmlFor="ticket.created" className="text-sm text-gray-700">
                  Ticket Created
                </label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="ticket.updated" className="mr-2" />
                <label htmlFor="ticket.updated" className="text-sm text-gray-700">
                  Ticket Updated
                </label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="ticket.deleted" className="mr-2" />
                <label htmlFor="ticket.deleted" className="text-sm text-gray-700">
                  Ticket Deleted
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Add Webhook
            </button>
          </div>
        </form>
      </div>
    </div>;
};