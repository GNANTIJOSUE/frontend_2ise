import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  Button,
  useTheme
} from '@mui/material';
import {
  Lock as LockIcon,
  Info as InfoIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface InscriptionClosedMessageProps {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
}

const InscriptionClosedMessage: React.FC<InscriptionClosedMessageProps> = ({
  title = "Inscriptions Fermées",
  message = "Les inscriptions sont actuellement fermées. Veuillez revenir plus tard ou contacter l'administration pour plus d'informations.",
  showHomeButton = true
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        p: 3
      }}
    >
      <Paper
        elevation={8}
        sx={{
          maxWidth: 600,
          width: '100%',
          p: 4,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 4
        }}
      >
        {/* Icône */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            mb: 3,
            backdropFilter: 'blur(10px)'
          }}
        >
          <LockIcon sx={{ fontSize: 50, color: 'white' }} />
        </Box>

        {/* Titre */}
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            mb: 2,
            color: 'white'
          }}
        >
          {title}
        </Typography>

        {/* Message */}
        <Typography
          variant="body1"
          sx={{
            mb: 4,
            opacity: 0.9,
            lineHeight: 1.6,
            color: 'white'
          }}
        >
          {message}
        </Typography>

        {/* Alert avec informations supplémentaires */}
        <Alert
          severity="info"
          icon={<InfoIcon />}
          sx={{
            mb: 3,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            '& .MuiAlert-icon': {
              color: 'white'
            }
          }}
        >
          <AlertTitle sx={{ color: 'white', fontWeight: 600 }}>
            Informations importantes
          </AlertTitle>
          Les inscriptions sont temporairement suspendues. Cette mesure permet de :
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Traiter les demandes en cours</li>
            <li>Préparer la nouvelle année scolaire</li>
            <li>Maintenir la qualité du service</li>
          </ul>
        </Alert>

        {/* Boutons d'action */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {showHomeButton && (
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
              sx={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(10px)',
                px: 3,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                '&:hover': {
                  background: 'rgba(255,255,255,0.3)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              Retour à l'accueil
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default InscriptionClosedMessage; 