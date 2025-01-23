import { X } from "lucide-react";
import { RoutingRuleBuilder } from "./RoutingRuleBuilder";
interface Props {
  ruleId: string | null;
  onClose: () => void;
}
export const NewRoutingRuleModal = ({
  ruleId,
  onClose
}: Props) => {
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {ruleId ? "Edit Routing Rule" : "Create Routing Rule"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <RoutingRuleBuilder ruleId={ruleId} onClose={onClose} />
      </div>
    </div>;
};