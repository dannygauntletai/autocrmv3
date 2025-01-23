import type { ChangeEvent } from 'react';
import type { TicketPriority, TicketCategory } from './types/common';

interface TicketFieldInputsProps {
  formData: {
    email: string;
    title: string;
    description: string;
    priority: TicketPriority;
    category: TicketCategory;
  };
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const TicketFieldInputs = ({ formData, onChange }: TicketFieldInputsProps) => {
  return <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
          <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="customer@example.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subject
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter ticket subject"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
            <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          >
            <option value="technical_support">Technical Support</option>
            <option value="billing">Billing</option>
            <option value="feature_request">Feature Request</option>
            <option value="general_inquiry">General Inquiry</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
            <span className="text-red-500">*</span>
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
          <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={6}
          placeholder="Please provide detailed information about the issue"
          required
        />
      </div>
    </div>;
};