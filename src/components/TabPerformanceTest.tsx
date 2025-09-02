import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import OptimizedTabs from './OptimizedTabs';
import { useOptimizedTabs } from '../hooks/useOptimizedTabs';

const TabPerformanceTest = () => {
  const [renderCount, setRenderCount] = useState(0);
  const [tabData, setTabData] = useState({
    0: Array.from({ length: 1000 }, (_, i) => `Item ${i}`),
    1: Array.from({ length: 1000 }, (_, i) => `Data ${i}`),
    2: Array.from({ length: 1000 }, (_, i) => `Info ${i}`)
  });

  const { activeTab, handleTabChange } = useOptimizedTabs({
    initialTab: 0,
    preloadTabs: true,
    cacheData: true
  });

  // Compter les re-renders
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  const handleTabSwitch = (newValue: number) => {
    handleTabChange({} as any, newValue);
  };

  const tabConfigs = [
    {
      label: `Onglet 1 (${tabData[0].length} éléments)`,
      content: (
        <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Onglet 1 - Rendu #{renderCount}
          </Typography>
          {tabData[0].map((item, index) => (
            <Box key={index} sx={{ p: 1, borderBottom: '1px solid #eee' }}>
              {item}
            </Box>
          ))}
        </Paper>
      )
    },
    {
      label: `Onglet 2 (${tabData[1].length} éléments)`,
      content: (
        <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Onglet 2 - Rendu #{renderCount}
          </Typography>
          {tabData[1].map((item, index) => (
            <Box key={index} sx={{ p: 1, borderBottom: '1px solid #eee' }}>
              {item}
            </Box>
          ))}
        </Paper>
      )
    },
    {
      label: `Onglet 3 (${tabData[2].length} éléments)`,
      content: (
        <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Onglet 3 - Rendu #{renderCount}
          </Typography>
          {tabData[2].map((item, index) => (
            <Box key={index} sx={{ p: 1, borderBottom: '1px solid #eee' }}>
              {item}
            </Box>
          ))}
        </Paper>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Test de Performance des Onglets
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" gutterBottom>
          Compteur de re-renders: <strong>{renderCount}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ce compteur augmente à chaque re-render du composant. 
          Avec les onglets optimisés, il ne devrait augmenter que lors des changements d'onglet.
        </Typography>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Button 
          variant="outlined" 
          onClick={() => handleTabSwitch(0)}
          color={activeTab === 0 ? 'primary' : 'inherit'}
        >
          Onglet 1
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => handleTabSwitch(1)}
          color={activeTab === 1 ? 'primary' : 'inherit'}
        >
          Onglet 2
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => handleTabSwitch(2)}
          color={activeTab === 2 ? 'primary' : 'inherit'}
        >
          Onglet 3
        </Button>
      </Box>

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
        <Typography variant="body2" component="div">
          <ul>
            <li>Cliquez sur les différents onglets</li>
            <li>Observez le compteur de re-renders</li>
            <li>Les onglets optimisés ne devraient pas causer de re-renders inutiles</li>
            <li>La navigation devrait être instantanée</li>
          </ul>
        </Typography>
      </Box>
    </Box>
  );
};

export default TabPerformanceTest;
