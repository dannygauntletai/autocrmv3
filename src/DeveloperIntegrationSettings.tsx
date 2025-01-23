import { IntegrationOverview } from "./IntegrationOverview";
import { ApiKeyManagement } from "./ApiKeyManagement";
import { ApiUsageLogs } from "./ApiUsageLogs";
export const DeveloperIntegrationSettings = () => {
  return <div className="w-full space-y-8">
      <div className="border-b border-gray-200 pb-5">
        <h2 className="text-2xl font-semibold text-gray-900">
          Developer Settings
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Manage your API keys and monitor API usage.
        </p>
      </div>
      <div className="grid gap-8">
        <IntegrationOverview />
        <ApiKeyManagement />
        <ApiUsageLogs />
      </div>
    </div>;
};