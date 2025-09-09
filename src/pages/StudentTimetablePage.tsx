import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, CircularProgress, Alert, Stack,
  Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Interfaces
interface ScheduleEntry {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject_name: string;
  teacher_first_name: string;
  teacher_last_name: string;
  room_name: string;
}

interface StudentInfo {
    class_id: number;
    class_name: string;
}

// Helpers
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

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const frenchDays: { [key: string]: string } = {
  "Monday": "Lundi",
  "Tuesday": "Mardi",
  "Wednesday": "Mercredi",
  "Thursday": "Jeudi",
  "Friday": "Vendredi",
};
const timeSlots = [
  "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
  "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00"
];

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

const StudentTimetablePage = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schoolYear, setSchoolYear] = useState(getCurrentSchoolYear());

  const fetchTimetable = useCallback(async (token: string, studentId: number) => {
    try {
      // Forcer le rechargement avec plusieurs techniques anti-cache
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const url = `https://2ise-groupe.com/api/students/${studentId}/schedule?school_year=${schoolYear}&_t=${timestamp}&_r=${randomId}&_v=2`;
      
      console.log('🔄 Requête vers:', url);
      
      const scheduleRes = await axios.get(url, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'If-None-Match': '*',
          'If-Modified-Since': '0'
        },
        // Forcer la requête même si elle est en cache
        validateStatus: function (status) {
          return status >= 200 && status < 300; // Accepter seulement les codes 2xx
        }
      });
      
      console.log('🔍 Status de la réponse:', scheduleRes.status);
      console.log('🔍 Données reçues de l\'API:', scheduleRes.data);
      console.log('🔍 Premier cours avec salle:', scheduleRes.data.schedule?.[0]);
      console.log('🔍 Toutes les salles:', scheduleRes.data.schedule?.map((s: ScheduleEntry) => s.room_name));
      
      // Vérifier si les salles sont présentes
      const hasRooms = scheduleRes.data.schedule?.some((s: ScheduleEntry) => s.room_name);
      console.log('🔍 Au moins une salle trouvée:', hasRooms);
      
      setSchedule(scheduleRes.data.schedule || []);
    } catch (scheduleErr) {
      console.warn("Avertissement: Impossible de charger l'emploi du temps.", scheduleErr);
      setError("L'emploi du temps de votre classe n'est pas encore disponible. Veuillez revenir plus tard.");
      setSchedule([]);
    }
  }, [schoolYear]);

  useEffect(() => {
    let isMounted = true;
    
    const token = localStorage.getItem('token');
    if (!token) {
        if (isMounted) navigate('/login');
        return;
    }
    
    const fetchStudentInfo = async () => {
        try {
            const res = await axios.get(`https://2ise-groupe.com/api/auth/me?school_year=${schoolYear}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!isMounted) return;
            
            if (res.data.student && res.data.student.id) {
                setStudentInfo({ class_id: res.data.student.class_id, class_name: res.data.student.class_name });
                await fetchTimetable(token, res.data.student.id);
            } else {
                if (isMounted) setError("Informations sur la classe non trouvées. Impossible de charger l'emploi du temps.");
            }
        } catch (err) {
            if (isMounted) setError("Erreur lors de la récupération de vos informations.");
        } finally {
            if (isMounted) setLoading(false);
        }
    };

    fetchStudentInfo();
    
    return () => {
      isMounted = false;
    };
  }, [navigate, fetchTimetable]);

  const renderCellContent = (day: string, timeSlot: string) => {
    const [start_time] = timeSlot.split(' - ');
    const entry = schedule.find(e => e.day_of_week === day && e.start_time.startsWith(start_time));

    if (entry) {
      console.log('🎯 Rendu cours:', { 
        subject: entry.subject_name, 
        room: entry.room_name, 
        hasRoom: !!entry.room_name,
        entry: entry 
      });
      
      const colors = getSubjectColors(entry.subject_name);
      return (
        <Paper 
            elevation={0}
            sx={{ p: 1, height: '100%', bgcolor: colors.bg, borderLeft: `4px solid ${colors.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRadius: '4px' }}
        >
            <Typography variant="body2" fontWeight="bold" sx={{color: colors.text, lineHeight: 1.25}} noWrap>{entry.subject_name}</Typography>
            <Typography variant="caption" sx={{color: colors.text, opacity: 0.8}}>{entry.teacher_first_name} {entry.teacher_last_name}</Typography>
            {entry.room_name && (
              <Typography variant="caption" sx={{color: colors.text, opacity: 0.7, fontSize: '0.65rem', fontWeight: 500}}>
                📍 {entry.room_name}
              </Typography>
            )}
        </Paper>
      );
    }
    return null;
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress size={60} /></Box>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f7f9fc' }}>
      <Box component="main" sx={{ p: 3, flexGrow: 1 }}>
        <Container maxWidth="xl">
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }} flexWrap="wrap" gap={2}>
            <Typography variant="h4" fontWeight="bold">Mon Emploi du temps : <span style={{ color: '#0277bd' }}>{studentInfo?.class_name}</span></Typography>
            <Stack direction="row" spacing={2}>
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={async () => {
                  console.log('🔄 Rechargement forcé...');
                  const token = localStorage.getItem('token');
                  if (token) {
                    try {
                      const res = await axios.get(`https://2ise-groupe.com/api/auth/me?school_year=${schoolYear}`, { 
                        headers: { Authorization: `Bearer ${token}` } 
                      });
                      if (res.data.student && res.data.student.id) {
                        await fetchTimetable(token, res.data.student.id);
                      }
                    } catch (err) {
                      console.error('Erreur lors du rechargement:', err);
                    }
                  }
                }}
              >
                🔄 Recharger
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => {
                  console.log('🧪 Test des données actuelles:');
                  console.log('📊 Schedule actuel:', schedule);
                  console.log('📊 Premier cours:', schedule[0]);
                  console.log('📊 Toutes les salles:', schedule.map(s => s.room_name));
                  console.log('📊 Salles non vides:', schedule.filter(s => s.room_name));
                }}
              >
                🧪 Test
              </Button>
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/student/dashboard')}>Retour au tableau de bord</Button>
            </Stack>
          </Stack>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
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
          </Box>

          {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

          {!error && (
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Table stickyHeader sx={{ minWidth: 900, borderCollapse: 'separate', borderSpacing: 0 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f1f3f5', border: '1px solid #dee2e6' }}>Heure</TableCell>
                            {daysOfWeek.map(day => (
                                <TableCell key={day} align="center" sx={{ fontWeight: 'bold', bgcolor: '#f1f3f5', textTransform: 'uppercase', fontSize: '0.8rem', border: '1px solid #dee2e6' }}>
                                    {frenchDays[day]}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {timeSlots.map((ts) => (
                            <TableRow key={ts}>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', bgcolor: '#fff', border: '1px solid #dee2e6' }}>
                                    {ts}
                                </TableCell>
                                {daysOfWeek.map(day => (
                                    <TableCell key={day} sx={{ p: 0.5, height: '95px', border: '1px solid #e9ecef' }}>
                                        {renderCellContent(day, ts)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default StudentTimetablePage; 