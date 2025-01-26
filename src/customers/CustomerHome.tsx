import { CustomerTicketList } from "./CustomerTicketList";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";

export const CustomerHome = () => {
  const [searchParams] = useSearchParams();
  const feedbackStatus = searchParams.get('feedback');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Support Center</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track and manage your support tickets
        </p>
      </div>

      {feedbackStatus === 'success' && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Thank you for your feedback! Your response has been recorded.
              </p>
            </div>
          </div>
        </div>
      )}

      {feedbackStatus === 'error' && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                Sorry, we couldn't process your feedback. Please try again or contact support if the issue persists.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900">Your Tickets</h2>
          <CustomerTicketList />
        </div>
      </div>
    </div>
  );
};