import { User, Clock } from "lucide-react";
export const InteractionLog = () => {
  const interactions = [{
    id: 1,
    type: "customer",
    author: "John Doe",
    content: "I'm unable to access the dashboard. Getting a 404 error.",
    timestamp: "2023-07-20 10:30:00"
  }, {
    id: 2,
    type: "agent",
    author: "Jane Smith",
    content: "I'll help you with that. Could you please provide your browser version and when this started happening?",
    timestamp: "2023-07-20 10:35:00"
  }];
  return <div className="space-y-6">
      {interactions.map(interaction => <div key={interaction.id} className={`flex ${interaction.type === "agent" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-2xl rounded-lg p-4 ${interaction.type === "agent" ? "bg-blue-50" : "bg-gray-50"}`}>
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-900">
                {interaction.author}
              </span>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                {interaction.timestamp}
              </div>
            </div>
            <div className="text-gray-700 prose prose-sm max-w-none">
              {interaction.content}
            </div>
          </div>
        </div>)}
    </div>;
};