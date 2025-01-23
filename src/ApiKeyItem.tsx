import { RefreshCw, Trash2, Copy } from "lucide-react";
import { useState } from "react";
import { supabase } from "./lib/supabaseClient";
import type { ApiKey } from "./types/common";

interface Props {
  apiKey: ApiKey;
}

export const ApiKeyItem = ({ apiKey }: Props) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey.key_value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', apiKey.id);

      if (error) throw error;
      // Trigger a refresh of the list
      window.location.reload();
    } catch (error) {
      console.error('Error revoking API key:', error);
    }
  };

  const handleRegenerate = async () => {
    try {
      const newKeyValue = crypto.randomUUID();
      const { error } = await supabase
        .from('api_keys')
        .update({ key_value: newKeyValue })
        .eq('id', apiKey.id);

      if (error) throw error;
      // Trigger a refresh of the list
      window.location.reload();
    } catch (error) {
      console.error('Error regenerating API key:', error);
    }
  };

  return (
    <div className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200 items-center">
      <div className="col-span-2">
        <div className="text-gray-900">{apiKey.description}</div>
        <div className="text-sm text-gray-500">
          Created {new Date(apiKey.created_at).toLocaleDateString()}
        </div>
      </div>
      <div className="col-span-2 font-mono text-sm text-gray-600 flex items-center gap-2">
        {apiKey.key_value.slice(0, 8)}...{apiKey.key_value.slice(-4)}
        <button 
          onClick={copyToClipboard}
          className="text-gray-400 hover:text-gray-600"
          title={copied ? "Copied!" : "Copy to clipboard"}
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
      <div className="text-sm text-gray-600">
        {new Date(apiKey.updated_at).toLocaleDateString()}
      </div>
      <div className="flex gap-2">
        <button 
          onClick={handleRegenerate}
          className="p-1 text-gray-600 hover:text-blue-600" 
          title="Regenerate"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button 
          onClick={handleRevoke}
          className="p-1 text-gray-600 hover:text-red-600" 
          title="Revoke"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};