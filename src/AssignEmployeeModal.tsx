import { X, Search } from "lucide-react";
interface Props {
  teamId: string | null;
  onClose: () => void;
}
export const AssignEmployeeModal = ({
  teamId,
  onClose
}: Props) => {
  const employees = [{
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "Support Agent"
  }, {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "Senior Agent"
  }];
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Assign Employee to Team</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input type="text" placeholder="Search employees..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md" />
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-auto">
          {employees.map(employee => <div key={employee.id} className="flex items-center justify-between py-4">
              <div>
                <div className="font-medium text-gray-900">{employee.name}</div>
                <div className="text-sm text-gray-500">{employee.email}</div>
                <div className="text-xs text-gray-400">{employee.role}</div>
              </div>
              <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Assign
              </button>
            </div>)}
        </div>
      </div>
    </div>;
};