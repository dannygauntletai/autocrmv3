export const CoverageHoursSettings = () => {
  return <div>
      <h4 className="text-sm font-medium text-gray-900 mb-4">Coverage Hours</h4>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Coverage Start
            </label>
            <input type="time" defaultValue="09:00" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Coverage End
            </label>
            <input type="time" defaultValue="17:00" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>
        <div>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span className="text-sm text-gray-700">
              Enable after-hours routing to on-call agents
            </span>
          </label>
        </div>
        <div>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span className="text-sm text-gray-700">
              Send notifications for tickets received outside coverage hours
            </span>
          </label>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Time Zone</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option>UTC-8 (Pacific Time)</option>
            <option>UTC-5 (Eastern Time)</option>
            <option>UTC+0 (GMT)</option>
            <option>UTC+1 (Central European Time)</option>
          </select>
        </div>
      </div>
    </div>;
};