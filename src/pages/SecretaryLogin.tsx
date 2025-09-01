import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  IconButton,
  InputAdornment,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { blue, green, purple } from '@mui/material/colors';
import axios from 'axios';

const SecretaryLogin = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'success',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setSnackbar({
        open: true,
        message: 'Veuillez remplir tous les champs',
        severity: 'error',
      });
      return;
    }

    try {
              const response = await axios.post('https://2ise-groupe.com/api/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      if (response.data.status === 'success') {
        const userData = response.data.data.user;
        
        // Vérifier que l'utilisateur a un rôle administratif
        const adminRoles = [
          'admin', 'secretary', 'éducateur', 'comptable',
          'directeur_etudes', 'directeur_general', 'censeur',
          'proviseur', 'principal', 'econome'
        ];

        if (!adminRoles.includes(userData.role)) {
          setSnackbar({
            open: true,
            message: 'Accès refusé. Seuls les administrateurs peuvent se connecter ici.',
            severity: 'error',
          });
          return;
        }

        // Stocker le token et les informations utilisateur dans le localStorage
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(userData));

        console.log('=== [DEBUG] Connexion réussie ===');
        console.log('Token:', response.data.data.token);
        console.log('User:', userData);
        console.log('Redirection vers /secretary/dashboard dans 1 seconde...');

        setSnackbar({
          open: true,
          message: `Connexion réussie ! Bienvenue ${userData.first_name || userData.email}`,
          severity: 'success',
        });

        setTimeout(() => {
          console.log('=== [DEBUG] Tentative de redirection ===');
          // Forcer la redirection avec window.location
          console.log('Redirection forcée vers /secretary/dashboard');
          window.location.href = '/secretary/dashboard';
        }, 1000);
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Erreur lors de la connexion',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${purple[50]} 0%, ${blue[50]} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <AdminPanelSettingsIcon
              sx={{
                fontSize: 64,
                color: 'primary.main',
                mb: 2,
              }}
            />
            <Typography variant="h4" component="h1" gutterBottom fontWeight={700} color="primary.main">
              Connexion Administrateur
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Connectez-vous avec vos identifiants administratifs
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: 16,
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 600,
                },
              }}
            />

            <TextField
              fullWidth
              label="Mot de passe"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: 16,
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 600,
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                fontSize: 16,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2 0%, #512da8 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #4527a0 100%)',
                },
              }}
            >
              Se connecter
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Accès réservé aux administrateurs de l'établissement
            </Typography>
          </Box>
        </Paper>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SecretaryLogin; 