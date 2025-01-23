export const CustomFieldsRenderer = () => {
  // Example custom fields - in real app, this would come from your schema definitions
  const customFields = [{
    id: 1,
    name: "Customer ID",
    type: "string",
    required: true
  }, {
    id: 2,
    name: "Product Category",
    type: "enum",
    required: false
  }];
  return <div className="space-y-4 border-t border-gray-200 pt-4">
      <h3 className="text-lg font-medium text-gray-900">Custom Fields</h3>
      {customFields.map(field => <div key={field.id}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.name}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder={`Enter ${field.name.toLowerCase()}`} />
        </div>)}
    </div>;
};