import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody, Paper, Card, CardContent, Grid, useTheme, useMediaQuery, Chip } from '@mui/material';

const days = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
const hours = [
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
];

function getDayIndex(day: string): number {
  const map: Record<string, number> = {
    'LUNDI': 0, 'MONDAY': 0,
    'MARDI': 1, 'TUESDAY': 1,
    'MERCREDI': 2, 'WEDNESDAY': 2,
    'JEUDI': 3, 'THURSDAY': 3,
    'VENDREDI': 4, 'FRIDAY': 4
  };
  return map[day?.toUpperCase()] ?? -1;
}

function getHourIndex(start_time: string): number {
  const h = start_time.slice(0, 5);
  return hours.findIndex(hr => hr.startsWith(h));
}

const ScheduleTab = ({ childId, schoolYear }: { childId: string | undefined, schoolYear: string }) => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`https://2ise-groupe.com/api/students/${childId}/schedule?school_year=${schoolYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedule(data.schedule || []);
      setLoading(false);
    };
    if (childId && schoolYear) fetchSchedule();
  }, [childId, schoolYear]);

  if (loading) return <CircularProgress />;
  if (!schedule.length) return <Typography>Aucun emploi du temps disponible.</Typography>;

  if (!loading && schedule.length === 0) return (
    <Typography color="error" fontWeight={700} align="center" sx={{ my: 3 }}>
      Aucune information disponible pour votre enfant en cette année scolaire.
    </Typography>
  );

  // Préparer la grille [heure][jour]
  const grid = Array.from({ length: hours.length }, () => Array(days.length).fill(null));
  schedule.forEach((c: any) => {
    const dayIdx = getDayIndex(c.day_of_week);
    const hourIdx = getHourIndex(c.start_time);
    if (dayIdx !== -1 && hourIdx !== -1) {
      grid[hourIdx][dayIdx] = c;
    }
  });

  return (
    <Box>
      <Typography variant="h6" mb={2} align="center">Emploi du Temps</Typography>
      <Typography align="center" color="primary" fontWeight={600} fontSize={isMobile ? 18 : 22} mb={1}>
        {schedule[0]?.class_name && `Emploi du Temps - ${schedule[0].class_name}`}
      </Typography>
      <Typography align="center" color="secondary" fontSize={isMobile ? 14 : 16} mb={2}>
        Année scolaire 2024-2025
      </Typography>
      
      <Paper sx={{ overflowX: 'auto', borderRadius: 2 }}>
        <Table sx={{ 
          minWidth: isMobile ? 600 : 800, 
          border: '1px solid #e0e0e0',
          fontSize: isMobile ? '0.75rem' : 'inherit'
        }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ 
                fontWeight: 'bold', 
                background: '#f5f5f5',
                fontSize: isMobile ? 12 : 14,
                padding: isMobile ? '8px 4px' : '16px'
              }}>
                HEURE
              </TableCell>
              {days.map(day => (
                <TableCell 
                  key={day} 
                  align="center" 
                  sx={{ 
                    fontWeight: 'bold', 
                    background: '#f5f5f5',
                    fontSize: isMobile ? 11 : 14,
                    padding: isMobile ? '8px 2px' : '16px',
                    minWidth: isMobile ? 80 : 120
                  }}
                >
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {hours.map((hr, i) => (
              <TableRow key={hr}>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  background: '#fafafa',
                  fontSize: isMobile ? 10 : 14,
                  padding: isMobile ? '6px 4px' : '16px'
                }}>
                  {hr}
                </TableCell>
                {days.map((day, j) => (
                  <TableCell 
                    key={day + hr} 
                    align="center" 
                    sx={{ 
                      p: isMobile ? 0.5 : 1, 
                      minWidth: isMobile ? 80 : 120, 
                      minHeight: isMobile ? 40 : 60,
                      fontSize: isMobile ? 10 : 14
                    }}
                  >
                    {grid[i][j] ? (
                      <Box sx={{
                        background: '#f8bbd0',
                        border: '1.5px solid #e57373',
                        borderRadius: isMobile ? 1 : 2,
                        p: isMobile ? 0.5 : 1,
                        minHeight: isMobile ? 35 : 50,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                      }}>
                        <Typography 
                          fontWeight={600} 
                          fontSize={isMobile ? 10 : 14}
                          sx={{ lineHeight: isMobile ? 1.2 : 1.4 }}
                        >
                          {grid[i][j].subject_name}
                        </Typography>
                        <Typography 
                          fontSize={isMobile ? 8 : 12} 
                          color="text.secondary"
                          sx={{ lineHeight: isMobile ? 1.1 : 1.3 }}
                        >
                          {grid[i][j].teacher_first_name} {grid[i][j].teacher_last_name}
                        </Typography>
                      </Box>
                    ) : null}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default ScheduleTab; 