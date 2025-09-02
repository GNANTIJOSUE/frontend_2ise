import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useOptimizedTabs } from '../hooks/useOptimizedTabs';
import OptimizedTabs from './OptimizedTabs';

const HistoryTest = () => {
  const { activeTab, handleTabChange } = useOptimizedTabs({
    initialTab: 0,
    preloadTabs: true,
    cacheData: true
  });

  const tabConfigs = [
    {
      label: 'Test Onglet 1',
      content: (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Test de l\'onglet 1</Typography>
          <Typography>Ceci est un test des optimisations dans History.tsx</Typography>
        </Box>
      )
    },
    {
      label: 'Test Onglet 2',
      content: (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Test de l\'onglet 2</Typography>
          <Typography>Navigation instantanée testée avec succès !</Typography>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Test des Optimisations History.tsx
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 2 }}>
        Onglet actif: {activeTab + 1}
      </Typography>

      <OptimizedTabs
        tabs={tabConfigs}
        initialTab={activeTab}
        preloadTabs={true}
        cacheData={true}
        onChange={(newValue) => handleTabChange({} as any, newValue)}
      />

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Instructions de Test
        </Typography>
        <Typography variant="body2">
          Cliquez sur les différents onglets pour tester la navigation instantanée.
          Les composants sont mémorisés pour éviter les re-renders inutiles.
        </Typography>
      </Box>
    </Box>
  );
};

export default HistoryTest;
