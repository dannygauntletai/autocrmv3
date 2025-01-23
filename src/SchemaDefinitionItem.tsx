import { Edit2, Trash2 } from "lucide-react";
interface SchemaField {
  id: number;
  name: string;
  type: string;
  required: boolean;
}
interface Props {
  field: SchemaField;
}
export const SchemaDefinitionItem = ({
  field
}: Props) => {
  return <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 items-center">
      <div className="text-gray-900">{field.name}</div>
      <div className="text-gray-600">{field.type}</div>
      <div className="text-gray-600">{field.required ? "Yes" : "No"}</div>
      <div className="flex gap-2">
        <button className="p-1 text-gray-600 hover:text-blue-600">
          <Edit2 className="h-4 w-4" />
        </button>
        <button className="p-1 text-gray-600 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>;
};