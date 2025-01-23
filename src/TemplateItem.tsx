import { Edit2, Trash2, Copy } from "lucide-react";
interface Template {
  id: number;
  title: string;
  content: string;
  category: string;
  usageCount: number;
}
interface Props {
  template: Template;
}
export const TemplateItem = ({
  template
}: Props) => {
  return <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 items-center">
      <div className="col-span-2">
        <div className="text-gray-900 font-medium">{template.title}</div>
        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
          {template.content}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Used {template.usageCount} times
        </div>
      </div>
      <div className="text-sm text-gray-600">{template.category}</div>
      <div className="flex gap-2">
        <button className="p-1 text-gray-600 hover:text-blue-600" title="Copy">
          <Copy className="h-4 w-4" />
        </button>
        <button className="p-1 text-gray-600 hover:text-blue-600" title="Edit">
          <Edit2 className="h-4 w-4" />
        </button>
        <button className="p-1 text-gray-600 hover:text-red-600" title="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>;
};