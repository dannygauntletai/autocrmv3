import { TemplateItem } from "./TemplateItem";
export const TemplateList = () => {
  const templates = [{
    id: 1,
    title: "General Greeting",
    content: "Hi {{customer.name}}, thank you for contacting us.",
    category: "General",
    usageCount: 156
  }, {
    id: 2,
    title: "Technical Issue Follow-up",
    content: "I understand you're experiencing issues with {{feature}}. Could you please provide more details?",
    category: "Technical Support",
    usageCount: 89
  }];
  return <div className="bg-white rounded-lg border border-gray-200">
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 border-b border-gray-200">
        <div className="col-span-2 font-medium text-gray-700">Template</div>
        <div className="font-medium text-gray-700">Category</div>
        <div className="font-medium text-gray-700">Actions</div>
      </div>
      {templates.map(template => <TemplateItem key={template.id} template={template} />)}
    </div>;
};