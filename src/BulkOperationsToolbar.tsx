import { BulkActionButton } from "./BulkActionButton";
import { BulkSelectionIndicator } from "./BulkSelectionIndicator";
interface Props {
  selectedCount: number;
  onClearSelection: () => void;
}
export const BulkOperationsToolbar = ({
  selectedCount,
  onClearSelection
}: Props) => {
  return <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
      <BulkSelectionIndicator count={selectedCount} onClear={onClearSelection} />
      <div className="flex gap-2">
        <BulkActionButton label="Status" options={["Open", "Pending", "On Hold", "Resolved"]} />
        <BulkActionButton label="Priority" options={["High", "Medium", "Low"]} />
        <BulkActionButton label="Assign" options={["John Doe", "Jane Smith", "Unassigned"]} />
      </div>
    </div>;
};