import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../lib/apiClient';
import desktopNotif from '../services/desktopNotification';

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

  const [liveAlerts, setLiveAlerts] = useState([]);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [desktopPermission, setDesktopPermission] = useState(desktopNotif.getPermission());
  const [soundEnabled, setSoundEnabled] = useState(desktopNotif.isSoundEnabled());

  const seenAlertIdsRef = useRef(new Set());
  const isInitialFetchRef = useRef(true);

  // Intervalle de polling silencieux en secondes (10s par défaut)
  const SYNC_INTERVAL_MS = 10000;
  const timerRef = useRef(null);

  const fetchLiveAlerts = useCallback(async () => {
    try {
      const res = await apiClient.get('/v1/admin/notifications/live-alerts');
      if (res.data?.data) {
        const { alerts, unread_count } = res.data.data;
        setLiveAlerts(alerts || []);
        setUnreadAlertsCount(unread_count || 0);

        if (Array.isArray(alerts)) {
          if (isInitialFetchRef.current) {
            // Premier chargement : enregistrer les IDs existants sans spammer de notification
            alerts.forEach(a => seenAlertIdsRef.current.add(a.id));
            isInitialFetchRef.current = false;
          } else {
            // Chargements ultérieurs : détecter les nouveaux événements
            const newAlerts = alerts.filter(a => !seenAlertIdsRef.current.has(a.id));
            newAlerts.forEach(newAlert => {
              seenAlertIdsRef.current.add(newAlert.id);
              // Déclencher la notification de bureau native sur l'ordinateur de l'admin !
              desktopNotif.showNotification({
                id: newAlert.id,
                title: newAlert.title,
                body: newAlert.message,
                url: newAlert.url,
              });
            });
          }
        }
      }
    } catch (err) {
      // Ignorer silencieusement si déconnecté ou erreur réseau
    }
  }, []);

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
    await Promise.allSettled([fetchSidebarStats(), fetchLiveAlerts()]);
    setTimeout(() => {
      setIsSyncing(false);
    }, 400);
  }, [fetchSidebarStats, fetchLiveAlerts]);

  // Demander la permission des notifications de bureau
  const requestDesktopPermission = useCallback(async () => {
    const result = await desktopNotif.requestPermission();
    setDesktopPermission(result);
    if (result === 'granted') {
      desktopNotif.testNotification();
    }
    return result;
  }, []);

  // Tester la notification sur l'ordinateur
  const testDesktopNotification = useCallback(() => {
    desktopNotif.testNotification();
  }, []);

  // Toggle du son
  const toggleSound = useCallback((enabled) => {
    const nextVal = enabled !== undefined ? enabled : !soundEnabled;
    desktopNotif.setSoundEnabled(nextVal);
    setSoundEnabled(nextVal);
  }, [soundEnabled]);

  // Boucle de synchronisation temps réel
  useEffect(() => {
    fetchSidebarStats();
    fetchLiveAlerts();

    if (!isLive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setLastSyncTime(new Date());
      setSyncCounter(c => c + 1);
      fetchSidebarStats();
      fetchLiveAlerts();
    }, SYNC_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLive, fetchSidebarStats, fetchLiveAlerts]);

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
    liveAlerts,
    unreadAlertsCount,
    desktopPermission,
    requestDesktopPermission,
    testDesktopNotification,
    soundEnabled,
    toggleSound,
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
