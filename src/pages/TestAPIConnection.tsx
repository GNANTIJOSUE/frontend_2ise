import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme
} from '@mui/material';
import { CheckCircle as CheckIcon, Error as ErrorIcon } from '@mui/icons-material';

const TestAPIConnection = () => {
  const theme = useTheme();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);

    const tests = [
      {
        name: 'Test de base - API accessible',
        url: '/api/public/health',
        method: 'GET'
      },
      {
        name: 'Test de la base de données',
        url: '/api/health',
        method: 'GET'
      },
      {
        name: 'Test du statut des inscriptions',
        url: '/api/settings/inscriptions/status',
        method: 'GET'
      },
      {
        name: 'Test de modification du statut',
        url: '/api/settings/inscriptions/status',
        method: 'PUT',
        body: { inscriptionsOpen: true }
      }
    ];

    for (const test of tests) {
      try {
        const options: any = {
          method: test.method,
          headers: { 'Content-Type': 'application/json' }
        };

        if (test.body) {
          options.body = JSON.stringify(test.body);
        }

        const response = await fetch(test.url, options);
        const data = await response.json();

        setTestResults(prev => [...prev, {
          name: test.name,
          success: response.ok,
          status: response.status,
          data: data,
          error: response.ok ? null : data.message || 'Erreur inconnue'
        }]);

      } catch (error) {
        setTestResults(prev => [...prev, {
          name: test.name,
          success: false,
          status: 'ERROR',
          data: null,
          error: error instanceof Error ? error.message : 'Erreur de connexion'
        }]);
      }
    }

    setLoading(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          🔧 Test de Connexion API
        </Typography>

        <Typography variant="body1" sx={{ mb: 3 }}>
          Ce composant teste la connectivité avec le serveur backend et les différentes routes API.
        </Typography>

        <Button
          variant="contained"
          onClick={runTests}
          disabled={loading}
          sx={{ mb: 3 }}
        >
          {loading ? 'Tests en cours...' : 'Lancer les tests'}
        </Button>

        {testResults.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Résultats des tests :
            </Typography>
            
            <List>
              {testResults.map((result, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      {result.success ? (
                        <CheckIcon sx={{ color: 'green', mr: 2 }} />
                      ) : (
                        <ErrorIcon sx={{ color: 'red', mr: 2 }} />
                      )}
                      
                      <Box sx={{ flexGrow: 1 }}>
                        <ListItemText
                          primary={result.name}
                          secondary={
                            result.success 
                              ? `✅ Succès (${result.status})`
                              : `❌ Échec (${result.status}): ${result.error}`
                          }
                        />
                        
                        {result.data && (
                          <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            Réponse: {JSON.stringify(result.data, null, 2)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                  {index < testResults.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Instructions de dépannage :</strong><br/>
            1. Vérifiez que le serveur backend est démarré (port 5000)<br/>
            2. Vérifiez que la base de données MySQL est accessible<br/>
            3. Vérifiez que la table `settings` existe<br/>
            4. Vérifiez les logs du serveur backend pour plus de détails
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TestAPIConnection; 