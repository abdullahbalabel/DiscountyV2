import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { useAuth } from '../../contexts/auth';
import type { ProviderStats } from '../../lib/api';
import { fetchOwnProviderProfile, fetchProviderStats } from '../../lib/api';
import type { ProviderProfile } from '../../lib/types';

export default function ProviderDashboard() {
  const { signOut, session } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsData, profileData] = await Promise.all([fetchProviderStats(), fetchOwnProviderProfile()]);
      setStats(statsData);
      setProfile(profileData);
    } catch (err) { console.error('Dashboard load error:', err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { if (session?.user) loadData(); }, [session, loadData]);
  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [loadData]);

  const surfaceBg = isDark ? '#1a110f' : '#fff8f6';
  const surfaceContainerLowest = isDark ? '#322825' : '#ffffff';
  const surfaceContainerHigh = isDark ? '#534340' : '#f5ddd9';
  const surfaceContainer = isDark ? '#3d3230' : '#f0e0dc';
  const onSurface = isDark ? '#f1dfda' : '#231917';
  const onSurfaceVariant = isDark ? '#d8c2bd' : '#564340';
  const outlineVariant = isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)';

  const quickActions = [
    { icon: 'add-circle' as const, label: 'Create New Deal', color: '#862045', onPress: () => router.push('/(provider)/create-deal') },
    { icon: 'qr-code-scanner' as const, label: 'Scan Customer QR', color: '#00694d', onPress: () => router.push('/(provider)/scan') },
    { icon: 'rate-review' as const, label: 'View Reviews', color: '#7b5733', onPress: () => router.push('/(provider)/reviews') },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#862045" />
        <Text style={{ color: onSurfaceVariant, fontFamily: 'Manrope', marginTop: 12, fontSize: 14 }}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: surfaceBg }}>
        <View>
          <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', letterSpacing: -0.5, fontSize: 18, color: onSurface }}>Dashboard</Text>
          {profile && <Text style={{ color: onSurfaceVariant, fontSize: 10, fontFamily: 'Manrope', marginTop: 2 }}>{profile.business_name}</Text>}
        </View>
        <AnimatedButton style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }} onPress={() => signOut()}>
          <MaterialIcons name="logout" size={18} color="#85736f" />
        </AnimatedButton>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#862045" />}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <AnimatedEntrance index={0} delay={100}>
            <View style={{ backgroundColor: '#862045', padding: 16, borderRadius: 8, marginBottom: 16, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#fff', fontFamily: 'Epilogue', fontSize: 14, fontWeight: '700' }}>Your Rating</Text>
                <MaterialIcons name="star" size={18} color="#FFD700" />
              </View>
              <Text style={{ color: '#fff', fontFamily: 'Epilogue', fontWeight: '900', fontSize: 30, letterSpacing: -0.5, marginBottom: 4 }}>
                {(stats?.averageRating || 0) > 0 ? stats!.averageRating.toFixed(1) : '—'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Manrope', fontSize: 12 }}>
                {stats?.totalReviews || 0} total reviews from customers
              </Text>
            </View>
          </AnimatedEntrance>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <AnimatedEntrance index={1} delay={150} style={{ flex: 1 }}>
              <View style={{ backgroundColor: surfaceContainerLowest, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: outlineVariant }}>
                <MaterialIcons name="local-offer" size={18} color="#862045" />
                <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 20, color: onSurface, marginBottom: 2, marginTop: 8 }}>{stats?.activeDeals || 0}</Text>
                <Text style={{ color: onSurfaceVariant, fontSize: 10, textTransform: 'uppercase', letterSpacing: 3, fontWeight: '700' }}>Active Deals</Text>
              </View>
            </AnimatedEntrance>
            <AnimatedEntrance index={2} delay={200} style={{ flex: 1 }}>
              <View style={{ backgroundColor: surfaceContainerLowest, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: outlineVariant }}>
                <MaterialIcons name="qr-code" size={18} color="#00694d" />
                <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 20, color: onSurface, marginBottom: 2, marginTop: 8 }}>{stats?.totalRedemptions || 0}</Text>
                <Text style={{ color: onSurfaceVariant, fontSize: 10, textTransform: 'uppercase', letterSpacing: 3, fontWeight: '700' }}>Redemptions</Text>
              </View>
            </AnimatedEntrance>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <AnimatedEntrance index={3} delay={250} style={{ flex: 1 }}>
              <View style={{ backgroundColor: surfaceContainerLowest, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: outlineVariant }}>
                <MaterialIcons name="hourglass-top" size={18} color="#f59e0b" />
                <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 20, color: onSurface, marginBottom: 2, marginTop: 8 }}>{stats?.claimedRedemptions || 0}</Text>
                <Text style={{ color: onSurfaceVariant, fontSize: 10, textTransform: 'uppercase', letterSpacing: 3, fontWeight: '700' }}>Pending</Text>
              </View>
            </AnimatedEntrance>
            <AnimatedEntrance index={4} delay={300} style={{ flex: 1 }}>
              <View style={{ backgroundColor: surfaceContainerLowest, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: outlineVariant }}>
                <MaterialIcons name="check-circle" size={18} color="#10b981" />
                <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 20, color: onSurface, marginBottom: 2, marginTop: 8 }}>{stats?.redeemedRedemptions || 0}</Text>
                <Text style={{ color: onSurfaceVariant, fontSize: 10, textTransform: 'uppercase', letterSpacing: 3, fontWeight: '700' }}>Completed</Text>
              </View>
            </AnimatedEntrance>
          </View>

          {stats?.recentRedemptions && stats.recentRedemptions.length > 0 && (
            <AnimatedEntrance index={5} delay={350}>
              <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16, color: onSurface, marginBottom: 12 }}>Recent Activity</Text>
              <View style={{ backgroundColor: surfaceContainerLowest, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: outlineVariant, marginBottom: 20 }}>
                {stats.recentRedemptions.map((redemption, idx) => (
                  <View key={redemption.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: idx !== stats.recentRedemptions.length - 1 ? 1 : 0, borderBottomColor: surfaceContainer }}>
                    <View style={{ width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: redemption.status === 'redeemed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)' }}>
                      <MaterialIcons name={redemption.status === 'redeemed' ? 'check-circle' : 'hourglass-top'} size={16} color={redemption.status === 'redeemed' ? '#10b981' : '#f59e0b'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Epilogue', fontWeight: '600', fontSize: 12, color: onSurface }} numberOfLines={1}>{(redemption.discount as any)?.title || 'Deal'}</Text>
                      <Text style={{ color: onSurfaceVariant, fontSize: 10, fontFamily: 'Manrope', marginTop: 2 }}>
                        {redemption.status === 'redeemed' ? 'Redeemed' : 'Claimed'} • {new Date(redemption.claimed_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: redemption.status === 'redeemed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)' }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: redemption.status === 'redeemed' ? '#10b981' : '#f59e0b' }}>{redemption.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </AnimatedEntrance>
          )}

          <AnimatedEntrance index={6} delay={400}>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16, color: onSurface, marginBottom: 12 }}>Quick Actions</Text>
            <View style={{ gap: 8 }}>
              {quickActions.map((action) => (
                <AnimatedButton
                  key={action.label}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: surfaceContainerLowest, borderRadius: 12, borderWidth: 1, borderColor: outlineVariant }}
                  onPress={action.onPress}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialIcons name={action.icon} size={18} color={action.color} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: 'Epilogue', fontWeight: '600', fontSize: 14, color: onSurface }}>{action.label}</Text>
                  <MaterialIcons name="chevron-right" size={20} color="#85736f" />
                </AnimatedButton>
              ))}
            </View>
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </View>
  );
}
