import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../utils/test-utils';
import { CreateTicketForm } from '../../CreateTicketForm';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(),
    insert: vi.fn(),
  })),
};

vi.mock('../../utils/supabaseClient', () => ({
  supabase: mockSupabase,
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('CreateTicketForm', () => {
  it('renders form fields correctly', () => {
    render(<CreateTicketForm />);
    
    // Check if all form elements are present
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create ticket/i })).toBeInTheDocument();
  });

  it('validates required fields', () => {
    render(<CreateTicketForm />);
    
    // Try to submit without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /create ticket/i }));
    
    // Check if HTML5 validation prevents submission
    expect(screen.getByLabelText(/email/i)).toBeInvalid();
  });
});
