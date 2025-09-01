import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  useTheme,
  Paper,
  Avatar,
  Fade,
  Zoom,
  IconButton,
  Divider,
  useMediaQuery,
  Modal,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import axios from 'axios';
import {
  School as SchoolIcon,
  EmojiEvents as EmojiEventsIcon,
  Group as GroupIcon,
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Star as StarIcon,
  Computer as ComputerIcon,
  SportsSoccer as SportsSoccerIcon,
  Lightbulb as LightbulbIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Login as LoginIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Psychology as PsychologyIcon,
  Science as ScienceIcon,
  Language as LanguageIcon,
  MusicNote as MusicNoteIcon,
  Brush as BrushIcon,
  DirectionsRun as DirectionsRunIcon,
  Celebration as CelebrationIcon,
  AdminPanelSettings,
} from '@mui/icons-material';
import { blue, green, orange, purple, pink, indigo, teal, amber } from '@mui/material/colors';
import Registration from './Registration';
import ErrorBoundary from '../components/ErrorBoundary';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { RegistrationMinimal } from './Registration';

const Home = () => {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [showRegistration, setShowRegistration] = React.useState(false);
  const [showAdminLogin, setShowAdminLogin] = React.useState(false);

  // Gestionnaire de raccourci clavier pour afficher la connexion admin
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key === 'a') {
        event.preventDefault();
        setShowAdminLogin(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  // Statistiques impressionnantes
  const stats = [
    { number: '98%', label: 'Taux de réussite', icon: <TrendingUpIcon />, color: green[500] },
    { number: '500+', label: 'Élèves actifs', icon: <PeopleIcon />, color: blue[500] },
    { number: '25+', label: 'Années d\'expérience', icon: <SchoolIcon />, color: orange[500] },
    { number: '50+', label: 'Enseignants qualifiés', icon: <GroupIcon />, color: purple[500] },
  ];

  // Pourquoi nous choisir ?
  const features = [
    {
      title: 'Excellence Académique',
      description: 'Taux de réussite exceptionnel de 98% au brevet des collèges avec un suivi personnalisé',
      icon: <StarIcon />,
      color: blue[500],
      image: '/lycee3.jpg',
    },
    {
      title: 'Équipe Pédagogique',
      description: 'Enseignants expérimentés et dévoués, experts dans leurs domaines respectifs',
      icon: <GroupIcon />,
      color: green[500],
      image: '/image.jpg',
    },
  ];

  // Programmes d'études
  const programs = [
    {
      title: 'Sciences et Technologies',
      description: 'Mathématiques avancées, physique, chimie et informatique',
      icon: <ScienceIcon />,
      color: indigo[500],
      image: '/science.webp',
    },
    {
      title: 'Langues et Communication',
      description: 'Français, anglais, espagnol et techniques de communication',
      icon: <LanguageIcon />,
      color: teal[500],
      image: '/langue.webp',
    },
  ];

  // Valeurs
  const values = [
    {
      title: 'Innovation Pédagogique',
      description: 'Méthodes d\'enseignement modernes et adaptées',
      icon: <LightbulbIcon />,
      color: pink[500],
    },
    {
      title: 'Excellence Académique',
      description: 'Exigence et rigueur dans tous nos programmes',
      icon: <SchoolIcon />,
      color: blue[500],
    },
  ];

  // Actualités
  const news = [
    {
      title: 'Inscriptions 2024-2025 Ouvertes',
      date: '15 Mars 2024',
      description: "Les inscriptions pour l'année scolaire 2024-2025 sont maintenant ouvertes. Places limitées, inscrivez-vous dès maintenant !",
      icon: <CheckCircleIcon sx={{ color: green[500] }} />,
      image: '/lycee5.jpg',
      tag: 'Admission',
    },
    {
      title: 'Journée Portes Ouvertes',
      date: '20 Mars 2024',
      description: 'Venez découvrir notre établissement, rencontrer nos enseignants et visiter nos installations lors de notre journée portes ouvertes.',
      icon: <EventIcon sx={{ color: blue[500] }} />,
      image: '/lycee1.webp',
      tag: 'Événement',
    },
  ];

  // Témoignages
  const testimonials = [
    {
      name: 'Marie Konan',
      role: 'Parent d\'élève',
      content: '2ISE-GROUPE a transformé l\'avenir de mon enfant. L\'excellence académique et le suivi personnalisé sont remarquables.',
      avatar: '/2ISE.jpg',
    },
    {
      name: 'Dr. Kouassi Jean',
      role: 'Ancien élève',
      content: 'Grâce à 2ISE-GROUPE, j\'ai pu intégrer une grande université. Les bases solides acquises ici m\'accompagnent encore aujourd\'hui.',
      avatar: '/2ISE.jpg',
    },
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
      overflowX: 'hidden',
      width: '100%'
    }}>
      {/* Hero Section Amélioré */}
      <Fade in={true} timeout={1000}>
        <Box sx={{ 
          position: 'relative',
          p: { xs: 4, md: 12 }, 
          mb: 6, 
          background: `linear-gradient(135deg, rgba(25, 118, 210, 0.4) 0%, rgba(21, 101, 192, 0.5) 100%)`, 
          color: 'white', 
          textAlign: 'center',
          overflow: 'hidden',
          width: '100%',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url(/lycee4.jpg) center/cover',
            opacity: 0.8,
            zIndex: 0,
          }
        }}>
          <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1200px', mx: 'auto', px: { xs: 2, sm: 4, md: 6 } }}>
            <Typography variant="h1" component="h1" gutterBottom sx={{ 
              fontWeight: 800, 
              letterSpacing: 2,
              fontSize: { xs: '2.5rem', md: '4rem' },
              textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
            }}>
             2ISE-GROUPE
            </Typography>
            <Typography variant="h4" sx={{ 
              mb: 3, 
              opacity: 0.95,
              fontWeight: 300,
              fontSize: { xs: '1.5rem', md: '2rem' },
              textShadow: '1px 1px 3px rgba(0,0,0,0.7)'
            }}>
              L'Excellence Éducative depuis 1998
            </Typography>
            <Typography variant="h6" sx={{ 
              mb: 6, 
              opacity: 0.9,
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6,
              textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
            }}>
              Un établissement d'exception qui forme les leaders de demain avec des méthodes innovantes et un accompagnement personnalisé
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                onClick={() => setShowRegistration(true)}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  display: { xs: 'none', sm: 'inline-flex' },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 25px rgba(0,0,0,0.6)',
                  }
                }}
              >
                Pré-inscription 2025-2026
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  borderColor: 'white',
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  display: { xs: 'none', sm: 'inline-flex' },
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                  }
                }}
              >
                Découvrir Plus
              </Button>
            </Stack>
          </Box>
        </Box>
      </Fade>

      {/* Statistiques */}
      <Box sx={{ mb: 8, width: '100%', px: { xs: 2, sm: 4, md: 6 } }}>
        <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto' }}>
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={stat.label}>
                <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 3, 
                    bgcolor: 'white', 
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    }
                  }}>
                    <Avatar sx={{ 
                      width: 60, 
                      height: 60, 
                      bgcolor: stat.color, 
                      mb: 2, 
                      mx: 'auto',
                      fontSize: '1.5rem'
                    }}>
                      {stat.icon}
                    </Avatar>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 700, 
                      color: stat.color,
                      mb: 1
                    }}>
                      {stat.number}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* Pourquoi nous choisir ? */}
      <Box sx={{ mb: 8, width: '100%', px: { xs: 2, sm: 4, md: 6 } }}>
        <Box sx={{ width: '100%' }}>
          <Typography variant="h3" component="h2" gutterBottom sx={{ 
            textAlign: 'center', 
            mb: 6, 
            fontWeight: 700,
            color: theme.palette.primary.main
          }}>
            Pourquoi Choisir 2ISE-GROUPE ?
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={feature.title}>
              <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                  <Card sx={{ 
                    height: '100%', 
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    }
                  }}>
                    <Box sx={{ 
                      height: 300, 
                      background: `url(${feature.image}) center/cover`,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(45deg, ${feature.color}60, transparent)`,
                      }
                    }}>
                      <Avatar sx={{ 
                        width: 80, 
                        height: 80, 
                        bgcolor: feature.color, 
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        fontSize: '2rem',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                      }}>
                    {feature.icon}
                  </Avatar>
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ 
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                        mb: 2
                      }}>
                    {feature.title}
                  </Typography>
                      <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                    </CardContent>
                  </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
        </Box>
      </Box>

      {/* Mission & Vision */}
      <Box sx={{ mb: 8, width: '100%', px: { xs: 2, sm: 4, md: 6 } }}>
        <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto' }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Zoom in={true}>
                <Box sx={{ 
                  p: 6, 
                  height: '100%', 
                  borderRadius: 3, 
                  background: `linear-gradient(135deg, rgba(25, 118, 210, 0.4) 0%, rgba(21, 101, 192, 0.5) 100%)`, 
                  color: 'white', 
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'url(/lycee4.jpg) center/cover',
                    opacity: 0.7,
                    zIndex: 0,
                  }
                }}>
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                  Notre Mission
                </Typography>
                    <Typography sx={{ mb: 4, fontSize: '1.1rem', lineHeight: 1.8 }}>
                      Former les leaders de demain en offrant une éducation d'excellence, en développant le potentiel unique de chaque élève et en cultivant des valeurs humaines essentielles pour un monde meilleur.
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  component={RouterLink}
                  to="/secretary-login"
                  sx={{
                    opacity: 0,
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    pointerEvents: 'auto',
                    zIndex: 1,
                  }}
                  startIcon={<LoginIcon />}
                  tabIndex={0}
                  aria-label="Connexion Secrétaire (invisible)"
                >
                  Connexion Secrétaire
                </Button>
                  </Box>
              </Box>
            </Zoom>
          </Grid>
          <Grid item xs={12} md={6}>
            <Zoom in={true}>
                <Box sx={{ 
                  p: 6, 
                  height: '100%', 
                  borderRadius: 3, 
                  background: `linear-gradient(135deg, rgba(76, 175, 80, 0.4) 0%, rgba(56, 142, 60, 0.5) 100%)`, 
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'url(/lycee6.webp) center/cover',
                    opacity: 0.7,
                    zIndex: 0,
                  }
                }}>
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                  Notre Vision
                </Typography>
                    <Typography sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                      Être reconnu comme l'établissement d'excellence de référence en Côte d'Ivoire, préparant les élèves à exceller dans un monde en constante évolution tout en préservant leurs valeurs culturelles et humaines.
                </Typography>
                  </Box>
              </Box>
            </Zoom>
          </Grid>
        </Grid>
        </Box>
      </Box>

      {/* Programmes d'études */}
      <Box sx={{ mb: 8, width: '100%', px: { xs: 2, sm: 4, md: 6 } }}>
        <Box sx={{ width: '100%' }}>
          <Typography variant="h3" component="h2" gutterBottom sx={{ 
            textAlign: 'center', 
            mb: 6, 
            fontWeight: 700,
            color: theme.palette.primary.main
          }}>
            Nos Programmes d'Études
          </Typography>
          <Grid container spacing={4}>
            {programs.map((program, index) => (
              <Grid item xs={12} md={6} key={program.title}>
                <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                  <Card sx={{ 
                    height: '100%', 
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    }
                  }}>
                    <Box sx={{ 
                      height: 250, 
                      background: `url(${program.image}) center/cover`,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(45deg, ${program.color}60, transparent)`,
                      }
                    }}>
                      <Avatar sx={{ 
                        width: 70, 
                        height: 70, 
                        bgcolor: program.color, 
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        fontSize: '1.8rem',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                      }}>
                        {program.icon}
                      </Avatar>
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ 
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                        mb: 2
                      }}>
                        {program.title}
                      </Typography>
                      <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {program.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* Valeurs */}
      <Box sx={{ mb: 8, width: '100%', px: { xs: 2, sm: 4, md: 6 } }}>
        <Box sx={{ width: '100%' }}>
          <Typography variant="h3" component="h2" gutterBottom sx={{ 
            textAlign: 'center', 
            mb: 6, 
            fontWeight: 700,
            color: theme.palette.primary.main
          }}>
            Nos Valeurs Fondamentales
        </Typography>
        <Grid container spacing={4}>
          {values.map((value, index) => (
              <Grid item xs={12} md={6} key={value.title}>
              <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                  <Box sx={{ 
                    height: '100%', 
                    textAlign: 'center', 
                    p: 4, 
                    bgcolor: 'white', 
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    }
                  }}>
                    <Avatar sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: value.color, 
                      mb: 3, 
                      mx: 'auto',
                      fontSize: '2rem',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}>
                    {value.icon}
                  </Avatar>
                    <Typography variant="h6" gutterBottom sx={{ 
                      fontWeight: 700,
                      color: theme.palette.primary.main,
                      mb: 2
                    }}>
                    {value.title}
                  </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {value.description}
                  </Typography>
                </Box>
              </Zoom>
            </Grid>
          ))}
        </Grid>
        </Box>
      </Box>

      {/* Témoignages */}
      <Box sx={{ mb: 8, width: '100%', px: { xs: 2, sm: 4, md: 6 } }}>
        <Box sx={{ width: '100%' }}>
          <Typography variant="h3" component="h2" gutterBottom sx={{ 
            textAlign: 'center', 
            mb: 6, 
            fontWeight: 700,
            color: theme.palette.primary.main
          }}>
            Ce que disent nos parents et élèves
          </Typography>
          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={6} key={testimonial.name}>
                <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                  <Card sx={{ 
                    height: '100%', 
                    p: 4, 
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar 
                        src={testimonial.avatar}
                        sx={{ width: 60, height: 60, mr: 2 }}
                      />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {testimonial.name}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          {testimonial.role}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ 
                      fontStyle: 'italic', 
                      lineHeight: 1.6,
                      color: 'text.primary'
                    }}>
                      "{testimonial.content}"
                    </Typography>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* Dernières actualités */}
      <Box sx={{ mb: 8, width: '100%', px: { xs: 2, sm: 4, md: 6 } }}>
        <Box sx={{ width: '100%' }}>
          <Typography variant="h3" component="h2" gutterBottom sx={{ 
            textAlign: 'center', 
            mb: 6, 
            fontWeight: 700,
            color: theme.palette.primary.main
          }}>
            Dernières Actualités
        </Typography>
        <Grid container spacing={4}>
          {news.map((item, index) => (
              <Grid item xs={12} md={6} key={item.title}>
              <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                  <Card sx={{ 
                    height: '100%', 
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    }
                  }}>
                    <Box sx={{ 
                      height: 300, 
                      background: `url(${item.image}) center/cover`,
                      position: 'relative'
                    }}>
                      <Chip 
                        label={item.tag}
                        sx={{ 
                          position: 'absolute',
                          top: 16,
                          left: 16,
                          bgcolor: 'rgba(255,255,255,0.9)',
                          fontWeight: 600
                        }}
                      />
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {item.icon}
                        <Typography variant="h6" sx={{ fontWeight: 600, ml: 1 }}>
                      {item.title}
                    </Typography>
                  </Box>
                      <Typography color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                    {item.date}
                  </Typography>
                      <Typography sx={{ lineHeight: 1.6 }}>
                    {item.description}
                  </Typography>
                    </CardContent>
                  </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
        </Box>
      </Box>

      {/* Call to action amélioré */}
      <Box sx={{ 
        mb: 8, 
        textAlign: 'center', 
        width: '100%', 
        px: { xs: 2, sm: 4, md: 6 },
        py: 8,
        background: `linear-gradient(135deg, rgba(255, 193, 7, 0.8) 0%, rgba(255, 152, 0, 0.9) 100%)`,
        borderRadius: 3,
        color: 'white'
      }}>
        <Box sx={{ width: '100%', maxWidth: '800px', mx: 'auto' }}>
          <Typography variant="h3" sx={{ mb: 3, fontWeight: 700 }}>
            Rejoignez l'Excellence
        </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, lineHeight: 1.6 }}>
            Découvrez l'excellence académique et le développement personnel à 2ISE-GROUPE
        </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            onClick={() => setShowRegistration(true)}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
            >
              Pré-inscription Élève
            </Button>
            {showAdminLogin && (
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/secretary-login')}
                startIcon={<AdminPanelSettings />}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                }}
              >
                Connexion Admin
          </Button>
        )}
          </Stack>
        </Box>
      </Box>

      {/* Formulaire d'inscription minimaliste sur mobile */}
      {isMobile && (
        <Box sx={{ mb: 8, width: '100%', px: { xs: 2, sm: 4, md: 6 } }}>
          <RegistrationMinimal />
        </Box>
      )}

      {/* Footer amélioré */}
        <Box sx={{ mb: 0, width: '100%', position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ 
          p: 8, 
            borderRadius: 0, 
          background: `linear-gradient(135deg, rgba(25, 118, 210, 0.9) 0%, rgba(21, 101, 192, 1) 100%)`, 
            color: 'white', 
            width: '100vw',
            position: 'relative',
            left: '50%',
            transform: 'translateX(-50%)',
            boxSizing: 'border-box'
          }}>
          <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto' }}>
              <Grid container spacing={6}>
                <Grid item xs={12} md={4}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
                  À propos de 2ISE-GROUPE
                  </Typography>
                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                  2ISE-GROUPE est un établissement d'enseignement secondaire reconnu pour son excellence académique, 
                  son innovation pédagogique et son engagement envers le développement intégral de chaque élève.
                  </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                  <IconButton sx={{ 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}>
                    <FacebookIcon />
                  </IconButton>
                  <IconButton sx={{ 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}>
                    <TwitterIcon />
                  </IconButton>
                  <IconButton sx={{ 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}>
                    <InstagramIcon />
                  </IconButton>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
                  Contactez-nous
                  </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <LocationOnIcon sx={{ mr: 2, color: 'rgba(255,255,255,0.8)' }} />
                  <Typography>Angré Chateau fin Goudron, Abidjan</Typography>
                  </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PhoneIcon sx={{ mr: 2, color: 'rgba(255,255,255,0.8)' }} />
                  <Typography>+225 0709531488</Typography>
                  </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <EmailIcon sx={{ mr: 2, color: 'rgba(255,255,255,0.8)' }} />
                    <Typography>info@2ise-groupe.com</Typography>
                  </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <EventIcon sx={{ mr: 2, color: 'rgba(255,255,255,0.8)' }} />
                  <Typography>Lun-Ven: 7h30-17h30</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
                    Liens rapides
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography sx={{ 
                    cursor: 'pointer', 
                    '&:hover': { textDecoration: 'underline' },
                    transition: 'all 0.3s ease'
                  }}>
                    À propos de nous
                  </Typography>
                  <Typography sx={{ 
                    cursor: 'pointer', 
                    '&:hover': { textDecoration: 'underline' },
                    transition: 'all 0.3s ease'
                  }}>
                    Admission et inscriptions
                  </Typography>
                  <Typography sx={{ 
                    cursor: 'pointer', 
                    '&:hover': { textDecoration: 'underline' },
                    transition: 'all 0.3s ease'
                  }}>
                    Programmes d'études
                  </Typography>
                  <Typography sx={{ 
                    cursor: 'pointer', 
                    '&:hover': { textDecoration: 'underline' },
                    transition: 'all 0.3s ease'
                  }}>
                    Événements et actualités
                  </Typography>
                  <Typography sx={{ 
                    cursor: 'pointer', 
                    '&:hover': { textDecoration: 'underline' },
                    transition: 'all 0.3s ease'
                  }}>
                    Contact et localisation
                  </Typography>
                  </Box>
                </Grid>
              </Grid>
            <Box sx={{ 
              mt: 8, 
              pt: 4, 
              borderTop: '1px solid rgba(255, 255, 255, 0.2)', 
              textAlign: 'center' 
            }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                © 2025 2ISE-GROUPE. Tous droits réservés. | Excellence éducative depuis 1998
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

      {/* Modale d'inscription sur desktop */}
      {!isMobile && (
        <Modal
          open={showRegistration}
          onClose={() => setShowRegistration(false)}
          aria-labelledby="modal-inscription"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <Box
            sx={{
              width: { xs: '100vw', sm: 500, md: 700 },
              maxWidth: { xs: '100vw', sm: '98vw' },
              height: { xs: '100vh', sm: 'auto' },
              maxHeight: { xs: '100vh', sm: '98vh' },
              overflowY: 'auto',
              borderRadius: 0,
              boxShadow: 0,
              bgcolor: 'background.paper',
              p: { xs: 1, sm: 3, md: 4 },
              m: 0,
              transition: 'all 0.3s',
            }}
          >
            <ErrorBoundary>
              <Registration onClose={() => setShowRegistration(false)} />
            </ErrorBoundary>
          </Box>
        </Modal>
      )}
    </Box>
  );
};

export default Home; 