import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, CircularProgress, Snackbar, Alert, Stack, Grid,
  Container, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, keyframes, ButtonGroup,
  Popover
} from '@mui/material';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SecretarySidebar from '../../components/SecretarySidebar';
import { usePermissions } from '../../hooks/usePermissions';
import ShareIcon from '@mui/icons-material/Share';
import PrintIcon from '@mui/icons-material/Print';

// Interfaces
interface ClassDetails {
  id: number;
  name: string;
  timetable_published: boolean;
}
interface Subject { id: number; name: string; }
interface Teacher { id: number; first_name: string; last_name: string; }
interface Room { id: number; name: string; capacity?: number; room_type: string; }
interface ScheduleEntry {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject_name: string;
  teacher_first_name: string;
  teacher_last_name: string;
  subject_id: number;
  teacher_id: number;
  room_id: number;
  room_name: string;
}
interface ScheduleSlot {
  day: string;
  start_time: string;
  end_time: string;
}

// Helpers
const glowingAnimation = keyframes`
  0% { background-color: rgba(25, 118, 210, 0.08); box-shadow: 0 0 4px rgba(25, 118, 210, 0.2); }
  50% { background-color: rgba(25, 118, 210, 0.15); box-shadow: 0 0 12px rgba(25, 118, 210, 0.4); }
  100% { background-color: rgba(25, 118, 210, 0.08); box-shadow: 0 0 4px rgba(25, 118, 210, 0.2); }
`;

// Renvoie l'année scolaire courante sous forme '2024-2025'
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

// Génère dynamiquement les 5 dernières années scolaires (y compris l'année courante)
function getSchoolYears(count = 5) {
  const current = getCurrentSchoolYear();
  const startYear = parseInt(current.split('-')[0], 10);
  return Array.from({ length: count }, (_, i) => {
    const start = startYear - i;
    return `${start}-${start + 1}`;
  });
}

const SCHOOL_YEARS = getSchoolYears(5);

const getSubjectColors = (str: string) => {
  let hash = 0;
  if (str.length === 0) return { bg: 'hsl(210, 20%, 98%)', border: 'hsl(210, 20%, 90%)', text: 'hsl(210, 20%, 40%)' };
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return {
    bg: `hsl(${h}, 80%, 96%)`,
    border: `hsl(${h}, 60%, 86%)`,
    text: `hsl(${h}, 50%, 45%)`,
  };
};

const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const timeSlots = [
  "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
  "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00"
];

const ClassTimetablePage = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // State
  const [schoolYear, setSchoolYear] = useState(getCurrentSchoolYear());
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Partial<ScheduleEntry> & ScheduleSlot | null>(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [subjectCoefficients, setSubjectCoefficients] = useState<{ [subjectId: number]: number }>({});
  const [coefficient, setCoefficient] = useState<number>(1);
  const [showCoefficientField, setShowCoefficientField] = useState(false);
  const [subjectTeachers, setSubjectTeachers] = useState<{ [subjectId: number]: Teacher[] }>({});
  
  // États pour la récupération automatique des coefficients
  const [autoRetrievedCoefficient, setAutoRetrievedCoefficient] = useState<number | null>(null);
  const [showAutoRetrievedMessage, setShowAutoRetrievedMessage] = useState(false);
  
  // Popover pour les erreurs de conflit
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [conflictAnchorEl, setConflictAnchorEl] = useState<HTMLElement | null>(null);

  const fetchPrerequisites = useCallback(async (token: string) => {
    try {
      // Fetch subjects
      try {
        const subjectsRes = await axios.get('https://2ise-groupe.com/api/subjects', { headers: { Authorization: `Bearer ${token}` } });
        setSubjects(subjectsRes.data);
      } catch (err) {
        console.error("Erreur fetch subjects:", err);
        throw new Error("Impossible de charger les matières.");
      }
      
      // Fetch teachers
      try {
        const teachersRes = await axios.get('https://2ise-groupe.com/api/teachers', { headers: { Authorization: `Bearer ${token}` } });
        setTeachers(teachersRes.data);
      } catch (err) {
        console.error("Erreur fetch teachers:", err);
        throw new Error("Impossible de charger les professeurs.");
      }
      
      // Fetch rooms
      try {
        const roomsRes = await axios.get('https://2ise-groupe.com/api/rooms', { headers: { Authorization: `Bearer ${token}` } });
        setRooms(roomsRes.data);
      } catch (err) {
        console.error("Erreur fetch rooms:", err);
        throw new Error("Impossible de charger les salles.");
      }
      
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors du chargement des données.");
    }
  }, []);

  const fetchTimetable = useCallback(async (token: string) => {
    if (!classId) return;

    const dayMappingReverse: { [key: string]: string } = {
        "Monday": "Lundi",
        "Tuesday": "Mardi",
        "Wednesday": "Mercredi",
        "Thursday": "Jeudi",
        "Friday": "Vendredi",
    };

    try {
      // 1. Fetch class details (critical)
      const classRes = await axios.get(`https://2ise-groupe.com/api/classes/${classId}`, { headers: { Authorization: `Bearer ${token}` } });
      setClassDetails(classRes.data);

      // 2. Fetch schedule (non-critical, can be empty)
      try {
        const scheduleRes = await axios.get(`https://2ise-groupe.com/api/schedules/class/${classId}?school_year=${schoolYear}`,
          { headers: { Authorization: `Bearer ${token}` } });
        const formattedSchedule = scheduleRes.data.map((item: any) => ({
          ...item,
          day_of_week: dayMappingReverse[item.day_of_week] || item.day_of_week,
          subject_name: item.subject_name || 'N/A',
          teacher_first_name: item.teacher_first_name || 'N/A',
          teacher_last_name: item.teacher_last_name || '',
        }));
        setSchedule(formattedSchedule);
      } catch (scheduleErr) {
        console.warn("Avertissement: Impossible de charger l'emploi du temps, la grille sera vide.", scheduleErr);
        setSchedule([]); // Affiche une grille vide en cas d'erreur
      }

    } catch (err) {
       setError("Impossible de charger les détails de la classe.");
    }
  }, [classId, schoolYear]);

  useEffect(() => {
    if (!classId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get(`/api/class/${classId}/subjects`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const coeffs: { [subjectId: number]: number } = {};
        res.data.forEach((s: any) => { coeffs[s.subject_id] = s.coefficient; });
        setSubjectCoefficients(coeffs);
      })
      .catch(() => setSubjectCoefficients({}));
  }, [classId]);

  useEffect(() => {
    let isMounted = true;
    
    const token = localStorage.getItem('token');
    if (!token) {
        if (isMounted) navigate('/login');
        return;
    }
    if (isMounted) setLoading(true);
    Promise.all([fetchPrerequisites(token), fetchTimetable(token)]).finally(() => {
      if (isMounted) setLoading(false);
    });
    
    return () => {
      isMounted = false;
    };
  }, [classId, navigate, fetchPrerequisites, fetchTimetable, schoolYear]);
  
  // Handlers
  const handleSelectSlot = (slot: ScheduleSlot, entry?: ScheduleEntry) => {
    setSelectedSlot(entry ? { ...entry, ...slot } : slot);
    setIsAddingMode(false);
  };
  
  const handleClearForm = () => {
    setSelectedSlot(null);
    setIsAddingMode(false);
    setAutoRetrievedCoefficient(null);
    setShowAutoRetrievedMessage(false);
  };

  const handleSave = async (event?: React.MouseEvent<HTMLElement>) => {
    if (!hasPermission('canManageTimetables')) {
      setError('Vous n\'avez pas la permission de modifier les emplois du temps');
      return;
    }
    if(!selectedSlot) return;
    const token = localStorage.getItem('token');

    const dayMapping: { [key: string]: string } = {
        "Lundi": "Monday",
        "Mardi": "Tuesday",
        "Mercredi": "Wednesday",
        "Jeudi": "Thursday",
        "Vendredi": "Friday"
    };
    
    const body = {
      class_id: parseInt(classId!, 10),
      subject_id: selectedSlot.subject_id,
      teacher_id: selectedSlot.teacher_id,
      room_id: selectedSlot.room_id,
      day_of_week: dayMapping[selectedSlot.day!] || selectedSlot.day,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      school_year: schoolYear,
      coefficient: coefficient
    };

    try {
        if(selectedSlot.id) { // Update
            const response = await axios.put(`https://2ise-groupe.com/api/schedules/${selectedSlot.id}`, body, { headers: { Authorization: `Bearer ${token}` } });
            await fetchTimetable(token!); // Refetch on update is fine
            setSuccess(response.data.message || "Opération réussie !");
        } else { // Create
            const response = await axios.post('https://2ise-groupe.com/api/schedules', body, { headers: { Authorization: `Bearer ${token}` } });
            const newEntry: ScheduleEntry = {
                subject_id: body.subject_id!,
                teacher_id: body.teacher_id!,
                room_id: body.room_id!,
                start_time: body.start_time!,
                end_time: body.end_time!,
                id: response.data.id,
                day_of_week: selectedSlot.day!, // Utiliser le jour original en français pour l'affichage immédiat
                subject_name: subjects.find(s => s.id === body.subject_id)?.name || 'N/A',
                teacher_first_name: teachers.find(t => t.id === body.teacher_id)?.first_name || 'N/A',
                teacher_last_name: teachers.find(t => t.id === body.teacher_id)?.last_name || '',
                room_name: rooms.find(r => r.id === body.room_id)?.name || 'N/A',
            };
            setSchedule(prev => [...prev, newEntry]);
            
            // Afficher un message spécial si un coefficient a été récupéré automatiquement
            if (autoRetrievedCoefficient !== null) {
                setSuccess(`Cours ajouté avec succès ! Coefficient ${autoRetrievedCoefficient} récupéré automatiquement depuis une autre classe du même niveau.`);
            } else {
                setSuccess(response.data.message || "Cours ajouté avec succès !");
            }
        }
        handleClearForm();
    } catch(err: any) {
        const errorMessage = err.response?.data?.message || "Erreur lors de la sauvegarde.";
        
        // Vérifier si c'est une erreur de conflit d'horaire
        if (errorMessage.includes('Conflit d\'horaire')) {
            setConflictError(errorMessage);
            if (event) {
                setConflictAnchorEl(event.currentTarget);
            }
        } else {
            setError(errorMessage);
        }
        console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
      if (!hasPermission('canManageTimetables')) {
        setError('Vous n\'avez pas la permission de supprimer des cours');
        return;
      }
      if(!window.confirm("Êtes-vous sûr de vouloir supprimer ce cours ?")) return;
      const token = localStorage.getItem('token');
      try {
          const response = await axios.delete(`https://2ise-groupe.com/api/schedules/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          setSchedule(prev => prev.filter(entry => entry.id !== id));
          setSuccess(response.data.message || "Suppression réussie !");
          handleClearForm();
      } catch(err: any) {
          setError(err.response?.data?.message || "Erreur lors de la suppression.");
      }
  }

  const handleShare = async () => {
    if (!hasPermission('canManageTimetables')) {
      setError('Vous n\'avez pas la permission de partager les emplois du temps');
      return;
    }
    if (!classDetails) return;
    const token = localStorage.getItem('token');
    try {
      await axios.put(`https://2ise-groupe.com/api/classes/${classDetails.id}/publish-timetable`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClassDetails(prev => prev ? { ...prev, timetable_published: true } : null);
      setSuccess('Emploi du temps partagé avec succès !');
    } catch (err) {
      setError('Erreur lors du partage de l\'emploi du temps.');
    }
  };

  const renderCellContent = (day: string, timeSlot: string) => {
    const [start_time] = timeSlot.split(' - ');
    const entry = schedule.find(e => e.day_of_week === day && e.start_time.startsWith(start_time));
    const slotData = { day, start_time: `${start_time}:00`, end_time: timeSlot.split(' - ')[1] + ':00' };

    if (entry) {
      const colors = getSubjectColors(entry.subject_name);
      return (
        <Paper 
            elevation={0}
            className="timetable-cell"
            sx={{ 
                p: 1, 
                height: '100%', 
                bgcolor: colors.bg,
                borderLeft: `4px solid ${colors.border}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '@media print': {
                    p: 0.5,
                    borderRadius: '2px',
                    '&:hover': {
                        transform: 'none',
                        boxShadow: 'none'
                    }
                },
                '&:hover': {
                    transform: 'scale(1.03)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 10
                }
            }}
            onClick={() => handleSelectSlot(slotData, entry)}
        >
            <Typography 
                variant="body2" 
                fontWeight="bold" 
                className="subject-name"
                sx={{
                    color: colors.text, 
                    lineHeight: 1.25
                }} 
                noWrap
            >
                {entry.subject_name}
            </Typography>
            <Typography 
                variant="caption" 
                className="teacher-name"
                sx={{
                    color: colors.text, 
                    opacity: 0.8, 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    mt: 0.5
                }}
            >
                {entry.teacher_first_name} {entry.teacher_last_name}
            </Typography>
            <Typography 
                variant="caption" 
                className="room-name"
                sx={{
                    color: colors.text, 
                    opacity: 0.7, 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    mt: 0.25,
                    fontSize: '0.65rem',
                    fontWeight: 500
                }}
            >
                📍 {entry.room_name}
            </Typography>
        </Paper>
      );
    }

    return (
      <Box 
        onClick={() => handleSelectSlot(slotData)} 
        sx={{
            height: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            cursor: 'pointer',
            borderRadius: 1,
            color: 'grey.400',
            transition: 'background-color 0.2s, color 0.2s',
            '&:hover': { 
                bgcolor: 'primary.lighter',
                color: 'primary.main',
                '& .MuiSvgIcon-root': {
                    transform: 'scale(1.1)'
                }
            }
        }}
        className="add-icon"
      >
        <AddCircleOutlineIcon sx={{ transition: 'transform 0.2s', fontSize: '1.3rem' }}/>
      </Box>
    );
  };

  const fetchTeachersForSubject = useCallback(async (subjectId: number) => {
    if (subjectTeachers[subjectId]) return; // déjà chargé
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const { data } = await axios.get(
        `https://2ise-groupe.com/api/subjects/${subjectId}/teachers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubjectTeachers(prev => ({ ...prev, [subjectId]: data }));
    } catch (err) {
      // Optionnel: afficher une erreur ou ignorer
    }
  }, [setSubjectTeachers]);

  // Fonction pour vérifier les coefficients existants par niveau
  const checkLevelCoefficient = useCallback(async (subjectId: number) => {
    if (!classId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    
    console.log('🔍 Vérification coefficient pour:', { classId, subjectId });
    
    try {
      const { data } = await axios.get(
        `https://2ise-groupe.com/api/schedules/class/${classId}/level-coefficient/${subjectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('📊 Réponse API coefficient:', data);
      
      if (data.coefficient) {
        console.log('✅ Coefficient trouvé:', data.coefficient);
        setAutoRetrievedCoefficient(data.coefficient);
        setShowAutoRetrievedMessage(true);
        setCoefficient(data.coefficient);
        setShowCoefficientField(false);
      } else {
        console.log('❌ Aucun coefficient trouvé');
        setAutoRetrievedCoefficient(null);
        setShowAutoRetrievedMessage(false);
        setShowCoefficientField(true);
        setCoefficient(1);
      }
    } catch (err) {
      console.error('❌ Erreur lors de la vérification du coefficient:', err);
      // Si l'API n'existe pas encore, on garde le comportement actuel
      setAutoRetrievedCoefficient(null);
      setShowAutoRetrievedMessage(false);
    }
  }, [classId]);

  useEffect(() => {
    if (selectedSlot?.subject_id) {
      fetchTeachersForSubject(selectedSlot.subject_id);
      // Vérifier les coefficients existants par niveau seulement pour les nouveaux cours
      if (!selectedSlot.id) {
        checkLevelCoefficient(selectedSlot.subject_id);
      }
    }
  }, [selectedSlot?.subject_id, fetchTeachersForSubject, checkLevelCoefficient]);

  // Vérification des permissions
  if (!hasPermission('canViewTimetables')) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <SecretarySidebar />
        <Box sx={{ p: 3, flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h5" color="error">
            Accès refusé - Vous n'avez pas la permission de consulter les emplois du temps
          </Typography>
        </Box>
      </Box>
    );
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress size={60} /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ display: 'flex' }}>
             <style>
         {`
           @media print {
             body * {
               visibility: hidden;
             }
             .printable-area, .printable-area * {
               visibility: visible !important;
             }
             .printable-area {
               position: absolute;
               left: 0;
               top: 0;
               width: 100%;
               max-width: 100%;
               overflow: hidden;
             }
             /* Masquer les icônes d'ajout lors de l'impression */
             .add-icon {
               display: none !important;
             }
             /* Masquer les éléments non nécessaires à l'impression */
             .no-print {
               display: none !important;
             }
             /* Styles pour les cellules d'emploi du temps */
             .timetable-cell {
               background-color: #fff !important;
               border-left: 2px solid #000 !important;
               box-shadow: none !important;
               transform: none !important;
               padding: 0.5 !important;
               border-radius: 2px !important;
             }
             /* Styles pour les noms de matières */
             .subject-name {
               color: #000 !important;
               font-size: 9px !important;
               font-weight: bold !important;
               line-height: 1.2 !important;
             }
             /* Styles pour les noms de professeurs */
             .teacher-name {
               color: #000 !important;
               font-size: 8px !important;
               opacity: 1 !important;
               line-height: 1.1 !important;
               visibility: visible !important;
             }
             /* Styles pour les noms de salles */
             .room-name {
               color: #000 !important;
               font-size: 7px !important;
               opacity: 1 !important;
               line-height: 1.1 !important;
               visibility: visible !important;
               font-weight: 500 !important;
             }
             /* Masquer les éléments de navigation */
             .MuiStack-root {
               display: none !important;
             }
             /* Ajuster le conteneur principal */
             .MuiContainer-root {
               max-width: none !important;
               padding: 0 !important;
             }
             /* Ajuster la grille */
             .MuiGrid-root {
               padding: 0 !important;
             }
             /* Contrôler les sauts de page */
             .printable-area {
               page-break-inside: avoid !important;
               break-inside: avoid !important;
             }
             /* Ajuster la taille de la page */
             @page {
               size: A4 landscape !important;
               margin: 10mm !important;
             }
           }
         `}
       </style>
      <SecretarySidebar />
      <Box component="main" sx={{ p: 3, flexGrow: 1, bgcolor: '#f7f9fc' }}>
        <Container maxWidth={false}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }} className="no-print">
            <FormControl sx={{ minWidth: 160 }} size="small">
              <InputLabel id="school-year-label">Année scolaire</InputLabel>
              <Select
                labelId="school-year-label"
                value={schoolYear}
                label="Année scolaire"
                onChange={e => setSchoolYear(e.target.value)}
              >
                {SCHOOL_YEARS.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4, '@media print': { display: 'none' } }} flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Emploi du temps : <span style={{ color: '#0277bd' }}>{classDetails?.name}</span>
                <span style={{ marginLeft: 16, fontSize: 18, color: '#888' }}>({schoolYear})</span>
              </Typography>
              {!hasPermission('canManageTimetables') && hasPermission('canViewTimetables') && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Mode consultation uniquement - Vous ne pouvez que consulter les emplois du temps
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end" className="no-print">
                {hasPermission('canManageTimetables') && (
                  <ButtonGroup variant="contained" aria-label="action buttons">
                      <Button 
                          startIcon={<AddCircleOutlineIcon />} 
                          onClick={() => {
                            setIsAddingMode(true);
                            setSelectedSlot(null);
                          }}
                      >
                          Ajouter un cours
                      </Button>
                      <Button
                          color={classDetails?.timetable_published ? "success" : "secondary"}
                          startIcon={<ShareIcon />}
                          onClick={handleShare}
                          disabled={classDetails?.timetable_published}
                          >
                          {classDetails?.timetable_published ? 'Partagé' : 'Partager'}
                      </Button>
                  </ButtonGroup>
                )}
                <ButtonGroup variant="outlined" aria-label="navigation buttons">
                    <Button
                        startIcon={<PrintIcon />}
                        onClick={() => window.print()}
                        >
                        Imprimer
                    </Button>
                    <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/secretary/timetables')}>Changer de classe</Button>
                </ButtonGroup>
            </Stack>
          </Stack>

          <Grid container spacing={3} className="printable-area">
            <Grid item xs={12} lg={isAddingMode || selectedSlot ? 9 : 12} sx={{ transition: 'all 0.3s ease-in-out'}}>
              <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Table stickyHeader sx={{ minWidth: 900, borderCollapse: 'separate', borderSpacing: 0, '@media print': { minWidth: 'auto', width: '100%' } }}>
                      <TableHead>
                          <TableRow>
                                                             <TableCell sx={{ 
                                 fontWeight: 'bold', 
                                 position: 'sticky', 
                                 left: 0, 
                                 zIndex: 10, 
                                 bgcolor: '#f1f3f5', 
                                 border: '1px solid #dee2e6', 
                                 borderRightWidth: 2,
                                 '@media print': {
                                   color: '#000 !important',
                                   bgcolor: '#f1f3f5 !important',
                                   visibility: 'visible !important',
                                   fontWeight: 'bold !important'
                                 }
                               }}>Heure</TableCell>
                               {daysOfWeek.map(day => (
                                   <TableCell key={day} align="center" sx={{ 
                                     fontWeight: 'bold', 
                                     bgcolor: '#f1f3f5',
                                     textTransform: 'uppercase', 
                                     fontSize: '0.8rem', 
                                     letterSpacing: '0.5px',
                                     border: '1px solid #dee2e6',
                                     '@media print': {
                                       color: '#000 !important',
                                       bgcolor: '#f1f3f5 !important',
                                       visibility: 'visible !important',
                                       fontWeight: 'bold !important',
                                       textTransform: 'uppercase !important'
                                     }
                                   }}>
                                       {day}
                                   </TableCell>
                               ))}
                          </TableRow>
                      </TableHead>
                      <TableBody>
                          {timeSlots.map((ts) => (
                              <TableRow key={ts} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                                     <TableCell component="th" scope="row" sx={{ 
                                     fontWeight: 'bold', 
                                     position: 'sticky', 
                                     left: 0, 
                                     bgcolor: '#fff', 
                                     border: '1px solid #dee2e6', 
                                     borderRightWidth: 2, 
                                     zIndex: 9,
                                     '@media print': {
                                       color: '#000 !important',
                                       bgcolor: '#fff !important',
                                       visibility: 'visible !important',
                                       fontWeight: 'bold !important'
                                     }
                                   }}>
                                       {ts}
                                   </TableCell>
                                  {daysOfWeek.map(day => (
                                                                             <TableCell 
                                           key={day} 
                                           sx={{ 
                                             p: 0.5, 
                                             height: '95px', 
                                             border: '1px solid #e9ecef', 
                                             '@media print': { 
                                               height: '60px', 
                                               p: 0.25,
                                               color: '#000 !important',
                                               visibility: 'visible !important',
                                               border: '1px solid #000 !important'
                                             } 
                                           }}
                                       >
                                           {renderCellContent(day, ts)}
                                       </TableCell>
                                  ))}
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </TableContainer>
            </Grid>
            {(isAddingMode || selectedSlot) && (
            <Grid item xs={12} lg={3} className="no-print">
                <Paper sx={{ p: 2, position: 'sticky', top: '80px', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                   <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                     <SchoolIcon color="primary" />
                     <Typography variant="h6" fontWeight="bold">
                        {selectedSlot?.id ? 'Détails du cours' : 'Nouveau cours'}
                      </Typography>
                   </Stack>
                    
                    {isAddingMode && !selectedSlot && (
                       <Stack alignItems="center" textAlign="center" spacing={2} sx={{p: 2, bgcolor: 'primary.lighter', borderRadius: 2, border: '1px dashed', borderColor: 'primary.light'}}>
                        <AccessTimeIcon sx={{fontSize: 32, color: 'primary.main'}} />
                        <Typography variant="body1" color="primary.dark" fontWeight="medium">
                          Sélectionnez un créneau libre dans la grille.
                        </Typography>
                      </Stack>
                    )}

                    {!isAddingMode && !selectedSlot && (
                      <Stack alignItems="center" textAlign="center" spacing={2} sx={{p: 3, bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed', borderColor: 'grey.300'}}>
                        <AccessTimeIcon sx={{fontSize: 32, color: 'grey.400'}} />
                        <Typography variant="body2" color="text.secondary">
                          Cliquez sur un créneau ou sur "Ajouter un cours" pour commencer.
                        </Typography>
                      </Stack>
                    )}

                    {selectedSlot && (
                      <Stack component="form" spacing={2.5} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                         <TextField
                            label="Créneau"
                            value={`${selectedSlot.day}, ${selectedSlot.start_time.substring(0,5)} - ${selectedSlot.end_time.substring(0,5)}`}
                            InputProps={{ readOnly: true }}
                            variant="filled"
                            size="small"
                            fullWidth
                         />
                         <FormControl fullWidth required>
                            <InputLabel id="subject-select-label">Matière</InputLabel>
                            <Select
                                labelId="subject-select-label"
                                value={selectedSlot?.subject_id || ''}
                                label="Matière"
                                onChange={e => {
                                  const subjectId = e.target.value as number;
                                  fetchTeachersForSubject(subjectId);
                                  setSelectedSlot(prev => ({
                                    ...prev!,
                                    subject_id: subjectId,
                                    teacher_id: undefined // reset prof si matière change
                                  }));
                                  if (subjectCoefficients[subjectId] !== undefined) {
                                    setShowCoefficientField(false);
                                    setCoefficient(subjectCoefficients[subjectId]);
                                  } else {
                                    setShowCoefficientField(true);
                                    setCoefficient(1);
                                  }
                                }}
                                size="small"
                            >
                                {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                                                 {(() => {
                           // Cours existant - permettre la modification
                           if (selectedSlot?.id) {
                             return (
                               <TextField
                                 label="Coefficient de la matière"
                                 type="number"
                                 value={coefficient}
                                 onChange={e => setCoefficient(Number(e.target.value))}
                                 fullWidth
                                 size="small"
                                 inputProps={{ min: 1, max: 20 }}
                                 sx={{ mt: 1 }}
                                 required
                               />
                             );
                           }
                           
                           // Coefficient existant pour cette classe
                           if (selectedSlot?.subject_id && subjectCoefficients[selectedSlot.subject_id] !== undefined) {
                             return (
                               <TextField
                                 label="Coefficient de la matière"
                                 type="number"
                                 value={subjectCoefficients[selectedSlot.subject_id]}
                                 fullWidth
                                 size="small"
                                 sx={{ mt: 1 }}
                                 InputProps={{ readOnly: true }}
                                 disabled
                               />
                             );
                           }
                           
                           // Coefficient récupéré automatiquement
                           if (showAutoRetrievedMessage) {
                             return (
                               <Box>
                                 <TextField
                                   label="Coefficient de la matière"
                                   type="number"
                                   value={coefficient}
                                   onChange={e => setCoefficient(Number(e.target.value))}
                                   fullWidth
                                   size="small"
                                   inputProps={{ min: 1, max: 20 }}
                                   sx={{ mt: 1 }}
                                   required
                                   InputProps={{
                                     endAdornment: (
                                       <Box sx={{ 
                                         display: 'flex', 
                                         alignItems: 'center', 
                                         gap: 0.5,
                                         color: 'success.main',
                                         fontSize: '0.75rem',
                                         fontWeight: 600
                                       }}>
                                         <Box sx={{ 
                                           width: 6, 
                                           height: 6, 
                                           borderRadius: '50%', 
                                           bgcolor: 'success.main' 
                                         }} />
                                         Auto
                                       </Box>
                                     )
                                   }}
                                 />
                                 <Typography 
                                   variant="caption" 
                                   sx={{ 
                                     color: 'success.main', 
                                     display: 'block', 
                                     mt: 0.5,
                                     fontStyle: 'italic'
                                   }}
                                 >
                                   ✓ Coefficient {autoRetrievedCoefficient} récupéré automatiquement depuis une autre classe du même niveau
                                 </Typography>
                               </Box>
                             );
                           }
                           
                           // Champ coefficient standard
                           if (showCoefficientField) {
                             return (
                               <TextField
                                 label="Coefficient de la matière"
                                 type="number"
                                 value={coefficient}
                                 onChange={e => setCoefficient(Number(e.target.value))}
                                 fullWidth
                                 size="small"
                                 inputProps={{ min: 1, max: 20 }}
                                 sx={{ mt: 1 }}
                                 required
                               />
                             );
                           }
                           
                           return null;
                         })()}
                        <FormControl fullWidth required>
                            <InputLabel id="teacher-select-label">Professeur</InputLabel>
                            <Select
                                labelId="teacher-select-label"
                                value={selectedSlot?.teacher_id || ''}
                                label="Professeur"
                                onChange={(e) => setSelectedSlot(prev => ({...prev!, teacher_id: e.target.value as number}))}
                                size="small"
                                disabled={!selectedSlot?.subject_id}
                            >
                                {(selectedSlot?.subject_id
                                  ? subjectTeachers[selectedSlot.subject_id] || []
                                  : []
                                ).map((t: Teacher) => (
                                  <MenuItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth required>
                            <InputLabel id="room-select-label">Salle</InputLabel>
                            <Select
                                labelId="room-select-label"
                                value={selectedSlot?.room_id || ''}
                                label="Salle"
                                onChange={(e) => setSelectedSlot(prev => ({...prev!, room_id: e.target.value as number}))}
                                size="small"
                            >
                                {rooms.map((r: Room) => (
                                  <MenuItem key={r.id} value={r.id}>
                                    {r.name} {r.capacity && `(${r.capacity} places)`}
                                  </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Stack direction="row" spacing={1} justifyContent="space-between" sx={{pt: 1}}>
                            {selectedSlot?.id && hasPermission('canManageTimetables') && <IconButton onClick={() => handleDelete(selectedSlot.id!)} color="error" size="small"><DeleteIcon /></IconButton>}
                            <Box sx={{ flexGrow: 1 }} />
                            <Button onClick={handleClearForm} size="small">Annuler</Button>
                            {hasPermission('canManageTimetables') && (
                              <Button 
                                type="submit" 
                                variant="contained" 
                                size="small" 
                                disabled={!selectedSlot.subject_id || !selectedSlot.teacher_id || !selectedSlot.room_id}
                                onClick={(e) => handleSave(e)}
                              >
                                {selectedSlot.id ? 'Mettre à jour' : 'Sauvegarder'}
                              </Button>
                            )}
                        </Stack>
                      </Stack>
                    )}
                </Paper>
            </Grid>
            )}
          </Grid>
        </Container>
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
        <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
        
        {/* Popover pour les erreurs de conflit d'horaire */}
        <Popover
          open={Boolean(conflictError)}
          anchorEl={conflictAnchorEl}
          onClose={() => {
            setConflictError(null);
            setConflictAnchorEl(null);
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          PaperProps={{
            sx: {
              p: 2,
              maxWidth: 400,
              bgcolor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#f39c12',
                flexShrink: 0
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#856404' }}>
              Conflit d'horaire détecté
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mt: 1, color: '#856404', lineHeight: 1.4 }}>
            {conflictError}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setConflictError(null);
                setConflictAnchorEl(null);
              }}
              sx={{
                borderColor: '#f39c12',
                color: '#856404',
                '&:hover': {
                  borderColor: '#e67e22',
                  bgcolor: 'rgba(243, 156, 18, 0.04)'
                }
              }}
            >
              Compris
            </Button>
          </Box>
        </Popover>
      </Box>
    </Box>
  );
};

export default ClassTimetablePage; 