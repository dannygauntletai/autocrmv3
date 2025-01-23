import React from "react";
export const TicketCustomFields = () => {
  const customFields = [{
    id: 1,
    name: "Customer ID",
    value: "12345"
  }, {
    id: 2,
    name: "Product",
    value: "Enterprise Plan"
  }, {
    id: 3,
    name: "Browser",
    value: "Chrome 94.0"
  }];
  return <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Details</h3>
      <div className="space-y-3">
        {customFields.map(field => <div key={field.id}>
            <label className="block text-xs text-gray-500">{field.name}</label>
            <div className="text-sm text-gray-900">{field.value}</div>
          </div>)}
      </div>
    </div>;
};