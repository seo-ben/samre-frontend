import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../lib/apiClient';

const RealtimeContext = createContext(null);

export const RealtimeProvider = ({ children }) => {
  const [isLive, setIsLive] = useState(true);
  const [syncCounter, setSyncCounter] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [sidebarStats, setSidebarStats] = useState({
    pending_offers_count: 0,
    pending_events_count: 0,
    pending_verifications_count: 0,
    pending_hirings_count: 0,
    pending_special_requests_count: 0,
    pending_reports_count: 0,
  });

  // Intervalle de polling silencieux en secondes (10s par défaut)
  const SYNC_INTERVAL_MS = 10000;
  const timerRef = useRef(null);

  const fetchSidebarStats = useCallback(async () => {
    try {
      const res = await apiClient.get('/v1/admin/sidebar-stats');
      if (res.data?.data) {
        setSidebarStats(res.data.data);
      }
    } catch (err) {
      // Ignorer silencieusement si déconnecté ou erreur réseau
    }
  }, []);

  const refreshNow = useCallback(async () => {
    setIsSyncing(true);
    setLastSyncTime(new Date());
    setSyncCounter(c => c + 1);
    await fetchSidebarStats();
    setTimeout(() => {
      setIsSyncing(false);
    }, 400);
  }, [fetchSidebarStats]);

  // Boucle de synchronisation temps réel
  useEffect(() => {
    fetchSidebarStats();

    if (!isLive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setLastSyncTime(new Date());
      setSyncCounter(c => c + 1);
      fetchSidebarStats();
    }, SYNC_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLive, fetchSidebarStats]);

  // Rafraîchissement automatique au focus de l'onglet ou retour de visibilité
  useEffect(() => {
    const handleFocus = () => {
      if (isLive) {
        refreshNow();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLive) {
        refreshNow();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLive, refreshNow]);

  const value = {
    isLive,
    setIsLive,
    syncCounter,
    lastSyncTime,
    isSyncing,
    refreshNow,
    sidebarStats,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error('useRealtime must be used within a <RealtimeProvider>');
  }
  return ctx;
};
