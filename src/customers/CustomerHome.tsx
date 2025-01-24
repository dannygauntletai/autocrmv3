import { CustomerTicketList } from "./CustomerTicketList";
export const CustomerHome = () => {
  return <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Support Center</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track and manage your support tickets
        </p>
      </div>
      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900">Your Tickets</h2>
          <CustomerTicketList />
        </div>
      </div>
    </div>;
};