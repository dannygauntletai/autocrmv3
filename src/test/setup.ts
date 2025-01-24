/// <reference types="vitest/globals" />
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock Supabase client
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn()
    }
  }
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
}); 