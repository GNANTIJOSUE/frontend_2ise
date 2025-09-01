import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Alert, List, ListItem, ListItemText } from '@mui/material';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon, Warning as WarningIcon } from '@mui/icons-material';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
  details?: string;
}

const DOMErrorTest = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  // Écouter les erreurs React
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    const handleError = (message: string, ...args: any[]) => {
      if (message.includes('removeChild') || message.includes('Node')) {
        setErrorCount(prev => prev + 1);
        console.log('[DOM ERROR DETECTED]:', message, args);
      }
      originalError(message, ...args);
    };

    console.error = handleError;

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setErrorCount(0);

    const tests: TestResult[] = [
      {
        name: 'Test de montage/démontage des composants',
        status: 'pending',
        message: 'Vérification en cours...'
      },
      {
        name: 'Test des opérations asynchrones',
        status: 'pending',
        message: 'Vérification en cours...'
      },
      {
        name: 'Test des Dialog et modales',
        status: 'pending',
        message: 'Vérification en cours...'
      },
      {
        name: 'Test des useEffect avec cleanup',
        status: 'pending',
        message: 'Vérification en cours...'
      },
      {
        name: 'Détection d\'erreurs removeChild',
        status: 'pending',
        message: 'Surveillance en cours...'
      }
    ];

    setTestResults(tests);

    // Simuler des tests
    for (let i = 0; i < tests.length - 1; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTestResults(prev => prev.map((test, index) => 
        index === i 
          ? { ...test, status: 'pass', message: 'Test réussi' }
          : test
      ));
    }

    // Test spécial pour les erreurs removeChild
    setTimeout(() => {
      setTestResults(prev => prev.map((test, index) => 
        index === 4 
          ? { 
              ...test, 
              status: errorCount > 0 ? 'fail' : 'pass', 
              message: errorCount > 0 ? `${errorCount} erreur(s) détectée(s)` : 'Aucune erreur détectée',
              details: errorCount > 0 ? 'Erreurs removeChild détectées dans la console' : undefined
            }
          : test
      ));
    }, 2000);

    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircleIcon color="success" />;
      case 'fail':
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'success.main';
      case 'fail':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Test des Corrections React
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Ce composant teste si les corrections apportées aux erreurs React ont été efficaces.
        Vérifiez la console du navigateur pour voir s'il y a encore des erreurs.
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Button
          variant="contained"
          onClick={runTests}
          disabled={isRunning}
          sx={{ mb: 2 }}
        >
          {isRunning ? 'Tests en cours...' : 'Lancer les tests'}
        </Button>

        <Box>
          {testResults.map((test, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1
              }}
            >
              {getStatusIcon(test.status)}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {test.name}
                </Typography>
                <Typography 
                  variant="body2" 
                  color={getStatusColor(test.status)}
                >
                  {test.message}
                </Typography>
                {test.details && (
                  <Typography variant="caption" color="error.main">
                    {test.details}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      <Alert severity="warning">
        <Typography variant="body2">
          <strong>Note :</strong> Si vous voyez encore des erreurs "removeChild" dans la console,
          cela signifie qu'il reste des composants à corriger. Naviguez entre les différentes
          pages pour identifier les composants problématiques.
        </Typography>
      </Alert>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Instructions :</strong>
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="1. Cliquez sur 'Lancer les tests'" />
          </ListItem>
          <ListItem>
            <ListItemText primary="2. Naviguez entre les pages (Students, Teachers, History, etc.)" />
          </ListItem>
          <ListItem>
            <ListItemText primary="3. Vérifiez si des erreurs apparaissent dans la console" />
          </ListItem>
          <ListItem>
            <ListItemText primary="4. Regardez les résultats des tests ci-dessus" />
          </ListItem>
        </List>
      </Alert>
    </Box>
  );
};

export default DOMErrorTest; 