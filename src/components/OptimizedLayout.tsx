import React, { memo, Suspense, lazy } from 'react';
import { Box, Skeleton, CircularProgress } from '@mui/material';

interface OptimizedLayoutProps {
  children: React.ReactNode;
  loading?: boolean;
  fallback?: React.ReactNode;
  suspense?: boolean;
}

const OptimizedLayout = memo(({
  children,
  loading = false,
  fallback,
  suspense = false
}: OptimizedLayoutProps) => {
  const defaultFallback = fallback || (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <CircularProgress />
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={400} />
        <Skeleton variant="text" sx={{ mt: 2 }} />
        <Skeleton variant="text" width="60%" />
      </Box>
    );
  }

  if (suspense) {
    return (
      <Suspense fallback={defaultFallback}>
        {children}
      </Suspense>
    );
  }

  return <>{children}</>;
});

OptimizedLayout.displayName = 'OptimizedLayout';

export default OptimizedLayout;
