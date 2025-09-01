import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { testApiConnection } from '../utils/apiUtils';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
}

const ApiConnectionTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'success' | 'error' | 'warning' | 'pending'>('pending');

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    const newResults: TestResult[] = [];

    // Test 1: Vérifier l'origine
    newResults.push({
      name: 'Origine du navigateur',
      status: 'success',
      message: `Origine détectée: ${window.location.origin}`,
      details: {
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        port: window.location.port,
        pathname: window.location.pathname
      }
    });

    // Test 2: Vérifier la connectivité réseau
    try {
      const response = await fetch('https://2ise-groupe.com/api/public/health', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (response.ok) {
        newResults.push({
          name: 'Connectivité réseau',
          status: 'success',
          message: 'Connexion réseau réussie',
          details: { status: response.status, statusText: response.statusText }
        });
      } else {
        newResults.push({
          name: 'Connectivité réseau',
          status: 'error',
          message: `Erreur HTTP: ${response.status} ${response.statusText}`,
          details: { status: response.status, statusText: response.statusText }
        });
      }
    } catch (error: any) {
      newResults.push({
        name: 'Connectivité réseau',
        status: 'error',
        message: `Erreur de connexion: ${error.message}`,
        details: { error: error.message, type: error.type }
      });
    }

    // Test 3: Test API avec authentification
    try {
      const isConnected = await testApiConnection();
      if (isConnected) {
        newResults.push({
          name: 'Test API complet',
          status: 'success',
          message: 'API accessible avec authentification',
          details: { authenticated: true }
        });
      } else {
        newResults.push({
          name: 'Test API complet',
          status: 'warning',
          message: 'API accessible mais problème d\'authentification',
          details: { authenticated: false }
        });
      }
    } catch (error: any) {
      newResults.push({
        name: 'Test API complet',
        status: 'error',
        message: `Erreur API: ${error.message}`,
        details: { error: error.message, type: error.type }
      });
    }

    // Test 4: Vérifier les headers CORS
    try {
      const response = await fetch('https://2ise-groupe.com/api/public/health', {
        method: 'OPTIONS',
        mode: 'cors'
      });
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
      };

      const hasCorsHeaders = Object.values(corsHeaders).some(header => header !== null);
      
      newResults.push({
        name: 'Headers CORS',
        status: hasCorsHeaders ? 'success' : 'warning',
        message: hasCorsHeaders ? 'Headers CORS présents' : 'Headers CORS manquants ou incomplets',
        details: corsHeaders
      });
    } catch (error: any) {
      newResults.push({
        name: 'Headers CORS',
        status: 'error',
        message: `Erreur lors de la vérification CORS: ${error.message}`,
        details: { error: error.message }
      });
    }

    setResults(newResults);
    
    // Déterminer le statut global
    const hasErrors = newResults.some(r => r.status === 'error');
    const hasWarnings = newResults.some(r => r.status === 'warning');
    
    if (hasErrors) {
      setOverallStatus('error');
    } else if (hasWarnings) {
      setOverallStatus('warning');
    } else {
      setOverallStatus('success');
    }
    
    setIsRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckIcon color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      default: return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  return (
    <Card sx={{ maxWidth: 800, mx: 'auto', mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6" component="h2">
            Test de Connectivité API
          </Typography>
          <Chip 
            label={overallStatus.toUpperCase()} 
            color={getStatusColor(overallStatus)}
            size="small"
          />
          <Button
            startIcon={<RefreshIcon />}
            onClick={runTests}
            disabled={isRunning}
            size="small"
          >
            {isRunning ? 'Test en cours...' : 'Relancer les tests'}
          </Button>
        </Box>

        {isRunning && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CircularProgress size={20} />
            <Typography>Exécution des tests...</Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <List>
          {results.map((result, index) => (
            <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getStatusIcon(result.status)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {result.name}
                      </Typography>
                      <Chip 
                        label={result.status.toUpperCase()} 
                        color={getStatusColor(result.status)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={result.message}
                />
              </Box>
              
              {result.details && (
                <Box sx={{ mt: 1, ml: 6, width: '100%' }}>
                  <Typography variant="caption" color="text.secondary">
                    Détails:
                  </Typography>
                  <pre style={{ 
                    fontSize: '12px', 
                    backgroundColor: '#f5f5f5', 
                    padding: '8px', 
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '100px'
                  }}>
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </Box>
              )}
            </ListItem>
          ))}
        </List>

        {overallStatus === 'error' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Problèmes détectés:
            </Typography>
            <Typography variant="body2">
              • Vérifiez votre connexion internet<br/>
              • Assurez-vous que l'API est accessible<br/>
              • Vérifiez les paramètres CORS du serveur<br/>
              • Contactez l'administrateur si le problème persiste
            </Typography>
          </Alert>
        )}

        {overallStatus === 'warning' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Avertissements:
            </Typography>
            <Typography variant="body2">
              • Certains tests ont échoué mais l'application peut fonctionner<br/>
              • Vérifiez les logs pour plus de détails
            </Typography>
          </Alert>
        )}

        {overallStatus === 'success' && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="subtitle2">
              Tous les tests sont passés avec succès ! L'API est accessible.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiConnectionTest;
