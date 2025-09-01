import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  CircularProgress, 
  Button, 
  Fade,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import axios from 'axios';
import BulletinPDF, { BulletinPDFRef } from './BulletinPDF';

// Helpers pour l'année scolaire
function getCurrentSchoolYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 9) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

function getSchoolYears(count = 5) {
  const current = getCurrentSchoolYear();
  const startYear = parseInt(current.split('-')[0], 10);
  return Array.from({ length: count }, (_, i) => {
    const start = startYear - i;
    return `${start}-${start + 1}`;
  });
}

const SCHOOL_YEARS = getSchoolYears(5);

const StudentReportCard = () => {
  const { studentId, classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Récupère l'année scolaire depuis l'URL ou par défaut l'année courante
  const queryParams = new URLSearchParams(location.search);
  const [schoolYear, setSchoolYear] = useState(queryParams.get('school_year') || getCurrentSchoolYear());
  

  
  const [student, setStudent] = useState<any>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trimesterRank, setTrimesterRank] = useState<{ rank: number; total: number; moyenne: number | null } | null>(null);
  const [selectedTrimester, setSelectedTrimester] = useState<string>('1er trimestre');
  const [rangClasse, setRangClasse] = useState<string | number | null>(null);
  const [moyenneClasse, setMoyenneClasse] = useState<number | null>(null);
  const [appreciation, setAppreciation] = useState<string>('Passable');
  const bulletinRef = useRef<BulletinPDFRef>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        if (isMounted) navigate('/secretary-login');
        return;
      }
      try {
        const studentRes = await axios.get(`https://2ise-groupe.com/api/students/${studentId}?school_year=${schoolYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!isMounted) return;
        setStudent(studentRes.data);
        const gradesRes = await axios.get(`https://2ise-groupe.com/api/students/${studentId}/grades?school_year=${schoolYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isMounted) {
          setGrades(gradesRes.data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Erreur lors du chargement du bulletin.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [studentId, schoolYear, navigate]);

  useEffect(() => {
    if (!student) return;
    if (grades.length === 0) return;
    const semester = selectedTrimester;
    if (!semester) return;
    const fetchRank = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(
          `https://2ise-groupe.com/api/students/${student.id}/trimester-rank?semester=${encodeURIComponent(semester)}&school_year=${schoolYear}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTrimesterRank(data);
        setRangClasse(data.rank + ' / ' + data.total);
        setMoyenneClasse(data.moyenne);
      } catch (err) {
        setTrimesterRank(null);
        setRangClasse(null);
        setMoyenneClasse(null);
      }
    };
    fetchRank();
  }, [student, grades, schoolYear, selectedTrimester]);

  // Filtrer les notes par trimestre sélectionné
  const gradesForTrimester = grades.filter(g => g.semester === selectedTrimester);
  
  // Calculs totaux pour le trimestre sélectionné
  const totalCoef = gradesForTrimester.reduce((acc, g) => acc + (g.coefficient || 1), 0);
  const totalMoyCoef = gradesForTrimester.reduce((acc, g) => acc + (g.moyenne * (g.coefficient || 1)), 0);
  const moyenneTrimestrielle = totalCoef ? (totalMoyCoef / totalCoef) : 0;

  // Calcul du nombre de matières avec moyenne >= 10
  const matieresReussies = gradesForTrimester.filter(g => g.moyenne >= 10).length;
  const tauxReussite = gradesForTrimester.length > 0 ? (matieresReussies / gradesForTrimester.length) * 100 : 0;

  // Fonction pour déclencher l'impression
  const handlePrintClick = () => {
    if (bulletinRef.current && bulletinRef.current.handlePrintBulletin) {
      bulletinRef.current.handlePrintBulletin();
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Fade in={true} timeout={1000}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={80} sx={{ color: 'white', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              Chargement du bulletin...
            </Typography>
          </Box>
        </Fade>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', maxWidth: 500 }}>
          <Typography color="error" variant="h6" sx={{ mb: 2 }}>{error}</Typography>
          <Button variant="contained" onClick={() => navigate(`/secretary/report-cards/${classId}`)}>
            Retour à la classe
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: { xs: 2, sm: 4 },
      overflowX: 'auto' // Allow horizontal scroll on mobile
    }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
        {/* Header avec bouton retour */}
        <Box sx={{ mb: { xs: 2, sm: 4 } }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/secretary/report-cards/${classId}`)}
            sx={{ 
              mb: { xs: 2, sm: 3 },
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            ← Retour à la classe
          </Button>
        </Box>

        {/* Sélecteur d'année scolaire et trimestre */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mb: { xs: 2, sm: 3 }, 
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <FormControl sx={{ minWidth: { xs: '100%', sm: 160 } }} size="small">
            <InputLabel id="school-year-label">Année scolaire</InputLabel>
            <Select
              labelId="school-year-label"
              value={schoolYear}
              label="Année scolaire"
              onChange={e => {
                setSchoolYear(e.target.value);
              }}
            >
              {SCHOOL_YEARS.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: { xs: '100%', sm: 160 } }} size="small">
            <InputLabel id="trimester-label">Trimestre</InputLabel>
            <Select
              labelId="trimester-label"
              value={selectedTrimester}
              label="Trimestre"
              onChange={e => setSelectedTrimester(e.target.value)}
            >
              <MenuItem value="1er trimestre">1er trimestre</MenuItem>
              <MenuItem value="2 ème trimestre">2e trimestre</MenuItem>
              <MenuItem value="3 ème trimestre">3e trimestre</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Bouton de téléchargement pour l'élève */}
        {student && gradesForTrimester.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: { xs: 2, sm: 3 } 
          }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              size="large"
              onClick={handlePrintClick}
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: 700,
                fontSize: 18,
                borderRadius: 3,
                boxShadow: 4,
                textTransform: 'uppercase',
                letterSpacing: 1,
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                  boxShadow: 6,
                },
              }}
            >
              Imprimer mon bulletin
            </Button>
          </Box>
        )}

        <Fade in={true} timeout={800}>
          <Paper sx={{ 
            borderRadius: 4, 
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            background: 'white'
          }}>
            {student && gradesForTrimester.length > 0 ? (
              <>
                <BulletinPDF
                ref={bulletinRef}
                student={student}
                bulletin={gradesForTrimester}
                trimester={selectedTrimester}
                rangClasse={rangClasse}
                appreciation={appreciation}
                moyenneClasse={moyenneClasse}
                schoolYear={schoolYear} // Passer l'année scolaire sélectionnée
                // Debug: Ajouter un log pour vérifier la valeur
                key={`bulletin-${studentId}-${schoolYear}-${selectedTrimester}`} // Forcer le re-render complet
                trimesterId={(() => {
                  // Déterminer l'ID du trimestre à partir du nom
                  switch (selectedTrimester) {
                    case '1er trimestre':
                      return 1;
                    case '2 ème trimestre':
                      return 3; // ID correct dans la base de données
                    case '3 ème trimestre':
                      return 4; // ID correct dans la base de données
                    default:
                      return 1; // Par défaut
                  }
                })()}
                showDownloadButton={true}
                principalTeacher={student?.principal_teacher_name || 'Non assigné'}
                                 compact={true}
               />
               </>
             ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  Aucune note disponible pour {selectedTrimester}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Veuillez sélectionner un autre trimestre ou vérifier que les notes ont été saisies.
                </Typography>
              </Box>
            )}
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default StudentReportCard; 