import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert, MenuItem, Select, InputLabel, FormControl, Container, Stack, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Grid, IconButton, Chip, FormControlLabel, Switch, ToggleButtonGroup, ToggleButton, Fade
} from '@mui/material';
import axios from 'axios';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ApartmentIcon from '@mui/icons-material/Apartment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import { useNavigate } from 'react-router-dom';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

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
  semester?: string;
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
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Nouvelle note ajoutée', message: 'Une nouvelle note a été ajoutée à votre classe.', date: new Date(), read: false },
    { id: 2, title: 'Absence signalée', message: 'Un élève a été signalé absent.', date: new Date(), read: false },
  ]);
  const [anchorNotif, setAnchorNotif] = useState<null | HTMLElement>(null);
  const [openConfirmStudents, setOpenConfirmStudents] = useState(false);
  const [openConfirmAdmin, setOpenConfirmAdmin] = useState(false);
  const [publishingGrades, setPublishingGrades] = useState(false);
  const trimestres = ["1er trimestre", "2e trimestre", "3e trimestre"];
  const [selectedTrimester, setSelectedTrimester] = useState<string>(trimestres[0]);
  const [openAbsenceDialog, setOpenAbsenceDialog] = useState(false);
  const [absenceList, setAbsenceList] = useState<{ [studentId: number]: { absent: boolean; reason: string; status: 'excused' | 'unexcused'; duration: number } }>({});
  const navigate = useNavigate();
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

  const [schoolYear, setSchoolYear] = useState(getCurrentSchoolYear());
  const SCHOOL_YEARS = getSchoolYears(5);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [noteTrimester, setNoteTrimester] = useState(trimestres[0]);
  const [loadingAbsences, setLoadingAbsences] = useState(false);
  // Ajout pour gestion dynamique des trimestres
  const [trimesters, setTrimesters] = useState<{ id: number, name: string, is_open: boolean, start_date?: string, end_date?: string }[]>([]);
  const [selectedTrimesterId, setSelectedTrimesterId] = useState<number | null>(null);
  // État pour vérifier si le professeur est désactivé
  const [isTeacherDeactivated, setIsTeacherDeactivated] = useState(false);
  // État pour vérifier le statut de l'année scolaire sélectionnée
  const [selectedSchoolYearStatus, setSelectedSchoolYearStatus] = useState<{ is_active: boolean; name: string } | null>(null);
  // État pour suivre les trimestres publiés
  const [publishedTrimesters, setPublishedTrimesters] = useState<{ [trimesterName: string]: boolean }>({});
  const [frenchSubSubjects, setFrenchSubSubjects] = useState<any[]>([]);
  const [selectedFrenchSubSubject, setSelectedFrenchSubSubject] = useState<number | ''>('');

  const unreadCount = notifications.filter(n => !n.read).length;

  // Fonction helper pour vérifier si les actions sont désactivées
  const isActionDisabled = () => {
    const yearClosed = selectedSchoolYearStatus ? !selectedSchoolYearStatus.is_active : false;
    const trimesterPublished = selectedTrimesterId ? publishedTrimesters[trimesters.find(t => t.id === selectedTrimesterId)?.name || ''] : false;
    return yearClosed || trimesterPublished;
  };

  // Fonction helper pour vérifier si toutes les notes d'un étudiant sont publiées
  const areAllStudentGradesPublished = (studentId: number) => {
    const studentGrades = grades.filter(g => g.student_id === studentId);
    return studentGrades.length > 0 && studentGrades.every(g => g.is_published);
  };

  // Fonction helper pour vérifier si le trimestre est publié (ce qui empêche d'ajouter des notes)
  const isTrimesterPublished = () => {
    const selectedTrimesterName = selectedTrimesterId ? trimesters.find(t => t.id === selectedTrimesterId)?.name : '';
    return selectedTrimesterName ? publishedTrimesters[selectedTrimesterName] : false;
  };

  // Fonction helper pour obtenir le message d'alerte
  const getAlertMessage = () => {
    if (selectedSchoolYearStatus && selectedSchoolYearStatus.is_active === false) {
      return `⚠️ Année scolaire ${schoolYear} fermée - Les modifications et suppressions sont désactivées`;
    }
    const selectedTrimesterName = selectedTrimesterId ? trimesters.find(t => t.id === selectedTrimesterId)?.name : '';
    if (selectedTrimesterName && publishedTrimesters[selectedTrimesterName]) {
      return `⚠️ Bulletin du ${selectedTrimesterName} publié - Les modifications et suppressions sont désactivées`;
    }
    return '';
  };

  // Fonction pour vérifier si la matière est le français et la classe du premier cycle UNIQUEMENT
  const isFrenchFirstCycle = () => {
    if (!selectedSubject || !selectedClass) {
      console.log('🔍 isFrenchFirstCycle: selectedSubject ou selectedClass manquant', { 
        selectedSubject, 
        selectedClass: selectedClass?.name,
        subjectsCount: subjects.length 
      });
      return false;
    }
    
    const selectedSubjectName = subjects.find(s => s.id === selectedSubject)?.name?.toLowerCase();
    const isFrench = selectedSubjectName === 'français' || selectedSubjectName === 'francais';
    
    const className = selectedClass.name?.toLowerCase() || '';
    
    // Premier cycle : 6ème à 3ème
    const isFirstCycle = className.includes('6ème') || className.includes('5ème') || 
                        className.includes('4ème') || className.includes('3ème') ||
                        className.includes('6eme') || className.includes('5eme') || 
                        className.includes('4eme') || className.includes('3eme') ||
                        className.includes('6e') || className.includes('5e') || 
                        className.includes('4e') || className.includes('3e');
    
    // Second cycle : 2nde à Terminale (EXPLICITEMENT EXCLUS)
    const isSecondCycle = className.includes('2nde') || className.includes('1ère') || 
                         className.includes('1ere') || className.includes('terminale') ||
                         className.includes('seconde') || className.includes('premiere');
    
    // Ne pas afficher si c'est le second cycle, même si c'est français
    const result = isFrench && isFirstCycle && !isSecondCycle;
    
    console.log('🔍 isFrenchFirstCycle DEBUG:', {
      selectedSubject,
      selectedSubjectName,
      isFrench,
      className,
      isFirstCycle,
      isSecondCycle,
      result,
      frenchSubSubjectsCount: frenchSubSubjects.length
    });
    
    return result;
  };

  // Fonction pour récupérer le statut de l'année scolaire sélectionnée
  const fetchSelectedSchoolYearStatus = async (yearName: string) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `https://2ise-groupe.com/api/school-years/by-name/${yearName}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedSchoolYearStatus(data);
      console.log('Statut de l\'année scolaire sélectionnée:', data);
    } catch (err) {
      console.error('Erreur lors de la récupération du statut de l\'année scolaire:', err);
      // Par défaut, considérer l'année comme active si on ne peut pas récupérer son statut
      setSelectedSchoolYearStatus({ is_active: true, name: yearName });
    }
  };

  // Fonction pour vérifier le statut de publication des trimestres
  const checkPublication = async (trimester: string) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `https://2ise-groupe.com/api/bulletins/status?semester=${trimester}&school_year=${schoolYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPublishedTrimesters(prev => ({
        ...prev,
        [trimester]: data.is_published || false
      }));
      console.log(`Statut de publication pour ${trimester}:`, data);
    } catch (err) {
      console.error(`Erreur lors de la vérification du statut de publication pour ${trimester}:`, err);
      // Par défaut, considérer comme non publié si on ne peut pas vérifier
      setPublishedTrimesters(prev => ({
        ...prev,
        [trimester]: false
      }));
    }
  };

  // Définir fetchMySubjects avant les useEffect
  const fetchMySubjects = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `https://2ise-groupe.com/api/teachers/${teacher?.id}/subjects?school_year=${schoolYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
  }, [teacher?.id, schoolYear, selectedSubject]);


  // Charger les informations du professeur
  useEffect(() => {
    let isMounted = true;
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'teacher') {
      const token = localStorage.getItem('token');
      axios.get(`https://2ise-groupe.com/api/teachers/me?school_year=${schoolYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (isMounted) {
          setTeacher(res.data);
          console.log('Professeur connecté:', res.data);
          
          // Vérifier si le professeur est désactivé
          if (res.data && res.data.status === 'inactive') {
            setIsTeacherDeactivated(true);
          } else {
            setIsTeacherDeactivated(false);
          }
        }
      })
      .catch(err => {
        if (isMounted) {
          setTeacher(null);
          console.error('Erreur lors de la récupération du professeur:', err);
          
          // Si l'erreur indique que le professeur n'enseigne pas cette année
          if (err.response?.status === 403 || err.response?.data?.message?.includes('n\'enseigne pas')) {
            setIsTeacherDeactivated(true);
          }
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [schoolYear]);

  // Charger le statut de l'année scolaire sélectionnée
  useEffect(() => {
    if (schoolYear) {
      fetchSelectedSchoolYearStatus(schoolYear);
    }
  }, [schoolYear]);

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
  }, [teacher?.id, schoolYear]);

  const handleSelectSubject = async (subject: Subject) => {
    setSelectedSubject(subject.id);
    setSelectedClass(null);
    setStudents([]);
    setGrades([]);
    setViewStep('classes');
    
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`https://2ise-groupe.com/api/teachers/${teacher?.id}/subjects/${subject.id}/classes`, {
        params: {
          school_year: schoolYear
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjectClasses(data);
    } catch (err) {
      console.error('Erreur lors du chargement des classes:', err);
      setSubjectClasses([]);
    }
  };

  const handleSelectClass = async (classe: Class) => {
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

      const studentsPromise = axios.get(`https://2ise-groupe.com/api/classes/${classe.id}/students?school_year=${schoolYear}`, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      const gradesPromise = axios.get(`https://2ise-groupe.com/api/classes/${classe.id}/grades?subject_id=${selectedSubject}&school_year=${schoolYear}`, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Utiliser le nom du trimestre sélectionné pour récupérer les absences
      const selectedTrimesterName = trimesters.find(t => t.id === selectedTrimesterId)?.name;
      const absencesPromise = axios.get(`https://2ise-groupe.com/api/absences?class_id=${classe.id}&subject_id=${selectedSubject}&school_year=${schoolYear}&semester=${selectedTrimesterName}`, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const [studentsRes, gradesRes, absencesRes] = await Promise.all([studentsPromise, gradesPromise, absencesPromise]);

      console.log('Données chargées:', {
        students: studentsRes.data.length,
        grades: gradesRes.data.length,
        absences: absencesRes.data.length,
        selectedTrimesterName: selectedTrimesterName
      });
      
      console.log('Absences récupérées:', absencesRes.data);

      setStudents(studentsRes.data);
      setGrades(gradesRes.data);
      setClassAbsences(absencesRes.data);

      // Vérifier le statut de publication du trimestre sélectionné
      if (selectedTrimesterName) {
        await checkPublication(selectedTrimesterName);
      }

    } catch (err: any) {
      console.error('Erreur lors du chargement des données:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors du chargement des élèves ou des notes';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      
      // Réinitialiser les données en cas d'erreur
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
    setSelectedFrenchSubSubject(''); // Réinitialiser la sous-matière
    
    // S'assurer que selectedSubject est défini
    if (!selectedSubject && subjects.length > 0) {
      setSelectedSubject(subjects[0].id);
    }
    
    setEditMode(false);
    setEditingGradeId(null);
    setStudentGradesSnapshot(grades.filter(g => g.student_id === student.id));
    setOpenDialog(true);
    setNoteTrimester(trimestres[0]);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleAddGrade = async () => {
    if (!selectedStudent || !selectedClass || !gradeValue || !selectedSubject) {
      setSnackbar({ open: true, message: 'Tous les champs sont obligatoires', severity: 'error' });
      return;
    }

    // Vérifier si l'année scolaire est fermée
    if (selectedSchoolYearStatus && selectedSchoolYearStatus.is_active === false) {
      setSnackbar({ 
        open: true, 
        message: `Impossible de modifier les notes : l'année scolaire ${schoolYear} est fermée.`, 
        severity: 'error' 
      });
      return;
    }

    // Vérifier si le trimestre est publié (seulement pour empêcher l'ajout de nouvelles notes)
    const selectedTrimesterName = trimesters.find(t => t.id === selectedTrimesterId)?.name;
    if (selectedTrimesterName && publishedTrimesters[selectedTrimesterName]) {
      setSnackbar({ 
        open: true, 
        message: `Impossible d'ajouter des notes : le bulletin du ${selectedTrimesterName} est publié.`, 
        severity: 'error' 
      });
      return;
    }

    // Validation de la note
    const gradeNum = parseFloat(gradeValue);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 20) {
      setSnackbar({ open: true, message: 'La note doit être comprise entre 0 et 20', severity: 'error' });
      return;
    }

    // Validation pour le français en premier cycle
    if (isFrenchFirstCycle() && !selectedFrenchSubSubject) {
      setSnackbar({ open: true, message: 'Veuillez sélectionner une sous-matière de français', severity: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({ open: true, message: 'Token d\'authentification manquant', severity: 'error' });
        return;
      }

      // Déterminer si c'est français et si on a une sous-matière sélectionnée
      const selectedSubjectName = subjects.find(s => s.id === selectedSubject)?.name?.toLowerCase();
      const isFrench = selectedSubjectName === 'français' || selectedSubjectName === 'francais';
      const hasSubSubject = Boolean(selectedFrenchSubSubject) && selectedFrenchSubSubject !== 0;
      
      const payload = {
        student_id: selectedStudent.id,
        class_id: selectedClass.id,
        grade: gradeNum,
        semester: trimesters.find(t => t.id === selectedTrimesterId)?.name,
        trimester_id: selectedTrimesterId,
        academic_year: schoolYear,
        coefficient: Number(coefficient) || 1,
        subject_id: selectedSubject,
        sub_subject_id: (isFrench && hasSubSubject) ? selectedFrenchSubSubject : null
      };

      console.log('🔍 DEBUG Payload pour ajout/modification de note:', {
        payload,
        isFrench,
        hasSubSubject,
        selectedFrenchSubSubject,
        selectedSubjectName,
        isFrenchFirstCycle: isFrenchFirstCycle()
      });

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
    // Vérifier si la note est publiée
    if (grade.is_published) {
      setSnackbar({ 
        open: true, 
        message: 'Impossible de modifier une note publiée. Les notes publiées ne peuvent plus être modifiées.', 
        severity: 'error' 
      });
      return;
    }

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
    setNoteTrimester(grade.semester || trimestres[0]);
  };

  const handleDeleteGrade = async (id: number) => {
    // Trouver la note à supprimer pour vérifier si elle est publiée
    const gradeToDelete = grades.find(g => g.id === id);
    if (gradeToDelete && gradeToDelete.is_published) {
      setSnackbar({ 
        open: true, 
        message: 'Impossible de supprimer une note publiée. Les notes publiées ne peuvent plus être supprimées.', 
        severity: 'error' 
      });
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      return;
    }

    // Vérifier si l'année scolaire est fermée
    if (selectedSchoolYearStatus && selectedSchoolYearStatus.is_active === false) {
      setSnackbar({ 
        open: true, 
        message: `Impossible de supprimer les notes : l'année scolaire ${schoolYear} est fermée.`, 
        severity: 'error' 
      });
      return;
    }

    // Vérifier si le trimestre est publié (seulement pour empêcher la suppression de notes)
    const selectedTrimesterName = trimesters.find(t => t.id === selectedTrimesterId)?.name;
    if (selectedTrimesterName && publishedTrimesters[selectedTrimesterName]) {
      setSnackbar({ 
        open: true, 
        message: `Impossible de supprimer les notes : le bulletin du ${selectedTrimesterName} est publié.`, 
        severity: 'error' 
      });
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

  // Fonction utilitaire pour dédupliquer les notes
  const deduplicateGrades = (grades: any[]) => {
    const seen = new Set();
    return grades.filter(grade => {
      // Créer une clé unique basée sur les propriétés importantes
      const key = `${grade.student_id}-${grade.grade}-${grade.coefficient}-${grade.sub_subject_name || 'no-sub'}-${grade.semester}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const processedStudents = useMemo(() => {
    if (!students || !Array.isArray(students)) return [];
    if (!grades || !Array.isArray(grades)) return [];
    if (!classAbsences || !Array.isArray(classAbsences)) return [];
    
    const processed = students.map(student => {
      // Vérifier que l'étudiant a un ID valide
      if (!student || !student.id) {
        console.warn('Étudiant invalide:', student);
        return null;
      }
      
      // Filtrer les notes pour le trimestre sélectionné
      const selectedTrimesterName = trimesters.find(t => t.id === selectedTrimesterId)?.name;
      const studentGradesRaw = grades.filter(
        g => g && g.student_id === student.id && g.semester === selectedTrimesterName
      );
      
      // Dédupliquer les notes
      const studentGrades = deduplicateGrades(studentGradesRaw);
      
      console.log(`[DEBUG] Notes pour ${student.first_name} ${student.last_name}:`, {
        selectedTrimesterName,
        totalGrades: grades.length,
        rawFilteredGrades: studentGradesRaw.length,
        deduplicatedGrades: studentGrades.length,
        grades: studentGrades.map(g => ({
          id: g.id,
          grade: g.grade,
          semester: g.semester,
          is_published: g.is_published,
          subject_id: g.subject_id,
          sub_subject_name: g.sub_subject_name
        }))
      });
      
      // Calculer la moyenne pour le trimestre sélectionné
      let moyenne = null;
      
      // Vérifier si c'est le français avec des sous-matières
      const selectedSubjectName = subjects.find(s => s.id === selectedSubject)?.name?.toLowerCase();
      const isFrench = selectedSubjectName === 'français' || selectedSubjectName === 'francais';
      const hasSubSubjects = studentGrades.some((note: any) => note.sub_subject_name);
      
      if (isFrench && hasSubSubjects && studentGrades.length > 0) {
        // Pour le français avec sous-matières : moyenne = moyenne des moyennes des sous-matières
        const subSubjectAverages: { [key: string]: number } = {};
        
        // Grouper les notes par sous-matière
        const subSubjectGroups: { [key: string]: any[] } = {};
        studentGrades.forEach((note: any) => {
          if (note.sub_subject_name && note.grade !== null && note.grade !== undefined) {
            if (!subSubjectGroups[note.sub_subject_name]) {
              subSubjectGroups[note.sub_subject_name] = [];
            }
            subSubjectGroups[note.sub_subject_name].push(note);
          }
        });
        
        // Calculer la moyenne de chaque sous-matière
        Object.keys(subSubjectGroups).forEach(subSubjectName => {
          const subSubjectNotes = subSubjectGroups[subSubjectName];
          
          if (subSubjectNotes.length > 0) {
            const totalPoints = subSubjectNotes.reduce((sum: number, note: any) => {
              const grade = parseFloat(note.grade) || 0;
              const coeff = parseFloat(note.coefficient) || 1;
              return sum + (grade * coeff);
            }, 0);
            
            const totalCoefficients = subSubjectNotes.reduce((sum: number, note: any) => {
              return sum + (parseFloat(note.coefficient) || 1);
            }, 0);
            
            subSubjectAverages[subSubjectName] = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
          } else {
            subSubjectAverages[subSubjectName] = 0;
          }
        });
        
        // Calculer la moyenne française = moyenne des moyennes des sous-matières
        const validSubSubjects = Object.values(subSubjectAverages).filter(avg => avg > 0);
        moyenne = validSubSubjects.length > 0 ? 
          validSubSubjects.reduce((sum, avg) => sum + avg, 0) / validSubSubjects.length : null;
        
        console.log(`📊 Moyenne française calculée (TeacherDashboard):`, {
          student: `${student.first_name} ${student.last_name}`,
          subSubjectAverages,
          frenchAverage: moyenne ? moyenne.toFixed(2) : 'N/A',
          className: selectedClass?.name,
          notes: studentGrades.map((n: any) => ({ 
            sub: n.sub_subject_name, 
            grade: n.grade, 
            coeff: n.coefficient 
          })),
          calculation: {
            subSubjectCount: validSubSubjects.length,
            subSubjectAverages,
            sum: validSubSubjects.reduce((sum, avg) => sum + avg, 0),
            average: moyenne
          }
        });
      } else {
        // Calcul normal pour les autres matières ou français sans sous-matières
        const totalPoints = studentGrades.reduce((acc, n) => acc + (n.grade || 0) * (n.coefficient || 1), 0);
        const totalCoefficients = studentGrades.reduce((acc, n) => acc + (n.coefficient || 1), 0);
        moyenne = totalCoefficients > 0 ? totalPoints / totalCoefficients : null;
      }
      
      const absenceCount = (() => {
        const filtered = classAbsences.filter(a =>
          a && String(a.student_id) === String(student.id) &&
          String(a.subject_id) === String(selectedSubject) &&
          a.semester && selectedTrimesterName &&
          a.semester.trim().toLowerCase() === selectedTrimesterName.trim().toLowerCase()
        );
        const totalHours = filtered.reduce((sum, current) => sum + (Number(current.duration_hours) || 0), 0);
        console.log('DEBUG Absences pour', student.first_name, student.last_name, ':', {
          totalAbsences: filtered.length,
          totalHours: totalHours,
          selectedTrimesterName: selectedTrimesterName,
          selectedSubject: selectedSubject,
          studentId: student.id,
          absences: filtered
        });
        return totalHours;
      })();
      
      return { 
        student, 
        notes: studentGrades, 
        moyenne,
        absenceCount,
        // Ajouter une clé stable pour éviter les problèmes de rendu
        key: `student-${student.id}-${selectedTrimesterId}-${selectedSubject}`
      };
    }).filter(Boolean); // Filtrer les valeurs null
    
    // Trier par ordre alphabétique : prénom puis nom de famille
    return processed.sort((a, b) => {
      // Vérifier que a et b ne sont pas null
      if (!a || !b) return 0;
      
      // Nettoyer et normaliser les noms (supprimer les espaces en début/fin)
      const lastNameA = (a.student.last_name || '').trim().toLowerCase();
      const lastNameB = (b.student.last_name || '').trim().toLowerCase();
      const firstNameA = (a.student.first_name || '').trim().toLowerCase();
      const firstNameB = (b.student.first_name || '').trim().toLowerCase();
      
      console.log(`[TRI] Comparaison: ${a.student.last_name} ${a.student.first_name} vs ${b.student.last_name} ${b.student.first_name}`);
      console.log(`[TRI] Normalisés: ${lastNameA} ${firstNameA} vs ${lastNameB} ${firstNameB}`);
      
      // Comparer d'abord par prénom
      if (firstNameA < firstNameB) {
        console.log(`[TRI] ${a.student.first_name} < ${b.student.first_name} (retour -1)`);
        return -1;
      }
      if (firstNameA > firstNameB) {
        console.log(`[TRI] ${a.student.first_name} > ${b.student.first_name} (retour 1)`);
        return 1;
      }
      
      // Si les prénoms sont identiques, comparer par nom de famille
      if (lastNameA < lastNameB) {
        console.log(`[TRI] Même prénom, ${a.student.last_name} < ${b.student.last_name} (retour -1)`);
        return -1;
      }
      if (lastNameA > lastNameB) {
        console.log(`[TRI] Même prénom, ${a.student.last_name} > ${b.student.last_name} (retour 1)`);
        return 1;
      }
      
      console.log(`[TRI] Égalité entre ${a.student.last_name} ${a.student.first_name} et ${b.student.last_name} ${b.student.first_name}`);
      return 0;
    });
    
    // Log de l'ordre final après tri
    console.log('[TRI] Ordre final des élèves après tri:');
    processed.forEach((student, index) => {
      if (student && student.student) {
        console.log(`[TRI] ${index + 1}. ${student.student.last_name} ${student.student.first_name}`);
      }
    });
  }, [students, grades, classAbsences, selectedTrimesterId, selectedSubject, trimesters]);

  const handleOpenNotif = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorNotif(event.currentTarget);
  };

  const handleCloseNotif = () => {
    setAnchorNotif(null);
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleMarkRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleSendNotesToStudents = async () => {
    if (!selectedClass) return;
    setOpenConfirmStudents(true);
  };

  const confirmSendNotesToStudents = async () => {
    setOpenConfirmStudents(false);
    if (!selectedClass) return;
    const { id } = selectedClass;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`https://2ise-groupe.com/api/classes/${id}/notify-students`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbar({ open: true, message: '✅ Les notifications ont bien été envoyées à tous les étudiants de la classe. Ils recevront une alerte avec leurs nouvelles notes.', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Erreur lors de la notification des étudiants.', severity: 'error' });
    }
  };

  const handleSendNotesToAdmin = async () => {
    if (!selectedClass) return;
    setOpenConfirmAdmin(true);
  };

  const confirmSendNotesToAdmin = async () => {
    setOpenConfirmAdmin(false);
    if (!selectedClass) return;
    const { id } = selectedClass;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`https://2ise-groupe.com/api/classes/${id}/submit-to-admin`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbar({ open: true, message: '✅ Les notes et moyennes de la classe ont bien été transmises à l\'administration. L\'équipe administrative pourra désormais établir les bulletins.', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Erreur lors de la transmission à l\'administration.', severity: 'error' });
    }
  };

  const handlePublishGrades = async () => {
    if (!selectedClass || !selectedSubject) {
      setSnackbar({ open: true, message: 'Veuillez sélectionner une classe et une matière', severity: 'error' });
      return;
    }
    
    setPublishingGrades(true);
    try {
      const token = localStorage.getItem('token');
      const selectedTrimesterName = trimesters.find(t => t.id === selectedTrimesterId)?.name;
      
      if (!selectedTrimesterName) {
        setSnackbar({ open: true, message: 'Veuillez sélectionner un trimestre', severity: 'error' });
        return;
      }
      
      const response = await axios.post('https://2ise-groupe.com/api/teachers/publish-grades', {
        class_id: selectedClass.id,
        subject_id: selectedSubject,
        semester: selectedTrimesterName,
        school_year: schoolYear
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const affectedRows = response.data.affectedRows || 0;
      setSnackbar({ 
        open: true, 
        message: `✅ ${affectedRows} note(s) publiée(s) avec succès ! Les étudiants peuvent maintenant voir leurs notes.`, 
        severity: 'success' 
      });
      
      // Rafraîchir les notes pour mettre à jour l'affichage
      await handleSelectClass(selectedClass);
    } catch (err: any) {
      console.error('Erreur lors de la publication des notes:', err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Erreur lors de la publication des notes.', severity: 'error' });
    } finally {
      setPublishingGrades(false);
    }
  };

  // Ouvre la modale et initialise la liste des présences
  const handleOpenAbsenceDialog = () => {
    const initial: { [studentId: number]: { absent: boolean; reason: string; status: 'excused' | 'unexcused'; duration: number } } = {};
    students.forEach(s => {
      initial[s.id] = { absent: false, reason: '', status: 'unexcused', duration: 1 };
    });
    setAbsenceList(initial);
    setOpenAbsenceDialog(true);
  };

  // Gère le changement d'état d'absence pour un élève
  const handleAbsenceChange = (studentId: number, field: string, value: any) => {
    setAbsenceList(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  // Validation collective des absences
  const handleSubmitAbsences = async () => {
    // Vérifier si l'année scolaire est fermée
    if (selectedSchoolYearStatus && selectedSchoolYearStatus.is_active === false) {
      setSnackbar({ 
        open: true, 
        message: `Impossible de modifier les absences : l'année scolaire ${schoolYear} est fermée.`, 
        severity: 'error' 
      });
      return;
    }

    // Vérifier si le trimestre est publié (seulement pour empêcher la modification des absences)
    const selectedTrimesterName = selectedTrimesterId ? trimesters.find(t => t.id === selectedTrimesterId)?.name : '';
    if (selectedTrimesterName && publishedTrimesters[selectedTrimesterName]) {
      setSnackbar({ 
        open: true, 
        message: `Impossible de modifier les absences : le bulletin du ${selectedTrimesterName} est publié.`, 
        severity: 'error' 
      });
      return;
    }

    const token = localStorage.getItem('token');
    let hasError = false;
    const currentTrimesterName = trimesters.find(t => t.id === selectedTrimesterId)?.name;
    
    const promises = Object.entries(absenceList)
      .filter(([_, v]) => v.absent)
      .map(([studentId, v]) =>
        axios.post('https://2ise-groupe.com/api/absences', {
          student_id: Number(studentId),
          class_id: selectedClass?.id,
          subject_id: selectedSubject,
          teacher_id: teacher?.id,
          date: new Date().toISOString().slice(0, 10),
          reason: v.reason,
          status: v.status,
          duration_hours: v.duration,
          semester: currentTrimesterName,
          trimester_id: selectedTrimesterId,
          school_year: schoolYear
        }, { headers: { Authorization: `Bearer ${token}` } })
        .catch(err => {
          hasError = true;
          setSnackbar({
            open: true,
            message: err.response?.data?.message || "Erreur lors de l'enregistrement de l'absence.",
            severity: 'error'
          });
        })
      );
    
    await Promise.all(promises);
    if (!hasError) {
      setOpenAbsenceDialog(false);
      setSnackbar({
        open: true,
        message: "✅ Absences enregistrées avec succès !",
        severity: 'success'
      });
      // Recharger les données pour mettre à jour l'affichage
      if (selectedClass) {
        await handleSelectClass(selectedClass);
      }
    }
  };

  // Charger l'emploi du temps du professeur pour l'année scolaire sélectionnée
  useEffect(() => {
    if (!teacher?.id) return;
    
    let isMounted = true;
    
    if (isMounted) {
      setSchedule([]);
      setLoadingSchedule(true);
    }
    
    const token = localStorage.getItem('token');
    axios.get(`https://2ise-groupe.com/api/teachers/${teacher.id}/teaching-schedule?school_year=${schoolYear}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (isMounted) {
          setSchedule(res.data);
        }
      })
      .catch(err => {
        if (isMounted) {
          setSchedule([]);
          console.error('Erreur lors du chargement de l\'emploi du temps:', err);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingSchedule(false);
        }
      });
      
    return () => {
      isMounted = false;
    };
  }, [teacher?.id, schoolYear]);

  // Charger les trimestres disponibles
  useEffect(() => {
    let isMounted = true;
    
    const fetchTrimesters = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('https://2ise-groupe.com/api/trimesters', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (isMounted) {
          setTrimesters(data);
          if (data.length > 0 && selectedTrimesterId === null) {
            setSelectedTrimesterId(data[0].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Erreur lors du chargement des trimestres:', err);
        }
      }
    };
    
    fetchTrimesters();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Charger les sous-matières de français
  useEffect(() => {
    let isMounted = true;
    
    const fetchFrenchSubSubjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('https://2ise-groupe.com/api/french-sub-subjects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (isMounted) {
          console.log('Sous-matières français chargées:', data);
          setFrenchSubSubjects(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Erreur lors du chargement des sous-matières français:', err);
        }
      }
    };
    
    fetchFrenchSubSubjects();
    
    return () => {
      isMounted = false;
    };
  }, []);



  // Utilitaire pour formater l'heure ("08:00:00" → "08h00")
  function formatHour(time: string) {
    if (!time) return '';
    const [h, m] = time.split(':');
    return `${h}h${m}`;
  }
  // Utilitaire pour traduire les jours anglais en français
  const daysFr: Record<string, string> = {
    'Monday': 'Lundi', 'Tuesday': 'Mardi', 'Wednesday': 'Mercredi', 'Thursday': 'Jeudi', 'Friday': 'Vendredi', 'Saturday': 'Samedi', 'Sunday': 'Dimanche',
    'Lundi': 'Lundi', 'Mardi': 'Mardi', 'Mercredi': 'Mercredi', 'Jeudi': 'Jeudi', 'Vendredi': 'Vendredi', 'Samedi': 'Samedi', 'Dimanche': 'Dimanche'
  };

  // Utilitaire pour parser une note ou une moyenne
  const parseNote = (val: any) => {
    if (typeof val === 'string') {
      // Si c'est du type "14:00:00" ou "14:00"
      if (val.includes(':')) {
        return parseFloat(val.split(':')[0]);
      }
      // Si c'est du type "14h00"
      if (val.includes('h')) {
        return parseFloat(val.split('h')[0]);
      }
      return parseFloat(val.replace(',', '.'));
    }
    return Number(val);
  };

  // Ajout : rechargement des données à chaque changement de trimestre, matière ou classe
  useEffect(() => {
    if (selectedClass && selectedSubject) {
      let isMounted = true;
      
      if (isMounted) {
        setLoadingAbsences(true);
      }
      
      handleSelectClass(selectedClass).finally(() => {
        if (isMounted) {
          setLoadingAbsences(false);
        }
      });
      
      return () => {
        isMounted = false;
      };
    }
  }, [selectedTrimesterId, selectedSubject, selectedClass]);

  // Vérifier le statut de publication quand le trimestre change
  useEffect(() => {
    if (selectedTrimesterId && trimesters.length > 0) {
      const selectedTrimester = trimesters.find(t => t.id === selectedTrimesterId);
      if (selectedTrimester) {
        checkPublication(selectedTrimester.name);
      }
    }
  }, [selectedTrimesterId, trimesters]);

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
          <IconButton color="inherit" onClick={handleOpenNotif} sx={{ position: 'relative' }}>
            <Badge badgeContent={unreadCount} color="error" invisible={unreadCount === 0}>
              <NotificationsIcon sx={{ color: 'white', fontSize: 28 }} />
            </Badge>
          </IconButton>
          <Popover
            open={Boolean(anchorNotif)}
            anchorEl={anchorNotif}
            onClose={handleCloseNotif}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { width: { xs: '90vw', sm: 350 }, maxWidth: 400, p: 2, borderRadius: 3 } }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" fontWeight={700}>Notifications</Typography>
              <Button size="small" onClick={handleMarkAllRead} disabled={unreadCount === 0}>Tout marquer lu</Button>
            </Box>
            {notifications.length === 0 && (
              <Typography color="text.secondary">Aucune notification.</Typography>
            )}
            <Stack spacing={1}>
              {notifications.map(n => (
                <Paper key={`notification-${n.id}`} sx={{ p: 1.5, bgcolor: n.read ? '#f5f5f5' : '#e3f2fd', borderLeft: n.read ? '4px solid #bdbdbd' : '4px solid #1976d2', boxShadow: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography fontWeight={700} fontSize={15}>{n.title}</Typography>
                      <Typography fontSize={14} color="text.secondary">{n.message}</Typography>
                      <Typography fontSize={12} color="text.disabled">{n.date.toLocaleString()}</Typography>
                    </Box>
                    {!n.read && (
                      <Button size="small" onClick={() => handleMarkRead(n.id)} sx={{ ml: 1 }}>Lu</Button>
                    )}
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Popover>
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

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <FormControl sx={{ minWidth: 160 }} size="small">
            <InputLabel id="school-year-label">Année scolaire</InputLabel>
            <Select
              labelId="school-year-label"
              value={schoolYear}
              label="Année scolaire"
              onChange={e => {
                setSchoolYear(e.target.value);
                setViewStep('subjects');
                setSelectedClass(null);
                setStudents([]);
                setGrades([]);
                setClassAbsences([]);
                setIsTeacherDeactivated(false); // Réinitialiser l'état de désactivation
              }}
            >
              {SCHOOL_YEARS.map(year => (
                <MenuItem key={`school-year-${year}`} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Affichage du message si le professeur est désactivé */}
        {isTeacherDeactivated ? (
          <Box sx={{ 
            mt: 4, 
            p: 6, 
            borderRadius: 4, 
            background: 'linear-gradient(135deg, #ffebee 0%, #fce4ec 100%)', 
            textAlign: 'center',
            border: '2px solid #f44336',
            boxShadow: '0 8px 32px rgba(244, 67, 54, 0.15)'
          }}>
            <Typography variant="h4" sx={{ color: '#d32f2f', fontWeight: 700, mb: 3 }}>
              ⚠️ Accès Restreint
            </Typography>
            <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 600, mb: 2 }}>
              Vous n'enseignez pas dans cet établissement pour l'année scolaire {schoolYear}
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
              Votre compte a été désactivé pour cette année scolaire. Veuillez contacter l'administration 
              si vous pensez qu'il s'agit d'une erreur.
            </Typography>
            <Typography variant="body2" sx={{ color: '#888', fontStyle: 'italic' }}>
              Vous pouvez changer d'année scolaire en utilisant le sélecteur ci-dessus pour voir 
              les années où vous étiez actif.
            </Typography>
          </Box>
        ) : (
          <>
            {loadingSchedule ? null : schedule.length === 0 ? (
              <Box sx={{ mt: 2, p: 4, borderRadius: 4, background: 'linear-gradient(135deg, #fffde7 0%, #e3f2fd 100%)', textAlign: 'center' }}>
                <Typography variant="h5" sx={{ color: '#d32f2f', fontWeight: 700, mb: 2 }}>
                  Aucun emploi du temps n'est disponible pour cette année scolaire.
              </Typography>
                <Typography color="text.secondary">
                  Veuillez vérifier l'année sélectionnée ou contacter l'administration si besoin.
                </Typography>
              </Box>
            ) : (
          <Paper elevation={2} sx={{ p: 3, borderRadius: 4, mb: 4, background: 'linear-gradient(135deg, #e3f2fd 0%, #fce4ec 100%)', boxShadow: '0 4px 24px 0 rgba(33, 150, 243, 0.10)' }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <CalendarTodayIcon color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2', letterSpacing: 1 }}>
                Mon emploi du temps <span style={{ fontWeight: 400, color: '#333', fontSize: 20 }}>({schoolYear})</span>
              </Typography>
            </Stack>
            <Box sx={{ 
              display: { xs: 'block', md: 'none' }, // Version mobile
              mb: 2 
            }}>
              {schedule.map((row, idx) => (
                <Paper
                  key={`mobile-schedule-${idx}-${row.class_name}-${row.subject_name}-${row.day_of_week}`}
                  sx={{
                    p: 2,
                    mb: 1.5,
                    borderRadius: 3,
                    background: idx % 2 === 0 ? '#f7fbff' : '#ffffff',
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', fontSize: 16 }}>
                      {row.class_name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', fontWeight: 600 }}>
                      {daysFr[row.day_of_week] || row.day_of_week}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                      {row.subject_name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', fontWeight: 600 }}>
                      {formatHour(row.start_time)} - {formatHour(row.end_time)}
                    </Typography>
                  </Box>
                  {row.room_name && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600, fontSize: 12 }}>
                        📍 {row.room_name}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
            
            <TableContainer 
              component={Paper} 
              elevation={0} 
              sx={{ 
                borderRadius: 3, 
                boxShadow: 'none', 
                mb: 2, 
                background: 'rgba(255,255,255,0.85)',
                display: { xs: 'none', md: 'block' } // Version desktop
              }}
            >
              <Table size="medium">
                <TableHead>
                  <TableRow sx={{ background: 'linear-gradient(90deg, #1976d2 80%, #d32f2f 100%)' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: 18, borderTopLeftRadius: 12 }}>Classe</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: 18 }}>Matière</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: 18 }}>Jour</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: 18 }}>Début</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: 18 }}>Fin</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: 18, borderTopRightRadius: 12 }}>Salle</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedule.map((row, idx) => (
                    <TableRow
                      key={`desktop-schedule-${idx}-${row.class_name}-${row.subject_name}-${row.day_of_week}`}
                      sx={{
                        backgroundColor: idx % 2 === 0 ? '#f7fbff' : '#ffffff',
                        '&:hover': { backgroundColor: '#e3f2fd' },
                        transition: 'background 0.2s',
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, fontSize: 16 }}>{row.class_name}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 16 }}>{row.subject_name}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 16 }}>{daysFr[row.day_of_week] || row.day_of_week}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 16 }}>{formatHour(row.start_time)}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 16 }}>{formatHour(row.end_time)}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 16, color: '#1976d2' }}>
                        {row.room_name ? `📍 ${row.room_name}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          
          )}
        </>
        )}

        {/* Si aucune matière ou classe, masquer tout le bloc */}
        {!isTeacherDeactivated && teacher && (teacher.subjects?.length === 0 || teacher.classes?.length === 0) ? (
          null
        ) : !isTeacherDeactivated ? (
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
                    key={`subject-${subject.id}`}
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
                      <Paper key={`class-${classe.id}`} sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              loadingAbsences ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="primary">Chargement des absences...</Typography>
                </Box>
              ) : (
                <Paper elevation={4} sx={{ p: { xs: 2, md: 3 }, borderRadius: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      Classe : {selectedClass.name}
                      <Typography variant="body1" component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                        ({subjects.find(s => s.id === Number(selectedSubject))?.name})
                      </Typography>
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handlePublishGrades}
                        disabled={publishingGrades || isActionDisabled()}
                        sx={{ 
                          fontWeight: 700, 
                          px: { xs: 1, sm: 2 }, 
                          py: { xs: 0.8, sm: 1 }, 
                          borderRadius: 2,
                          fontSize: { xs: 14, sm: 16 },
                          minWidth: { xs: '100%', sm: 'auto' }
                        }}
                      >
                        {publishingGrades ? 'Publication...' : 'Publier les notes'}
                      </Button>
                    </Box>
                  </Box>
                  {getAlertMessage() && (
                    <Alert 
                      severity="warning" 
                      sx={{ 
                        mb: 2,
                        background: 'linear-gradient(45deg, #ff9800, #f57c00)',
                        color: 'white',
                        '& .MuiAlert-icon': {
                          color: 'white'
                        }
                      }}
                    >
                      {getAlertMessage()}
                    </Alert>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                      variant="contained"
                      color="warning"
                      disabled={isActionDisabled()}
                      sx={{ 
                        fontWeight: 700, 
                        borderRadius: 2,
                        opacity: isActionDisabled() ? 0.5 : 1,
                        fontSize: { xs: 14, sm: 16 },
                        px: { xs: 1, sm: 2 },
                        py: { xs: 0.8, sm: 1 }
                      }}
                      onClick={handleOpenAbsenceDialog}
                    >
                      GÉRER LES ABSENCES
                    </Button>
                  </Box>
                  <Stack
                    direction={{ xs: 'column', sm: 'column', md: 'row' }}
                    spacing={2}
                    sx={{ mb: 3, justifyContent: 'center', alignItems: { xs: 'center', md: 'flex-start' } }}
                  >
                    {trimesters.map(trim => (
                      <Box
                        key={`trimester-${trim.id}`}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          mx: { xs: 0, md: 1 },
                          mb: { xs: 1.5, md: 0 },
                          width: { xs: '100%', md: 'auto' }
                        }}
                      >
                        <Button
                          variant={selectedTrimesterId === trim.id ? 'contained' : 'outlined'}
                          color={selectedTrimesterId === trim.id ? 'primary' : 'inherit'}
                          onClick={() => setSelectedTrimesterId(trim.id)}
                          sx={{
                            fontWeight: 700,
                            borderRadius: 2,
                            minWidth: { xs: '100%', md: 160 },
                            fontSize: { xs: 14, md: 16 },
                            py: { xs: 1, md: 1.5 },
                            px: { xs: 0, md: 2 },
                            mb: 0.5
                          }}
                          fullWidth={true}
                        >
                          {trim.name}
                        </Button>
                        {trim.start_date && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: 11, md: 13 } }}>
                            Début : {new Date(trim.start_date).toLocaleDateString('fr-FR')}
                          </Typography>
                        )}
                        {trim.end_date && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.2, fontSize: { xs: 11, md: 13 } }}>
                            Fin : {new Date(trim.end_date).toLocaleDateString('fr-FR')}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                  {/* Version mobile pour le tableau des élèves */}
                  <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
                    {processedStudents.map((row, idx) => {
                      if (!row) return null;
                      
                      return (
                        <Paper
                          key={`mobile-student-${row.student.id}-${idx}`}
                          sx={{
                            p: 2,
                            mb: 2,
                            borderRadius: 3,
                            background: idx % 2 === 0 ? '#f7fbff' : '#ffffff',
                            border: '1px solid #e0e0e0',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', fontSize: 16 }}>
                                {row.student.first_name} {row.student.last_name}
                              </Typography>
                              {areAllStudentGradesPublished(row.student.id) && (
                                <Chip 
                                  label="Toutes notes publiées" 
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                  sx={{ fontSize: 10, height: 20 }}
                                />
                              )}
                            </Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 600 }}>
                              {row.absenceCount > 0 ? `${row.absenceCount} h absences` : 'Aucune absence'}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ mb: 1.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#333', mb: 0.5 }}>
                              Notes ({trimesters.find(t => t.id === selectedTrimesterId)?.name || 'Trimestre'}):
                            </Typography>
                            {row.notes.length > 0 ? (
                              <Box>
                                {row.notes.map(n => {
                                  if (!n || !n.id) return null;
                                  
                                  return (
                                    <Box key={`mobile-grade-${n.id}`} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2', mr: 1 }}>
                                        {parseNote(n.grade).toFixed(2)} (x{n.coefficient || 1})
                                      </Typography>
                                      {!n.is_published && <Chip label="Non publié" size="small" color="warning" variant="outlined" sx={{ ml: 0.5 }} />}
                                      {n.is_published && <Chip label="Publié" size="small" color="success" variant="outlined" sx={{ ml: 0.5 }} />}
                                    </Box>
                                  );
                                }).filter(Boolean)}
                                <Chip
                                  label={`${row.notes.filter(n => n && n.is_published).length}/${row.notes.length} publiées`}
                                  size="small"
                                  color={row.notes.filter(n => n && n.is_published).length === row.notes.length ? "success" : "warning"}
                                  variant="outlined"
                                  sx={{ mt: 1 }}
                                />
                              </Box>
                            ) : (
                              <Typography variant="body2" sx={{ color: '#bdbdbd', fontStyle: 'italic' }}>
                                Aucune note
                              </Typography>
                            )}
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                                Moyenne:
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: row.moyenne != null ? '#1976d2' : '#bdbdbd' }}>
                                {row.moyenne != null ? parseNote(row.moyenne).toFixed(2) : '-'}
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              disabled={isActionDisabled()}
                              onClick={() => handleOpenDialog(row.student)}
                              sx={{
                                background: isActionDisabled()
                                  ? 'linear-gradient(90deg, #bdbdbd 0%, #9e9e9e 100%)'
                                  : 'linear-gradient(90deg, #1976d2 0%, #43e97b 100%)',
                                color: 'white',
                                fontWeight: 700,
                                borderRadius: 2,
                                opacity: isActionDisabled() ? 0.5 : 1,
                                '&:hover': {
                                  background: isActionDisabled()
                                    ? 'linear-gradient(90deg, #bdbdbd 0%, #9e9e9e 100%)'
                                    : 'linear-gradient(90deg, #1565c0 0%, #21cb7a 100%)',
                                },
                              }}
                              title={isActionDisabled() ? getAlertMessage() : ''}
                            >
                              + Note
                            </Button>
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                  
                  {/* Version desktop pour le tableau des élèves */}
                  <TableContainer component={Paper} elevation={0} sx={{ 
                    mt: 1, 
                    mb: 2, 
                    border: 'none', 
                    borderRadius: 3, 
                    boxShadow: '0 4px 24px 0 rgba(33, 150, 243, 0.08)',
                    display: { xs: 'none', md: 'block' }
                  }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ background: 'linear-gradient(90deg, #1976d2 80%, #d32f2f 100%)' }}>
                          <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: 18, borderTopLeftRadius: 12 }}>Élève</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: 18 }}>{`Notes ${trimesters.find(t => t.id === selectedTrimesterId)?.name || 'Trimestre'}`}</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: 18 }}>{`Moyenne ${trimesters.find(t => t.id === selectedTrimesterId)?.name || 'Trimestre'}`}</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: 18 }}>H. Absences</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: 18, borderTopRightRadius: 12 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {processedStudents.map((row, idx) => {
                          // Vérifier que row n'est pas null
                          if (!row) {
                            console.warn('Row invalide à l\'index:', idx);
                            return null;
                          }
                          
                          console.log('DEBUG moyenne affichée', row.moyenne, typeof row.moyenne, row.student.first_name, row.student.last_name);
                          return (
                            <TableRow
                              key={row.key || `student-${row.student.id}-${idx}`}
                              sx={{
                                backgroundColor: idx % 2 === 0 ? '#f7fbff' : '#ffffff',
                                '&:hover': { backgroundColor: '#e3f2fd' },
                                transition: 'background 0.2s',
                              }}
                            >
                              <TableCell sx={{ fontWeight: 600, fontSize: 16 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <span>{row.student.first_name} {row.student.last_name}</span>
                                  {areAllStudentGradesPublished(row.student.id) && (
                                    <Chip 
                                      label="Toutes notes publiées" 
                                      size="small" 
                                      color="success" 
                                      variant="outlined"
                                      sx={{ fontSize: 10, height: 20 }}
                                    />
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                {row.notes.length > 0 ? (
                                  <Box>
                                    {row.notes.map(n => {
                                      // Vérifier que la note est valide
                                      if (!n || !n.id) {
                                        console.warn('Note invalide:', n);
                                        return null;
                                      }
                                      
                                      return (
                                        <span key={`grade-${n.id}-${n.student_id}`} style={{ display: 'inline-block', marginRight: 8, marginBottom: 2 }}>
                                          <b style={{ color: '#1976d2' }}>{parseNote(n.grade).toFixed(2)}</b> (x{n.coefficient || 1}){' '}
                                          {!n.is_published && <Chip label="Non publié" size="small" color="warning" variant="outlined" sx={{ ml: 0.5, fontWeight: 600 }} />}
                                          {n.is_published && <Chip label="Publié" size="small" color="success" variant="outlined" sx={{ ml: 0.5, fontWeight: 600 }} />}
                                        </span>
                                      );
                                    }).filter(Boolean)}
                                    <Box sx={{ mt: 1 }}>
                                      <Chip
                                        label={`${row.notes.filter(n => n && n.is_published).length}/${row.notes.length} publiées`}
                                        size="small"
                                        color={row.notes.filter(n => n && n.is_published).length === row.notes.length ? "success" : "warning"}
                                        variant="outlined"
                                        sx={{ fontWeight: 600 }}
                                      />
                                    </Box>
                                  </Box>
                                ) : (
                                  <span style={{ color: '#bdbdbd' }}>-</span>
                                )}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, background: '#e3f2fd', color: row.moyenne != null ? '#1976d2' : '#bdbdbd', borderRadius: 2, fontSize: 16 }}>
                                {row.moyenne != null ? parseNote(row.moyenne).toFixed(2) : '-'}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, color: row.absenceCount > 0 ? '#d32f2f' : '#1976d2', fontSize: 16 }}>
                                {row.absenceCount > 0 ? `${row.absenceCount} h` : '-'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="medium"
                                  variant="contained"
                                  color="primary"
                                  disabled={isActionDisabled()}
                                  onClick={() => handleOpenDialog(row.student)}
                                  startIcon={<span style={{ fontWeight: 'bold', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</span>}
                                  sx={{
                                    background: isActionDisabled()
                                      ? 'linear-gradient(90deg, #bdbdbd 0%, #9e9e9e 100%)'
                                      : 'linear-gradient(90deg, #1976d2 0%, #43e97b 100%)',
                                    color: 'white',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    borderRadius: 3,
                                    boxShadow: '0 2px 8px 0 rgba(33,150,243,0.10)',
                                    px: 2.5,
                                    py: 1.2,
                                    fontSize: 15,
                                    letterSpacing: 1,
                                    transition: 'all 0.2s',
                                    opacity: isActionDisabled() ? 0.5 : 1,
                                    '&:hover': {
                                      background: isActionDisabled()
                                        ? 'linear-gradient(90deg, #bdbdbd 0%, #9e9e9e 100%)'
                                        : 'linear-gradient(90deg, #1565c0 0%, #21cb7a 100%)',
                                      boxShadow: '0 4px 16px 0 rgba(33,150,243,0.18)',
                                      transform: isActionDisabled() ? 'none' : 'translateY(-2px) scale(1.04)',
                                    },
                                    '& .MuiButton-startIcon': {
                                      marginRight: 1.2,
                                    },
                                  }}
                                  title={isActionDisabled() ? getAlertMessage() : ''}
                                >
                                  Ajouter une note
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        }).filter(Boolean)}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Button sx={{ mt: 2, fontWeight: 600 }} onClick={() => setViewStep('classes')}>
                    RETOUR AUX CLASSES
                  </Button>
                </Paper>
              )
            )}
          </Grid>
        </Grid>
        ) : null}
      </Container>

      {/* Dialog pour ajouter/modifier les notes */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        TransitionComponent={Fade}
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', fontSize: 22 }}>
          {editMode ? 'Modifier' : 'Ajouter'} une note pour {selectedStudent?.first_name}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#f5faff', borderRadius: 3, p: 3 }}>
          {studentGradesSnapshot.length > 0 && (
            <Box mb={2}>
              <Typography variant="h6" sx={{ mb: 1, color: 'primary.main', fontWeight: 600 }}>Notes existantes</Typography>
              {studentGradesSnapshot.map((g) => (
                <Paper key={g.id} sx={{ 
                  p: 1.5, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 1, 
                  bgcolor: g.is_published ? '#e8f5e8' : '#f0f0f0', 
                  borderRadius: 2,
                  border: g.is_published ? '2px solid #4caf50' : '1px solid #e0e0e0'
                }}>
                  <Box>
                    <Typography>
                      Note: <b>{parseNote(g.grade).toFixed(2)}</b> | Coeff: {g.coefficient} | Semestre: {g.semester}
                    </Typography>
                    {g.is_published && (
                      <Chip 
                        label="PUBLIÉE - Non modifiable" 
                        size="small" 
                        color="success" 
                        variant="filled"
                        sx={{ mt: 0.5, fontWeight: 600 }}
                      />
                    )}
                  </Box>
                  <Stack direction="row">
                    <Button 
                      size="small" 
                      onClick={() => handleEditGrade(g)} 
                      variant="outlined" 
                      disabled={isActionDisabled() || g.is_published}
                      sx={{ 
                        mr: 1, 
                        opacity: (isActionDisabled() || g.is_published) ? 0.5 : 1,
                        color: g.is_published ? '#9e9e9e' : 'inherit'
                      }}
                      title={g.is_published ? 'Note publiée - Modification impossible' : ''}
                    >
                      Modifier
                    </Button>
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={() => handleDeleteGrade(g.id)} 
                      variant="outlined"
                      disabled={isActionDisabled() || g.is_published}
                      sx={{ 
                        opacity: (isActionDisabled() || g.is_published) ? 0.5 : 1,
                        color: g.is_published ? '#9e9e9e' : 'inherit'
                      }}
                      title={g.is_published ? 'Note publiée - Suppression impossible' : ''}
                    >
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
            disabled={isActionDisabled()}
            fullWidth
            sx={{ mt: 2, mb: 2 }}
            inputProps={{ min: 0, max: 20, step: 0.5 }}
            helperText={isActionDisabled() 
              ? getAlertMessage()
              : "Note entre 0 et 20"
            }
          />
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Trimestre</InputLabel>
            <Select
              value={selectedTrimesterId ?? ''}
              label="Trimestre"
              disabled={isActionDisabled()}
              onChange={e => setSelectedTrimesterId(Number(e.target.value))}
            >
              {trimesters.map(trim => (
                <MenuItem key={`grade-trim-${trim.id}`} value={trim.id}>
                  {trim.name} {trim.is_open ? '(Ouvert)' : '(Fermé)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Sélection des sous-matières de français pour le premier cycle UNIQUEMENT */}
          {(() => {
            // Vérification stricte : uniquement pour FRANÇAIS et premier cycle (6ème à 3ème)
            const selectedSubjectName = subjects.find(s => s.id === selectedSubject)?.name?.toLowerCase();
            const isFrench = selectedSubjectName === 'français' || selectedSubjectName === 'francais';
            
            const className = selectedClass?.name?.toLowerCase() || '';
            
            // Premier cycle : 6ème à 3ème
            const isFirstCycle = className.includes('6ème') || className.includes('5ème') || 
                                className.includes('4ème') || className.includes('3ème') ||
                                className.includes('6eme') || className.includes('5eme') || 
                                className.includes('4eme') || className.includes('3eme') ||
                                className.includes('6e') || className.includes('5e') || 
                                className.includes('4e') || className.includes('3e') ||
                                className.includes('sixième') || className.includes('cinquième') ||
                                className.includes('quatrième') || className.includes('troisième') ||
                                className.includes('sixieme') || className.includes('cinquieme') ||
                                className.includes('quatrieme') || className.includes('troisieme') ||
                                className.includes('6 éme') || className.includes('5 éme') ||
                                className.includes('4 éme') || className.includes('3 éme') ||
                                className.includes('6 eme') || className.includes('5 eme') ||
                                className.includes('4 eme') || className.includes('3 eme');
            
            // Second cycle : 2nde à Terminale (EXPLICITEMENT EXCLUS)
            const isSecondCycle = className.includes('2nde') || className.includes('1ère') || 
                                 className.includes('1ere') || className.includes('terminale') ||
                                 className.includes('seconde') || className.includes('premiere') ||
                                 className.includes('première');
            
            // Ne pas afficher si c'est le second cycle, même si c'est français
            const shouldShow = isFrench && isFirstCycle && !isSecondCycle && frenchSubSubjects.length > 0;
            
            console.log('🎯 DEBUG Affichage sous-matières français:', {
              selectedSubject,
              selectedSubjectName,
              isFrench,
              className,
              isFirstCycle,
              isSecondCycle,
              frenchSubSubjectsCount: frenchSubSubjects.length,
              shouldShow,
              subjects: subjects.map(s => ({ id: s.id, name: s.name })),
              'DÉTAIL_CLASSE': {
                'nom_original': selectedClass?.name,
                'nom_lowercase': className,
                'contient_premiere': className.includes('premiere'),
                'contient_première': className.includes('première'),
                'contient_1ere': className.includes('1ere'),
                'contient_1ère': className.includes('1ère'),
                'contient_sixieme': className.includes('sixieme'),
                'contient_sixième': className.includes('sixième'),
                'contient_6eme': className.includes('6eme'),
                'contient_6ème': className.includes('6ème'),
                'contient_6_eme': className.includes('6 éme'),
                'contient_6_eme_espace': className.includes('6 eme')
              }
            });
            
            return shouldShow;
          })() && (
            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
              <InputLabel>Sous-matière de français</InputLabel>
              <Select
                value={selectedFrenchSubSubject}
                label="Sous-matière de français"
                disabled={isActionDisabled()}
                onChange={e => setSelectedFrenchSubSubject(Number(e.target.value))}
              >
                {frenchSubSubjects.map(subSubject => (
                  <MenuItem key={`french-sub-${subSubject.id}`} value={subSubject.id}>
                    {subSubject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {selectedTrimesterId && (
            <Typography variant="body2" color="text.secondary">
              {trimesters.find(t => t.id === selectedTrimesterId)?.start_date} - {trimesters.find(t => t.id === selectedTrimesterId)?.end_date}
            </Typography>
          )}
          <TextField
            label="Coefficient"
            type="number"
            value={coefficient}
            onChange={e => setCoefficient(parseInt(e.target.value) || 1)}
            disabled={isActionDisabled()}
            fullWidth
            sx={{ mt: 2, mb: 2 }}
            inputProps={{ min: 1, step: 1 }}
            helperText={isActionDisabled() 
              ? getAlertMessage()
              : "Coefficient de la note (entier uniquement)"
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px', bgcolor: '#f5faff', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
          <Button onClick={handleCloseDialog} variant="outlined">Annuler</Button>
          <Button 
            onClick={handleAddGrade} 
            variant="contained" 
            color="primary" 
            disabled={isActionDisabled()}
            sx={{ 
              fontWeight: 700,
              opacity: isActionDisabled() ? 0.5 : 1
            }}
          >
            {editMode ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openConfirmStudents} onClose={() => setOpenConfirmStudents(false)}>
        <DialogTitle>Confirmer l'envoi</DialogTitle>
        <DialogContent>
          Voulez-vous vraiment notifier les étudiants de la classe de leurs nouvelles notes ?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmStudents(false)}>Annuler</Button>
          <Button onClick={confirmSendNotesToStudents} variant="contained" color="primary">Confirmer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openConfirmAdmin} onClose={() => setOpenConfirmAdmin(false)}>
        <DialogTitle>Confirmer la transmission</DialogTitle>
        <DialogContent>
          Voulez-vous vraiment transmettre toutes les notes et moyennes de la classe à l'administration pour le bulletin ?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmAdmin(false)}>Annuler</Button>
          <Button onClick={confirmSendNotesToAdmin} variant="contained" color="error">Confirmer</Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openAbsenceDialog} 
        onClose={() => setOpenAbsenceDialog(false)} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            width: { xs: '95%', sm: '90%', md: '80%' },
            maxWidth: { xs: '95%', sm: '90%', md: '80%' },
            margin: { xs: '16px', sm: '24px' }
          }
        }}
      >
        <DialogTitle sx={{ 
          fontSize: { xs: 18, sm: 20, md: 22 },
          fontWeight: 700,
          pb: { xs: 1, sm: 2 }
        }}>
          Gestion des absences - {selectedClass?.name}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          {getAlertMessage() && (
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 2,
                background: 'linear-gradient(45deg, #ff9800, #f57c00)',
                color: 'white',
                '& .MuiAlert-icon': {
                  color: 'white'
                }
              }}
            >
              {getAlertMessage()}
            </Alert>
          )}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Trimestre</InputLabel>
            <Select
              value={selectedTrimesterId ?? ''}
              label="Trimestre"
              onChange={e => setSelectedTrimesterId(Number(e.target.value))}
            >
              {trimesters.map(trim => (
                <MenuItem key={`absence-trim-${trim.id}`} value={trim.id}>
                  {trim.name} {trim.is_open ? '(Ouvert)' : '(Fermé)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Version mobile pour la gestion des absences */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {students
              .sort((a, b) => {
                const lastNameA = (a.last_name || '').trim().toLowerCase();
                const lastNameB = (b.last_name || '').trim().toLowerCase();
                const firstNameA = (a.first_name || '').trim().toLowerCase();
                const firstNameB = (b.first_name || '').trim().toLowerCase();
                
                if (firstNameA < firstNameB) return -1;
                if (firstNameA > firstNameB) return 1;
                if (lastNameA < lastNameB) return -1;
                if (lastNameA > lastNameB) return 1;
                return 0;
              })
              .map(s => (
                <Paper
                  key={`mobile-absence-${s.id}`}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', fontSize: 16 }}>
                      {s.first_name} {s.last_name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 1, fontWeight: 600 }}>
                        Absent:
                      </Typography>
                      <input
                        type="checkbox"
                        checked={absenceList[s.id]?.absent || false}
                        onChange={e => handleAbsenceChange(s.id, 'absent', e.target.checked)}
                        disabled={isActionDisabled()}
                      />
                    </Box>
                  </Box>
                  
                  {absenceList[s.id]?.absent && (
                    <>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Raison:
                        </Typography>
                        <TextField
                          value={absenceList[s.id]?.reason || ''}
                          onChange={e => handleAbsenceChange(s.id, 'reason', e.target.value)}
                          disabled={isActionDisabled()}
                          size="small"
                          fullWidth
                          placeholder="Raison de l'absence"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Statut:
                          </Typography>
                          <Select
                            value={absenceList[s.id]?.status || 'unexcused'}
                            onChange={e => handleAbsenceChange(s.id, 'status', e.target.value)}
                            disabled={isActionDisabled()}
                            size="small"
                            fullWidth
                          >
                            <MenuItem value="unexcused">Non justifiée</MenuItem>
                            <MenuItem value="excused">Justifiée</MenuItem>
                          </Select>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Durée (h):
                          </Typography>
                          <TextField
                            type="number"
                            value={absenceList[s.id]?.duration || 1}
                            onChange={e => handleAbsenceChange(s.id, 'duration', Number(e.target.value))}
                            disabled={isActionDisabled()}
                            size="small"
                            fullWidth
                            inputProps={{ min: 1, max: 8 }}
                          />
                        </Box>
                      </Box>
                    </>
                  )}
                </Paper>
              ))}
          </Box>
          
          {/* Version desktop pour la gestion des absences */}
          <Table sx={{ display: { xs: 'none', md: 'table' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: { xs: 14, sm: 16 } }}>Élève</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: { xs: 14, sm: 16 } }}>Absent</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: { xs: 14, sm: 16 } }}>Raison</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: { xs: 14, sm: 16 } }}>Statut</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: { xs: 14, sm: 16 } }}>Durée (h)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students
                .sort((a, b) => {
                  const lastNameA = (a.last_name || '').trim().toLowerCase();
                  const lastNameB = (b.last_name || '').trim().toLowerCase();
                  const firstNameA = (a.first_name || '').trim().toLowerCase();
                  const firstNameB = (b.first_name || '').trim().toLowerCase();
                  
                  if (firstNameA < firstNameB) return -1;
                  if (firstNameA > firstNameB) return 1;
                  if (lastNameA < lastNameB) return -1;
                  if (lastNameA > lastNameB) return 1;
                  return 0;
                })
                .map(s => (
                <TableRow key={`desktop-absence-${s.id}`}>
                  <TableCell sx={{ fontSize: { xs: 14, sm: 16 } }}>{s.first_name} {s.last_name}</TableCell>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={absenceList[s.id]?.absent || false}
                      onChange={e => handleAbsenceChange(s.id, 'absent', e.target.checked)}
                      disabled={isActionDisabled()}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={absenceList[s.id]?.reason || ''}
                      onChange={e => handleAbsenceChange(s.id, 'reason', e.target.value)}
                      disabled={!absenceList[s.id]?.absent || isActionDisabled()}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={absenceList[s.id]?.status || 'unexcused'}
                      onChange={e => handleAbsenceChange(s.id, 'status', e.target.value)}
                      disabled={!absenceList[s.id]?.absent || isActionDisabled()}
                      size="small"
                    >
                      <MenuItem value="unexcused">Non justifiée</MenuItem>
                      <MenuItem value="excused">Justifiée</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={absenceList[s.id]?.duration || 1}
                      onChange={e => handleAbsenceChange(s.id, 'duration', Number(e.target.value))}
                      disabled={!absenceList[s.id]?.absent || isActionDisabled()}
                      size="small"
                      inputProps={{ min: 1, max: 8 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
          <Button 
            onClick={() => setOpenAbsenceDialog(false)}
            sx={{ 
              fontSize: { xs: 14, sm: 16 },
              px: { xs: 1, sm: 2 }
            }}
          >
            Annuler
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            disabled={isActionDisabled()}
            onClick={handleSubmitAbsences}
            sx={{ 
              opacity: isActionDisabled() ? 0.5 : 1,
              fontSize: { xs: 14, sm: 16 },
              px: { xs: 1, sm: 2 }
            }}
          >
            Enregistrer les absences
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
