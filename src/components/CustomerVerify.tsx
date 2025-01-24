import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export const CustomerVerify = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNameForm, setShowNameForm] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    const verifyCustomer = async () => {
      try {
        // Get email from URL parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const email = hashParams.get("email");

        if (!email) {
          throw new Error("No email found in verification link");
        }
        
        // Check if customer exists in customers table
        const { data: existingCustomer, error: customerError } = await supabase
          .from('customers')
          .select('name, email')
          .eq('email', email)
          .single();

        if (customerError && customerError.code !== 'PGRST116') {
          // If it's not a "not found" error, throw it
          throw customerError;
        }

        if (existingCustomer) {
          // Customer exists, store email and proceed
          sessionStorage.setItem('customerEmail', email);
          sessionStorage.setItem('customerName', existingCustomer.name);
          navigate('/customer');
        } else {
          // Store email temporarily
          sessionStorage.setItem('customerEmail', email);
          // Customer doesn't exist, show name form
          setShowNameForm(true);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    verifyCustomer();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const email = sessionStorage.getItem('customerEmail');
      if (!email) throw new Error("No email found");

      // Insert new customer
      const { error: insertError } = await supabase
        .from("customers")
        .insert([{ email, name }]);

      if (insertError) throw insertError;

      // Store customer info
      sessionStorage.setItem('customerName', name);
      navigate('/customer');

    } catch (err: any) {
      console.error("Error creating customer:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Verifying...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!showNameForm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Checking customer status...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Please enter your full name
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="sr-only">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 