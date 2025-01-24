import { Route, Routes, Navigate } from "react-router-dom";
import { CustomerSidebar } from "./CustomerSidebar";
import { CustomerHome } from "./CustomerHome";
import { CreateTicketForm } from "../CreateTicketForm";
import { CustomerTicketDetail } from "./CustomerTicketDetail";
import { KnowledgeBase } from "./KnowledgeBase";

export const CustomerPanel = () => {
  // Check if customer email exists
  const customerEmail = sessionStorage.getItem('customerEmail');
  if (!customerEmail) {
    return <Navigate to="/customer/login" replace />;
  }

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