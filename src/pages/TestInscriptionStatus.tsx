import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Paper,
  useTheme,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { useInscriptionStatus } from '../hooks/useInscriptionStatus';
import InscriptionClosedMessage from '../components/InscriptionClosedMessage';
import { useNavigate } from 'react-router-dom';

const TestInscriptionStatus = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isOpen, loading, error } = useInscriptionStatus();

  const testRoutes = [
    {
      name: 'Inscription en ligne',
      path: '/registration',
      description: 'Formulaire d\'inscription en ligne pour les nouveaux étudiants'
    },
    {
      name: 'Inscription en présentiel',
      path: '/secretary/inscription-pre',
      description: 'Formulaire d\'inscription en présentiel (accès secrétaire)'
    },
    {
      name: 'Contrôle des inscriptions',
      path: '/secretary/inscription-control',
      description: 'Interface de contrôle des inscriptions (accès secrétaire)'
    }
  ];

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Chargement du statut des inscriptions...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (!isOpen) {
    return (
      <InscriptionClosedMessage
        title="Inscriptions Temporairement Fermées"
        message="Les inscriptions sont actuellement fermées. Cette page de test n'est pas accessible."
        showHomeButton={true}
      />
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Test du Statut des Inscriptions
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Erreur: {error}
          </Alert>
        )}

        <Alert severity={isOpen ? "success" : "warning"} sx={{ mb: 3 }}>
          Statut: {isOpen ? "Inscriptions OUVERTES" : "Inscriptions FERMÉES"}
        </Alert>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Test des composants d'inscription
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {testRoutes.map((route, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {route.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {route.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    variant="contained"
                    onClick={() => navigate(route.path)}
                    fullWidth
                  >
                    Tester {route.name}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Cette page permet de tester que les composants d'inscription respectent bien le statut des inscriptions.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TestInscriptionStatus; 