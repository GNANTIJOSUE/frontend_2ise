import React from 'react';
import { Box, Typography, Paper, Alert, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Block as BlockIcon } from '@mui/icons-material';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionDeniedProps {
  requiredPermission?: string;
  message?: string;
}

const PermissionDenied: React.FC<PermissionDeniedProps> = ({ 
  requiredPermission, 
  message = "Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité." 
}) => {
  const navigate = useNavigate();
  const { user, getRoleLabel } = usePermissions();

  const getPermissionLabel = (permission: string): string => {
    switch (permission) {
      case 'canManageStudents': return 'Gestion des étudiants';
      case 'canManageTeachers': return 'Gestion des professeurs';
      case 'canManageClasses': return 'Gestion des classes';
      case 'canManageSubjects': return 'Gestion des matières';
      case 'canManageTimetables': return 'Gestion des emplois du temps';
      case 'canManageReportCards': return 'Gestion des bulletins';
      case 'canManageEvents': return 'Gestion des événements';
      case 'canManagePayments': return 'Gestion des paiements';
      case 'canManageDiscounts': return 'Gestion des bons et prises en charge';
      case 'canManageTrimesters': return 'Gestion des trimestres';
      case 'canManageInscriptions': return 'Gestion des inscriptions';
      case 'canManageSettings': return 'Gestion des paramètres';
      case 'canManageRoles': return 'Gestion des rôles';
      default: return permission;
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      bgcolor: '#f5f7fa',
      p: 3
    }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center', borderRadius: 3 }}>
        <BlockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        
        <Typography variant="h4" color="error" gutterBottom fontWeight={700}>
          Accès refusé
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {message}
        </Typography>

        {user && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Rôle actuel :</strong> {getRoleLabel(user.role)}
            </Typography>
            {requiredPermission && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Permission requise :</strong> {getPermissionLabel(requiredPermission)}
              </Typography>
            )}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/secretary/dashboard')}
            sx={{ fontWeight: 600 }}
          >
            Retour au tableau de bord
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default PermissionDenied; 