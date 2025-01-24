import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export const CustomerVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [needsName, setNeedsName] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [submittingName, setSubmittingName] = useState(false);

  useEffect(() => {
    const verifyOtp = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        // If no session, check for access token in URL
        if (!session) {
          const accessToken = searchParams.get('access_token');
          if (!accessToken) {
            throw new Error('No verification token found');
          }

          // Set the access token
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: '',
          });
          if (setSessionError) throw setSessionError;
        }

        // Get user email from session
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user?.email) throw new Error('No email found in verification');

        setEmail(user.email);

        // Check if customer exists
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id, name')
          .eq('email', user.email)
          .single();

        if (customerError && customerError.code !== 'PGRST116') {
          throw customerError;
        }

        if (!customer) {
          // New customer needs to enter their name
          setNeedsName(true);
          return;
        }

        // Existing customer, store email and name
        sessionStorage.setItem('customerEmail', user.email);
        sessionStorage.setItem('customerName', customer.name);

        // Sign out from temporary auth (we don't want to keep the auth session)
        await supabase.auth.signOut();

        navigate('/customer');

      } catch (err: any) {
        console.error('Verification error:', err);
        setError(err.message || 'Failed to verify email');
      }
    };

    verifyOtp();
  }, [navigate, searchParams]);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setSubmittingName(true);
      
      // Create new customer record
      const { error: insertError } = await supabase
        .from('customers')
        .insert([{ email, name }]);

      if (insertError) throw insertError;

      // Store email and name
      sessionStorage.setItem('customerEmail', email);
      sessionStorage.setItem('customerName', name);

      // Sign out from temporary auth
      await supabase.auth.signOut();

      navigate('/customer');

    } catch (err: any) {
      console.error('Error creating customer:', err);
      setError(err.message || 'Failed to create customer profile');
      setSubmittingName(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-800">Verification Failed</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={() => navigate('/customer/login')}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (needsName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Welcome to Support Portal</h2>
            <p className="text-sm text-gray-600 mb-6">
              Please enter your full name to complete your registration.
            </p>
            <form onSubmit={handleNameSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled={submittingName}
                />
              </div>
              <button
                type="submit"
                disabled={submittingName}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {submittingName ? 'Creating Profile...' : 'Complete Registration'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="mt-4 text-center text-sm text-gray-600">
            Verifying your email...
          </p>
        </div>
      </div>
    </div>
  );
}; 