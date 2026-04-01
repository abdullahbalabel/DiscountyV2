import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/auth';

export default function Index() {
  const { session, role, approvalStatus } = useAuth();

  // Not logged in → auth
  if (!session) {
    return <Redirect href="/(auth)" />;
  }

  // New user (no role yet) → role selection
  if (!role) {
    return <Redirect href="/(auth)/role-select" />;
  }

  // Provider pending approval
  if (role === 'provider' && approvalStatus === 'pending') {
    return <Redirect href="/(auth)/pending-approval" />;
  }

  // Customer → feed
  if (role === 'customer') {
    return <Redirect href="/(customer)/feed" />;
  }

  // Provider (approved) → dashboard
  if (role === 'provider') {
    return <Redirect href="/(provider)/dashboard" />;
  }

  // Fallback
  return <Redirect href="/(auth)" />;
}
