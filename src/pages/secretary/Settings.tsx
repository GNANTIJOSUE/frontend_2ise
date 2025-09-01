import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
  IconButton,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import SecretarySidebar from '../../components/SecretarySidebar';
import axios from 'axios';

const Settings = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored === 'true';
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Token d'authentification manquant.");
      setLoading(false);
      return;
    }
    axios.get('https://2ise-groupe.com/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setProfile(res.data);
        setEmail(res.data.email);
        setError(null);
      })
      .catch(() => {
        setError("Impossible de charger les informations du compte.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSaveEmail = async () => {
    if (!email) {
      setSnackbar({ open: true, message: "L'email ne peut pas être vide.", severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('https://2ise-groupe.com/api/auth/admins/' + profile.id, { email }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar({ open: true, message: 'Email modifié avec succès.', severity: 'success' });
      setProfile({ ...profile, email });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Erreur lors de la modification de l\'email.', severity: 'error' });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setSnackbar({ open: true, message: 'Veuillez remplir tous les champs du mot de passe.', severity: 'error' });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setSnackbar({ open: true, message: 'Les nouveaux mots de passe ne correspondent pas.', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('https://2ise-groupe.com/api/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar({ open: true, message: 'Mot de passe modifié avec succès.', severity: 'success' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Erreur lors du changement de mot de passe.', severity: 'error' });
    }
    setSaving(false);
  };

  const handleDarkModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDarkMode(event.target.checked);
    localStorage.setItem('darkMode', event.target.checked ? 'true' : 'false');
    window.dispatchEvent(new Event('darkModeChanged'));
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SecretarySidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%' }}>
        <Container maxWidth="sm">
          <Typography variant="h4" component="h1" gutterBottom>
            Mon compte
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}><CircularProgress /></Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : profile && (
            <>
              <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>Informations du compte</Typography>
                <TextField
                  label="Rôle"
                  value={profile.role}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Email"
                  value={email}
                  onChange={handleEmailChange}
                  fullWidth
                  margin="normal"
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveEmail}
                  sx={{ mt: 2 }}
                  disabled={saving}
                >
                  Sauvegarder l'email
                </Button>
                <FormControlLabel
                  control={<Switch checked={darkMode} onChange={handleDarkModeChange} color="primary" />}
                  label="Mode sombre"
                  sx={{ mt: 3 }}
                />
              </Paper>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Changer le mot de passe</Typography>
                <TextField
                  label="Mot de passe actuel"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwords.currentPassword}
                  onChange={handlePasswordsChange}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showCurrentPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                          onClick={() => setShowCurrentPassword((show) => !show)}
                          edge="end"
                        >
                          {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Nouveau mot de passe"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwords.newPassword}
                  onChange={handlePasswordsChange}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                          onClick={() => setShowNewPassword((show) => !show)}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Confirmer le nouveau mot de passe"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwords.confirmPassword}
                  onChange={handlePasswordsChange}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                          onClick={() => setShowConfirmPassword((show) => !show)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleChangePassword}
                  sx={{ mt: 2 }}
                  disabled={saving}
                >
                  Changer le mot de passe
                </Button>
              </Paper>
            </>
          )}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </Box>
  );
};

export default Settings; 