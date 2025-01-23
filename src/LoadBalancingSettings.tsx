import { MaxTicketsSlider } from "./MaxTicketsSlider";
import { FallbackRules } from "./FallbackRules";
import { CoverageHoursSettings } from "./CoverageHoursSettings";
export const LoadBalancingSettings = () => {
  return <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Workload Distribution
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure how tickets are distributed among agents
        </p>
      </div>
      <div className="p-6 space-y-6">
        <MaxTicketsSlider />
        <div className="border-t border-gray-200 pt-6">
          <CoverageHoursSettings />
        </div>
        <div className="border-t border-gray-200 pt-6">
          <FallbackRules />
        </div>
        <div className="border-t border-gray-200 pt-6 flex justify-end">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Save Settings
          </button>
        </div>
      </div>
    </div>;
};