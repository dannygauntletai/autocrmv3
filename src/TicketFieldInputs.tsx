import React from "react";
export const TicketFieldInputs = () => {
  return <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
          <span className="text-red-500">*</span>
        </label>
        <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="customer@example.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subject
          <span className="text-red-500">*</span>
        </label>
        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter ticket subject" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
            <span className="text-red-500">*</span>
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Select category</option>
            <option>Technical Support</option>
            <option>Billing</option>
            <option>Feature Request</option>
            <option>General Inquiry</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
            <span className="text-red-500">*</span>
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Select priority</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
          <span className="text-red-500">*</span>
        </label>
        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={6} placeholder="Please provide detailed information about the issue" />
      </div>
    </div>;
};