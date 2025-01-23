import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
interface Props {
  label: string;
  options: string[];
}
export const BulkActionButton = ({
  label,
  options
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  return <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
        {label}
        <ChevronDown className="ml-2 h-4 w-4" />
      </button>
      {isOpen && <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            {options.map(option => <button key={option} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsOpen(false)}>
                {option}
              </button>)}
          </div>
        </div>}
    </div>;
};