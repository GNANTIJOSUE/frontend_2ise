import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Modal,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';
import axios from 'axios';

interface OnlineRegistration {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  registration_number: string;
  created_at: string;
}

interface Class {
  id: number;
  name: string;
}

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const FinalizeRegistration = () => {
  const theme = useTheme();
  const [registrations, setRegistrations] = useState<OnlineRegistration[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<OnlineRegistration | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get('https://2ise-groupe.com/api/students/online-registrations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegistrations(data);
    } catch (err) {
      setError('Erreur lors de la récupération des inscriptions.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('https://2ise-groupe.com/api/classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(data);
    } catch (err) {
      console.error("Erreur lors de la récupération des classes", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      await fetchRegistrations();
      await fetchClasses();
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [fetchRegistrations]);

  const handleOpenModal = (student: OnlineRegistration) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedStudent(null);
    setSelectedClass('');
    setPaymentAmount('');
  };

  const handleFinalize = async () => {
    if (!selectedStudent || !selectedClass || !paymentAmount) {
      setSnackbar({ open: true, message: 'Veuillez remplir tous les champs.', severity: 'error' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`https://2ise-groupe.com/api/students/${selectedStudent.id}/finalize`, {
        class_id: selectedClass,
        payment_amount: paymentAmount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbar({ open: true, message: 'Inscription finalisée avec succès!', severity: 'success' });
      handleCloseModal();
      fetchRegistrations(); // Refresh the list
    } catch (err) {
      setSnackbar({ open: true, message: 'Erreur lors de la finalisation.', severity: 'error' });
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom>Finaliser les Inscriptions en Ligne</Typography>
        <Typography variant="body1">
          Liste des étudiants pré-inscrits en ligne. Cliquez sur "Finaliser" pour leur assigner une classe et enregistrer le paiement.
        </Typography>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom complet</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Matricule</TableCell>
              <TableCell>Date de pré-inscription</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {registrations.map((reg) => (
              <TableRow key={reg.id}>
                <TableCell>{`${reg.first_name} ${reg.last_name}`}</TableCell>
                <TableCell>{reg.email}</TableCell>
                <TableCell>{reg.registration_number}</TableCell>
                <TableCell>{new Date(reg.created_at).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <Button variant="contained" color="primary" onClick={() => handleOpenModal(reg)}>
                    Finaliser
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box sx={style}>
          <Typography variant="h6" component="h2">
            Finaliser l'inscription de {selectedStudent?.first_name} {selectedStudent?.last_name}
          </Typography>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="class-select-label">Classe</InputLabel>
              <Select
                labelId="class-select-label"
                value={selectedClass}
                label="Classe"
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                {classes.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              margin="normal"
              label="Montant payé (F CFA)"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleCloseModal} sx={{ mr: 1 }}>Annuler</Button>
              <Button variant="contained" onClick={handleFinalize}>
                Confirmer la Finalisation
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FinalizeRegistration; 