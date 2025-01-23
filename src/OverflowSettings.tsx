export const OverflowSettings = () => {
  return <div>
      <h4 className="text-sm font-medium text-gray-900 mb-4">
        Overflow Settings
      </h4>
      <div className="space-y-4">
        <div>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span className="text-sm text-gray-700">
              Allow overflow to other teams when queue is full
            </span>
          </label>
        </div>
        <div>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span className="text-sm text-gray-700">
              Consider agent skill levels when distributing overflow
            </span>
          </label>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Overflow Threshold (minutes)
          </label>
          <input type="number" min="5" defaultValue="30" className="w-24 px-3 py-2 border border-gray-300 rounded-md" />
        </div>
      </div>
    </div>;
};