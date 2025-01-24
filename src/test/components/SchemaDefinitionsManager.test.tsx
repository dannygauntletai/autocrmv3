import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SchemaDefinitionsManager } from '../../SchemaDefinitionsManager';
import { supabase } from '../../lib/supabaseClient';

// Mock the supabase client
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}));

describe('SchemaDefinitionsManager', () => {
  const mockSchemaFields = [
    {
      id: '1',
      field_name: 'customer_type',
      field_type: 'text',
      is_required: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockResolvedValue({ data: mockSchemaFields, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null })
    }));
  });

  it('renders schema fields list', async () => {
    render(<SchemaDefinitionsManager />);
    
    // Check for the header
    expect(screen.getByText('Schema Definitions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add field/i })).toBeInTheDocument();
  });

  it('opens add field modal when clicking add button', async () => {
    render(<SchemaDefinitionsManager />);

    const addButton = screen.getByRole('button', { name: /add field/i });
    fireEvent.click(addButton);

    expect(screen.getByText('Add Schema Field')).toBeInTheDocument();
    expect(screen.getByText('Field Name')).toBeInTheDocument();
    expect(screen.getByText('Field Type')).toBeInTheDocument();
  });

  it('handles errors when fetching schema fields', async () => {
    const mockError = { message: 'Failed to fetch schema fields' };
    
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }));

    render(<SchemaDefinitionsManager />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
}); 