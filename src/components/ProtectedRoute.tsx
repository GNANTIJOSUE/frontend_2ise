import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof ReturnType<typeof usePermissions>['permissions'];
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission, 
  fallbackPath = '/secretary/dashboard' 
}) => {
  const { user, hasPermission, permissions } = usePermissions();

  // Si pas d'utilisateur connecté, rediriger vers la page de connexion
  if (!user) {
    return <Navigate to="/secretary/login" replace />;
  }

  // Si une permission spécifique est requise et que l'utilisateur ne l'a pas
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        bgcolor: '#f5f7fa'
      }}>
        <Typography variant="h4" color="error" gutterBottom>
          Accès refusé
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 400 }}>
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Redirection vers le tableau de bord...
        </Typography>
        <CircularProgress sx={{ mt: 2 }} />
        <Navigate to={fallbackPath} replace />
      </Box>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute; 