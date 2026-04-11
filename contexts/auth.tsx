import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { unregisterAllGeofences } from '../lib/geofence';
import type { Session } from '@supabase/supabase-js';
import type { UserRole } from '../lib/types';

interface AuthState {
  session: Session | null;
  role: UserRole | null;
  isLoading: boolean;
  isNewUser: boolean;
  approvalStatus: string | null;
  isBanned: boolean;
  signInWithOtp: (phone: string) => Promise<{ error: string | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  setUserRole: (role: UserRole) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  role: null,
  isLoading: true,
  isNewUser: false,
  approvalStatus: null,
  isBanned: false,
  signInWithOtp: async () => ({ error: null }),
  verifyOtp: async () => ({ error: null }),
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  setUserRole: async () => ({ error: null }),
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function useProtectedRoute(session: Session | null, role: UserRole | null, isLoading: boolean, isNewUser: boolean, approvalStatus: string | null, isBanned: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!segments.length) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Not logged in and outside auth → go to auth
      router.replace('/(auth)');
    } else if (!session && inAuthGroup) {
      // Not logged in but inside auth → go to login page
      const currentScreen = segments[1] || 'index';
      if (currentScreen !== 'index') {
        router.replace('/(auth)');
      }
    } else if (session && !inAuthGroup) {
      // User is outside auth group — verify they have a role
      if (!role) {
        // No role yet → send to role selection
        router.replace('/(auth)/role-select');
      } else if (isBanned) {
        // Customer is banned → send to banned screen
        router.replace('/(auth)/account-suspended');
      } else if (role === 'provider' && approvalStatus === 'rejected') {
        // Provider was suspended → send to banned screen
        router.replace('/(auth)/account-suspended');
      }
      // If they have a role and are not banned, let them stay where they are
    } else if (session && inAuthGroup) {
      // Determine the current auth sub-screen
      const currentScreen = segments[1] || 'index';

      if (isNewUser || (!role && !isLoading)) {
        // New user OR user without a role → guide to role selection
        if (currentScreen === 'index' || currentScreen === 'otp-verify') {
          router.replace('/(auth)/role-select');
        }
        // Let them stay on role-select, provider-signup, pending-approval
      } else if (isBanned || (role === 'provider' && approvalStatus === 'rejected')) {
        // Banned customer or suspended provider → show banned screen
        if (currentScreen !== 'account-suspended') {
          router.replace('/(auth)/account-suspended');
        }
      } else if (role === 'provider' && approvalStatus === 'pending') {
        router.replace('/(auth)/pending-approval');
      } else if (role === 'customer') {
        router.replace('/(customer)/feed');
      } else if (role === 'provider' && approvalStatus === 'approved') {
        router.replace('/(provider)/dashboard');
      }
    }
  }, [session, role, isLoading, isNewUser, approvalStatus, isBanned, segments]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [isBanned, setIsBanned] = useState(false);

  // Fetch user role from database
  const fetchUserRole = useCallback(async (userId: string, sessionCreatedAt?: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Distinguish new user from deleted user: if auth account is older
      // than 5 minutes but has no role data, the user was deleted — sign out.
      if (sessionCreatedAt) {
        const accountAge = Date.now() - new Date(sessionCreatedAt).getTime();
        if (accountAge > 5 * 60 * 1000) {
          await supabase.auth.signOut();
          setSession(null);
          setRole(null);
          setIsNewUser(false);
          setApprovalStatus(null);
          setIsBanned(false);
          return;
        }
      }
      setIsNewUser(true);
      setRole(null);
      setIsBanned(false);
      return;
    }

    setRole(data.role as UserRole);
    setIsNewUser(false);

    // If provider, check approval status
    if (data.role === 'provider') {
      const { data: providerData } = await supabase
        .from('provider_profiles')
        .select('approval_status')
        .eq('user_id', userId)
        .single();

      setApprovalStatus(providerData?.approval_status || null);
      setIsBanned(false);
    }

    // If customer, check ban status
    if (data.role === 'customer') {
      const { data: customerData } = await supabase
        .from('customer_profiles')
        .select('is_banned')
        .eq('user_id', userId)
        .single();

      setIsBanned(customerData?.is_banned || false);
      setApprovalStatus(null);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);

        if (currentSession?.user) {
          await fetchUserRole(currentSession.user.id, currentSession.user.created_at);
        }
      } catch (err: any) {
        // Refresh token is invalid or expired — clear stale session and send user to login
        console.warn('[Auth] Session restore failed:', err?.message);
        await supabase.auth.signOut();
        setSession(null);
        setRole(null);
        setIsNewUser(false);
        setApprovalStatus(null);
        setIsBanned(false);
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // If the SDK fires SIGNED_OUT due to a failed token refresh, clean up state
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setRole(null);
          setIsNewUser(false);
          setApprovalStatus(null);
          setIsBanned(false);
          return;
        }

        if (newSession?.user) {
          setIsLoading(true);
          setSession(newSession);
          await fetchUserRole(newSession.user.id, newSession.user.created_at);
          setIsLoading(false);
        } else {
          setSession(newSession);
          setRole(null);
          setIsNewUser(false);
          setApprovalStatus(null);
          setIsBanned(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserRole]);

  // Send OTP
  const signInWithOtp = useCallback(async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error: error?.message || null };
  }, []);

  // Verify OTP
  const verifyOtp = useCallback(async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    return { error: error?.message || null };
  }, []);

  // Email sign-in (for dev/testing without Twilio)
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  }, []);

  // Email sign-up (for dev/testing without Twilio)
  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // If email confirmation is disabled, the user is immediately signed in
    if (data.session) {
      setSession(data.session);
      // Mark as new user so they get redirected to role selection
      setIsNewUser(true);
      setRole(null);
    }
    return { error: null };
  }, []);

  // Set role after signup
  const setUserRole = useCallback(async (newRole: UserRole) => {
    const userId = session?.user?.id;
    if (!userId) return { error: 'Not authenticated' };

    // Upsert into user_roles (handles re-selection / duplicate key)
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id' });

    if (roleError) return { error: roleError.message };

    // Create profile based on role
    if (newRole === 'customer') {
      const { error: profileError } = await supabase
        .from('customer_profiles')
        .upsert({ user_id: userId }, { onConflict: 'user_id' });

      if (profileError) return { error: profileError.message };
    }

    setRole(newRole);
    setIsNewUser(false);
    return { error: null };
  }, [session]);

  // Sign out
  const handleSignOut = useCallback(async () => {
    await unregisterAllGeofences();
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
    setIsNewUser(false);
    setApprovalStatus(null);
    setIsBanned(false);
  }, []);

  useProtectedRoute(session, role, isLoading, isNewUser, approvalStatus, isBanned);

  return (
    <AuthContext.Provider
      value={{
        session,
        role,
        isLoading,
        isNewUser,
        approvalStatus,
        isBanned,
        signInWithOtp,
        verifyOtp,
        signInWithEmail,
        signUpWithEmail,
        setUserRole,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
