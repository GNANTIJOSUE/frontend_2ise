import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Receipt as ReceiptIcon,
  Euro as EuroIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import SecretarySidebar from '../../components/SecretarySidebar';

// Fonction utilitaire pour générer les années scolaires
function getSchoolYears(count = 5) {
  const now = new Date();
  const currentYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return Array.from({ length: count }, (_, i) => {
    const start = currentYear - (count - 1 - i);
    return `${start}-${start + 1}`;
  }).reverse();
}

// Fonction utilitaire pour afficher un nombre ou 0 si NaN/null/undefined
function safeNumber(val: any) {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolYear, setSchoolYear] = useState('2024-2025');
  const [availableYears, setAvailableYears] = useState<string[]>(getSchoolYears(5));

  // Résumé des paiements
  const [paymentsSummary, setPaymentsSummary] = useState<any>(null);

  // Modifie le fetch des paiements pour inclure l'année scolaire
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('Token d\'authentification manquant');
      return;
    }

    // Récupérer les paiements
    fetch(`https://2ise-groupe.com/api/payments?school_year=${schoolYear}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Vérifier que data est un tableau
        if (Array.isArray(data)) {
          // Mapping pour compatibilité avec le tableau
          const mapped = data.map((p: any) => ({
            ...p,
            matricule: p.registration_number || p.matricule || '',
            nom: p.last_name || p.nom || '',
            prenom: p.first_name || p.prenom || '',
          }));
          setPayments(mapped);
        } else {
          console.error('Les données reçues ne sont pas un tableau:', data);
          setPayments([]);
        }
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des paiements:', error);
        setPayments([]);
      });
    
    // Récupère le résumé des paiements
    fetch(`https://2ise-groupe.com/api/payments/summary?school_year=${schoolYear}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Vérifier que data est un objet valide
        if (data && typeof data === 'object') {
          setPaymentsSummary(data);
        } else {
          console.error('Les données du résumé ne sont pas un objet valide:', data);
          setPaymentsSummary(null);
        }
      })
      .catch(error => {
        console.error('Erreur lors de la récupération du résumé des paiements:', error);
        setPaymentsSummary(null);
      });
  }, [schoolYear]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.prenom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcul des statistiques
  const totalPayments = payments.length;
  const paidPayments = payments.filter(p => p.statut === 'Payé').length;
  const pendingPayments = payments.filter(p => p.statut === 'En attente').length;
  const latePayments = payments.filter(p => p.statut === 'Retard').length;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SecretarySidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%' }}>
        {/* En-tête stylisée */}
        <Paper elevation={2} sx={{ mb: 4, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f7fa', borderRadius: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Gestion des Paiements
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 180, mr: 2 }}>
              <InputLabel id="school-year-label">Année scolaire</InputLabel>
              <Select
                labelId="school-year-label"
                value={schoolYear}
                label="Année scolaire"
                onChange={e => setSchoolYear(e.target.value)}
              >
                {availableYears.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
  
          </Box>
        </Paper>

        {/* Statistiques */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Cartes stylisées */}
          {paymentsSummary && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: 3, borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 6, transform: 'scale(1.03)' } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{safeNumber(paymentsSummary.paid_assigned).toLocaleString()} FCFA</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Montant payé par les élèves affectés
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: 3, borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 6, transform: 'scale(1.03)' } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{safeNumber(paymentsSummary.paid_unassigned).toLocaleString()} FCFA</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Montant payé par les élèves non affectés
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: 3, borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 6, transform: 'scale(1.03)' } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WarningIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{safeNumber(paymentsSummary.remaining_assigned).toLocaleString()} FCFA</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Reste à payer par les élèves affectés
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ boxShadow: 3, borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 6, transform: 'scale(1.03)' } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WarningIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{safeNumber(paymentsSummary.remaining_unassigned).toLocaleString()} FCFA</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Reste à payer par les élèves non affectés
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>

        {/* Résumé des paiements stylisé */}
        {paymentsSummary && (
          <Box sx={{ mb: 4 }}>
            <Paper sx={{ p: 3, mb: 2, background: '#f5f7fa', borderRadius: 2, boxShadow: 2 }}>
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 700, color: 'primary.main' }}>
                Montant total payé (établissement) : <b style={{ fontSize: '2rem' }}>{safeNumber(paymentsSummary.total_paid).toLocaleString()} FCFA</b>
                {paymentsSummary.total_bon > 0 && (
                  <span style={{ marginLeft: 16, color: '#1976d2', fontStyle: 'italic', fontWeight: 500 }}>
                    (dont bons : <b>{safeNumber(paymentsSummary.total_bon).toLocaleString()} FCFA</b>)
                  </span>
                )}
              </Typography>
              <Box sx={{ mt: 2, mb: 2, pl: 2 }}>
                <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600, fontSize: 18, mb: 0.5 }}>
                  Montant payé par les élèves affectés :
                  <span style={{ color: '#388e3c', fontWeight: 700, marginLeft: 8 }}>{safeNumber(paymentsSummary.paid_assigned).toLocaleString()} FCFA</span>
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600, fontSize: 18, mb: 0.5 }}>
                  Montant payé par les élèves non affectés :
                  <span style={{ color: '#1976d2', fontWeight: 700, marginLeft: 8 }}>{safeNumber(paymentsSummary.paid_unassigned).toLocaleString()} FCFA</span>
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600, fontSize: 18, mb: 0.5 }}>
                  Reste à payer par les élèves affectés :
                  <span style={{ color: '#f57c00', fontWeight: 700, marginLeft: 8 }}>{safeNumber(paymentsSummary.remaining_assigned).toLocaleString()} FCFA</span>
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600, fontSize: 18, mb: 0.5 }}>
                  Reste à payer par les élèves non affectés :
                  <span style={{ color: '#1976d2', fontWeight: 700, marginLeft: 8 }}>{safeNumber(paymentsSummary.remaining_unassigned).toLocaleString()} FCFA</span>
                </Typography>
              </Box>
            </Paper>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, boxShadow: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>Montant total payé par classe</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ background: '#f0f4f8' }}>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Classe</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>Montant payé (FCFA)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentsSummary.byClass && paymentsSummary.byClass.length > 0 ? paymentsSummary.byClass.map((row: any, idx: number) => (
                        <TableRow key={row.class_id} sx={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                          <TableCell>{row.class_name || <span style={{ color: '#aaa', fontStyle: 'italic' }}>(Non affecté à une classe)</span>}</TableCell>
                          <TableCell align="right">{safeNumber(row.total_paid).toLocaleString()} FCFA</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={2}>Aucune donnée</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, boxShadow: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>Montant total payé par niveau</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ background: '#f0f4f8' }}>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Niveau</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>Montant payé (FCFA)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentsSummary.byLevel && paymentsSummary.byLevel.length > 0 ? paymentsSummary.byLevel.map((row: any, idx: number) => (
                        <TableRow key={row.level} sx={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                          <TableCell>{row.level || <span style={{ color: '#aaa', fontStyle: 'italic' }}>(Non affecté à un niveau)</span>}</TableCell>
                          <TableCell align="right">{safeNumber(row.total_paid).toLocaleString()} FCFA</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={2}>Aucune donnée</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

      </Box>
    </Box>
  );
};

export default Payments; 