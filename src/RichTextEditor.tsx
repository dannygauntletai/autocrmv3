import { useState } from "react";
import { Bold, Italic, List, Link, Image, ChevronDown } from "lucide-react";
export const RichTextEditor = () => {
  const [showTemplates, setShowTemplates] = useState(false);
  const templates = [{
    id: 1,
    name: "General Greeting",
    content: "Hi, thank you for reaching out!"
  }, {
    id: 2,
    name: "Technical Issue",
    content: "I understand you're experiencing technical difficulties."
  }];
  return <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-600 hover:text-gray-900 rounded">
            <Bold className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900 rounded">
            <Italic className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900 rounded">
            <List className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900 rounded">
            <Link className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900 rounded">
            <Image className="h-5 w-5" />
          </button>
        </div>
        <div className="relative">
          <button onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
            Quick Templates
            <ChevronDown className="h-4 w-4" />
          </button>
          {showTemplates && <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
              {templates.map(template => <button key={template.id} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                  {template.name}
                </button>)}
            </div>}
        </div>
      </div>
      <textarea className="w-full px-4 py-3 border border-gray-300 rounded-md min-h-[150px] resize-y" placeholder="Type your reply..." />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" className="rounded border-gray-300" />
          Add as internal note
        </label>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
            Save Draft
          </button>
          <button className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Send Reply
          </button>
        </div>
      </div>
    </div>;
};