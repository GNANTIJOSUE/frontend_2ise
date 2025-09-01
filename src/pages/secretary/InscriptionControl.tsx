import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  useTheme,
  Divider,
  Button,
  Switch,
  FormControlLabel,
  Fade,
  Zoom,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import SecretarySidebar from '../../components/SecretarySidebar';

const InscriptionControl = () => {
  const theme = useTheme();
  const [inscriptionsOpen, setInscriptionsOpen] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Charger le statut initial
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetch('https://2ise-groupe.com/api/public/settings/inscriptions/status');
        if (response.ok) {
          const data = await response.json();
          setInscriptionsOpen(data.inscriptionsOpen || false);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du statut:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, []);

  const handleSaveStatus = async () => {
    try {
      const response = await fetch('https://2ise-groupe.com/api/public/settings/inscriptions/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inscriptionsOpen })
      });

      if (response.ok) {
        const data = await response.json();
        setSnackbarMessage(data.message || `Inscriptions ${inscriptionsOpen ? 'ouvertes' : 'fermées'} avec succès`);
        setShowSnackbar(true);
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      setSnackbarMessage('Erreur lors de la sauvegarde');
      setShowSnackbar(true);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <SecretarySidebar />
        <Box sx={{ flexGrow: 1, p: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress size={60} />
          </Container>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <SecretarySidebar />
      <Box sx={{ flexGrow: 1, p: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {/* Header */}
          <Fade in={true} timeout={1000}>
            <Box sx={{ mb: 6, textAlign: 'center' }}>
              <Box sx={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 2, 
                p: 3, 
                borderRadius: 4,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                mb: 3
              }}>
                <PersonAddIcon sx={{ fontSize: 48 }} />
                <Typography variant="h3" component="h1" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                  Contrôle des Inscriptions
                </Typography>
              </Box>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}>
                Gérez l'ouverture et la fermeture des inscriptions pour l'année scolaire en cours
              </Typography>
            </Box>
          </Fade>

          {/* Contrôle principal */}
          <Zoom in={true} timeout={1200}>
            <Card 
              elevation={8}
              sx={{
                maxWidth: 600,
                mx: 'auto',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                }
              }}
            >
              <CardContent sx={{ p: 5, textAlign: 'center', position: 'relative' }}>
                {/* Icône de statut */}
                <Box sx={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  mb: 4,
                  backdropFilter: 'blur(10px)'
                }}>
                  {inscriptionsOpen ? <LockOpenIcon sx={{ fontSize: 50, color: 'white' }} /> : <LockIcon sx={{ fontSize: 50, color: 'white' }} />}
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                  {inscriptionsOpen ? 'Inscriptions Ouvertes' : 'Inscriptions Fermées'}
                </Typography>

                <Typography variant="body1" sx={{ mb: 4, opacity: 0.9, lineHeight: 1.6 }}>
                  {inscriptionsOpen 
                    ? "Les nouveaux étudiants peuvent s'inscrire et accéder au système."
                    : "Les inscriptions sont fermées. Seuls les étudiants déjà inscrits peuvent accéder au système."
                  }
                </Typography>

                {/* Switch de contrôle */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={inscriptionsOpen}
                      onChange={(e) => setInscriptionsOpen(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                      {inscriptionsOpen ? 'Fermer les inscriptions' : 'Ouvrir les inscriptions'}
                    </Typography>
                  }
                  sx={{ mb: 4 }}
                />

                {/* Bouton de confirmation */}
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSaveStatus}
                  sx={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '2px solid rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(10px)',
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 600,
                    '&:hover': {
                      background: 'rgba(255,255,255,0.3)',
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  Confirmer
                </Button>
              </CardContent>
            </Card>
          </Zoom>

          {/* Section d'informations */}
          <Fade in={true} timeout={1600}>
            <Paper sx={{ 
              mt: 6, 
              p: 4, 
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <InfoIcon sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  Informations importantes
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 3, borderRadius: 2, background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 2 }}>
                      ?? Inscriptions ouvertes
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Les nouveaux étudiants peuvent s'inscrire et les demandes d'inscription sont acceptées.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 3, borderRadius: 2, background: 'rgba(240, 147, 251, 0.1)', border: '1px solid rgba(240, 147, 251, 0.2)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.secondary.main, mb: 2 }}>
                      ?? Inscriptions fermées
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Aucune nouvelle inscription n'est acceptée. Seuls les étudiants déjà inscrits peuvent accéder au système.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Fade>
        </Container>
      </Box>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default InscriptionControl; 
