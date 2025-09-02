import React, { memo, useMemo } from 'react';
import { Tabs, Tab, Box, Skeleton } from '@mui/material';
import { useOptimizedTabs } from '../hooks/useOptimizedTabs';

interface TabConfig {
  label: string;
  content: React.ReactNode;
  icon?: React.ReactElement | string;
  disabled?: boolean;
  loading?: boolean;
}

interface OptimizedTabsProps {
  tabs: TabConfig[];
  initialTab?: number;
  preloadTabs?: boolean;
  cacheData?: boolean;
  onChange?: (newValue: number) => void;
  className?: string;
  variant?: 'standard' | 'fullWidth' | 'scrollable';
  scrollButtons?: boolean | 'auto';
  allowScrollButtonsMobile?: boolean;
}

const OptimizedTabs = memo(({
  tabs,
  initialTab = 0,
  preloadTabs = false,
  cacheData = true,
  onChange,
  className,
  variant = 'standard',
  scrollButtons = 'auto',
  allowScrollButtonsMobile = false
}: OptimizedTabsProps) => {
  const {
    activeTab,
    loadedTabs,
    handleTabChange
  } = useOptimizedTabs({
    initialTab,
    preloadTabs,
    cacheData
  });

  // Gérer le changement d'onglet
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    handleTabChange(event, newValue);
    onChange?.(newValue);
  };

  // Mémoriser le contenu des onglets pour éviter les re-renders
  const tabContents = useMemo(() => {
    return tabs.map((tab, index) => {
      if (!loadedTabs.has(index)) {
        return (
          <Box key={index} sx={{ p: 2 }}>
            <Skeleton variant="rectangular" height={200} />
            <Skeleton variant="text" sx={{ mt: 1 }} />
            <Skeleton variant="text" width="60%" />
          </Box>
        );
      }

      return (
        <Box key={index} sx={{ display: activeTab === index ? 'block' : 'none' }}>
          {tab.loading ? (
            <Box sx={{ p: 2 }}>
              <Skeleton variant="rectangular" height={200} />
              <Skeleton variant="text" sx={{ mt: 1 }} />
              <Skeleton variant="text" width="60%" />
            </Box>
          ) : (
            tab.content
          )}
        </Box>
      );
    });
  }, [tabs, loadedTabs, activeTab]);

  return (
    <Box className={className}>
      <Tabs
        value={activeTab}
        onChange={handleChange}
        variant={variant}
        scrollButtons={scrollButtons}
        allowScrollButtonsMobile={allowScrollButtonsMobile}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 2
        }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            icon={tab.icon}
            disabled={tab.disabled}
            sx={{
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 500,
              '&.Mui-selected': {
                fontWeight: 700,
                color: 'primary.main'
              }
            }}
          />
        ))}
      </Tabs>
      
      <Box>
        {tabContents[activeTab]}
      </Box>
    </Box>
  );
});

OptimizedTabs.displayName = 'OptimizedTabs';

export default OptimizedTabs;
