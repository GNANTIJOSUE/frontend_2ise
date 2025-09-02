import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useOptimizedTabs } from '../hooks/useOptimizedTabs';
import OptimizedTabs from './OptimizedTabs';

const SimpleTabTest = () => {
  const { activeTab, handleTabChange } = useOptimizedTabs({
    initialTab: 0,
    preloadTabs: true,
    cacheData: true
  });

  const tabConfigs = [
    {
      label: 'Onglet 1',
      content: (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Contenu de l'onglet 1</Typography>
          <Typography>Ceci est un test des onglets optimisés.</Typography>
        </Box>
      )
    },
    {
      label: 'Onglet 2',
      content: (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Contenu de l'onglet 2</Typography>
          <Typography>Navigation instantanée entre les onglets.</Typography>
        </Box>
      )
    },
    {
      label: 'Onglet 3',
      content: (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Contenu de l'onglet 3</Typography>
          <Typography>Performance optimisée avec React.memo et useMemo.</Typography>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Test Simple des Onglets Optimisés
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
          Instructions
        </Typography>
        <Typography variant="body2">
          Cliquez sur les différents onglets pour tester la navigation instantanée.
          Les composants sont mémorisés pour éviter les re-renders inutiles.
        </Typography>
      </Box>
    </Box>
  );
};

export default SimpleTabTest;
