export const CustomerRichTextEditor = () => {
  return <div className="space-y-4">
      <textarea className="w-full px-4 py-3 border border-gray-300 rounded-md min-h-[150px] resize-y" placeholder="Type your message..." />
      <div className="flex justify-end">
        <button className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Send Message
        </button>
      </div>
    </div>;
};