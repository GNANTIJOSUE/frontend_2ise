import { useState, useCallback, useMemo } from 'react';

interface UseOptimizedTabsOptions {
  initialTab?: number;
  preloadTabs?: boolean;
  cacheData?: boolean;
}

export const useOptimizedTabs = (options: UseOptimizedTabsOptions = {}) => {
  const { initialTab = 0, preloadTabs = false, cacheData = true } = options;
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loadedTabs, setLoadedTabs] = useState(new Set([initialTab]));
  const [tabData, setTabData] = useState<Record<number, any>>({});

  // Gestion intelligente du changement d'onglet
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Marquer l'onglet comme chargé
    if (!loadedTabs.has(newValue)) {
      setLoadedTabs(prev => new Set([...prev, newValue]));
    }
  }, [loadedTabs]);

  // Précharger les données d'un onglet
  const preloadTabData = useCallback((tabIndex: number, dataLoader: () => any) => {
    if (preloadTabs && !tabData[tabIndex]) {
      const data = dataLoader();
      setTabData(prev => ({ ...prev, [tabIndex]: data }));
    }
  }, [preloadTabs, tabData]);

  // Mettre à jour les données d'un onglet
  const updateTabData = useCallback((tabIndex: number, data: any) => {
    if (cacheData) {
      setTabData(prev => ({ ...prev, [tabIndex]: data }));
    }
  }, [cacheData]);

  // Vérifier si un onglet est chargé
  const isTabLoaded = useCallback((tabIndex: number) => {
    return loadedTabs.has(tabIndex);
  }, [loadedTabs]);

  // Obtenir les données d'un onglet
  const getTabData = useCallback((tabIndex: number) => {
    return tabData[tabIndex];
  }, [tabData]);

  // Réinitialiser les onglets
  const resetTabs = useCallback(() => {
    setLoadedTabs(new Set([initialTab]));
    setTabData({});
    setActiveTab(initialTab);
  }, [initialTab]);

  return {
    activeTab,
    loadedTabs,
    tabData,
    handleTabChange,
    preloadTabData,
    updateTabData,
    isTabLoaded,
    getTabData,
    resetTabs,
    setActiveTab
  };
};
