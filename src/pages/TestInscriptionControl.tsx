import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Paper,
  Switch,
  FormControlLabel,
  useTheme
} from '@mui/material';
import { Lock as LockIcon, LockOpen as LockOpenIcon } from '@mui/icons-material';

const TestInscriptionControl = () => {
  const theme = useTheme();
  const [inscriptionsOpen, setInscriptionsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Charger le statut initial
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/settings/inscriptions/status');
      if (response.ok) {
        const data = await response.json();
        setInscriptionsOpen(data.inscriptionsOpen);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const toggleStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/inscriptions/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inscriptionsOpen: !inscriptionsOpen })
      });

      if (response.ok) {
        const data = await response.json();
        setInscriptionsOpen(!inscriptionsOpen);
        setMessage(data.message || 'Statut mis à jour avec succès');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Erreur lors de la mise à jour');
      }
    } catch (error) {
      setMessage('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Test - Contrôle des Inscriptions
        </Typography>

        {message && (
          <Alert severity={message.includes('Erreur') ? 'error' : 'success'} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
          {inscriptionsOpen ? (
            <LockOpenIcon sx={{ fontSize: 48, color: 'green', mr: 2 }} />
          ) : (
            <LockIcon sx={{ fontSize: 48, color: 'red', mr: 2 }} />
          )}
          <Typography variant="h6">
            Statut actuel : {inscriptionsOpen ? 'OUVERTES' : 'FERMÉES'}
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={inscriptionsOpen}
              onChange={toggleStatus}
              disabled={loading}
              color="primary"
            />
          }
          label="Basculer le statut"
          sx={{ mb: 3 }}
        />

        <Box sx={{ mt: 3 }}>
          <Button 
            variant="contained" 
            onClick={() => window.location.href = '/registration'}
            sx={{ mr: 2 }}
            disabled={!inscriptionsOpen}
          >
            Tester la page d'inscription
          </Button>
          
          <Button 
            variant="contained" 
            onClick={() => window.location.href = '/secretary/inscription-control'}
            sx={{ mr: 2 }}
          >
            Interface complète
          </Button>
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Instructions :</strong><br/>
            1. Utilisez le switch pour ouvrir/fermer les inscriptions<br/>
            2. Testez la page d'inscription pour voir l'effet<br/>
            3. Le changement est immédiat et persistant
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TestInscriptionControl; 