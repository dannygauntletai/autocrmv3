import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
export const QuickResponsesDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const templates = [{
    id: 1,
    title: "Greeting",
    content: "Hi, thank you for contacting us."
  }, {
    id: 2,
    title: "Following Up",
    content: "Just checking in on this issue."
  }];
  return <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">
        Quick Responses
        <ChevronDown className="ml-2 h-4 w-4" />
      </button>
      {isOpen && <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            {templates.map(template => <button key={template.id} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsOpen(false)}>
                {template.title}
              </button>)}
          </div>
        </div>}
    </div>;
};