import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PlusCircle, BookOpen, LogOut, Layout, MessageSquare, Clock } from "lucide-react";

const NavLink = ({
  to,
  children
}: {
  to: string;
  children: React.ReactNode;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 ${
        isActive ? "bg-blue-50 text-blue-600" : "text-gray-700"
      }`}
    >
      {children}
    </Link>
  );
};

export const CustomerSidebar = () => {
  const navigate = useNavigate();
  
  const handleSignOut = () => {
    sessionStorage.removeItem('customerEmail');
    navigate('/customer/login');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 h-full overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-8">
          <Layout className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Support Portal</h1>
        </div>
        <nav className="space-y-6">
          <div className="space-y-1">
            <NavLink to="/customer/new-ticket">
              <PlusCircle className="h-5 w-5" />
              New Ticket
            </NavLink>
            <NavLink to="/customer">
              <Clock className="h-5 w-5" />
              History
            </NavLink>
            <NavLink to="/customer/knowledge-base">
              <BookOpen className="h-5 w-5" />
              Knowledge Base
            </NavLink>
          </div>
          
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 w-full text-left rounded-md hover:bg-gray-50 text-gray-700"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};