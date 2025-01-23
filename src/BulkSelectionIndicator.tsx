import { X } from "lucide-react";
interface Props {
  count: number;
  onClear: () => void;
}
export const BulkSelectionIndicator = ({
  count,
  onClear
}: Props) => {
  return <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">
        <span className="font-medium">{count}</span> tickets selected
      </span>
      <button onClick={onClear} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
        <X className="h-4 w-4" />
        Clear selection
      </button>
    </div>;
};