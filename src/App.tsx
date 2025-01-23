import { useAuth } from './hooks/useAuth';
import { DataManagementAdminPanel } from "./DataManagementAdminPanel";

export function App() {
  const { user, loading, error, signInAnonymously } = useAuth();

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

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <button
          onClick={signInAnonymously}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Continue as Guest
        </button>
      </div>
    );
  }

  return <DataManagementAdminPanel />;
}