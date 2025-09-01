import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Stack, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import SecretarySidebar from '../../components/SecretarySidebar';
import SchoolIcon from '@mui/icons-material/School';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { fr } from 'date-fns/locale';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isValid } from 'date-fns';

type BtnColor = "primary" | "warning" | "secondary";
const trimesterColors: { bg: string; border: string; btn: BtnColor }[] = [
  {
    bg: 'linear-gradient(90deg, #e3f0ff 0%, #b3d8ff 100%)',
    border: '#1976d2',
    btn: 'primary',
  },
  {
    bg: 'linear-gradient(90deg, #fff4e3 0%, #ffd8b3 100%)',
    border: '#ff9800',
    btn: 'warning',
  },
  {
    bg: 'linear-gradient(90deg, #f3e3ff 0%, #dab3ff 100%)',
    border: '#8e24aa',
    btn: 'secondary',
  },
];

type Trimester = {
  id: number;
  name: string;
  is_open: boolean;
  start_date?: string;
  end_date?: string;
};

const TrimestersManagement = () => {
  const [trimesters, setTrimesters] = useState<Trimester[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [newTrimesterName, setNewTrimesterName] = useState('');
  const [newStartDate, setNewStartDate] = useState<Date | null>(null);
  const [newEndDate, setNewEndDate] = useState<Date | null>(null);
  const [dateError, setDateError] = useState('');

  // Charger les trimestres depuis l'API
  const fetchTrimesters = async () => {
    let isMounted = true;
    
    if (isMounted) {
      setLoading(true);
    }
    
    try {
      const res = await fetch('https://2ise-groupe.com/api/trimesters');
      const data = await res.json();
      
      if (isMounted) {
        setTrimesters(data);
      }
    } catch (err) {
      if (isMounted) {
        console.error('Erreur fetchTrimesters:', err);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    if (isMounted) {
      fetchTrimesters();
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (newStartDate && newEndDate && newStartDate > newEndDate) {
      setDateError('La date de début doit être avant la date de fin');
    } else {
      setDateError('');
    }
  }, [newStartDate, newEndDate]);

  // Ouvrir/fermer un trimestre
  const handleToggle = async (id: number, isOpen: boolean) => {
    setLoading(true);
    try {
      await fetch(`https://2ise-groupe.com/api/trimesters/${id}/${isOpen ? 'close' : 'open'}`, { method: 'PATCH' });
      await fetchTrimesters();
    } catch (err) {
      alert('Erreur réseau : ' + err);
      console.error('Erreur PATCH:', err);
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau trimestre
  const handleCreateTrimester = async () => {
    if (!newTrimesterName.trim() || !newStartDate || !newEndDate || dateError) return;
    setLoading(true);
    await fetch('https://2ise-groupe.com/api/trimesters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newTrimesterName,
        start_date: isValid(newStartDate) ? format(newStartDate, 'yyyy-MM-dd') : '',
        end_date: isValid(newEndDate) ? format(newEndDate, 'yyyy-MM-dd') : '',
      }),
    });
    setNewTrimesterName('');
    setNewStartDate(null);
    setNewEndDate(null);
    setOpenDialog(false);
    await fetchTrimesters();
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <SecretarySidebar />
      <Box sx={{
        flexGrow: 1,
        p: 4,
        minHeight: '100vh',
        background: 'linear-gradient(120deg, #e0e7ff 0%, #fceabb 100%)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <SchoolIcon sx={{ fontSize: 44, color: '#1976d2', mr: 2, filter: 'drop-shadow(0 2px 8px #b3d8ff)' }} />
          <Typography variant="h3" fontWeight={900} color="#222" gutterBottom sx={{ letterSpacing: 1 }}>
            Gestion des trimestres
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ ml: 4, height: 48 }}
            onClick={() => setOpenDialog(true)}
          >
            + Nouveau trimestre
          </Button>
        </Box>
        <Stack spacing={4}>
          {trimesters.length === 0 && !loading && (
            <Typography color="text.secondary">Aucun trimestre pour le moment.</Typography>
          )}
          {trimesters.map((trim, idx) => (
            <Paper
              key={trim.id}
              elevation={6}
              sx={{
                p: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 4,
                background: trim.is_open
                  ? `linear-gradient(90deg, #e0ffe3 0%, #b3ffd8 100%)`
                  : trimesterColors[idx % trimesterColors.length].bg,
                borderLeft: `10px solid ${trimesterColors[idx % trimesterColors.length].border}`,
                boxShadow: trim.is_open
                  ? '0 6px 32px 0 rgba(76, 175, 80, 0.13)'
                  : `0 4px 20px 0 ${trimesterColors[idx % trimesterColors.length].border}22`,
                transition: 'background 0.3s, box-shadow 0.3s',
              }}
            >
              <Box>
                <Typography variant="h5" fontWeight={700} color={trim.is_open ? 'green' : trimesterColors[idx % trimesterColors.length].border}>
                  {trim.name} {trim.is_open ? '(Ouvert)' : '(Fermé)'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {trim.start_date && trim.end_date
                    ? `Du ${new Date(trim.start_date).toLocaleDateString('fr-FR')} au ${new Date(trim.end_date).toLocaleDateString('fr-FR')}`
                    : 'Dates non définies'}
                </Typography>
              </Box>
              <Button
                variant={trim.is_open ? 'contained' : 'outlined'}
                color={trim.is_open ? 'error' : trimesterColors[idx % trimesterColors.length].btn}
                onClick={() => handleToggle(trim.id, trim.is_open)}
                disabled={loading}
                sx={{
                  minWidth: 130,
                  fontWeight: 700,
                  fontSize: 17,
                  borderWidth: 2,
                  borderColor: trim.is_open ? '#d32f2f' : trimesterColors[idx % trimesterColors.length].border,
                  color: trim.is_open ? '#fff' : trimesterColors[idx % trimesterColors.length].border,
                  background: trim.is_open ? '#d32f2f' : 'transparent',
                  boxShadow: trim.is_open
                    ? '0 2px 8px rgba(244,67,54,0.13)'
                    : `0 2px 8px ${trimesterColors[idx % trimesterColors.length].border}22`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.07)',
                    background: trim.is_open
                      ? '#b71c1c'
                      : trimesterColors[idx % trimesterColors.length].bg,
                    color: '#222',
                  },
                }}
              >
                {trim.is_open ? 'Fermer' : 'Ouvrir'}
              </Button>
            </Paper>
          ))}
        </Stack>

        {/* Dialog pour créer un trimestre */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Créer un nouveau trimestre</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nom du trimestre"
              fullWidth
              value={newTrimesterName}
              onChange={e => setNewTrimesterName(e.target.value)}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Date de début"
                value={newStartDate}
                onChange={setNewStartDate}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'dense',
                    sx: { mt: 2 },
                    inputProps: { readOnly: true }, // Désactive la saisie manuelle
                  }
                }}
              />
              <DatePicker
                label="Date de fin"
                value={newEndDate}
                onChange={setNewEndDate}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'dense',
                    sx: { mt: 2 },
                    inputProps: { readOnly: true }, // Désactive la saisie manuelle
                  }
                }}
              />
            </LocalizationProvider>
            {dateError && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>{dateError}</Typography>
            )}
            {/* DEBUG: Affichage temporaire des valeurs */}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              nom: {newTrimesterName} | début: {String(newStartDate)} | fin: {String(newEndDate)} | erreur: {dateError} | loading: {String(loading)}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
            <Button
              onClick={() => {
                console.log('disabled:', !newTrimesterName.trim(), !newStartDate, !newEndDate, !!dateError, loading);
                handleCreateTrimester();
              }}
              variant="contained"
              disabled={
                !newTrimesterName.trim() ||
                !newStartDate ||
                !newEndDate ||
                !!dateError ||
                loading
              }
            >
              Créer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default TrimestersManagement; 