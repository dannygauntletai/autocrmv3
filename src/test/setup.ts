/// <reference types="vitest/globals" />
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock environment variables
const env = {
  VITE_SUPABASE_URL: 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key'
};

// Mock import.meta.env
vi.mock('vite', () => ({
  defineConfig: (config: any) => config
}));

// @ts-ignore
globalThis.import = { meta: { env } };

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null
    }),
    BrowserRouter: ({ children }: { children: React.ReactNode }) => children
  };
});

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