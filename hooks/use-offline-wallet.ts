import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';
import type { CachedRedemption } from '../lib/types';

const WALLET_KEY = '@discounty_wallet';
const LAST_SYNC_KEY = '@discounty_wallet_last_sync';

export function useOfflineWallet() {
  const [cachedRedemptions, setCachedRedemptions] = useState<CachedRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected !== true);
    });
    return unsubscribe;
  }, []);

  const loadCache = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(WALLET_KEY);
      if (raw) {
        setCachedRedemptions(JSON.parse(raw));
      }
      const syncTime = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (syncTime) setLastSyncedAt(syncTime);
    } catch {}
  }, []);

  const persist = useCallback(async (items: CachedRedemption[]) => {
    setCachedRedemptions(items);
    await AsyncStorage.setItem(WALLET_KEY, JSON.stringify(items));
  }, []);

  const cacheRedemption = useCallback(async (data: CachedRedemption) => {
    const raw = await AsyncStorage.getItem(WALLET_KEY);
    const current: CachedRedemption[] = raw ? JSON.parse(raw) : [];
    const idx = current.findIndex((r) => r.redemptionId === data.redemptionId);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...data };
    } else {
      current.push(data);
    }
    await persist(current);
  }, [persist]);

  const syncWithServer = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(WALLET_KEY);
      if (!raw) return;
      const current: CachedRedemption[] = JSON.parse(raw);
      if (current.length === 0) return;

      const updated = await Promise.all(
        current.map(async (item) => {
          try {
            const { data } = await supabase
              .from('redemptions')
              .select('status')
              .eq('id', item.redemptionId)
              .single();
            if (data) {
              return { ...item, status: data.status as CachedRedemption['status'] };
            }
          } catch {}
          return item;
        })
      );

      await persist(updated);
      const now = new Date().toISOString();
      await AsyncStorage.setItem(LAST_SYNC_KEY, now);
      setLastSyncedAt(now);
    } catch {}
  }, [persist]);

  const removeRedemption = useCallback(async (redemptionId: string) => {
    const raw = await AsyncStorage.getItem(WALLET_KEY);
    if (!raw) return;
    const current: CachedRedemption[] = JSON.parse(raw);
    const filtered = current.filter((r) => r.redemptionId !== redemptionId);
    await persist(filtered);
  }, [persist]);

  const clearExpired = useCallback(async () => {
    const raw = await AsyncStorage.getItem(WALLET_KEY);
    if (!raw) return;
    const current: CachedRedemption[] = JSON.parse(raw);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const filtered = current.filter((r) => {
      if (r.status === 'expired') {
        return new Date(r.cachedAt).getTime() > sevenDaysAgo;
      }
      return true;
    });
    if (filtered.length !== current.length) {
      await persist(filtered);
    }
  }, [persist]);

  useEffect(() => {
    (async () => {
      await loadCache();
      await clearExpired();
      setIsLoading(false);
    })();
  }, [loadCache, clearExpired]);

  return {
    cachedRedemptions,
    isLoading,
    isOffline,
    lastSyncedAt,
    cacheRedemption,
    syncWithServer,
    removeRedemption,
    clearExpired,
  };
}
