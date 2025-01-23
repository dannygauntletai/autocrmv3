import { AgentListItem } from "./AgentListItem";
export const AgentList = () => {
  const agents = [{
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "Senior Agent",
    status: "Active",
    skills: ["Technical Support", "Product Knowledge"],
    activeTickets: 5,
    performance: {
      responseTime: "1.5h",
      satisfaction: "94%"
    }
  }, {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "Agent",
    status: "Away",
    skills: ["Customer Service", "Billing"],
    activeTickets: 3,
    performance: {
      responseTime: "2h",
      satisfaction: "92%"
    }
  }];
  return <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {agents.map(agent => <AgentListItem key={agent.id} agent={agent} />)}
      </div>
    </div>;
};