import { Clock, User, FileText } from "lucide-react";
export const AuditLogList = () => {
  // Example audit logs - in real app, this would come from your backend
  const auditLogs = [{
    id: 1,
    timestamp: "2023-07-20 10:30:45",
    action: 'Created field "Customer ID"',
    user: "John Doe"
  }, {
    id: 2,
    timestamp: "2023-07-20 10:15:22",
    action: "Modified ticket schema",
    user: "Jane Smith"
  }
  // Add more example logs as needed
  ];
  return <div className="bg-white rounded-lg border border-gray-200">
      {auditLogs.map(log => <div key={log.id} className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              <span className="text-gray-900">{log.action}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {log.user}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {log.timestamp}
              </div>
            </div>
          </div>
        </div>)}
    </div>;
};