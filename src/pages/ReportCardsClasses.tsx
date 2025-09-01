import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, List, ListItemButton, ListItemText, CircularProgress, Alert, Stack, Card, CardContent } from '@mui/material';
import axios from 'axios';
import SecretarySidebar from '../components/SecretarySidebar';

const ReportCardsClasses = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Définition de l'ordre des niveaux de la 6ème à la Terminale
  const niveauOrder = [
    "6ème", "5ème", "4ème", "3ème", "Seconde", "Première", "Terminale"
  ];

  // Fonction pour obtenir l'index d'un niveau
  function getNiveauIndex(niveau: string) {
    return niveauOrder.indexOf(niveau);
  }

  // Fonction pour trier les classes par niveau
  const sortClassesByLevel = (classesList: any[]) => {
    return classesList.sort((a, b) => {
      const niveauA = a.level || '';
      const niveauB = b.level || '';
      const indexA = getNiveauIndex(niveauA);
      const indexB = getNiveauIndex(niveauB);
      
      // Si les deux niveaux sont dans la liste, les trier par ordre
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // Si un seul niveau est dans la liste, le mettre en premier
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // Si aucun niveau n'est dans la liste, trier alphabétiquement
      return niveauA.localeCompare(niveauB);
    });
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchClasses = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('https://2ise-groupe.com/api/classes/list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isMounted) {
          // Trier les classes par niveau avant de les définir
          const sortedClasses = sortClassesByLevel(res.data);
          setClasses(sortedClasses);
        }
      } catch (err: any) {
        if (isMounted) setError(err.response?.data?.message || 'Erreur lors du chargement des classes.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchClasses();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #e3f0ff 0%, #f8e1ff 100%)' }}>
      <SecretarySidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Paper sx={{ p: 4, borderRadius: 5, boxShadow: '0 8px 32px rgba(80, 36, 204, 0.10)', background: 'rgba(255,255,255,0.95)' }}>
            <Typography variant="h4" fontWeight={800} sx={{ color: 'primary.main', mb: 3, letterSpacing: 1 }} gutterBottom>
              Gestion des bulletins <span style={{ color: '#8e24aa' }}>- Choisissez une classe</span>
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
                <CircularProgress size={40} thickness={5} sx={{ color: 'primary.main' }} />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <Stack spacing={3} direction="column" sx={{ mt: 2 }}>
                {classes.map((classe) => (
                  <Card
                    key={classe.id}
                    elevation={3}
                    sx={{
                      borderRadius: 4,
                      background: 'linear-gradient(90deg, #e3f0ff 60%, #f8e1ff 100%)',
                      boxShadow: '0 4px 16px rgba(80,36,204,0.07)',
                      transition: 'transform 0.18s, box-shadow 0.18s',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px) scale(1.03)',
                        boxShadow: '0 8px 32px rgba(142,36,170,0.13)',
                        background: 'linear-gradient(90deg, #d1c4e9 60%, #b39ddb 100%)',
                      },
                    }}
                    onClick={() => navigate(`/secretary/report-cards/${classe.id}`)}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        {classe.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Niveau : <b>{classe.level || ''}</b>
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default ReportCardsClasses; 