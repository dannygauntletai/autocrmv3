export const WorkHoursSettings = () => {
  return <div>
      <h4 className="text-sm font-medium text-gray-900 mb-4">Working Hours</h4>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Start Time
            </label>
            <input type="time" defaultValue="09:00" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">End Time</label>
            <input type="time" defaultValue="17:00" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>
        <div>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span className="text-sm text-gray-700">
              Automatically adjust ticket distribution during off-hours
            </span>
          </label>
        </div>
      </div>
    </div>;
};