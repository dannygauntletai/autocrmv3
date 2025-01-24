import { Route, Routes } from "react-router-dom";
import { CustomerHome } from "./CustomerHome";
import { CreateTicketForm } from "../CreateTicketForm";
import { CustomerTicketDetail } from "./CustomerTicketDetail";
import { AIChatbot } from "./AIChatbot";
export const CustomerDashboard = () => {
  return <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<CustomerHome />} />
          <Route path="/create-ticket" element={<CreateTicketForm />} />
          <Route path="/tickets/:id" element={<CustomerTicketDetail />} />
        </Routes>
      </div>
      <AIChatbot />
    </div>;
};