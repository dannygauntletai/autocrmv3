import { useAuth } from './hooks/useAuth';
import { DataManagementAdminPanel } from "./DataManagementAdminPanel";
import { LoginPanel } from './components/LoginPanel';
import { CustomerLoginPanel } from './components/CustomerLoginPanel';
import { CustomerPanel } from './customers/CustomerPanel';
import { CustomerVerify } from './customers/CustomerVerify';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

export function App() {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Customer routes - separate flow from admin/agent auth */}
        <Route path="/customer/login" element={<CustomerLoginPanel />} />
        <Route path="/customer/verify" element={<CustomerVerify />} />
        <Route path="/customer/*" element={<CustomerPanel />} />
        
        {/* Main route for admin/agent login and dashboard */}
        <Route path="/" element={!user ? <LoginPanel /> : <DataManagementAdminPanel />} />
        <Route path="/*" element={!user ? <LoginPanel /> : <DataManagementAdminPanel />} />
      </Routes>
    </Router>
  );
}