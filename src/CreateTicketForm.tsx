import { TicketFieldInputs } from "./TicketFieldInputs";
import { CustomFieldsRenderer } from "./CustomFieldsRenderer";
import { FormValidationErrors } from "./FormValidationErrors";
export const CreateTicketForm = () => {
  return <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Create Ticket
      </h2>
      <form className="space-y-6">
        <TicketFieldInputs />
        <CustomFieldsRenderer />
        <FormValidationErrors />
        <div className="flex justify-end gap-2">
          <button type="button" className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Create Ticket
          </button>
        </div>
      </form>
    </div>;
};