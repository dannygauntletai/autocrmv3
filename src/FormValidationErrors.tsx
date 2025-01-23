import { AlertCircle } from "lucide-react";

interface FormValidationErrorsProps {
  errors: string[];
}

export const FormValidationErrors = ({ errors }: FormValidationErrorsProps) => {
  if (errors.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <div className="text-sm text-red-600">
        <ul className="list-disc pl-5 space-y-1">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};