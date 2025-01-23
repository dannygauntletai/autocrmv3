import { Bold, Italic, Link, Image, List } from "lucide-react";
export const TextEditorToolbar = () => {
  return <div className="flex items-center gap-1">
      <button className="p-1 text-gray-600 hover:text-gray-900 rounded">
        <Bold className="h-5 w-5" />
      </button>
      <button className="p-1 text-gray-600 hover:text-gray-900 rounded">
        <Italic className="h-5 w-5" />
      </button>
      <button className="p-1 text-gray-600 hover:text-gray-900 rounded">
        <Link className="h-5 w-5" />
      </button>
      <button className="p-1 text-gray-600 hover:text-gray-900 rounded">
        <Image className="h-5 w-5" />
      </button>
      <button className="p-1 text-gray-600 hover:text-gray-900 rounded">
        <List className="h-5 w-5" />
      </button>
    </div>;
};