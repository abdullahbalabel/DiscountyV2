import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSavedDealIds, toggleSaveDeal as apiToggleSaveDeal } from '../lib/api';

interface SavedDealsState {
  savedIds: Set<string>;
  toggleSave: (dealId: string) => Promise<boolean>;
  isSaving: (dealId: string) => boolean;
  reload: () => Promise<void>;
}

const SavedDealsContext = createContext<SavedDealsState>({
  savedIds: new Set(),
  toggleSave: async () => false,
  isSaving: () => false,
  reload: async () => {},
});

export function SavedDealsProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    const ids = await getSavedDealIds();
    setSavedIds(new Set(ids));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const toggleSave = useCallback(async (dealId: string): Promise<boolean> => {
    setPendingIds(prev => new Set(prev).add(dealId));
    const newState = await apiToggleSaveDeal(dealId);
    setSavedIds(prev => {
      const next = new Set(prev);
      if (newState) next.add(dealId); else next.delete(dealId);
      return next;
    });
    setPendingIds(prev => { const next = new Set(prev); next.delete(dealId); return next; });
    return newState;
  }, []);

  const isSaving = useCallback((dealId: string) => pendingIds.has(dealId), [pendingIds]);

  return (
    <SavedDealsContext.Provider value={{ savedIds, toggleSave, isSaving, reload }}>
      {children}
    </SavedDealsContext.Provider>
  );
}

export function useSavedDeals() {
  return useContext(SavedDealsContext);
}
