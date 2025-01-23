import { Settings, Award } from "lucide-react";
interface AgentMetrics {
  responseTime: string;
  resolution: string;
  satisfaction: string;
}
interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: string;
  activeTickets: number;
  skills: string[];
  metrics: AgentMetrics;
}
interface Props {
  agent: Agent;
}
export const TeamAgentItem = ({
  agent
}: Props) => {
  return <div className="p-6">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <img src={agent.avatar} alt={agent.name} className="h-10 w-10 rounded-full" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-medium text-gray-900">
                {agent.name}
              </h4>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${agent.status === "online" ? "bg-green-100 text-green-800" : ""}
                ${agent.status === "busy" ? "bg-yellow-100 text-yellow-800" : ""}
                ${agent.status === "offline" ? "bg-gray-100 text-gray-800" : ""}`}>
                {agent.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">{agent.role}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {agent.skills.map(skill => <span key={skill} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {skill}
                </span>)}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-sm">
                <span className="text-gray-500">Response:</span>
                <span className="ml-2 text-gray-900">
                  {agent.metrics.responseTime}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Resolution:</span>
                <span className="ml-2 text-gray-900">
                  {agent.metrics.resolution}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Rating:</span>
                <span className="ml-2 text-gray-900">
                  {agent.metrics.satisfaction}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100">
            <Award className="h-4 w-4" />
            <span className="ml-2">Assign Skills</span>
          </button>
          <button className="p-2 text-gray-600 hover:text-blue-600 rounded-md">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>;
};