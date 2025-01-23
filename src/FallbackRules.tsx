export const FallbackRules = () => {
  return <div>
      <h4 className="text-sm font-medium text-gray-900 mb-4">Fallback Rules</h4>
      <div className="space-y-4">
        <div>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span className="text-sm text-gray-700">
              Redistribute if no response within
              <select className="mx-2 px-2 py-1 border border-gray-300 rounded">
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>2 hours</option>
              </select>
            </span>
          </label>
        </div>
        <div>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span className="text-sm text-gray-700">
              Escalate to team lead after
              <select className="mx-2 px-2 py-1 border border-gray-300 rounded">
                <option>2 hours</option>
                <option>4 hours</option>
                <option>8 hours</option>
              </select>
            </span>
          </label>
        </div>
        <div>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm text-gray-700">
              Auto-assign to available agents
            </span>
          </label>
        </div>
      </div>
    </div>;
};