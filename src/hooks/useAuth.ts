import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state with session check
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInAnonymously = async () => {
    try {
      setLoading(true);
      setError(null);

      // Only try to sign in if we don't already have a session
      if (!user) {
        // First try to sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'danny.mota@gauntletai.com',
          password: 'guest123!@#'
        });

        // If sign in fails due to no account, create one
        if (signInError?.message === 'Invalid login credentials') {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: 'danny.mota@gauntletai.com',
            password: 'guest123!@#',
            options: {
              data: {
                display_name: 'Danny Mota'
              }
            }
          });

          if (signUpError) throw signUpError;
          setUser(signUpData.user);
          return;
        }

        // If it was a different error, throw it
        if (signInError) throw signInError;
        
        // Sign in succeeded
        setUser(signInData.user);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setUser(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signInAnonymously,
    signOut
  };
}; 