import { Route, Routes, Navigate, useNavigate, useLocation } from "react-router-dom";
import { CustomerSidebar } from "./CustomerSidebar";
import { CustomerHome } from "./CustomerHome";
import { CreateTicketForm } from "../CreateTicketForm";
import { CustomerTicketDetail } from "./CustomerTicketDetail";
import { KnowledgeBase } from "./KnowledgeBase";
import { supabase } from "../lib/supabaseClient";
import { useEffect } from "react";

// Feedback submission component
const FeedbackSubmission = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleFeedback = async () => {
      try {
        // Get feedback ID and token from URL
        const pathParts = window.location.pathname.split('/');
        const feedbackId = pathParts[pathParts.length - 2];
        const rating = pathParts[pathParts.length - 1];
        const token = new URLSearchParams(window.location.search).get('token');

        if (!feedbackId || !rating || !token) {
          throw new Error('Missing required parameters');
        }

        // Verify token and update feedback
        const { data: feedback, error: feedbackError } = await supabase
          .from('feedback')
          .select('*')
          .eq('id', feedbackId)
          .eq('token', token)
          .single();

        if (feedbackError || !feedback) {
          throw new Error('Invalid feedback token');
        }

        // Check if feedback has expired
        if (new Date(feedback.expires_at) < new Date()) {
          throw new Error('Feedback link has expired');
        }

        // Update feedback with rating
        const { error: updateError } = await supabase
          .from('feedback')
          .update({
            rating: parseInt(rating),
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', feedbackId)
          .eq('token', token);

        if (updateError) {
          throw updateError;
        }

        // Store customer email temporarily for the thank you page
        if (feedback.customer_email) {
          sessionStorage.setItem('tempCustomerEmail', feedback.customer_email);
        }

        // Redirect to thank you page
        navigate('/customer/feedback/thank-you');
      } catch (error) {
        console.error('Error submitting feedback:', error);
        navigate('/customer/feedback/error');
      }
    };

    handleFeedback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
};

// Feedback result pages
const FeedbackThankYou = () => {
  const navigate = useNavigate();
  const tempEmail = sessionStorage.getItem('tempCustomerEmail');

  useEffect(() => {
    // Clean up temp email after showing the page
    return () => sessionStorage.removeItem('tempCustomerEmail');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white shadow rounded-lg">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Thank You for Your Feedback!</h2>
          <p className="text-gray-600 mb-6">Your response has been recorded and helps us improve our service.</p>
          {tempEmail && (
            <button
              onClick={() => navigate('/customer/login')}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Your Tickets
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const FeedbackError = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white shadow rounded-lg">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Unable to Process Feedback</h2>
          <p className="text-gray-600 mb-6">
            We couldn't process your feedback at this time. This could be because the link has expired or is invalid.
          </p>
          <p className="text-gray-600">
            If you continue to experience issues, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export const CustomerPanel = () => {
  const location = useLocation();
  const customerEmail = sessionStorage.getItem('customerEmail');
  
  // Allow feedback routes without login
  const isFeedbackRoute = location.pathname.includes('/feedback/');
  if (!customerEmail && !isFeedbackRoute) {
    return <Navigate to="/customer/login" replace />;
  }

  // For feedback routes, show without sidebar
  if (isFeedbackRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/feedback/submit/:id/:rating" element={<FeedbackSubmission />} />
          <Route path="/feedback/thank-you" element={<FeedbackThankYou />} />
          <Route path="/feedback/error" element={<FeedbackError />} />
        </Routes>
      </div>
    );
  }

  // Normal customer panel with sidebar
  return (
    <div className="flex h-screen w-full bg-gray-50">
      <CustomerSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<CustomerHome />} />
            <Route path="/new-ticket" element={<CreateTicketForm />} />
            <Route path="/tickets/:id" element={<CustomerTicketDetail />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};