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
  Alert,
  Chip,
  Fade,
  Zoom,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  School as SchoolIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Settings as SettingsIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SecretarySidebar from '../../components/SecretarySidebar';

interface SchoolYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_current: boolean;
}

const SchoolYearsManagement = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<SchoolYear | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false
  });

  // Charger les années scolaires au montage du composant
  useEffect(() => {
    fetchSchoolYears();
  }, []);

  const fetchSchoolYears = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://2ise-groupe.com/api/school-years', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchoolYears(data);
      } else {
        setError('Erreur lors du chargement des années scolaires');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateYear = () => {
    setEditingYear(null);
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      is_active: false
    });
    setDialogOpen(true);
  };

  const handleEditYear = (year: SchoolYear) => {
    setEditingYear(year);
    setFormData({
      name: year.name,
      start_date: year.start_date,
      end_date: year.end_date,
      is_active: year.is_active
    });
    setDialogOpen(true);
  };

  const handleSaveYear = async () => {
    try {
      const url = editingYear 
        ? `https://2ise-groupe.com/api/school-years/${editingYear.id}`
        : 'https://2ise-groupe.com/api/school-years';
      
      const method = editingYear ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuccess(editingYear 
          ? `Année scolaire ${formData.name} mise à jour avec succès`
          : `Année scolaire ${formData.name} créée avec succès`
        );
        setDialogOpen(false);
        fetchSchoolYears(); // Recharger la liste
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
      console.error('Erreur:', err);
    }
  };



  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <SchoolIcon /> : <LockIcon />;
  };

  const handleCloseYear = async (yearId: number) => {
    try {
      const response = await fetch(`https://2ise-groupe.com/api/school-years/${yearId}/close`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        fetchSchoolYears(); // Recharger la liste
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la fermeture de l\'année scolaire');
      }
    } catch (err) {
      setError('Erreur lors de la fermeture de l\'année scolaire');
      console.error('Erreur:', err);
    }
  };

  const handleGenerateCurrentYear = async () => {
    try {
      const response = await fetch('https://2ise-groupe.com/api/school-years/generate-current', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        fetchSchoolYears(); // Recharger la liste
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la génération de l\'année courante');
      }
    } catch (err) {
      setError('Erreur lors de la génération de l\'année courante');
      console.error('Erreur:', err);
    }
  };

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
                <SchoolIcon sx={{ fontSize: 48 }} />
                <Typography variant="h3" component="h1" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                  Gestion des Années Scolaires
                </Typography>
              </Box>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}>
                Créez, modifiez et gérez les années scolaires avec leurs paramètres
              </Typography>
            </Box>
          </Fade>

          {/* Boutons d'action */}
          <Box sx={{ mb: 4, textAlign: 'center', display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={handleCreateYear}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                px: 4,
                py: 2,
                borderRadius: 3,
                fontWeight: 600,
                fontSize: '1.1rem',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              Créer une nouvelle année scolaire
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<SchoolIcon />}
              onClick={handleGenerateCurrentYear}
              sx={{
                borderColor: theme.palette.success.main,
                color: theme.palette.success.main,
                px: 4,
                py: 2,
                borderRadius: 3,
                fontWeight: 600,
                fontSize: '1.1rem',
                '&:hover': {
                  borderColor: theme.palette.success.dark,
                  backgroundColor: 'rgba(76, 175, 80, 0.04)',
                }
              }}
            >
              Générer l'année courante
            </Button>
          </Box>

          {/* Messages d'alerte */}
          {error && (
            <Fade in={true}>
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            </Fade>
          )}
          
          {success && (
            <Fade in={true}>
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            </Fade>
          )}

          {/* Loading */}
          {loading && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                Chargement des années scolaires...
              </Typography>
            </Box>
          )}

          {/* Liste des années scolaires */}
          <Grid container spacing={3}>
            {schoolYears.map((year, index) => (
              <Grid item xs={12} md={6} lg={4} key={year.id}>
                <Zoom in={true} timeout={800 + index * 200}>
                  <Card 
                    elevation={8}
                    sx={{
                      height: '100%',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: year.is_current 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-4px) scale(1.02)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4, textAlign: 'center', position: 'relative' }}>
                      {/* Badge année courante */}
                      {year.is_current && (
                        <Chip
                          label="Année Courante"
                          color="primary"
                          sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      )}
                      
                      {/* Badge année fermée */}
                      {!year.is_active && (
                        <Chip
                          label="Année Fermée"
                          color="error"
                          sx={{
                            position: 'absolute',
                            top: year.is_current ? 56 : 16,
                            right: 16,
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      )}

                      {/* Icône de statut */}
                      <Box sx={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        mb: 3,
                        backdropFilter: 'blur(10px)'
                      }}>
                        {getStatusIcon(year.is_active)}
                      </Box>

                      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                        {year.name}
                      </Typography>

                      <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
                        {year.start_date} - {year.end_date}
                      </Typography>


                      
                      {/* Statut de l'année */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                        <Chip
                          icon={<SchoolIcon />}
                          label={year.is_active ? 'Année Active' : 'Année Fermée'}
                          color={year.is_active ? 'success' : 'error'}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>

                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        {year.is_active ? (
                          <>
                            <Tooltip title="Modifier">
                              <IconButton
                                onClick={() => handleEditYear(year)}
                                sx={{
                                  color: 'white',
                                  border: '1px solid rgba(255,255,255,0.3)',
                                  '&:hover': {
                                    background: 'rgba(255,255,255,0.1)',
                                  }
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            

                            
                            <Tooltip title="Fermer l'année scolaire">
                              <IconButton
                                onClick={() => handleCloseYear(year.id)}
                                sx={{
                                  color: 'white',
                                  border: '1px solid rgba(255,255,255,0.3)',
                                  '&:hover': {
                                    background: 'rgba(255,255,255,0.1)',
                                  }
                                }}
                              >
                                <SchoolIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                            Année fermée - Aucune modification possible
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>

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
                      ?? Création d'année scolaire
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Créez de nouvelles années scolaires avec leurs périodes et paramètres spécifiques.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 3, borderRadius: 2, background: 'rgba(240, 147, 251, 0.1)', border: '1px solid rgba(240, 147, 251, 0.2)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.secondary.main, mb: 2 }}>
                      ?? Gestion des années scolaires
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Ouvrez et fermez les années scolaires pour contrôler l'accès aux données.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Fade>
        </Container>

        {/* Dialog pour créer/modifier une année scolaire */}
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SchoolIcon />
              <Typography variant="h6">
                {editingYear ? 'Modifier l\'année scolaire' : 'Créer une nouvelle année scolaire'}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nom de l'année scolaire"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: 2024-2025"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date de début"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date de fin"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      color="primary"
                    />
                  }
                  label="Année active"
                />
              </Grid>

            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSaveYear}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                }
              }}
            >
              {editingYear ? 'Modifier' : 'Créer'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default SchoolYearsManagement;
