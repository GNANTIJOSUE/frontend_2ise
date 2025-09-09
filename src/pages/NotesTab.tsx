import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Paper, Chip, Avatar, Card, CardContent, Grid, useTheme, useMediaQuery, Accordion, AccordionSummary, AccordionDetails, IconButton, Collapse } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GradeIcon from '@mui/icons-material/Grade';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const NotesTab = ({ childId, schoolYear }: { childId: string | undefined, schoolYear: string }) => {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchGrades = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`https://2ise-groupe.com/api/students/${childId}/grades?school_year=${schoolYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('🔍 NotesTab - Données reçues:', data);
      console.log('🔍 NotesTab - Structure des données:', data.map((item: any) => ({
        subject_name: item.subject_name,
        sub_subject_name: item.sub_subject_name,
        semester: item.semester,
        notes_count: item.notes?.length || 0
      })));
      setGrades(data);
      setLoading(false);
    };
    if (childId && schoolYear) fetchGrades();
  }, [childId, schoolYear]);

  if (loading) return <CircularProgress />;
  if (!grades.length) return <Typography>Aucune note disponible.</Typography>;

  if (!loading && grades.length === 0) return (
    <Typography color="error" fontWeight={700} align="center" sx={{ my: 3 }}>
      Aucune information disponible pour votre enfant en cette année scolaire.
    </Typography>
  );

  // Fonction pour colorer le badge de moyenne
  const moyenneColor = (moy: number) => {
    if (moy >= 15) return 'success';
    if (moy >= 10) return 'primary';
    return 'error';
  };

  // Grouper les notes par matière et sous-matière
  const groupedBySubject = grades.reduce((acc: any, grade: any) => {
    // Créer une clé unique qui combine matière et sous-matière
    const key = grade.sub_subject_name ? `${grade.subject_name} - ${grade.sub_subject_name}` : grade.subject_name;
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(grade);
    return acc;
  }, {});

  // Calculer la moyenne générale par matière
  const getSubjectAverage = (subjectGrades: any[]) => {
    const validGrades = subjectGrades.filter(g => g.moyenne !== null && !isNaN(Number(g.moyenne)));
    if (validGrades.length === 0) return null;
    const sum = validGrades.reduce((acc, g) => acc + Number(g.moyenne), 0);
    return sum / validGrades.length;
  };

  // Trier les notes par date
  const sortNotesByDate = (notes: any[]) => {
    return notes.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB.getTime() - dateA.getTime(); // Plus récent en premier
    });
  };

  const handleSubjectClick = (subjectName: string) => {
    setExpandedSubject(expandedSubject === subjectName ? null : subjectName);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Avatar sx={{ bgcolor: '#f06292', mr: 2 }}>
          <GradeIcon />
        </Avatar>
        <Typography variant="h5" fontWeight={700} color="primary.main">
          Notes de votre enfant
        </Typography>
      </Box>
      
      <Grid container spacing={2}>
        {Object.entries(groupedBySubject).map(([subjectKey, subjectGrades]: [string, any]) => {
          const subjectAverage = getSubjectAverage(subjectGrades);
          const isExpanded = expandedSubject === subjectKey;
          
          // Extraire le nom de la matière et de la sous-matière
          const isSubSubject = subjectKey.includes(' - ');
          const [mainSubject, subSubject] = isSubSubject ? subjectKey.split(' - ') : [subjectKey, null];
          
          return (
            <Grid item xs={12} key={subjectKey}>
              <Card 
                sx={{ 
                  borderRadius: 3, 
                  boxShadow: 3, 
                  border: '1px solid #e0e0e0',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                  }
                }}
                onClick={() => handleSubjectClick(subjectKey)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                      <Typography variant="h6" fontWeight={700} color="#d81b60">
                        {mainSubject}
                      </Typography>
                      {subSubject && (
                        <Typography variant="subtitle2" fontWeight={600} color="#1976d2" sx={{ ml: 2 }}>
                          📚 {subSubject}
                        </Typography>
                      )}
                      {subjectAverage !== null && (
                        <Chip
                          label={`Moyenne: ${subjectAverage.toFixed(2)}`}
                          color={moyenneColor(subjectAverage)}
                          icon={<EmojiEventsIcon />}
                          sx={{ 
                            fontWeight: 700, 
                            fontSize: 14, 
                            px: 1, 
                            bgcolor: subjectAverage >= 15 ? '#43a047' : subjectAverage >= 10 ? '#1976d2' : '#e53935', 
                            color: 'white' 
                          }}
                        />
                      )}
                    </Box>
                    <IconButton 
                      size="small"
                      sx={{ 
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  </Box>
                  
                  <Collapse in={isExpanded}>
                    <Box sx={{ mt: 2 }}>
                      {subjectGrades.map((grade: any, gradeIdx: number) => {
                        console.log('🔍 NotesTab - Rendu grade:', {
                          subject: grade.subject_name,
                          sub_subject: grade.sub_subject_name,
                          semester: grade.semester,
                          notes_count: grade.notes?.length || 0
                        });
                        return (
                          <Box key={gradeIdx} sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <CalendarTodayIcon sx={{ mr: 1, color: 'primary.main' }} />
                              <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                                {grade.semester}
                              </Typography>
                            {grade.moyenne !== null && !isNaN(Number(grade.moyenne)) && (
                              <Chip
                                label={`Moyenne: ${Number(grade.moyenne).toFixed(2)}`}
                                size="small"
                                color={moyenneColor(Number(grade.moyenne))}
                                sx={{ ml: 2, fontWeight: 600 }}
                              />
                            )}
                          </Box>
                          
                          {(() => {
                            // Filtrer les notes pour ne garder que celles de cette sous-matière
                            const filteredNotes = grade.notes ? grade.notes.filter((note: any) => {
                              // Si c'est une sous-matière, filtrer par sub_subject_id
                              if (grade.sub_subject_id && note.sub_subject_id) {
                                return note.sub_subject_id === grade.sub_subject_id;
                              }
                              // Si ce n'est pas une sous-matière, garder toutes les notes
                              return !grade.sub_subject_id && !note.sub_subject_id;
                            }) : [];
                            
                            console.log('🔍 NotesTab - Filtrage des notes:', {
                              subject: grade.subject_name,
                              sub_subject_id: grade.sub_subject_id,
                              total_notes: grade.notes?.length || 0,
                              filtered_notes: filteredNotes.length,
                              filtered_notes_details: filteredNotes.map((n: any) => ({
                                id: n.id,
                                grade: n.grade,
                                sub_subject_id: n.sub_subject_id
                              }))
                            });
                            
                            return filteredNotes.length > 0 ? (
                              <Box display="flex" flexDirection="column" gap={1}>
                                {sortNotesByDate(filteredNotes).map((note: any, noteIdx: number) => {
                                  const isValidDate = note.date && !isNaN(new Date(note.date).getTime());
                                  const gradeColor = isNaN(Number(note.grade)) ? '#e53935' : '#f06292';
                                  return (
                                    <Box
                                      key={noteIdx}
                                      sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: gradeColor,
                                        color: 'white',
                                        fontSize: 14,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: 1
                                      }}
                                    >
                                      <Box>
                                        <Typography variant="body2" fontWeight={600}>
                                          Note: {isNaN(Number(note.grade))
                                            ? <span style={{ color: '#ffcdd2' }}>Erreur donnée</span>
                                            : Number(note.grade).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Typography>
                                        {note.coefficient && note.coefficient !== 1 && (
                                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                            Coefficient: {note.coefficient}
                                          </Typography>
                                        )}
                                      </Box>
                                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                        {isValidDate 
                                          ? new Date(note.date).toLocaleDateString('fr-FR')
                                          : 'Date inconnue'
                                        }
                                      </Typography>
                                    </Box>
                                  );
                                })}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                Aucune note disponible pour cette sous-matière
                              </Typography>
                            );
                          })()}
                        </Box>
                        );
                      })}
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default NotesTab; 