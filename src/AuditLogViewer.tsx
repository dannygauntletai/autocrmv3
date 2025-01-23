import React from "react";
import { AuditLogList } from "./AuditLogList";
import { AuditLogFilters } from "./AuditLogFilters";
export const AuditLogViewer = () => {
  return <div className="w-full">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Audit Log</h2>
      <AuditLogFilters />
      <AuditLogList />
    </div>;
};