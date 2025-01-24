import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBulkTicketOperations } from '../../hooks/useBulkTicketOperations';
import { PostgrestResponse } from '@supabase/supabase-js';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

// Import after mock
import { supabase } from '../../lib/supabase';

// Create a success response
const createSuccessResponse = () => ({
  data: null,
  error: null,
  count: null,
  status: 200,
  statusText: 'OK'
}) as unknown as PostgrestResponse<null>;

describe('useBulkTicketOperations', () => {
  const mockUpdate = vi.fn();
  const mockInsert = vi.fn();
  const mockIn = vi.fn();
  const mockIs = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockUpdate.mockReturnValue({ in: mockIn });
    mockIn.mockReturnValue({ is: mockIs });
    mockIs.mockResolvedValue(createSuccessResponse());
    mockInsert.mockResolvedValue(createSuccessResponse());

    // Mock the Supabase client
    (supabase.from as any).mockReturnValue({
      update: mockUpdate,
      insert: mockInsert
    });
  });

  const { updateTicketsStatus, updateTicketsPriority, assignTicketsToEmployee } = useBulkTicketOperations();
  const mockTicketIds = ['ticket1', 'ticket2'];

  describe('updateTicketsStatus', () => {
    it('should update status for multiple tickets', async () => {
      await updateTicketsStatus(mockTicketIds, 'open');
      
      expect(supabase.from).toHaveBeenCalledWith('tickets');
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'open',
        updated_at: expect.any(String)
      });
      expect(mockIn).toHaveBeenCalledWith('id', mockTicketIds);
    });
  });

  describe('updateTicketsPriority', () => {
    it('should update priority for multiple tickets', async () => {
      await updateTicketsPriority(mockTicketIds, 'high');
      
      expect(supabase.from).toHaveBeenCalledWith('tickets');
      expect(mockUpdate).toHaveBeenCalledWith({
        priority: 'high',
        updated_at: expect.any(String)
      });
      expect(mockIn).toHaveBeenCalledWith('id', mockTicketIds);
    });
  });

  describe('assignTicketsToEmployee', () => {
    it('should unassign tickets first', async () => {
      await assignTicketsToEmployee(mockTicketIds, 'emp1');
      
      expect(supabase.from).toHaveBeenCalledWith('employee_ticket_assignments');
      expect(mockUpdate).toHaveBeenCalledWith({
        unassigned_at: expect.any(String)
      });
      expect(mockIn).toHaveBeenCalledWith('ticket_id', mockTicketIds);
    });

    it('should create new assignments when employeeId is provided', async () => {
      await assignTicketsToEmployee(mockTicketIds, 'emp1');
      
      expect(supabase.from).toHaveBeenCalledWith('employee_ticket_assignments');
      expect(mockInsert).toHaveBeenCalledWith(
        mockTicketIds.map(ticketId => ({
          ticket_id: ticketId,
          employee_id: 'emp1',
          assigned_at: expect.any(String)
        }))
      );
    });

    it('should only unassign when employeeId is "unassigned"', async () => {
      await assignTicketsToEmployee(mockTicketIds, 'unassigned');
      
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });
}); 