import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Paper, Typography, CircularProgress, Button, Alert, Fade, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import axios from 'axios';
import BulletinPDF, { BulletinPDFRef } from './BulletinPDF';

const MyReportCard = () => {
  const { trimester, semester } = useParams();
  // Gérer les deux noms de paramètres possibles
  const currentTrimester = trimester || semester;
  const navigate = useNavigate();
  const location = useLocation();
  const [student, setStudent] = useState<any>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trimesterRank, setTrimesterRank] = useState<{ rank: number; total: number; moyenne: number | null } | null>(null);
  const [rangClasse, setRangClasse] = useState<string | number | null>(null);
  const [moyenneClasse, setMoyenneClasse] = useState<number | null>(null);
  const [appreciation, setAppreciation] = useState<string>('Passable');
  const bulletinRef = useRef<BulletinPDFRef>(null);
  const [isPublished, setIsPublished] = useState<boolean | null>(null);
  const [schoolYear, setSchoolYear] = useState(() => {
    // Récupérer l'année scolaire depuis l'URL si disponible, sinon utiliser l'année courante
    const urlParams = new URLSearchParams(location.search);
    const urlSchoolYear = urlParams.get('school_year');
    return urlSchoolYear || getCurrentSchoolYear();
  });
  const [classStatistics, setClassStatistics] = useState({
    plusForteMoyenne: 'N/A',
    plusFaibleMoyenne: 'N/A',
    moyenneClasse: 'N/A'
  });

  // Helper pour l'année scolaire
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

  // Fonction pour obtenir les années scolaires disponibles
  function getSchoolYears(count = 5) {
    const current = getCurrentSchoolYear();
    const startYear = parseInt(current.split('-')[0], 10);
    return Array.from({ length: count }, (_, i) => {
      const start = startYear - i;
      return `${start}-${start + 1}`;
    });
  }

  // Fonction pour changer l'année scolaire
  const handleSchoolYearChange = (newSchoolYear: string) => {
    setSchoolYear(newSchoolYear);
    // Recharger les données avec la nouvelle année scolaire
    setLoading(true);
    setError(null);
    setStudent(null);
    setGrades([]);
    setTrimesterRank(null);
    setRangClasse(null);
    setMoyenneClasse(null);
    setClassStatistics({
      plusForteMoyenne: 'N/A',
      plusFaibleMoyenne: 'N/A',
      moyenneClasse: 'N/A'
    });
  };


  // Écouter les changements de l'URL pour mettre à jour l'année scolaire
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlSchoolYear = urlParams.get('school_year');
    if (urlSchoolYear && urlSchoolYear !== schoolYear) {
      console.log('MyReportCard - URL changée, mise à jour de schoolYear:', urlSchoolYear);
      setSchoolYear(urlSchoolYear);
    }
  }, [location.search, schoolYear]);

  useEffect(() => {
    let isMounted = true;


    const fetchData = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        if (isMounted) navigate('/login');
        return;
      }
      
      try {
        // 1. Charger l'étudiant d'abord avec toutes les informations
        console.log('MyReportCard - fetchData - schoolYear utilisée:', schoolYear);
        const studentRes = await axios.get('https://2ise-groupe.com/api/students/me', {
          params: {
            school_year: schoolYear
          },
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!isMounted) return;
        console.log('DEBUG REPONSE /api/students/me', studentRes.data);
        console.log('DEBUG STUDENT DATA:', {
          class_name: studentRes.data.student?.class_name,
          class_size: studentRes.data.student?.class_size,
          principal_teacher_name: studentRes.data.student?.principal_teacher_name
        });
        setStudent(studentRes.data.student);

        // 2. Déduire class_id et school_year
        const studentObj = studentRes.data.student;
        console.log('DEBUG BULLETIN', { student: studentObj });
        const class_id = studentObj.class_id || studentObj.classe_id || studentObj.classId;
        const currentSchoolYear = studentObj.school_year || schoolYear;
        console.log('DEBUG AVANT /published', { class_id, currentSchoolYear, trimester: currentTrimester });
        if (!class_id) {
          setLoading(false);
          setError("Impossible de déterminer la classe de l'élève. Veuillez contacter l'administration.");
          return;
        }

        // 3. Vérifier la publication du bulletin
        console.log('MyReportCard - Vérification publication - schoolYear utilisée:', schoolYear);
        let pubRes;
        try {
          pubRes = await axios.get('https://2ise-groupe.com/api/report-cards/published', {
            params: {
              class_id,
              trimester: currentTrimester,
              school_year: schoolYear
            },
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (err: any) {
          setLoading(false);
          setError(`Erreur publication bulletin : ${err?.response?.data?.message || err.message} (class_id=${class_id}, school_year=${schoolYear}, trimester=${currentTrimester})`);
          return;
        }
        if (!isMounted) return;
        setIsPublished(!!pubRes.data.published);
        if (!pubRes.data.published) {
          setLoading(false);
          setError("Le bulletin de ce trimestre n'a pas encore été publié par l'administration.");
          return;
        }

        // 4. Récupérer toutes les notes de l'étudiant
        console.log('MyReportCard - Récupération notes - schoolYear utilisée:', schoolYear);
        const gradesRes = await axios.get(`https://2ise-groupe.com/api/students/me/grades`, {
          params: {
            school_year: schoolYear
          },
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isMounted) {
          // Filtrer les notes par trimestre si spécifié
          const allGrades = gradesRes.data;
          let filteredGrades;
          
          if (currentTrimester) {
            // Normaliser le trimestre pour la correspondance avec la base de données
            let normalizedTrimester = currentTrimester;
            if (currentTrimester === '2e trimestre') {
              normalizedTrimester = '2 ème trimestre';
            } else if (currentTrimester === '3e trimestre') {
              normalizedTrimester = '3 ème trimestre';
            }
            
            filteredGrades = allGrades.filter((g: any) => 
              g.semester === currentTrimester || g.semester === normalizedTrimester
            );
          } else {
            filteredGrades = allGrades;
          }
          
                   // Récupérer les rangs par matière si le trimestre est spécifié
           if (currentTrimester && filteredGrades.length > 0) {
             try {
               const ranksRes = await axios.get(`https://2ise-groupe.com/api/students/me/subject-ranks`, {
                 params: {
                   semester: currentTrimester,
                   school_year: schoolYear
                 },
                 headers: { Authorization: `Bearer ${token}` }
               });
             
              // Fusionner les rangs avec les notes
              console.log('DEBUG RANGS PAR MATIERE:', ranksRes.data);
              const gradesWithRanks = filteredGrades.map((grade: any) => {
                const rankData = ranksRes.data.find((r: any) => r.subject_id === grade.subject_id);
                return {
                  ...grade,
                  rang: rankData ? rankData.rank : null
                };
              });
             
              console.log('DEBUG NOTES AVEC RANGS:', gradesWithRanks);
              setGrades(gradesWithRanks);
            } catch (ranksError) {
              console.error('Erreur lors de la récupération des rangs par matière:', ranksError);
              setGrades(filteredGrades);
            }
          } else {
            setGrades(filteredGrades);
          }
        }

        // 5. Récupérer le rang global du trimestre
        if (typeof currentTrimester === 'string') {
          console.log('MyReportCard - Récupération rang global - schoolYear utilisée:', schoolYear);
          const rankRes = await axios.get(
            `https://2ise-groupe.com/api/students/me/trimester-rank?semester=${encodeURIComponent(currentTrimester)}&school_year=${schoolYear}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
                      if (isMounted) {
            console.log('DEBUG RANG GLOBAL:', rankRes.data);
            setTrimesterRank(rankRes.data);
            setRangClasse(rankRes.data.rank + ' / ' + rankRes.data.total);
            setMoyenneClasse(rankRes.data.moyenne);
          }
        } else {
          setTrimesterRank(null);
          setRangClasse(null);
          setMoyenneClasse(null);
        }

        // 6. Récupérer les statistiques de classe si la classe existe
        if (class_id && typeof currentTrimester === 'string') {
          try {
            // Normaliser le trimestre pour les statistiques de classe
            let normalizedTrimester = currentTrimester;
            if (currentTrimester === '2e trimestre') {
              normalizedTrimester = '2 ème trimestre';
            } else if (currentTrimester === '3e trimestre') {
              normalizedTrimester = '3 ème trimestre';
            }
            
            const statsRes = await axios.get('https://2ise-groupe.com/api/students/class-statistics', {
              params: {
                class_id,
                semester: currentTrimester, // Utiliser le trimestre original, le backend gère la normalisation
                school_year: schoolYear
              },
              headers: { Authorization: `Bearer ${token}` }
            });
            if (isMounted && statsRes.data) {
              // Stocker les statistiques dans l'état
              setClassStatistics({
                plusForteMoyenne: statsRes.data.plusForteMoyenne || 'N/A',
                plusFaibleMoyenne: statsRes.data.plusFaibleMoyenne || 'N/A',
                moyenneClasse: statsRes.data.moyenneClasse || 'N/A'
              });
              console.log('Statistiques de classe récupérées:', statsRes.data);
            }
          } catch (statsError) {
            console.error('Erreur lors de la récupération des statistiques de classe:', statsError);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          if (err.response?.status === 403) {
            setError("Le bulletin de ce trimestre n'a pas encore été publié par l'administration.");
          } else {
            console.error('Erreur lors du chargement des données:', err);
            setError(err.response?.data?.message || 'Erreur lors du chargement des données.');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [navigate, currentTrimester, schoolYear]);

  // Les calculs sont maintenant gérés par le composant BulletinPDF

  // Fonction pour déclencher l'impression
  const handlePrintClick = () => {
    if (bulletinRef.current && bulletinRef.current.handlePrintBulletin) {
      bulletinRef.current.handlePrintBulletin();
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><Alert severity="info">{error}</Alert></Box>;
  
  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 4 }, 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #e3f0ff 0%, #f8e1ff 100%)',
      overflowX: 'auto' // Allow horizontal scroll on mobile
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Button variant="outlined" onClick={() => navigate('/student/choose-trimester')}>
          ← Retour à la sélection des trimestres
        </Button>
        
        {/* Sélecteur d'année scolaire */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            Année scolaire :
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={schoolYear}
              onChange={(e) => handleSchoolYearChange(e.target.value)}
              sx={{ bgcolor: '#fff', borderRadius: 2 }}
            >
              {getSchoolYears(5).map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {(!loading && !error && student && grades.length > 0) && (
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
              fontSize: 16,
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
        )}
      </Box>
      {(!loading && !error) && (
        <Fade in={true} timeout={800}>
          <Paper sx={{ 
            borderRadius: 4, 
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            background: 'white'
          }}>
            {student && grades.length > 0 ? (
              <>
                {/* Indicateur de l'année scolaire */}
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#e3f2fd', borderBottom: '1px solid #bbdefb' }}>
                  <Typography variant="h6" color="primary.main" fontWeight={600}>
                    📚 Bulletin de l'année scolaire {schoolYear}
                  </Typography>
                </Box>
                
                <BulletinPDF
                  ref={bulletinRef}
                  student={student}
                  bulletin={grades}
                  trimester={currentTrimester || '1er trimestre'}
                  rangClasse={rangClasse}
                  appreciation={appreciation}
                  moyenneClasse={moyenneClasse}
                  trimesterId={(() => {
                    // Déterminer l'ID du trimestre à partir du nom
                    switch (currentTrimester) {
                      case '1er trimestre':
                        return 1;
                      case '2e trimestre':
                        return 3; // ID correct dans la base de données
                      case '3e trimestre':
                        return 4; // ID correct dans la base de données
                      default:
                        return 1; // Par défaut
                    }
                  })()}
                  showDownloadButton={true}
                  principalTeacher={student?.principal_teacher_name || 'Non assigné'}
                  compact={true}
                  classStatistics={classStatistics} // Passer les statistiques de classe
                  schoolYear={schoolYear} // Passer l'année scolaire sélectionnée
                  key={`bulletin-${student?.id}-${schoolYear}-${currentTrimester}`} // Forcer le re-render complet
                />
              </>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Aucune donnée disponible pour ce trimestre
                </Typography>
              </Box>
            )}
          </Paper>
        </Fade>
      )}
    </Box>
  );
};

export default MyReportCard; 
