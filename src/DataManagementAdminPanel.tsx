import { Route, Routes, Link, Navigate, useLocation } from "react-router-dom";
import { Layout, Database, ClipboardList, FileText, InboxIcon, LayoutDashboard, MessageSquare, Settings, Users, GitBranch, Award, Scale, LogOut } from "lucide-react";
import { SchemaDefinitionsManager } from "./SchemaDefinitionsManager";
import { AuditLogViewer } from "./AuditLogViewer";
import { CreateTicketForm } from "./CreateTicketForm";
import { TicketQueueList } from "./TicketQueueList";
import { TicketDetailThread } from "./TicketDetailThread";
import { AgentDashboard } from "./AgentDashboard";
import { TemplateManagementPanel } from "./TemplateManagementPanel";
import { DeveloperIntegrationSettings } from "./DeveloperIntegrationSettings";
import { TeamManagementConsole } from "./TeamManagementConsole";
import { RoutingRuleList } from "./RoutingRuleList";
import { SkillsetsPanel } from "./SkillsetsPanel";
import { LoadBalancingSettings } from "./LoadBalancingSettings";
import { TeamAdminPanel } from "./TeamAdminPanel";
import { useAuth } from './hooks/useAuth';
import { useEmployeeRole } from './hooks/useEmployeeRole';

const NavLink = ({
  to,
  children
}: {
  to: string;
  children: React.ReactNode;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return <Link to={to} className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700"}`}>
      {children}
    </Link>;
};

export const DataManagementAdminPanel = () => {
  const { signOut } = useAuth();
  const { role, loading } = useEmployeeRole();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAdmin = role === 'admin';
  const isSupervisor = role === 'supervisor';
  const isAgent = role === 'agent';

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 h-full overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-8">
            <Layout className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">AutoCRM</h1>
          </div>
          <nav className="space-y-6">
            {/* Agent Tools - Available to all roles */}
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Agent Tools
              </div>
              <div className="space-y-1">
                <NavLink to="/dashboard">
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </NavLink>
                <NavLink to="/tickets">
                  <InboxIcon className="h-5 w-5" />
                  Ticket Queue
                </NavLink>
                <NavLink to="/templates">
                  <MessageSquare className="h-5 w-5" />
                  Response Templates
                </NavLink>
              </div>
            </div>

            {/* Team Management - Available to supervisors only */}
            {isSupervisor && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Team Management
                </div>
                <div className="space-y-1">
                  <NavLink to="/team">
                    <Users className="h-5 w-5" />
                    My Team
                  </NavLink>
                  <NavLink to="/skills">
                    <Award className="h-5 w-5" />
                    Skillsets
                  </NavLink>
                  <NavLink to="/load-balancing">
                    <Scale className="h-5 w-5" />
                    Load Balancing
                  </NavLink>
                </div>
              </div>
            )}

            {/* Administration - Only available to admins */}
            {isAdmin && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Administration
                </div>
                <div className="space-y-1">
                  <NavLink to="/admin/teams">
                    <Users className="h-5 w-5" />
                    Teams
                  </NavLink>
                  <NavLink to="/routing">
                    <GitBranch className="h-5 w-5" />
                    Routing Rules
                  </NavLink>
                  <NavLink to="/schema">
                    <Database className="h-5 w-5" />
                    Schema Definitions
                  </NavLink>
                  <NavLink to="/audit">
                    <ClipboardList className="h-5 w-5" />
                    Audit Log
                  </NavLink>
                  <NavLink to="/create-ticket">
                    <FileText className="h-5 w-5" />
                    Create Ticket
                  </NavLink>
                  <NavLink to="/developer">
                    <Settings className="h-5 w-5" />
                    Developer Settings
                  </NavLink>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 py-2 w-full text-left rounded-md hover:bg-gray-50 text-gray-700"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<AgentDashboard />} />
            <Route path="/tickets" element={<TicketQueueList />} />
            <Route path="/tickets/:id" element={<TicketDetailThread />} />
            <Route path="/templates" element={<TemplateManagementPanel />} />
            
            {/* Protected routes for supervisors only */}
            {isSupervisor && (
              <>
                <Route path="/team" element={<TeamManagementConsole />} />
                <Route path="/skills" element={<SkillsetsPanel />} />
                <Route path="/load-balancing" element={<LoadBalancingSettings />} />
              </>
            )}

            {/* Protected routes for admins only */}
            {isAdmin && (
              <>
                <Route path="/admin/teams" element={<TeamAdminPanel />} />
                <Route path="/routing" element={<RoutingRuleList />} />
                <Route path="/schema" element={<SchemaDefinitionsManager />} />
                <Route path="/audit" element={<AuditLogViewer />} />
                <Route path="/create-ticket" element={<CreateTicketForm />} />
                <Route path="/developer" element={<DeveloperIntegrationSettings />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </div>
  );
};