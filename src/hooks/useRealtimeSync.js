import { useEffect, useRef } from 'react';
import { useRealtime } from '../contexts/RealtimeContext';

/**
 * Hook pour synchroniser automatiquement les données d'une page en temps réel.
 * 
 * @param {Function} fetchCallback - Fonction asynchrone à appeler pour actualiser les données.
 * @param {Array} deps - Dépendances locales (ex: filtres, pagination, recherche).
 * @param {Object} options - Options { silent: boolean, enabled: boolean }
 */
export const useRealtimeSync = (fetchCallback, deps = [], options = {}) => {
  const { syncCounter, isLive } = useRealtime();
  const { enabled = true } = options;
  const isFirstRun = useRef(true);
  const callbackRef = useRef(fetchCallback);

  // Mettre à jour la référence du callback pour éviter les fermetures obsolètes
  useEffect(() => {
    callbackRef.current = fetchCallback;
  }, [fetchCallback]);

  // Exécution lors du changement des dépendances (filtres, page, etc.)
  useEffect(() => {
    if (enabled && typeof callbackRef.current === 'function') {
      callbackRef.current({ isBackgroundSync: false });
    }
  }, deps);

  // Exécution lors du signal de synchronisation temps réel
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (enabled && isLive && typeof callbackRef.current === 'function') {
      callbackRef.current({ isBackgroundSync: true });
    }
  }, [syncCounter, isLive, enabled]);
};

export default useRealtimeSync;
