import { Clock, User, FileText } from "lucide-react";
import type { AuditLog } from "./types/common";

interface AuditLogListProps {
  logs: AuditLog[];
}

export const AuditLogList = ({ logs }: AuditLogListProps) => {
  const formatActionDetails = (log: AuditLog) => {
    const details = log.action_details;
    switch (log.action_type) {
      case 'SCHEMA_UPDATE':
        if (details.operation === 'create') {
          return `Created field "${details.field_name}" (${details.field_type})`;
        } else if (details.operation === 'delete') {
          return `Deleted field "${details.field_name}"`;
        }
        return `Updated schema field "${details.field_name}"`;
      default:
        return `${log.action_type}: ${JSON.stringify(details)}`;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {logs.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No audit logs found.
        </div>
      ) : (
        logs.map(log => (
          <div key={log.id} className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="text-gray-900">{formatActionDetails(log)}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {log.performed_by}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};