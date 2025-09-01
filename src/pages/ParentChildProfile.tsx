import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Button, Grid, Typography, IconButton, Badge, Menu, MenuItem, ListItemText, ListItemIcon, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Alert, TextField, useTheme, useMediaQuery, Chip, FormControl, InputLabel, Select, TableContainer } from '@mui/material';
import { useAppBadge } from '../hooks/useAppBadge';
import NotesTab from './NotesTab';
import ReportCardTab from './ReportCardTab';
import AbsencesTab from './AbsencesTab';
import ScheduleTab from './ScheduleTab';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaymentIcon from '@mui/icons-material/Payment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BarChartIcon from '@mui/icons-material/BarChart';
import StarIcon from '@mui/icons-material/Star';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import CloseIcon from '@mui/icons-material/Close';

const tabOptions = [
  {
    label: 'Remarques',
    color: '#1976d2',
    icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
  },
  {
    label: 'Bulletin',
    color: '#e040fb',
    icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
  },
  {
    label: 'Absences',
    color: '#ff9800',
    icon: <EventBusyIcon sx={{ fontSize: 40 }} />,
  },
  {
    label: 'Emploi du temps',
    color: '#43a047',
    icon: <CalendarTodayIcon sx={{ fontSize: 40 }} />,
  },
];

const PaiementDialog = ({ open, onClose, childId, schoolYear }: { open: boolean, onClose: () => void, childId: string | undefined, schoolYear: string }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [fusionAccount, setFusionAccount] = useState('');
  const [payingId, setPayingId] = useState<number | null>(null);
  const [fusionAccounts, setFusionAccounts] = useState<{ [key: number]: string }>({});
  const [receipt, setReceipt] = useState<any | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [customAmount, setCustomAmount] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [fusionPaymentUrl, setFusionPaymentUrl] = useState<string | null>(null);
  const [fusionPaymentToken, setFusionPaymentToken] = useState<string | null>(null);
  const [fusionPaymentAmount, setFusionPaymentAmount] = useState<number | string | null>(null);
  const [fusionPaymentId, setFusionPaymentId] = useState<number | string | null>(null);
  const [showFusionModal, setShowFusionModal] = useState(false);

  // Fonction pour rafraîchir manuellement les données
  const refreshData = async () => {
    if (!childId || !schoolYear) return;
    
    setRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      const [paymentsRes, studentRes] = await Promise.all([
        axios.get(`https://2ise-groupe.com/api/students/${childId}/payments?school_year=${schoolYear}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`https://2ise-groupe.com/api/students/${childId}?school_year=${schoolYear}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setPayments(paymentsRes.data);
      setStudent(studentRes.data);
      setError(null);
    } catch (e: any) {
      setError("Erreur lors du rafraîchissement des données.");
    } finally {
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    if (!open || !childId || !schoolYear) return;
    
    let isMounted = true;
    
    if (isMounted) {
      setLoading(true);
      setError(null);
      setReceipt(null);
      setShowReceipt(false);
    }
    
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [paymentsRes, studentRes] = await Promise.all([
          axios.get(`https://2ise-groupe.com/api/students/${childId}/payments?school_year=${schoolYear}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`https://2ise-groupe.com/api/students/${childId}?school_year=${schoolYear}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (isMounted) {
          setPayments(paymentsRes.data);
          setStudent(studentRes.data);
        }
      } catch (e: any) {
        if (isMounted) {
          setError("Erreur lors du chargement des paiements.");
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [open, childId, schoolYear]);

  // Correction : toujours utiliser les valeurs du backend pour l'affichage global
  const totalDue = student?.class_amount ?? student?.total_due ?? 0;
  const totalDiscount = student?.total_discount ?? 0;
  const totalPaid = student?.total_paid ?? 0;
  const reste = student?.reste_a_payer ?? Math.max(0, totalDue - totalDiscount - totalPaid);

  // Paiement individuel d'une ligne en attente
  const handleFusionPaySingle = async (payment: any) => {
    setPayingId(payment.id);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('https://2ise-groupe.com/api/payments', {
        student_id: childId,
        amount: payment.amount,
        monnaie_fusion_account: fusionAccounts[payment.id] || '',
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (res.data && res.data.fusion && res.data.fusion.url) {
        // Ouvrir la modal de paiement Money Fusion intégrée
        setFusionPaymentUrl(res.data.fusion.url);
        setFusionPaymentToken(res.data.fusion.token);
        setFusionPaymentAmount(payment.amount);
        setFusionPaymentId(payment.id);
        setShowFusionModal(true);
        
        // Démarrer le polling pour vérifier le statut
        startPaymentStatusPolling(res.data.fusion.token, payment.amount, payment.id);
      } else {
        setError("Erreur lors de l'initiation du paiement Monnaie Fusion.");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Erreur lors du paiement.");
    }
    setPayingId(null);
  };

  // Fonction pour démarrer le polling du statut de paiement
  const startPaymentStatusPolling = (token: string, amount: number, paymentId: string | number) => {
    const checkPaymentStatus = setInterval(async () => {
      try {
        const tokenAuth = localStorage.getItem('token');
        // Vérifier le statut du paiement
        const statusRes = await axios.get(`https://2ise-groupe.com/api/students/${childId}/payments?school_year=${schoolYear}`, {
          headers: { Authorization: `Bearer ${tokenAuth}` }
        });
        
        // Trouver le paiement correspondant
        const updatedPayment = statusRes.data.find((p: any) => p.transaction_id === token);
        
        if (updatedPayment && updatedPayment.status === 'completed') {
          clearInterval(checkPaymentStatus);
          // Afficher le reçu seulement si le paiement est complété
          setReceipt({
            payment_date: new Date().toISOString(),
            amount: amount,
            status: 'complété',
            id: paymentId,
            student_name: student ? `${student.first_name} ${student.last_name}` : '',
          });
          setShowReceipt(true);
          // Recharger les données
          const [paymentsRes, studentRes] = await Promise.all([
            axios.get(`https://2ise-groupe.com/api/students/${childId}/payments?school_year=${schoolYear}`, { headers: { Authorization: `Bearer ${tokenAuth}` } }),
            axios.get(`https://2ise-groupe.com/api/students/${childId}?school_year=${schoolYear}`, { headers: { Authorization: `Bearer ${tokenAuth}` } })
          ]);
          setPayments(paymentsRes.data);
          setStudent(studentRes.data);
          // Effacer le message d'erreur si le paiement a réussi
          setError(null);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
      }
    }, 3000); // Vérifier toutes les 3 secondes
    
    // Arrêter la vérification après 5 minutes
    setTimeout(() => {
      clearInterval(checkPaymentStatus);
    }, 300000);
  };

  // Paiement du reste à payer (global)
  const handleFusionPay = async () => {
    setPaying(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const amountToPay = Number(customAmount);
      const res = await axios.post('https://2ise-groupe.com/api/payments', {
        student_id: childId,
        amount: amountToPay,
        monnaie_fusion_account: fusionAccount
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (res.data && res.data.fusion && res.data.fusion.url) {
        // Ouvrir la modal de paiement Money Fusion intégrée
        setFusionPaymentUrl(res.data.fusion.url);
        setFusionPaymentToken(res.data.fusion.token);
        setFusionPaymentAmount(amountToPay.toString());
        setFusionPaymentId('reste');
        setShowFusionModal(true);
        
        // Démarrer le polling pour vérifier le statut
        startPaymentStatusPolling(res.data.fusion.token, amountToPay, 'reste');
      } else {
        setError("Erreur lors de l'initiation du paiement Monnaie Fusion.");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Erreur lors du paiement.");
    }
    setPaying(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 700, fontSize: { xs: 18, sm: 22 } }}>
        Paiements de l'enfant
        <IconButton
          onClick={refreshData}
          disabled={refreshing}
          sx={{ 
            position: 'absolute', 
            right: 8, 
            top: 8, 
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          {refreshing ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 1, sm: 3 }, py: { xs: 1, sm: 2 } }}>
        {loading ? <CircularProgress /> : error ? (
          <Box data-testid="error-container">
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>
                {error}
              </Typography>
              {error.includes("popups sont bloqués") && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Pour résoudre ce problème :
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                    <Typography component="li" variant="body2">
                      Cliquez sur l'icône de cadenas ou bouclier dans la barre d'adresse
                    </Typography>
                    <Typography component="li" variant="body2">
                      Autorisez les popups pour ce site
                    </Typography>
                    <Typography component="li" variant="body2">
                      Ou utilisez le lien de paiement qui apparaîtra ci-dessous
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Le statut de votre paiement sera automatiquement mis à jour une fois le paiement effectué.
                  </Typography>
                </Box>
              )}
            </Alert>
          </Box>
        ) : (
          <>
            <Box mb={2}>
              <Typography variant="subtitle1" mb={1} fontSize={{ xs: 15, sm: 18 }}>
                <b>Montant total de la scolarité :</b> <span style={{ color: '#1976d2', fontWeight: 700 }}>{totalDue.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span><br />
                {totalDiscount > 0 && (
                  <>
                    <b>Réduction :</b> <span style={{ color: '#1976d2', fontWeight: 700 }}>- {totalDiscount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span><br />
                  </>
                )}
                <b>Net à payer :</b> <span style={{ color: '#ff6f00', fontWeight: 700, fontSize: '1.1em' }}>{(totalDue - totalDiscount).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span><br />
                <b>Total payé :</b> <span style={{ color: '#388e3c', fontWeight: 700 }}>{totalPaid.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span><br />
                <b>Reste à payer :</b> <span style={{ color: reste > 0 ? '#d32f2f' : '#388e3c', fontWeight: 700 }}>{reste.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
              </Typography>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <TableContainer sx={{ overflowX: 'auto', borderRadius: 2, boxShadow: 2, bgcolor: '#fff', mb: 2 }}>
                <Table size="small" sx={{ minWidth: 600 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: 13, md: 15 }, px: { xs: 1, md: 2 } }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: 13, md: 15 }, px: { xs: 1, md: 2 } }}>Heure</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: 13, md: 15 }, px: { xs: 1, md: 2 } }}>Montant</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: 13, md: 15 }, px: { xs: 1, md: 2 } }}>Statut</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: { xs: 13, md: 15 }, px: { xs: 1, md: 2 } }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((p, idx) => {
                      const dateObj = new Date(p.payment_date);
                      const isPending = p.status === 'en attente' || p.status === 'pending';
                      return (
                        <TableRow key={idx} sx={{ bgcolor: idx % 2 === 0 ? '#f8fafd' : '#fff' }}>
                          <TableCell sx={{ fontSize: { xs: 13, md: 15 }, px: { xs: 1, md: 2 } }}>{dateObj.toLocaleDateString('fr-FR')}</TableCell>
                          <TableCell sx={{ fontSize: { xs: 13, md: 15 }, px: { xs: 1, md: 2 } }}>{dateObj.toLocaleTimeString('fr-FR')}</TableCell>
                          <TableCell sx={{ fontSize: { xs: 13, md: 15 }, px: { xs: 1, md: 2 } }}>{Number(p.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</TableCell>
                          <TableCell sx={{ fontSize: { xs: 13, md: 15 }, px: { xs: 1, md: 2 } }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 10px',
                              borderRadius: 12,
                              fontWeight: 600,
                              color: isPending ? '#d32f2f' : '#388e3c',
                              background: isPending ? '#fff3e0' : '#e8f5e9',
                              fontSize: 14
                            }}>{p.status}</span>
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: { xs: 13, md: 15 }, px: { xs: 1, md: 2 } }}>
                            {isPending && (
                              <Box display={{ xs: 'block', sm: 'flex' }} alignItems="center" gap={1}>
                                <TextField
                                  size="small"
                                  label="Compte Monnaie Fusion"
                                  value={fusionAccounts[p.id] || ''}
                                  onChange={e => setFusionAccounts({ ...fusionAccounts, [p.id]: e.target.value })}
                                  sx={{ width: { xs: '100%', sm: 170 }, mb: { xs: 1, sm: 0 } }}
                                />
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  startIcon={<PaymentIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                  disabled={payingId === p.id || !(fusionAccounts[p.id] && fusionAccounts[p.id].length > 0)}
                                  onClick={() => handleFusionPaySingle(p)}
                                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                                >
                                  Payer
                                </Button>
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {payments.length === 0 && (
                      <TableRow><TableCell colSpan={5} align="center">Aucun paiement trouvé.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            {reste > 0 && (
              <>
                {/* Information sur les frais Money Fusion */}
                {customAmount && Number(customAmount) > 0 && (
                  <Box
                    mt={2}
                    p={2}
                    sx={{
                      bgcolor: '#fff3e0',
                      borderRadius: 2,
                      border: '1px solid #ff9800',
                      mb: 2
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={700} color="#ff6f00" mb={1}>
                      💡 Information sur les frais de transaction
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 14 }}>
                      <b>Montant à payer (par le parent) :</b> {Number(customAmount).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}<br />
                      <b>Frais Money Fusion (3%) :</b> {(Number(customAmount) * 0.03).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}<br />
                      <b>Montant que recevra l'école :</b> <span style={{ color: '#388e3c', fontWeight: 700 }}>{(Number(customAmount) * 0.97).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span><br />
                      <span style={{ color: '#ff6f00', fontSize: 12, fontStyle: 'italic' }}>💡 Ce montant sera pris en compte dans le calcul du reste à payer</span>
                    </Typography>
                  </Box>
                )}
                
                <Box
                  mt={2}
                  display="flex"
                  flexDirection={{ xs: 'column', sm: 'row' }}
                  alignItems="center"
                  justifyContent="center"
                  gap={2}
                  sx={{ width: '100%' }}
                >
                  <TextField
                    label="Montant à payer"
                    type="number"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value.replace(/^0+/, ''))}
                    size="small"
                    sx={{
                      width: { xs: '100%', sm: 170 },
                      bgcolor: '#fff',
                      borderRadius: 2,
                      boxShadow: 1,
                      '& .MuiInputBase-root': { borderRadius: 2 },
                    }}
                    inputProps={{ min: 1, max: reste }}
                    helperText={`Maximum : ${reste.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}`}
                  />
                  <TextField
                    label="Compte Monnaie Fusion (téléphone)"
                    value={fusionAccount}
                    onChange={e => setFusionAccount(e.target.value)}
                    size="small"
                    sx={{
                      width: { xs: '100%', sm: 220 },
                      bgcolor: '#fff',
                      borderRadius: 2,
                      boxShadow: 1,
                      '& .MuiInputBase-root': { borderRadius: 2 },
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<PaymentIcon sx={{ fontSize: { xs: 20, sm: 28 } }} />}
                    disabled={
                      paying ||
                      !fusionAccount ||
                      !customAmount ||
                      isNaN(Number(customAmount)) ||
                      Number(customAmount) <= 0 ||
                      Number(customAmount) > reste
                    }
                    onClick={handleFusionPay}
                    sx={{
                      width: { xs: '100%', sm: 200 },
                      fontSize: { xs: 16, sm: 20 },
                      py: { xs: 1.2, sm: 2 },
                      px: { xs: 0, sm: 4 },
                      fontWeight: 900,
                      borderRadius: 2,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      boxShadow: 3,
                      bgcolor: !paying && fusionAccount && customAmount && !isNaN(Number(customAmount)) && Number(customAmount) > 0 && Number(customAmount) <= reste ? '#43a047' : '#e0e0e0',
                      color: !paying && fusionAccount && customAmount && !isNaN(Number(customAmount)) && Number(customAmount) > 0 && Number(customAmount) <= reste ? '#fff' : '#888',
                      transition: 'background 0.2s, color 0.2s',
                      '&:hover': {
                        bgcolor: !paying && fusionAccount && customAmount && !isNaN(Number(customAmount)) && Number(customAmount) > 0 && Number(customAmount) <= reste ? '#388e3c' : '#e0e0e0',
                        color: !paying && fusionAccount && customAmount && !isNaN(Number(customAmount)) && Number(customAmount) > 0 && Number(customAmount) <= reste ? '#fff' : '#888',
                      },
                    }}
                  >
                    Payer {customAmount ? Number(customAmount).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' }) : ''}
                  </Button>
                </Box>
              </>
            )}
            {reste === 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>La scolarité est totalement réglée.</Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ fontSize: { xs: 15, sm: 16 } }}>Fermer</Button>
      </DialogActions>
      
      {/* Modal Money Fusion intégrée */}
      <Dialog 
        open={showFusionModal} 
        onClose={() => setShowFusionModal(false)} 
        maxWidth="md" 
        fullWidth 
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            height: isMobile ? '100%' : '80vh',
            maxHeight: isMobile ? '100%' : '80vh',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#1976d2', 
          color: 'white', 
          fontWeight: 700, 
          fontSize: { xs: 18, sm: 22 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Paiement Money Fusion
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Montant: {fusionPaymentAmount ? 
                (typeof fusionPaymentAmount === 'number' ? 
                  fusionPaymentAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' }) :
                  Number(fusionPaymentAmount).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })
                ) : '0 FCFA'
              }
            </Typography>
          </Box>
          <IconButton
            onClick={() => setShowFusionModal(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {fusionPaymentUrl ? (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Instructions */}
              <Box sx={{ p: 2, bgcolor: '#fff3e0', borderBottom: '1px solid #ff9800' }}>
                <Typography variant="body2" color="#ff6f00" fontWeight={600}>
                  💡 Instructions de paiement:
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  1. Remplissez vos informations de paiement dans le formulaire ci-dessous<br/>
                  2. Confirmez le paiement<br/>
                  3. Le statut sera automatiquement mis à jour une fois le paiement effectué
                </Typography>
              </Box>
              
              {/* Iframe Money Fusion */}
              <Box sx={{ flex: 1, position: 'relative' }}>
                <iframe
                  src={fusionPaymentUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '0 0 8px 8px'
                  }}
                  title="Paiement Money Fusion"
                  allow="payment"
                  sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"
                />
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialogue reçu */}
      <Dialog open={showReceipt} onClose={() => setShowReceipt(false)} fullScreen={isMobile}>
        <DialogTitle>Reçu de paiement</DialogTitle>
        <DialogContent>
          {receipt && (
            <Box>
              <Typography variant="subtitle1" fontWeight={700} mb={1}>Paiement #{receipt.id}</Typography>
              <Typography>Élève : <b>{receipt.student_name}</b></Typography>
              <Typography>Date : <b>{new Date(receipt.payment_date).toLocaleDateString('fr-FR')} {new Date(receipt.payment_date).toLocaleTimeString('fr-FR')}</b></Typography>
              <Typography>Montant : <b>{Number(receipt.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</b></Typography>
              <Typography>Statut : <b>{receipt.status}</b></Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReceipt(false)} sx={{ fontSize: { xs: 15, sm: 16 } }}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

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

const ParentChildProfile = () => {
  const { childId } = useParams();
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  // Notifications d'absence pour l'enfant courant
  const [absenceNotifications, setAbsenceNotifications] = useState<any[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  // Hook pour gérer les badges d'application
  const { badgeCount, isSupported, updateBadge, clearBadge, requestPermissions } = useAppBadge({
    autoUpdate: true,
    interval: 30000
  });
  const handleNotifClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleNotifClose = () => {
    setAnchorEl(null);
  };

  // Fonction pour marquer une notification comme lue
  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`https://2ise-groupe.com/api/events/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Mettre à jour l'état local
      setAbsenceNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: 1 } : n
      ));
      const newCount = Math.max(0, absenceNotifications.filter(n => !n.is_read && n.id !== notificationId).length);
      setNotifCount(newCount);
      // Mettre à jour le badge de l'application
      updateBadge(newCount);
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  // Fonction pour marquer toutes les notifications comme lues
  const markAllNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('https://2ise-groupe.com/api/events/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Mettre à jour l'état local
      setAbsenceNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setNotifCount(0);
      // Effacer le badge de l'application
      clearBadge();
      // Fermer le menu après le marquage
      setAnchorEl(null);
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    let interval: NodeJS.Timeout;
    
    const fetchAbsenceNotifications = async () => {
      if (!childId || !isMounted) return;
      const token = localStorage.getItem('token');
      try {
        const { data } = await axios.get(`https://2ise-groupe.com/api/events/my-notifications?school_year=${schoolYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const absNotifs = data.filter(
          (n: any) =>
            n.title &&
            n.title.startsWith('Absence de') &&
            (n.student_id === Number(childId) || (n.message && n.message.includes(childId)))
        );
        
        if (isMounted) {
          setAbsenceNotifications(absNotifs);
          const unreadCount = absNotifs.filter((n: any) => !n.is_read).length;
          setNotifCount(unreadCount);
          // Mettre à jour le badge de l'application
          updateBadge(unreadCount);
        }
      } catch (e) {
        if (isMounted) {
          setAbsenceNotifications([]);
          setNotifCount(0);
        }
      }
    };
    
    fetchAbsenceNotifications();
    interval = setInterval(fetchAbsenceNotifications, 10000); // toutes les 10s
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [childId]);

  // Dialogue paiement
  const [openPaiement, setOpenPaiement] = useState(false);
  const handlePayment = () => setOpenPaiement(true);
  const handleClosePaiement = () => setOpenPaiement(false);

  // Ajout pour la moyenne annuelle
  const [annualAverage, setAnnualAverage] = useState<{ moyenne_annuelle: number, rank: number, total: number } | null>(null);
  const [schoolYear, setSchoolYear] = useState(getCurrentSchoolYear());
  const SCHOOL_YEARS = getSchoolYears(5);
  const [publishedTrimesters, setPublishedTrimesters] = useState<{ [key: string]: boolean }>({});
  const [studentClassId, setStudentClassId] = useState<number | null>(null);

  React.useEffect(() => {
    if (!childId) return;
    
    let isMounted = true;
    
    const fetchAnnualAverage = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`https://2ise-groupe.com/api/students/${childId}/annual-average?school_year=${schoolYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (isMounted) {
          setAnnualAverage(data);
        }
      } catch {
        if (isMounted) {
          setAnnualAverage(null);
        }
      }
    };
    
    fetchAnnualAverage();
    
    return () => {
      isMounted = false;
    };
  }, [childId, schoolYear]);

  // Récupérer la classe de l'élève pour l'année scolaire sélectionnée
  React.useEffect(() => {
    if (!childId) return;
    
    let isMounted = true;
    
    const fetchClassId = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`https://2ise-groupe.com/api/students/${childId}?school_year=${schoolYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (isMounted) {
          setStudentClassId(data.class_id);
        }
      } catch {
        if (isMounted) {
          setStudentClassId(null);
        }
      }
    };
    
    fetchClassId();
    
    return () => {
      isMounted = false;
    };
  }, [childId, schoolYear]);

  // Récupérer l'état de publication des bulletins pour chaque trimestre
  React.useEffect(() => {
    if (!studentClassId) return;
    
    let isMounted = true;
    
    const fetchPublished = async () => {
      const trimesters = ['1er trimestre', '2e trimestre', '3e trimestre'];
      const token = localStorage.getItem('token');
      const results: { [key: string]: boolean } = {};
      await Promise.all(trimesters.map(async (trimester) => {
        try {
          const { data } = await axios.get(`https://2ise-groupe.com/api/report-cards/published?class_id=${studentClassId}&trimester=${encodeURIComponent(trimester)}&school_year=${schoolYear}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          results[trimester] = !!data.published;
        } catch {
          results[trimester] = false;
        }
      }));
      
      if (isMounted) {
        setPublishedTrimesters(results);
      }
    };
    
    fetchPublished();
    
    return () => {
      isMounted = false;
    };
  }, [studentClassId, schoolYear]);

  // Ajout pour les trimestres dynamiques
  const [trimesters, setTrimesters] = useState<{ id: number, name: string, is_open: boolean, start_date?: string, end_date?: string }[]>([]);
  React.useEffect(() => {
    let isMounted = true;
    
    // Récupérer les trimestres dynamiquement
    const fetchTrimesters = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('https://2ise-groupe.com/api/trimesters', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (isMounted) {
          setTrimesters(data);
        }
      } catch (err) {
        if (isMounted) {
          setTrimesters([]);
        }
      }
    };
    
    fetchTrimesters();
    
    return () => {
      isMounted = false;
    };
  }, [schoolYear]);

  // Bloc moyenne annuelle stylisé : affiché seulement si les 3 bulletins sont publiés
  console.log('DEBUG annualAverage:', annualAverage);
  console.log('DEBUG publishedTrimesters:', publishedTrimesters);
  const allTrimestersPublished = publishedTrimesters['1er trimestre'] && publishedTrimesters['2e trimestre'] && publishedTrimesters['3e trimestre'];

  return (
    <Box sx={{ p: 4 }}>
      {/* Bouton retour */}
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, fontWeight: 700, fontSize: 16, borderRadius: 3, px: 3 }}
        onClick={() => navigate('/parent/dashboard')}
      >
        Retour au tableau de bord parent
      </Button>
      {/* Dates de début et de fin des trimestres */}
      <Box sx={{ mt: 1, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', fontWeight: 600, color: 'primary.main' }}>
          Périodes des trimestres
        </Typography>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'row', 
            gap: 2, 
            overflowX: 'auto', 
            pb: 2,
            px: 1,
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#1976d2',
              borderRadius: 4,
              '&:hover': {
                background: '#1565c0',
              },
            },
            scrollbarWidth: 'thin',
            scrollbarColor: '#1976d2 #f1f1f1',
          }}
        >
          {trimesters.length > 0 ? (
            trimesters.map(trim => (
              <Box 
                key={trim.id} 
                sx={{ 
                  px: 3, 
                  py: 2, 
                  borderRadius: 3, 
                  bgcolor: '#e3f2fd', 
                  minWidth: 180, 
                  flexShrink: 0,
                  border: '2px solid #bbdefb',
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.1)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ fontSize: 16, mb: 1 }}>
                  {trim.name}
                </Typography>
                {trim.start_date && (
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: 14 }}>
                    <strong>Début :</strong> {new Date(trim.start_date).toLocaleDateString('fr-FR')}
                  </Typography>
                )}
                {trim.end_date && (
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'block', fontSize: 14 }}>
                    <strong>Fin :</strong> {new Date(trim.end_date).toLocaleDateString('fr-FR')}
                  </Typography>
                )}
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', width: '100%', py: 2 }}>
              Aucune information de trimestre disponible.
            </Typography>
          )}
        </Box>
        {trimesters.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1, fontStyle: 'italic' }}>
            💡 Faites glisser horizontalement pour voir tous les trimestres
          </Typography>
        )}
      </Box>
      <Box display="flex" alignItems="center" justifyContent="flex-end" mb={2}>
        {isSupported && (
          <Button
            variant="outlined"
            size="small"
            onClick={requestPermissions}
            sx={{ mr: 1, fontSize: 12 }}
          >
            Activer notifications
          </Button>
        )}
        <IconButton color="primary" sx={{ ml: 2 }} onClick={handleNotifClick}>
          <Badge badgeContent={notifCount} color="error">
            <NotificationsIcon sx={{ fontSize: 32 }} />
          </Badge>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleNotifClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{ sx: { minWidth: 320, borderRadius: 3, boxShadow: 4 } }}
        >
          <Box sx={{ px: 2, pt: 1, pb: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" color="primary.main" fontWeight={700}>
              Notifications d'absence
            </Typography>
            {absenceNotifications.length > 0 && (
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  markAllNotificationsAsRead();
                }}
                sx={{ fontSize: 12, py: 0.5 }}
              >
                Tout marquer comme lu
              </Button>
            )}
          </Box>
          {absenceNotifications.length === 0 ? (
            <MenuItem disabled>
              <ListItemText primary="Aucune notification d'absence" />
            </MenuItem>
          ) : (
            <>
              {absenceNotifications.map((notif: any, i: number) => (
                <MenuItem 
                  key={i} 
                  onClick={() => {
                    markNotificationAsRead(notif.id);
                    handleNotifClose();
                  }} 
                  sx={{ 
                    alignItems: 'flex-start',
                    backgroundColor: notif.is_read ? 'transparent' : '#f0f8ff',
                    '&:hover': {
                      backgroundColor: notif.is_read ? '#f5f5f5' : '#e3f2fd'
                    }
                  }}
                >
                  <ListItemIcon sx={{ mt: 0.5 }}>
                    {notif.type === 'public' && <InfoIcon color="primary" />}
                    {notif.type === 'private' && <EventBusyIcon color="warning" />}
                    {notif.type === 'class' && <CheckCircleIcon color="success" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={<span>
                      {notif.title}
                      {!notif.is_read && (
                        <span style={{
                          marginLeft: 8,
                          fontSize: 10,
                          backgroundColor: '#ff4444',
                          color: 'white',
                          borderRadius: '50%',
                          width: 16,
                          height: 16,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold'
                        }}>
                          N
                        </span>
                      )}
                      <span style={{
                        marginLeft: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        color:
                          notif.type === 'public' ? '#1976d2' :
                          notif.type === 'private' ? '#ff9800' :
                          '#43a047',
                        border: '1px solid',
                        borderColor:
                          notif.type === 'public' ? '#1976d2' :
                          notif.type === 'private' ? '#ff9800' :
                          '#43a047',
                        borderRadius: 8,
                        padding: '2px 8px',
                        background:
                          notif.type === 'public' ? '#e3f2fd' :
                          notif.type === 'private' ? '#fff3e0' :
                          '#e8f5e9',
                      }}>
                        {notif.type === 'public' && 'Public'}
                        {notif.type === 'private' && 'Privé'}
                        {notif.type === 'class' && 'Classe'}
                      </span>
                    </span>}
                    secondary={notif.message}
                    primaryTypographyProps={{ fontSize: 15 }}
                    secondaryTypographyProps={{ fontSize: 13, color: 'text.secondary' }}
                  />
                </MenuItem>
              ))}
              <MenuItem disabled sx={{ borderTop: '1px solid #e0e0e0', mt: 1 }}>
                <ListItemText 
                  primary="Affiche les 10 notifications les plus récentes" 
                  primaryTypographyProps={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}
                />
              </MenuItem>
            </>
          )}
        </Menu>
      </Box>
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
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
      {(annualAverage && annualAverage.moyenne_annuelle !== null && allTrimestersPublished) ? (
        <Paper
          elevation={4}
          sx={{
            p: { xs: 2, md: 4 },
            borderRadius: '32px',
            background: 'linear-gradient(135deg, #e3f2fd 0%, #b2ebf2 100%)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
            textAlign: 'center',
            mt: 1,
            mb: 4,
            maxWidth: 600,
            mx: 'auto',
            transition: 'box-shadow 0.3s',
            '&:hover': {
              boxShadow: '0 16px 40px 0 rgba(31, 38, 135, 0.25)',
            },
          }}
        >
          <BarChartIcon sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
          <Typography variant="h5" fontWeight={700} color="primary.main" mb={1}>
            Moyenne annuelle
          </Typography>
          <Typography variant="h2" fontWeight={900} color="#1976d2" mb={1}>
            {annualAverage!.moyenne_annuelle.toFixed(2)}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" mb={1}>
            Rang dans la classe : <b>{annualAverage!.rank} / {annualAverage!.total}</b>
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={1}>
            {annualAverage!.moyenne_annuelle >= 10 ? (
              <Chip label="Admis en classe supérieure" color="success" icon={<StarIcon />} sx={{ fontWeight: 700, fontSize: 16 }} />
            ) : (
              <Chip label="Non admis" color="error" icon={<StarIcon />} sx={{ fontWeight: 700, fontSize: 16 }} />
            )}
          </Box>
        </Paper>
      ) : (
        <Paper elevation={2} sx={{ p: 3, borderRadius: '16px', background: '#fff', textAlign: 'center', boxShadow: '0 2px 8px #1976d2', mb: 4, maxWidth: 600, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <InfoIcon sx={{ color: '#1976d2', fontSize: 36 }} />
          <Typography variant="h6" color="#1976d2" sx={{ textAlign: 'left' }}>
            La moyenne annuelle de votre enfant sera affichée ici<br />
            <b>dès que les bulletins des trois trimestres auront été publiés par l'administration.</b><br />
            <span style={{ fontWeight: 400, fontSize: 15 }}>Merci de votre compréhension.</span>
          </Typography>
        </Paper>
      )}
      <Paper sx={{ mb: 4, p: 3, borderRadius: 4, boxShadow: 4 }}>
        <Grid container spacing={4} justifyContent="center" alignItems="center">
          {tabOptions.map((opt, idx) => (
            <Grid item key={opt.label} xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant={tab === idx ? 'contained' : 'outlined'}
                onClick={() => setTab(idx)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 120,
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 20,
                  color: tab === idx ? 'white' : opt.color,
                  background: tab === idx ? opt.color : 'white',
                  borderColor: opt.color,
                  boxShadow: tab === idx ? 6 : 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: opt.color,
                    color: 'white',
                    boxShadow: 8,
                  },
                  mb: 1,
                }}
                startIcon={opt.icon}
              >
                {opt.label}
              </Button>
            </Grid>
          ))}
        </Grid>
        {/* Bouton Paiement */}
        <Box display="flex" justifyContent="center" mt={4}>
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<PaymentIcon sx={{ fontSize: 32 }} />}
            sx={{
              px: 6,
              py: 2,
              fontWeight: 700,
              fontSize: 22,
              borderRadius: 3,
              boxShadow: 3,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
            onClick={handlePayment}
          >
            Paiement
          </Button>
        </Box>
      </Paper>
      <PaiementDialog open={openPaiement} onClose={handleClosePaiement} childId={childId} schoolYear={schoolYear} />
      {tab === 0 && <NotesTab childId={childId} schoolYear={schoolYear} />}
      {tab === 1 && <ReportCardTab childId={childId} schoolYear={schoolYear} />}
      {tab === 2 && <AbsencesTab childId={childId} schoolYear={schoolYear} />}
      {tab === 3 && <ScheduleTab childId={childId} schoolYear={schoolYear} />}
    </Box>
  );
};

export default ParentChildProfile; 