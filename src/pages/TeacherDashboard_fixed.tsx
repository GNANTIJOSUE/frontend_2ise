import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert, MenuItem, Select, InputLabel, FormControl, Container, Stack, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Grid, IconButton, Chip, FormControlLabel, Switch, ToggleButtonGroup, ToggleButton, Fade
} from '@mui/material';
import axios from 'axios';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { useNavigate } from 'react-router-dom';

interface Class {
  id: number;
  name: string;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
}

interface Grade {
  id: number;
  grade: number;
  semester: string;
  academic_year: string;
  created_at: string;
  class_id: number;
  student_id: number;
  subject_id: number;
  coefficient?: number;
  is_published: boolean;
}

interface Subject { 
  id: number; 
  name: string; 
  created_at?: string; 
}

interface Absence {
  id?: number;
  student_id: number;
  class_id: number;
  subject_id: number;
  teacher_id: number;
  date: string;
  reason: string;
  status: 'excused' | 'unexcused';
  duration_hours?: number;
}

type AbsenceState = Map<number, { 
  status: 'present' | 'absent'; 
  reason: string; 
  justified: boolean; 
  initialStatus: 'present' | 'absent'; 
  duration_hours: number 
}>;

const TeacherDashboard = () => {
  const [teacher, setTeacher] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [gradeValue, setGradeValue] = useState('');
  const [semester, setSemester] = useState('1er trimestre');
  const [academicYear, setAcademicYear] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getFullYear() + 1}`;
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'info' 
  });
  const [editMode, setEditMode] = useState(false);
  const [editingGradeId, setEditingGradeId] = useState<number | null>(null);
  const [coefficient, setCoefficient] = useState(1);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [viewStep, setViewStep] = useState<'subjects' | 'classes' | 'students'>('subjects');
  const [subjectClasses, setSubjectClasses] = useState<Class[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [absenceData, setAbsenceData] = useState<AbsenceState>(new Map());
  const [classAbsences, setClassAbsences] = useState<Absence[]>([]);
  const [studentGradesSnapshot, setStudentGradesSnapshot] = useState<Grade[]>([]);
  const navigate = useNavigate();

  // Ajout pour gestion dynamique des trimestres
  const [trimesters, setTrimesters] = useState<{ id: number, name: string, is_open: boolean, start_date?: string, end_date?: string }[]>([]);
  const [selectedTrimesterId, setSelectedTrimesterId] = useState<number | null>(null);

  // Charger les informations du professeur
  useEffect(() => {
    let isMounted = true;
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'teacher') {
      const token = localStorage.getItem('token');
      axios.get('https://2ise-groupe.com/api/teachers/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (isMounted) {
          setTeacher(res.data);
          console.log('Professeur connecté:', res.data);
        }
      })
      .catch(err => {
        if (isMounted) {
          setTeacher(null);
          console.error('Erreur lors de la récupération du professeur:', err);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Charger les matières du professeur
  useEffect(() => {
    let isMounted = true;
    
    if (teacher?.id) {
      console.log('Chargement des matières pour teacher.id =', teacher.id);
      fetchMySubjects();
    }
    
    return () => {
      isMounted = false;
    };
  }, [teacher?.id]);

  // Ajout pour gestion dynamique des trimestres
  useEffect(() => {
    const fetchTrimesters = async () => {
      const { data } = await axios.get('https://2ise-groupe.com/api/trimesters');
      setTrimesters(data);
      if (data.length > 0 && selectedTrimesterId === null) {
        setSelectedTrimesterId(data[0].id);
      }
    };
    fetchTrimesters();
    // eslint-disable-next-line
  }, []);

  const fetchMySubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`https://2ise-groupe.com/api/teachers/${teacher?.id}/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Matières récupérées:', data);
      setSubjects(data);
      
      // Sélectionner automatiquement la première matière si aucune n'est sélectionnée
      if (data.length > 0 && !selectedSubject) {
        setSelectedSubject(data[0].id);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des matières:', err);
      setSubjects([]);
    }
  };

  const handleSelectSubject = async (subject: Subject) => {
    setSelectedSubject(subject.id);
    setSelectedClass(null);
    setStudents([]);
    setGrades([]);
    setViewStep('classes');
    
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`https://2ise-groupe.com/api/teachers/${teacher?.id}/subjects/${subject.id}/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjectClasses(data);
    } catch (err) {
      console.error('Erreur lors du chargement des classes:', err);
      setSubjectClasses([]);
    }
  };

  const handleSelectClass = async (classe: Class) => {
    console.log('handleSelectClass appelé avec :', classe);
    setSelectedClass(classe);
    setViewStep('students');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({ open: true, message: 'Token d\'authentification manquant', severity: 'error' });
        return;
      }
      if (!selectedSubject) {
        setSnackbar({ open: true, message: 'Aucune matière sélectionnée', severity: 'error' });
        return;
      }
      console.log('Chargement des données pour la classe:', classe.id, 'matière:', selectedSubject);
      const studentsPromise = axios.get(`https://2ise-groupe.com/api/classes/${classe.id}/students`, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      const gradesPromise = axios.get(`https://2ise-groupe.com/api/classes/${classe.id}/grades?subject_id=${selectedSubject}`, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      const absencesPromise = axios.get(`https://2ise-groupe.com/api/absences?class_id=${classe.id}&subject_id=${selectedSubject}`, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      const [studentsRes, gradesRes, absencesRes] = await Promise.all([studentsPromise, gradesPromise, absencesPromise]);
      console.log('Élèves chargés :', studentsRes.data);
      setStudents(studentsRes.data);
      setGrades(gradesRes.data);
      setClassAbsences(absencesRes.data);
    } catch (err: any) {
      console.error('Erreur lors du chargement des données:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors du chargement des élèves ou des notes';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      setStudents([]);
      setGrades([]);
      setClassAbsences([]);
    }
  };

  const handleOpenDialog = async (student: Student) => {
    setSelectedStudent(student);
    setGradeValue('');
    setSemester('1er trimestre');
    setAcademicYear(() => {
      const now = new Date();
      return `${now.getFullYear()}-${now.getFullYear() + 1}`;
    });
    setCoefficient(1);
    
    // S'assurer que selectedSubject est défini
    if (!selectedSubject && subjects.length > 0) {
      setSelectedSubject(subjects[0].id);
    }
    
    setEditMode(false);
    setEditingGradeId(null);
    setStudentGradesSnapshot(grades.filter(g => g.student_id === student.id));
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleAddGrade = async () => {
    if (!selectedStudent || !selectedClass || !gradeValue || !selectedSubject) {
      setSnackbar({ open: true, message: 'Tous les champs sont obligatoires', severity: 'error' });
      return;
    }

    // Validation de la note
    const gradeNum = parseFloat(gradeValue);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 20) {
      setSnackbar({ open: true, message: 'La note doit être comprise entre 0 et 20', severity: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({ open: true, message: 'Token d\'authentification manquant', severity: 'error' });
        return;
      }

      const payload = {
        student_id: Number(selectedStudent.id),
        class_id: Number(selectedClass.id),
        grade: gradeNum,
        semester: trimesters.find(t => t.id === Number(selectedTrimesterId))?.name,
        trimester_id: Number(selectedTrimesterId),
        academic_year: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        coefficient: coefficient || 1,
        subject_id: Number(selectedSubject)
      };

      console.log('Payload pour ajout/modification de note:', payload);

      if (editMode && editingGradeId) {
        const response = await axios.put(
          `https://2ise-groupe.com/api/teachers/grades/${editingGradeId}`, 
          payload, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Note modifiée:', response.data);
        setSnackbar({ open: true, message: 'Note modifiée avec succès !', severity: 'success' });
      } else {
        const response = await axios.post(
          'https://2ise-groupe.com/api/teachers/grades', 
          payload, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Note ajoutée:', response.data);
        setSnackbar({ open: true, message: 'Note ajoutée avec succès !', severity: 'success' });
      }

      // Rafraîchir les données après ajout/modification
      if (selectedClass) {
        await handleSelectClass(selectedClass);
      }
      
      handleCloseDialog();
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout/modification de la note:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'ajout/modification de la note';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleEditGrade = (grade: Grade) => {
    setOpenDialog(true);
    setSelectedStudent(students.find(s => s.id === grade.student_id) || null);
    setEditMode(true);
    setEditingGradeId(grade.id);
    setGradeValue(grade.grade.toString());
    setSemester(grade.semester || '1er trimestre');
    setAcademicYear(grade.academic_year || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${now.getFullYear() + 1}`;
    })());
    setCoefficient((grade as any).coefficient || 1);
    
    // S'assurer que selectedSubject est défini avec la matière de la note
    const gradeSubjectId = (grade as any).subject_id;
    if (gradeSubjectId) {
      setSelectedSubject(gradeSubjectId);
    } else if (subjects.length > 0) {
      setSelectedSubject(subjects[0].id);
    }
  };

  const handleDeleteGrade = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({ open: true, message: 'Token d\'authentification manquant', severity: 'error' });
        return;
      }

      await axios.delete(`https://2ise-groupe.com/api/teachers/grades/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setSnackbar({ open: true, message: 'Note supprimée avec succès !', severity: 'success' });
      
      // Rafraîchir les données après suppression
      if (selectedClass) {
        await handleSelectClass(selectedClass);
      }
      
      handleCloseDialog();
    } catch (err: any) {
      console.error('Erreur lors de la suppression de la note:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression de la note';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const processedStudents = useMemo(() => {
    if (!students) return [];
    return students
      .map(student => {
        const studentGrades = grades ? grades.filter(g => g.student_id === student.id) : [];
        const totalPoints = studentGrades.reduce((acc, n) => acc + n.grade * (n.coefficient || 1), 0);
        const totalCoefficients = studentGrades.reduce((acc, n) => acc + (n.coefficient || 1), 0);
        const moyenne = totalCoefficients > 0 ? Number((totalPoints / totalCoefficients).toFixed(2)) : null;
        const absenceCount = classAbsences
          .filter(a => a.student_id === student.id)
          .reduce((sum, current) => sum + (Number(current.duration_hours) || 0), 0);
        console.log('MAPPING processedStudent:', { nom: student.first_name + ' ' + student.last_name, moyenne, absenceCount });
        return { student, studentGrades, moyenne, absenceCount };
      })
      .sort((a, b) => {
        const moyenneB = b.moyenne ?? -1;
        const moyenneA = a.moyenne ?? -1;
        if (moyenneA !== moyenneB) return moyenneB - moyenneA;
        return a.student.last_name.localeCompare(b.student.last_name);
      });
  }, [students, grades, classAbsences]);

  // Utilitaire pour parser une note ou une moyenne
  const parseNote = (val: any) => {
    if (typeof val === 'string') {
      // Si c'est du type "14h00" ou "14:00"
      const match = val.match(/^([0-9]+)(?:[h:][0-9]*)?$/);
      if (match) return parseFloat(match[1]);
      return parseFloat(val.replace(',', '.'));
    }
    return Number(val);
  };

  console.log('viewStep:', viewStep, 'selectedClass:', selectedClass, 'students:', students, 'subjects:', subjects, 'selectedSubject:', selectedSubject);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      <Box sx={{
        width: '100%',
        background: 'linear-gradient(45deg, #0d47a1 30%, #1976d2 90%)',
        color: 'white',
        py: 2,
        px: { xs: 2, md: 4 },
        boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1100
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <SchoolIcon sx={{ fontSize: { xs: 28, md: 32 } }} />
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 1, display: { xs: 'none', md: 'block' } }}>
            Espace Enseignant
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Chip
            icon={<PersonIcon />}
            label={`${teacher?.first_name || ''} ${teacher?.last_name || ''}`}
            variant="filled"
            sx={{
              color: 'white',
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              fontWeight: 600,
              display: { xs: 'none', md: 'flex' }
            }}
          />
          <IconButton
            onClick={handleLogout}
            sx={{
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
            }}
            title="Déconnexion"
          >
            <LogoutIcon />
          </IconButton>
        </Stack>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, md: 4 } }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: '#1A237E', mb: 4 }}>
          Tableau de bord
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 4, borderTop: '4px solid #1976d2' }}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                <MenuBookIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary' }}>Vos matières</Typography>
              </Stack>
              <Stack spacing={1}>
                {subjects.map(subject => (
                  <Button
                    key={subject.id}
                    variant={selectedSubject === subject.id ? "contained" : "outlined"}
                    fullWidth
                    onClick={() => handleSelectSubject(subject)}
                    sx={{
                      justifyContent: 'flex-start',
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: 'none',
                      bgcolor: selectedSubject === subject.id ? 'primary.main' : undefined,
                      color: selectedSubject === subject.id ? 'white' : 'inherit',
                      mb: 1
                    }}
                  >
                    {subject.name}
                  </Button>
                ))}
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            {viewStep === 'classes' && (
              <Paper elevation={2} sx={{ p: 3, borderRadius: 4, borderTop: '4px solid #1976d2' }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                  <ApartmentIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Classes pour {subjects.find(s => s.id === selectedSubject)?.name}
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  {subjectClasses.length > 0 ? (
                    subjectClasses.map((classe) => (
                      <Paper key={classe.id} sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {classe.name}
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          onClick={() => handleSelectClass({ id: classe.id, name: classe.name })}
                        >
                          Voir élèves / notes
                        </Button>
                      </Paper>
                    ))
                  ) : (
                    <Typography color="text.secondary">Aucune classe trouvée pour cette matière.</Typography>
                  )}
                </Stack>
                <Button sx={{ mt: 2, fontWeight: 600 }} onClick={() => setViewStep('subjects')}>
                  RETOUR AUX MATIÈRES
                </Button>
              </Paper>
            )}
            {viewStep === 'students' && selectedClass && (
              <Paper elevation={4} sx={{ p: { xs: 2, md: 3 }, borderRadius: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Classe : {selectedClass.name}
                    <Typography variant="body1" component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                      ({subjects.find(s => s.id === Number(selectedSubject))?.name})
                    </Typography>
                  </Typography>
                </Box>
                <TableContainer component={Paper} elevation={0} sx={{ mt: 1, mb: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ '& .MuiTableCell-root': { bgcolor: '#f4f6f8', fontWeight: 'bold' } }}>
                        <TableCell>Élève</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell>Moyenne</TableCell>
                        <TableCell>H. Absences</TableCell>
                        <TableCell>Rang</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {processedStudents.map((row) => {
                        console.log('row.moyenne:', row.moyenne, 'row:', row);
                        const rang = row.moyenne == null ? '-' : (processedStudents.findIndex(r => r.moyenne === row.moyenne) + 1);
                        return (
                          <TableRow key={row.student.id} hover>
                            <TableCell sx={{fontWeight: 500}}>
                              {row.student.first_name} {row.student.last_name}
                            </TableCell>
                            <TableCell>
                              {row.studentGrades.length > 0 ? 
                                row.studentGrades.map((n) => (
                                  <span key={n.id}>
                                    {n.grade != null ? parseNote(n.grade).toFixed(2) : '-'} (x{n.coefficient || 1}) 
                                    {!n.is_published && 
                                      <Chip label="Non publié" size="small" color="warning" variant="outlined"/>
                                    }
                                  </span>
                                )) 
                                : '-'
                              }
                            </TableCell>
                            <TableCell sx={{fontWeight: 600}}>
                              {row.moyenne != null ? parseNote(row.moyenne).toFixed(2) : '-'}
                            </TableCell>
                            <TableCell sx={{color: row.absenceCount > 0 ? 'error.main' : 'inherit', fontWeight: 600}}>
                              {row.absenceCount > 0 ? `${row.absenceCount.toFixed(0)} h` : '-'}
                            </TableCell>
                            <TableCell>{rang}</TableCell>
                            <TableCell>
                              <Button 
                                variant="contained" 
                                size="small" 
                                onClick={() => handleOpenDialog(row.student)}
                              >
                                Gérer les notes
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button sx={{ mt: 2, fontWeight: 600 }} onClick={() => setViewStep('classes')}>
                  RETOUR AUX CLASSES
                </Button>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Dialog pour ajouter/modifier les notes */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        TransitionComponent={Fade}
      >
        <DialogTitle sx={{fontWeight: 700}}>
          {editMode ? 'Modifier' : 'Ajouter'} une note pour {selectedStudent?.first_name}
        </DialogTitle>
        <DialogContent>
          {studentGradesSnapshot.length > 0 && (
            <Box mb={2}>
              <Typography variant="h6" sx={{mb:1}}>Notes existantes</Typography>
              {studentGradesSnapshot.map((g) => (
                <Paper key={g.id} sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, bgcolor: '#f5f5f5' }}>
                  <Typography>
                    Note: <b>{g.grade != null ? parseNote(g.grade).toFixed(2) : '-'}</b> | Coeff: {g.coefficient} | Semestre: {g.semester}
                  </Typography>
                  <Stack direction="row">
                    <Button size="small" onClick={() => handleEditGrade(g)}>
                      Modifier
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDeleteGrade(g.id)}>
                      Supprimer
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Box>
          )}
          <TextField 
            label="Note" 
            type="number" 
            value={gradeValue} 
            onChange={e => setGradeValue(e.target.value)} 
            fullWidth 
            sx={{ mt: 2 }}
            inputProps={{ min: 0, max: 20, step: 0.5 }}
            helperText="Note entre 0 et 20"
          />
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Trimestre</InputLabel>
            <Select
              value={selectedTrimesterId ?? ''}
              label="Trimestre"
              onChange={e => setSelectedTrimesterId(Number(e.target.value))}
            >
              {trimesters.map(trim => (
                <MenuItem key={trim.id} value={trim.id}>
                  {trim.name} {trim.is_open ? '(Ouvert)' : '(Fermé)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedTrimesterId && (
            <Typography variant="body2" color="text.secondary">
              {trimesters.find(t => t.id === selectedTrimesterId)?.start_date} - {trimesters.find(t => t.id === selectedTrimesterId)?.end_date}
            </Typography>
          )}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Coefficient</InputLabel>
            <Select 
              value={coefficient} 
              label="Coefficient" 
              onChange={e => setCoefficient(Number(e.target.value))}
            >
              <MenuItem value={0.5}>0.5</MenuItem>
              <MenuItem value={1}>1</MenuItem>
              <MenuItem value={1.5}>1.5</MenuItem>
              <MenuItem value={2}>2</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{p: '16px 24px'}}>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleAddGrade} variant="contained">
            {editMode ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeacherDashboard; 