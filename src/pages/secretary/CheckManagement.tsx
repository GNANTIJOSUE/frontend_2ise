import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import axios from 'axios';
import SecretarySidebar from '../../components/SecretarySidebar';

interface CheckPayment {
  id: number;
  student_id: number;
  student_name: string;
  amount: number;
  check_number: string;
  bank_name: string;
  issue_date: string;
  payment_type: 'check' | 'transfer';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  notes?: string;
}

const CheckManagement = () => {
  // Fonction pour obtenir l'année scolaire courante
  const getCurrentSchoolYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    // L'année scolaire commence en septembre (mois 9)
    // Si on est entre septembre et décembre, c'est l'année scolaire en cours
    // Si on est entre janvier et août, c'est l'année scolaire précédente
    if (month >= 9) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };

  // Fonction utilitaire pour générer les années scolaires
  const getSchoolYears = (count = 5) => {
    const currentSchoolYear = getCurrentSchoolYear();
    const currentYear = parseInt(currentSchoolYear.split('-')[0]);
    return Array.from({ length: count }, (_, i) => {
      const start = currentYear - (count - 1 - i);
      return `${start}-${start + 1}`;
    }).reverse();
  };

  const [checks, setChecks] = useState<CheckPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCheck, setSelectedCheck] = useState<CheckPayment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'view'>('view');
  const [notes, setNotes] = useState('');
  const [schoolYear, setSchoolYear] = useState<string>(getCurrentSchoolYear());
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchChecks();
  }, [schoolYear]); // Ajouter schoolYear comme dépendance

  const fetchChecks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://2ise-groupe.com/api/payments/checks?school_year=${schoolYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChecks(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des chèques:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la récupération des chèques',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (check: CheckPayment, type: 'approve' | 'reject' | 'view') => {
    setSelectedCheck(check);
    setActionType(type);
    setNotes('');
    setDialogOpen(true);
  };

  // Gérer le changement d'année scolaire
  const handleSchoolYearChange = (event: any) => {
    const newYear = event.target.value as string;
    setSchoolYear(newYear);
    // Les données seront rechargées automatiquement via useEffect
  };

  const handleSubmitAction = async () => {
    if (!selectedCheck) return;

    try {
      const token = localStorage.getItem('token');
      const endpoint = actionType === 'approve' 
        ? `https://2ise-groupe.com/api/payments/checks/${selectedCheck.id}/approve`
        : `https://2ise-groupe.com/api/payments/checks/${selectedCheck.id}/reject`;

      await axios.post(endpoint, {
        notes: notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSnackbar({
        open: true,
        message: `Chèque ${actionType === 'approve' ? 'approuvé' : 'rejeté'} avec succès`,
        severity: 'success'
      });

      setDialogOpen(false);
      fetchChecks(); // Rafraîchir la liste
    } catch (error: any) {
      console.error('Erreur lors de l\'action:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Erreur lors de l\'action',
        severity: 'error'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <SecretarySidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Gestion des chèques et virements
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            {/* Sélecteur d'année scolaire */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Année scolaire</InputLabel>
              <Select
                value={schoolYear}
                onChange={handleSchoolYearChange}
                label="Année scolaire"
              >
                {getSchoolYears(5).map((year) => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchChecks}
            >
              Actualiser
            </Button>
          </Box>
        </Box>

      {/* Indicateur d'année scolaire */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" color="primary">
          Année scolaire : {schoolYear}
        </Typography>
        <Chip 
          label={`${checks.length} paiements trouvés`}
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Statistiques */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total des paiements
              </Typography>
              <Typography variant="h4">
                {checks.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Chèques
              </Typography>
              <Typography variant="h4" color="primary.main">
                {checks.filter(c => c.payment_type === 'check').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Virements
              </Typography>
              <Typography variant="h4" color="secondary.main">
                {checks.filter(c => c.payment_type === 'transfer').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                En attente
              </Typography>
              <Typography variant="h4" color="warning.main">
                {checks.filter(c => c.status === 'pending').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approuvés
              </Typography>
              <Typography variant="h4" color="success.main">
                {checks.filter(c => c.status === 'approved').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Rejetés
              </Typography>
              <Typography variant="h4" color="error.main">
                {checks.filter(c => c.status === 'rejected').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table des chèques */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Étudiant</TableCell>
                <TableCell>Montant</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>N° Chèque/Virement</TableCell>
                <TableCell>Banque</TableCell>
                <TableCell>Date d'émission</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date de soumission</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {checks.map((check) => (
                <TableRow key={check.id} hover>
                  <TableCell>{check.student_name}</TableCell>
                  <TableCell>{formatAmount(check.amount)}</TableCell>
                  <TableCell>{check.payment_type === 'check' ? 'Chèque' : 'Virement'}</TableCell>
                  <TableCell>{check.check_number}</TableCell>
                  <TableCell>{check.bank_name}</TableCell>
                  <TableCell>{formatDate(check.issue_date)}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(check.status)}
                      color={getStatusColor(check.status) as any}
                      size="small"
                    />
                    {check.payment_type === 'transfer' && check.status === 'approved' && (
                      <Chip
                        label="Auto-approuvé"
                        color="info"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{formatDate(check.created_at)}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Voir les détails">
                        <IconButton
                          size="small"
                          onClick={() => handleAction(check, 'view')}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {check.status === 'pending' && check.payment_type === 'check' && (
                        <>
                          <Tooltip title="Approuver">
                            <IconButton
                              size="small"
                              onClick={() => handleAction(check, 'approve')}
                              color="success"
                            >
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Rejeter">
                            <IconButton
                              size="small"
                              onClick={() => handleAction(check, 'reject')}
                              color="error"
                            >
                              <RejectIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog pour les actions */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'view' ? 
            (selectedCheck?.payment_type === 'check' ? 'Détails du chèque' : 'Détails du virement') : 
            actionType === 'approve' ? 'Approuver le chèque' : 'Rejeter le chèque'}
        </DialogTitle>
        <DialogContent>
          {selectedCheck && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Étudiant:</strong> {selectedCheck.student_name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Montant:</strong> {formatAmount(selectedCheck.amount)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Type:</strong> {selectedCheck.payment_type === 'check' ? 'Chèque' : 'Virement'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>N° Chèque/Virement:</strong> {selectedCheck.check_number}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Banque:</strong> {selectedCheck.bank_name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Date d'émission:</strong> {formatDate(selectedCheck.issue_date)}
              </Typography>
              {selectedCheck.notes && (
                <Typography variant="body1" gutterBottom>
                  <strong>Notes:</strong> {selectedCheck.notes}
                </Typography>
              )}
              {selectedCheck.payment_type === 'transfer' && (
                <Typography variant="body2" color="info.main" sx={{ mt: 2, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                  <strong>Note:</strong> Les virements sont automatiquement approuvés et impactés directement sur la scolarité de l'étudiant.
                </Typography>
              )}
              {actionType !== 'view' && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes (optionnel)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Annuler
          </Button>
          {actionType !== 'view' && (
            <Button
              onClick={handleSubmitAction}
              variant="contained"
              color={actionType === 'approve' ? 'success' : 'error'}
            >
              {actionType === 'approve' ? 'Approuver' : 'Rejeter'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
                 </Alert>
       </Snackbar>
       </Box>
     </Box>
   );
 };

export default CheckManagement; 