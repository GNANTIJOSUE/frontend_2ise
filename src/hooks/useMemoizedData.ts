import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

interface UseMemoizedDataOptions<T> {
  initialData?: T;
  cacheKey?: string;
  maxCacheSize?: number;
  ttl?: number; // Time to live en millisecondes
}

export const useMemoizedData = <T>(
  dataLoader: () => Promise<T> | T,
  dependencies: any[] = [],
  options: UseMemoizedDataOptions<T> = {}
) => {
  const { initialData, cacheKey, maxCacheSize = 10, ttl = 5 * 60 * 1000 } = options;
  
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Vérifier si les données sont expirées
  const isDataExpired = useCallback(() => {
    return Date.now() - lastFetch > ttl;
  }, [lastFetch, ttl]);

  // Charger les données avec gestion d'erreur et annulation
  const loadData = useCallback(async () => {
    try {
      // Annuler la requête précédente si elle existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);

      const result = await dataLoader();
      
      // Vérifier si la requête a été annulée
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      setData(result);
      setLastFetch(Date.now());

      // Mettre en cache si une clé est fournie
      if (cacheKey) {
        const cache = cacheRef.current;
        cache.set(cacheKey, { data: result, timestamp: Date.now() });

        // Limiter la taille du cache
        if (cache.size > maxCacheSize) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [dataLoader, cacheKey, maxCacheSize]);

  // Charger les données depuis le cache si disponible
  const loadFromCache = useCallback(() => {
    if (cacheKey && cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey)!;
      if (Date.now() - cached.timestamp < ttl) {
        setData(cached.data);
        setLastFetch(cached.timestamp);
        return true;
      }
    }
    return false;
  }, [cacheKey, ttl]);

  // Recharger les données
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // Charger les données automatiquement si nécessaire
  useEffect(() => {
    if (!data || isDataExpired()) {
      if (!loadFromCache()) {
        loadData();
      }
    }
  }, dependencies);

  // Nettoyer lors du démontage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Mémoriser les données pour éviter les re-renders inutiles
  const memoizedData = useMemo(() => data, [data]);

  return {
    data: memoizedData,
    loading,
    error,
    refresh,
    lastFetch,
    isDataExpired: isDataExpired()
  };
};
