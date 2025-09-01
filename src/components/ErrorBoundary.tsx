import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRefresh = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
            bgcolor: '#f5f5f5'
          }}
        >
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              maxWidth: 600,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Typography variant="h6" gutterBottom>
              Une erreur s'est produite
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              L'application a rencontré un problème inattendu. Cela peut être dû à :
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Une perte de connexion réseau</li>
              <li>Un problème temporaire du serveur</li>
              <li>Une erreur dans l'interface utilisateur</li>
            </ul>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              <strong>Détails techniques :</strong> {this.state.error?.message}
            </Typography>
          </Alert>
          
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={this.handleRefresh}
            sx={{ mt: 2 }}
          >
            Recharger la page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 