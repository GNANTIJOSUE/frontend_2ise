import React, { useState, useEffect } from 'react';
import {
  Button,
  Snackbar,
  Alert,
  Box,
  Typography,
  IconButton,
  Paper,
  useTheme
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

interface InstallPWAProps {
  onInstall?: () => void;
}

const InstallPWA: React.FC<InstallPWAProps> = ({ onInstall }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const theme = useTheme();

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkIfInstalled();

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    // Écouter l'événement appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setSnackbarMessage('Application installée avec succès !');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
      if (onInstall) onInstall();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstall]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Afficher le prompt d'installation
      deferredPrompt.prompt();

      // Attendre la réponse de l'utilisateur
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setSnackbarMessage('Installation en cours...');
        setSnackbarSeverity('success');
        setShowSnackbar(true);
      } else {
        setSnackbarMessage('Installation annulée');
        setSnackbarSeverity('error');
        setShowSnackbar(true);
      }

      // Réinitialiser le prompt
      setDeferredPrompt(null);
      setShowInstallButton(false);
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error);
      setSnackbarMessage('Erreur lors de l\'installation');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  // Ne pas afficher si l'app est déjà installée ou si le bouton ne doit pas être affiché
  if (isInstalled || !showInstallButton) {
    return null;
  }

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          p: 2,
          maxWidth: 300,
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.primary.main}`,
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <InstallIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
            Installer l'application
          </Typography>
          <IconButton
            size="small"
            onClick={() => setShowInstallButton(false)}
            sx={{ ml: 'auto' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Installez 2ISE-GROUPE sur votre appareil pour un accès rapide et une expérience optimale.
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<InstallIcon />}
          onClick={handleInstallClick}
          fullWidth
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
            '&:hover': {
              background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
            }
          }}
        >
          Installer maintenant
        </Button>
      </Paper>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          icon={snackbarSeverity === 'success' ? <CheckCircleIcon /> : undefined}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default InstallPWA;
