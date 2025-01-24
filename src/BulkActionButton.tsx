import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  label: string;
  options: (string | Option)[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export const BulkActionButton = ({
  label,
  options,
  onSelect,
  disabled = false
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: string | Option) => {
    const value = typeof option === 'string' ? option : option.value;
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        disabled={disabled}
        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white 
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
      >
        {label}
        <ChevronDown className="ml-2 h-4 w-4" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            {options.map((option, index) => {
              const optionLabel = typeof option === 'string' ? option : option.label;
              return (
                <button
                  key={index}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleSelect(option)}
                >
                  {optionLabel}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};