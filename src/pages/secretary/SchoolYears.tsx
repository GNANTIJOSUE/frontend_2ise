import React, { useState } from 'react';
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
  Fade,
  Zoom,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  School as SchoolIcon,
  PersonAdd as PersonAddIcon,
  CalendarMonth as CalendarMonthIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SecretarySidebar from '../../components/SecretarySidebar';

const SchoolYears = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleManageInscriptions = () => {
    navigate('/secretary/inscription-control');
  };

  const handleManageSchoolYears = () => {
    navigate('/secretary/school-years-management');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <SecretarySidebar />
      <Box sx={{ flexGrow: 1, p: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {/* Header avec animation */}
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
                <CalendarMonthIcon sx={{ fontSize: 48 }} />
                <Typography variant="h3" component="h1" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                  Gestion Académique
                </Typography>
              </Box>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}>
                Gérez les années scolaires et contrôlez les inscriptions des étudiants avec une interface intuitive et moderne
              </Typography>
            </Box>
          </Fade>

          {/* Cartes principales avec animations */}
          <Grid container spacing={4}>
            {/* Gérer les inscriptions */}
            <Grid item xs={12} md={6}>
              <Zoom in={true} timeout={1200}>
                <Card 
                  elevation={8}
                  sx={{
                    height: '100%',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                      '& .card-bg': {
                        transform: 'scale(1.1)',
                      }
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                      zIndex: 1
                    }
                  }}
                  onClick={handleManageInscriptions}
                >
                  <Box className="card-bg" sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    transition: 'transform 0.4s ease',
                    zIndex: 0
                  }} />
                  <CardContent sx={{ p: 5, textAlign: 'center', position: 'relative', zIndex: 2 }}>
                    <Box sx={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      mb: 3,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <PersonAddIcon sx={{ fontSize: 60, color: 'white' }} />
                    </Box>
                    <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                      Gérer les inscriptions
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 4, opacity: 0.9, lineHeight: 1.6 }}>
                      Ouvrir ou fermer les inscriptions, gérer les demandes d'inscription 
                      et contrôler l'accès des nouveaux étudiants au système.
                    </Typography>
                    
                    <Button
                      variant="contained"
                      size="large"
                      sx={{
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: '2px solid rgba(255,255,255,0.3)',
                        backdropFilter: 'blur(10px)',
                        px: 4,
                        py: 1.5,
                        borderRadius: 3,
                        fontWeight: 600,
                        '&:hover': {
                          background: 'rgba(255,255,255,0.3)',
                          transform: 'translateY(-2px)',
                        }
                      }}
                    >
                      Accéder
                      <ArrowForwardIcon sx={{ ml: 1 }} />
                    </Button>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>

            {/* Gérer les années scolaires */}
            <Grid item xs={12} md={6}>
              <Zoom in={true} timeout={1400}>
                <Card 
                  elevation={8}
                  sx={{
                    height: '100%',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                      '& .card-bg': {
                        transform: 'scale(1.1)',
                      }
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                      zIndex: 1
                    }
                  }}
                  onClick={handleManageSchoolYears}
                >
                  <Box className="card-bg" sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    transition: 'transform 0.4s ease',
                    zIndex: 0
                  }} />
                  <CardContent sx={{ p: 5, textAlign: 'center', position: 'relative', zIndex: 2 }}>
                    <Box sx={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      mb: 3,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <SchoolIcon sx={{ fontSize: 60, color: 'white' }} />
                    </Box>
                    <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                      Gérer les années scolaires
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 4, opacity: 0.9, lineHeight: 1.6 }}>
                      Créer, modifier et configurer les années scolaires, 
                      définir les périodes d'inscription et les paramètres académiques.
                    </Typography>
                    
                    <Button
                      variant="contained"
                      size="large"
                      sx={{
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: '2px solid rgba(255,255,255,0.3)',
                        backdropFilter: 'blur(10px)',
                        px: 4,
                        py: 1.5,
                        borderRadius: 3,
                        fontWeight: 600,
                        '&:hover': {
                          background: 'rgba(255,255,255,0.3)',
                          transform: 'translateY(-2px)',
                        }
                      }}
                    >
                      Accéder
                      <ArrowForwardIcon sx={{ ml: 1 }} />
                    </Button>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          </Grid>

          {/* Section d'informations avec design moderne */}
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
                      📝 Gestion des inscriptions
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Contrôlez quand les nouveaux étudiants peuvent s'inscrire 
                      et gérez les demandes d'inscription en attente avec une interface intuitive.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 3, borderRadius: 2, background: 'rgba(240, 147, 251, 0.1)', border: '1px solid rgba(240, 147, 251, 0.2)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.secondary.main, mb: 2 }}>
                      🎓 Années scolaires
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Configurez les périodes académiques, les trimestres 
                      et les paramètres spécifiques à chaque année scolaire.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Fade>

          {/* Barre de progression décorative */}
          <Box sx={{ mt: 4, mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={100} 
              sx={{ 
                height: 4, 
                borderRadius: 2,
                background: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                  borderRadius: 2
                }
              }} 
            />
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default SchoolYears; 