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

  // Grouper les notes par matière
  const groupedBySubject = grades.reduce((acc: any, grade: any) => {
    if (!acc[grade.subject_name]) {
      acc[grade.subject_name] = [];
    }
    acc[grade.subject_name].push(grade);
    return acc;
  }, {});

  // Calculer la moyenne générale par matière
  const getSubjectAverage = (subjectGrades: any[]) => {
    const validGrades = subjectGrades.filter(g => g.moyenne !== null && !isNaN(g.moyenne));
    if (validGrades.length === 0) return null;
    const sum = validGrades.reduce((acc, g) => acc + g.moyenne, 0);
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
        {Object.entries(groupedBySubject).map(([subjectName, subjectGrades]: [string, any]) => {
          const subjectAverage = getSubjectAverage(subjectGrades);
          const isExpanded = expandedSubject === subjectName;
          
          return (
            <Grid item xs={12} key={subjectName}>
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
                onClick={() => handleSubjectClick(subjectName)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6" fontWeight={700} color="#d81b60">
                        {subjectName}
                      </Typography>
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
                      {subjectGrades.map((grade: any, gradeIdx: number) => (
                        <Box key={gradeIdx} sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <CalendarTodayIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                              {grade.semester}
                            </Typography>
                            {grade.moyenne !== null && (
                              <Chip
                                label={`Moyenne: ${grade.moyenne.toFixed(2)}`}
                                size="small"
                                color={moyenneColor(grade.moyenne)}
                                sx={{ ml: 2, fontWeight: 600 }}
                              />
                            )}
                          </Box>
                          
                          {grade.notes && grade.notes.length > 0 ? (
                            <Box display="flex" flexDirection="column" gap={1}>
                              {sortNotesByDate(grade.notes).map((note: any, noteIdx: number) => {
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
                              Aucune note disponible pour ce trimestre
                            </Typography>
                          )}
                        </Box>
                      ))}
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