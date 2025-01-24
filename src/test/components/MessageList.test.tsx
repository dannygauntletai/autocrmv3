import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';

// Mock Supabase client
vi.mock('../../lib/supabaseClient', async () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 1,
              message_body: 'Test message 1',
              created_at: '2023-01-01T16:00:00',
              is_internal: false,
              sender_id: '1',
              sender_type: 'employee',
            },
            {
              id: 2,
              message_body: 'Test message 2',
              created_at: '2023-01-02T16:00:00',
              is_internal: true,
              sender_id: '2',
              sender_type: 'employee',
            },
          ],
          error: null,
        }),
      }),
      url: new URL('http://mock-url.com'),
      headers: {},
      insert: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
    channel: vi.fn().mockImplementation(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({
        unsubscribe: vi.fn(),
      }),
      topic: 'test-topic',
      params: {},
      socket: {},
      bindings: [],
      state: 'SUBSCRIBED',
      presence: { state: {} },
      unsubscribe: vi.fn(),
      track: vi.fn(),
      untrack: vi.fn(),
      on_error: vi.fn(),
      on_close: vi.fn(),
      on_open: vi.fn(),
      trigger: vi.fn(),
      send: vi.fn(),
      push: vi.fn(),
      leave: vi.fn(),
      receive: vi.fn(),
      reset: vi.fn(),
      rejoin: vi.fn(),
    })),
  },
}));

import { supabase } from '../../lib/supabaseClient';
import { MessageList } from '../../MessageList';

describe('MessageList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock sessionStorage
    const mockSessionStorage = {
      getItem: vi.fn((key) => {
        if (key === 'customerEmail') return null;
        if (key === 'customerName') return 'Test Customer';
        return null;
      }),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
    });
  });

  it('handles loading state correctly', () => {
    // Mock loading state by returning a never-resolving promise
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnValue(new Promise(() => { /* pending */ })),
      }),
      url: new URL('http://mock-url.com'),
      headers: {},
      insert: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }));

    render(<MessageList ticketId="123" />);
    expect(screen.getByText(/loading messages/i)).toBeInTheDocument();
  });

  it('handles error state correctly', async () => {
    // Mock error response
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Failed to load messages' },
        }),
      }),
      url: new URL('http://mock-url.com'),
      headers: {},
      insert: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }));

    render(<MessageList ticketId="123" />);

    await waitFor(() => {
      expect(screen.getByText(/error loading messages/i)).toBeInTheDocument();
    });
  });

  it('sets up and cleans up real-time subscription', () => {
    const unsubscribeMock = vi.fn();
    const channelMock = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({
        unsubscribe: unsubscribeMock,
      }),
      topic: 'test-topic',
      params: {},
      socket: {},
      bindings: [],
      state: 'SUBSCRIBED',
      presence: { state: {} },
      unsubscribe: vi.fn(),
      track: vi.fn(),
      untrack: vi.fn(),
      on_error: vi.fn(),
      on_close: vi.fn(),
      on_open: vi.fn(),
      trigger: vi.fn(),
      send: vi.fn(),
      push: vi.fn(),
      leave: vi.fn(),
      receive: vi.fn(),
      reset: vi.fn(),
      rejoin: vi.fn(),
      timeout: 10000,
      joinedOnce: false,
      joinPush: { receive: vi.fn() },
      rejoinTimer: { scheduleTimeout: vi.fn() },
      stateChangeRefs: [],
      ref: 0,
      refEvent: null,
      accessToken: null,
      broadcast: { ack: vi.fn() },
      pushBuffer: [],
      broadcastEndpointURL: 'http://localhost:54321',
      subTopic: 'test-subtopic',
      private: false,
      config: {},
      serializeMessage: vi.fn(),
      presenceState: () => ({}),
      updateJoinPayload: vi.fn()
    } as any; // Type assertion needed since RealtimeChannel has complex internal types

    vi.mocked(supabase.channel).mockReturnValueOnce(channelMock);

    const { unmount } = render(<MessageList ticketId="123" />);

    expect(supabase.channel).toHaveBeenCalledWith('ticket_messages:123');
    expect(channelMock.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages',
      }),
      expect.any(Function)
    );

    unmount();
    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
