import { RefreshCw, Trash2, Copy } from "lucide-react";
interface ApiKey {
  id: number;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  scopes: string[];
}
interface Props {
  apiKey: ApiKey;
}
export const ApiKeyItem = ({
  apiKey
}: Props) => {
  return <div className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200 items-center">
      <div className="col-span-2">
        <div className="text-gray-900">{apiKey.name}</div>
        <div className="text-sm text-gray-500">Created {apiKey.created}</div>
      </div>
      <div className="col-span-2 font-mono text-sm text-gray-600 flex items-center gap-2">
        {apiKey.key}
        <button className="text-gray-400 hover:text-gray-600">
          <Copy className="h-4 w-4" />
        </button>
      </div>
      <div className="text-sm text-gray-600">{apiKey.lastUsed}</div>
      <div className="flex gap-2">
        <button className="p-1 text-gray-600 hover:text-blue-600" title="Regenerate">
          <RefreshCw className="h-4 w-4" />
        </button>
        <button className="p-1 text-gray-600 hover:text-red-600" title="Revoke">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>;
};