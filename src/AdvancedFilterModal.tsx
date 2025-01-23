import { X } from "lucide-react";
interface Props {
  onClose: () => void;
}
export const AdvancedFilterModal = ({
  onClose
}: Props) => {
  // These would come from your schema definitions in a real app
  const customFields = [{
    id: 1,
    name: "Customer ID",
    type: "string"
  }, {
    id: 2,
    name: "Product Category",
    type: "enum"
  }];
  const categories = ["General Support", "Technical Support", "Billing Support", "Feature Requests"];
  const tags = ["bug", "feature", "urgent", "documentation", "billing"];
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Advanced Filters</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-6">
          {/* Categories */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Categories
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(category => <label key={category} className="flex items-center p-2 border border-gray-200 rounded-md">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm text-gray-700">{category}</span>
                </label>)}
            </div>
          </div>
          {/* Tags */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => <label key={tag} className="inline-flex items-center px-3 py-1 border border-gray-200 rounded-full">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm text-gray-700">{tag}</span>
                </label>)}
            </div>
          </div>
          {/* Custom Fields */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Custom Fields
            </h4>
            <div className="space-y-3">
              {customFields.map(field => <div key={field.id} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-1/4">
                    {field.name}:
                  </span>
                  {field.type === "enum" ? <select className="flex-1 px-3 py-2 border border-gray-300 rounded-md">
                      <option value="">Any</option>
                      <option>Option 1</option>
                      <option>Option 2</option>
                    </select> : <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded-md" placeholder={`Enter ${field.name.toLowerCase()}`} />}
                </div>)}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Apply Filters
          </button>
        </div>
      </div>
    </div>;
};