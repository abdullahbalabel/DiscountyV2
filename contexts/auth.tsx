import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { supabase, supabaseUrl } from '../lib/supabase';
import { unregisterAllGeofences } from '../lib/geofence';
import type { Session } from '@supabase/supabase-js';
import type { UserRole } from '../lib/types';

interface MaintenanceStatus {
  is_enabled: boolean;
  message_title: string;
  message_body: string;
  estimated_duration: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
}

const MAINTENANCE_EDGE_FUNCTION_URL = `${supabaseUrl}/functions/v1/check-maintenance`;

interface AuthState {
  session: Session | null;
  role: UserRole | null;
  isLoading: boolean;
  isNewUser: boolean;
  approvalStatus: string | null;
  isBanned: boolean;
  isMaintenanceActive: boolean;
  maintenanceTitle: string | null;
  maintenanceMessage: string | null;
  maintenanceDuration: string | null;
  refreshMaintenanceStatus: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithApple: () => Promise<{ error: string | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: string | null }>;
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
  isMaintenanceActive: false,
  maintenanceTitle: null,
  maintenanceMessage: null,
  maintenanceDuration: null,
  refreshMaintenanceStatus: async () => {},
  signInWithGoogle: async () => ({ error: null }),
  signInWithApple: async () => ({ error: null }),
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  setUserRole: async () => ({ error: null }),
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function useProtectedRoute(session: Session | null, role: UserRole | null, isLoading: boolean, isNewUser: boolean, approvalStatus: string | null, isBanned: boolean, isMaintenanceActive: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!segments.length) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentScreen = segments[1] || 'index';

    // Maintenance takes priority over all other redirects (HC-02, HC-05)
    if (isMaintenanceActive && currentScreen !== 'maintenance') {
      router.replace('/(auth)/maintenance');
      return;
    }

    // If maintenance is active and user is on maintenance screen, stay there
    if (isMaintenanceActive && currentScreen === 'maintenance') {
      return;
    }

    // If maintenance just ended and user is on maintenance screen, redirect appropriately
    if (!isMaintenanceActive && currentScreen === 'maintenance') {
      if (session && role) {
        if (role === 'customer') {
          router.replace('/(customer)/feed');
        } else if (role === 'provider' && approvalStatus === 'approved') {
          router.replace('/(provider)/dashboard');
        }
      } else if (!session) {
        router.replace('/(auth)');
      }
      return;
    }

    if (!session && !inAuthGroup) {
      // Not logged in and outside auth → go to welcome
      router.replace('/(auth)');
    } else if (!session && inAuthGroup) {
      // Not logged in but inside auth → allow welcome, sign-in, sign-up, forgot-password
      const allowedScreens = ['index', 'sign-in', 'sign-up', 'forgot-password'];
      if (!allowedScreens.includes(currentScreen)) {
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
      if (isNewUser || (!role && !isLoading)) {
        // New user OR user without a role → guide to role selection
        const authScreens = ['index', 'sign-in', 'sign-up', 'forgot-password'];
        if (authScreens.includes(currentScreen)) {
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
  }, [session, role, isLoading, isNewUser, approvalStatus, isBanned, isMaintenanceActive, segments]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [maintenanceTitle, setMaintenanceTitle] = useState<string | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string | null>(null);
  const [maintenanceDuration, setMaintenanceDuration] = useState<string | null>(null);

  // Temporarily store name fields from signUpWithEmail for use in setUserRole
  const pendingSignUpName = useRef<{ firstName: string; lastName: string } | null>(null);

  // Keep a ref to session for use in callbacks without stale closures
  const sessionRef = useRef<Session | null>(null);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // Check maintenance status from Edge Function
  const checkMaintenanceStatus = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(MAINTENANCE_EDGE_FUNCTION_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        // Edge Function error — don't block app, assume no maintenance
        return false;
      }

      const data: MaintenanceStatus = await response.json();
      const wasActive = isMaintenanceActive;
      setIsMaintenanceActive(data.is_enabled);
      setMaintenanceTitle(data.message_title || null);
      setMaintenanceMessage(data.message_body || null);
      setMaintenanceDuration(data.estimated_duration || null);

      // If maintenance just ended and we have a session but no role yet, fetch role
      // Uses sessionRef to avoid stale closures during init
      const currentSession = sessionRef.current;
      if (wasActive && !data.is_enabled && currentSession?.user && !role) {
        await fetchUserRole(currentSession.user.id, currentSession.user.created_at);
      }

      return data.is_enabled;
    } catch {
      // Network error — don't block app, assume no maintenance
      return false;
    }
  }, [isMaintenanceActive, role, fetchUserRole]);

  // Exposed for "Try Again" button on maintenance screen
  const refreshMaintenanceStatus = useCallback(async () => {
    await checkMaintenanceStatus();
  }, [checkMaintenanceStatus]);

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
        // Check maintenance before role fetch (HC-02, FR-05)
        const maintenanceActive = await checkMaintenanceStatus();

        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);

        // Only fetch role if maintenance is not active (avoid unnecessary work)
        if (currentSession?.user && !maintenanceActive) {
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
  }, [fetchUserRole, checkMaintenanceStatus]);

  // Re-check maintenance when app returns to foreground (FR-05)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkMaintenanceStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [checkMaintenanceStatus]);

  // Google sign-in (temporarily disabled — missing iosUrlScheme config)
  const signInWithGoogle = useCallback(async () => {
    return { error: 'Google sign-in is temporarily unavailable' };
    // try {
    //   await GoogleSignin.signIn();
    //   const { idToken } = await GoogleSignin.getTokens();
    //   if (!idToken) return { error: 'Failed to get Google ID token' };
    //   const { error } = await supabase.auth.signInWithIdToken({
    //     provider: 'google',
    //     token: idToken,
    //   });
    //   return { error: error?.message || null };
    // } catch (err: any) {
    //   // User cancelled — not an error
    //   if (err?.code === 'SIGN_IN_CANCELLED') return { error: null };
    //   return { error: err?.message || 'Google sign-in failed' };
    // }
  }, []);

  // Apple sign-in (temporarily disabled)
  const signInWithApple = useCallback(async () => {
    return { error: 'Apple sign-in is temporarily unavailable' };
  }, []);

  // Email sign-in
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  }, []);

  // Email sign-up with name fields
  const signUpWithEmail = useCallback(async (email: string, password: string, firstName: string, lastName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // Store name for setUserRole to consume
    pendingSignUpName.current = { firstName, lastName };
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
      const nameData = pendingSignUpName.current;
      const firstName = nameData?.firstName || null;
      const lastName = nameData?.lastName || null;
      const displayName = firstName && lastName ? `${firstName} ${lastName}` : null;

      const { error: profileError } = await supabase
        .from('customer_profiles')
        .upsert({
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
          display_name: displayName,
        }, { onConflict: 'user_id' });

      if (profileError) return { error: profileError.message };
      pendingSignUpName.current = null;
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

  useProtectedRoute(session, role, isLoading, isNewUser, approvalStatus, isBanned, isMaintenanceActive);

  return (
    <AuthContext.Provider
      value={{
        session,
        role,
        isLoading,
        isNewUser,
        approvalStatus,
        isBanned,
        isMaintenanceActive,
        maintenanceTitle,
        maintenanceMessage,
        maintenanceDuration,
        refreshMaintenanceStatus,
        signInWithGoogle,
        signInWithApple,
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
