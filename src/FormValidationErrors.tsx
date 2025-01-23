import React from "react";
import { AlertCircle } from "lucide-react";
export const FormValidationErrors = () => {
  // Example errors - in real app, this would come from form validation
  const errors = ["Title is required", "Priority must be selected"];
  if (errors.length === 0) return null;
  return <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <div className="flex items-center gap-2 text-red-800 mb-2">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">Please fix the following errors:</span>
      </div>
      <ul className="list-disc list-inside text-sm text-red-700">
        {errors.map((error, index) => <li key={index}>{error}</li>)}
      </ul>
    </div>;
};