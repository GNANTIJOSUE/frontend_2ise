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
  Chip,
  CircularProgress,
  Alert,
  Container,
  Stack,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput
} from '@mui/material';
import { Visibility as VisibilityIcon, Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import axios from 'axios';
import SecretarySidebar from '../../components/SecretarySidebar';
import { usePermissions } from '../../hooks/usePermissions';

// Interfaces
interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  contact?: string;
  role: string;
  civilité: string;
  created_at: string;
}

interface Payment {
  id: number;
  amount: number;
  payment_date: string;
  user_id?: number;
  created_by?: number;
  student_id: number;
  payment_method: string;
  status: string;
  user_first_name?: string;
  user_last_name?: string;
  // Propriétés pour les paiements par chèque/virement
  check_number?: string;
  bank_name?: string;
  issue_date?: string;
}

interface Enrollment {
  id: number;
  student_id: number;
  enrollment_date: string;
  user_id?: number;
  created_by?: number;
  status: string;
  user_first_name?: string;
  user_last_name?: string;
}

interface DailyStats {
  date: string;
  totalPayments: number;
  paymentCount: number;
  totalEnrollments: number;
  enrollmentCount: number;
  paymentsByUser: {
    [key: string]: {
      userName: string;
      total: number;
      count: number;
    };
  };
}

interface UserStats {
  userId: number;
  userName: string;
  totalPayments: number;
  paymentCount: number;
  totalEnrollments: number;
  enrollmentCount: number;
}

const History = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<{
    payments: Payment[];
    enrollments: Enrollment[];
  }>({ payments: [], enrollments: [] });
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Nouveaux états pour la recherche par date
  const [searchDate, setSearchDate] = useState<string>('');
  const [filteredDailyStats, setFilteredDailyStats] = useState<DailyStats[]>([]);
  const [filteredUserStats, setFilteredUserStats] = useState<UserStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  const { hasPermission, getRoleLabel } = usePermissions();

  const relevantRoles = [
    'secretary',
    'admin', 
    'directeur_general',
    'directeur_etudes',
    'comptable'
  ];

  // Fonction pour filtrer les données par date
  const filterDataByDate = (date: string) => {
    if (!date) {
      setFilteredDailyStats(dailyStats);
      setFilteredUserStats(userStats);
      setFilteredUsers(users);
      return;
    }

    const searchDateStr = normalizeDate(date);
    
    console.log('Recherche pour la date:', date);
    console.log('Date normalisée pour recherche:', searchDateStr);
    console.log('Statistiques disponibles:', dailyStats.map(s => ({ date: s.date, normalized: normalizeDate(s.date) })));

    if (!searchDateStr) {
      console.error('Date de recherche invalide:', date);
      return;
    }

    // Filtrer les statistiques quotidiennes
    const filteredStats = dailyStats.filter(stat => {
      const statDateStr = normalizeDate(stat.date);
      const matches = statDateStr === searchDateStr;
      console.log(`Comparaison: "${statDateStr}" === "${searchDateStr}" = ${matches}`);
      return matches;
    });
    console.log('Statistiques filtrées:', filteredStats);
    setFilteredDailyStats(filteredStats);

    // Filtrer les utilisateurs qui ont eu des activités à cette date
    const usersWithActivity = users.filter(user => {
      const userHasPayments = dailyStats.some(stat => {
        const statDateStr = normalizeDate(stat.date);
        const hasActivity = statDateStr === searchDateStr && Object.keys(stat.paymentsByUser).includes(user.id.toString());
        console.log(`Utilisateur ${user.id} (${user.first_name} ${user.last_name}) a des activités le ${statDateStr}: ${hasActivity}`);
        return hasActivity;
      });
      return userHasPayments;
    });
    console.log('Utilisateurs avec activité:', usersWithActivity);
    setFilteredUsers(usersWithActivity);

    // Filtrer les statistiques par utilisateur pour cette date
    const filteredUserStatsData = userStats.filter(stat => {
      const userHasActivity = dailyStats.some(dailyStat => {
        const statDateStr = normalizeDate(dailyStat.date);
        return statDateStr === searchDateStr && Object.keys(dailyStat.paymentsByUser).includes(stat.userId.toString());
      });
      return userHasActivity;
    });
    setFilteredUserStats(filteredUserStatsData);
  };

  // Gérer le changement de date de recherche
  const handleDateSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value;
    setSearchDate(newDate);
    filterDataByDate(newDate);
  };

  // Effacer la recherche
  const clearSearch = () => {
    setSearchDate('');
    setFilteredDailyStats(dailyStats);
    setFilteredUserStats(userStats);
    setFilteredUsers(users);
  };

  // Charger les utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Token non trouvé');
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get('https://2ise-groupe.com/api/auth/users', { headers });
        
        const filteredUsers = response.data.filter((user: User) => 
          relevantRoles.includes(user.role)
        );
        
        setUsers(filteredUsers);
        setFilteredUsers(filteredUsers);
      } catch (err: any) {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Modifier l'useEffect qui charge les statistiques pour initialiser les données filtrées
  useEffect(() => {
    if (users.length > 0) {
      loadAllStats();
    }
  }, [users]);

  // Ajouter un useEffect pour mettre à jour les données filtrées quand les données changent
  useEffect(() => {
    setFilteredDailyStats(dailyStats);
    setFilteredUserStats(userStats);
    setFilteredUsers(users);
  }, [dailyStats, userStats, users]);

  // Fonctions utilitaires
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0';
    }
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      secretary: '#2e7d32',
      admin: '#1976d2',
      directeur_general: '#f57c00',
      directeur_etudes: '#7b1fa2',
      comptable: '#d32f2f'
    };
    return colors[role] || '#757575';
  };

  // Fonction utilitaire pour normaliser les dates
  const normalizeDate = (dateString: string): string => {
    try {
      // Si la date est au format DD/MM/YYYY (français)
      if (dateString && dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // Les mois commencent à 0 en JavaScript
          const year = parseInt(parts[2]);
          
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('fr-FR');
            }
          }
        }
      }
      
      // Essayer le format standard
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Date invalide:', dateString);
        return '';
      }
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      console.error('Erreur lors de la normalisation de la date:', dateString, error);
      return '';
    }
  };

  // Fonctions de calcul des statistiques
  const calculateDailyStats = (payments: Payment[], enrollments: Enrollment[]): DailyStats[] => {
    const statsByDate: { [key: string]: DailyStats } = {};

    console.log('Calcul des statistiques quotidiennes...');
    console.log('Paiements reçus:', payments.length);
    console.log('Inscriptions reçues:', enrollments.length);
    
    // Afficher quelques exemples de dates pour debug
    if (payments.length > 0) {
      console.log('Exemples de dates de paiements:', payments.slice(0, 3).map(p => p.payment_date));
    }
    if (enrollments.length > 0) {
      console.log('Exemples de dates d\'inscriptions:', enrollments.slice(0, 3).map(e => e.enrollment_date));
    }

    // Traiter les paiements
    payments.forEach(payment => {
      const originalDate = payment.payment_date;
      const date = normalizeDate(payment.payment_date);
      console.log(`Paiement ${payment.id}: date originale="${originalDate}", date normalisée="${date}"`);
      
      if (!date) {
        console.warn(`Paiement ${payment.id}: date invalide, ignoré`);
        return;
      }
      
      if (!statsByDate[date]) {
        statsByDate[date] = {
          date,
          totalPayments: 0,
          paymentCount: 0,
          totalEnrollments: 0,
          enrollmentCount: 0,
          paymentsByUser: {}
        };
      }
      
      const paymentAmount = Number(payment.amount) || 0;
      statsByDate[date].totalPayments += paymentAmount;
      statsByDate[date].paymentCount += 1;
      
            const userId = (payment.user_id || payment.created_by)?.toString();
      if (userId && !statsByDate[date].paymentsByUser[userId]) {
        const userName = payment.user_first_name && payment.user_last_name 
          ? `${payment.user_first_name} ${payment.user_last_name}`
          : `Utilisateur ${userId}`;
        statsByDate[date].paymentsByUser[userId] = {
          userName,
          total: 0,
          count: 0
        };
      }
      
      if (userId && statsByDate[date].paymentsByUser[userId]) {
      statsByDate[date].paymentsByUser[userId].total += paymentAmount;
      statsByDate[date].paymentsByUser[userId].count += 1;
      }
    });

    // Traiter les inscriptions
    enrollments.forEach(enrollment => {
      const originalDate = enrollment.enrollment_date;
      const date = normalizeDate(enrollment.enrollment_date);
      console.log(`Inscription ${enrollment.id}: date originale="${originalDate}", date normalisée="${date}"`);
      
      if (!date) {
        console.warn(`Inscription ${enrollment.id}: date invalide, ignorée`);
        return;
      }
      
      if (!statsByDate[date]) {
        statsByDate[date] = {
          date,
          totalPayments: 0,
          paymentCount: 0,
          totalEnrollments: 0,
          enrollmentCount: 0,
          paymentsByUser: {}
        };
      }
      
      statsByDate[date].totalEnrollments += 1;
      statsByDate[date].enrollmentCount += 1;
    });

    const result = Object.values(statsByDate).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    console.log('Statistiques quotidiennes calculées:', result);
    return result;
  };

  const calculateUserStats = (users: User[], payments: Payment[], enrollments: Enrollment[]): UserStats[] => {
    return users.map(user => {
      const userPayments = payments.filter(p => (p.user_id || p.created_by) === user.id);
      const userEnrollments = enrollments.filter(e => (e.user_id || e.created_by) === user.id);
      
      const totalPayments = userPayments.reduce((sum, p) => {
        const amount = Number(p.amount) || 0;
        return sum + amount;
      }, 0);
      
      return {
        userId: user.id,
        userName: `${user.civilité} ${user.first_name} ${user.last_name}`,
        totalPayments: totalPayments,
        paymentCount: userPayments.length,
        totalEnrollments: userEnrollments.length,
        enrollmentCount: userEnrollments.length
      };
    });
  };

  // Modifier la fonction loadAllStats pour inclure la mise à jour des données filtrées
  const loadAllStats = async () => {
    setStatsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token non trouvé');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [paymentsResponse, enrollmentsResponse] = await Promise.all([
        axios.get('https://2ise-groupe.com/api/payments/all', { headers }),
        axios.get('https://2ise-groupe.com/api/students/enrollments/all', { headers })
      ]);

      const allPayments = paymentsResponse.data || [];
      const allEnrollments = enrollmentsResponse.data || [];

      // Pour les statistiques globales, on utilise seulement les paiements de la table payments
      // qui incluent déjà les chèques et virements approuvés (transformés en paiements)
      const combinedPayments = allPayments;

      const dailyStatsData = calculateDailyStats(combinedPayments, allEnrollments);
      const userStatsData = calculateUserStats(users, combinedPayments, allEnrollments);

      setDailyStats(dailyStatsData);
      setUserStats(userStatsData);
      setFilteredDailyStats(dailyStatsData);
      setFilteredUserStats(userStatsData);
      setFilteredUsers(users);
    } catch (err: any) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setStatsLoading(false);
    }
  };

  // Fonction pour voir les détails d'un utilisateur
  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    setDetailsLoading(true);
    setDetailsError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setDetailsError('Token non trouvé');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      console.log('Chargement des détails pour utilisateur:', user.id);
      
      const [paymentsResponse, enrollmentsResponse, checkPaymentsResponse] = await Promise.all([
        axios.get(`https://2ise-groupe.com/api/payments/by-user/${user.id}`, { headers }),
        axios.get(`https://2ise-groupe.com/api/students/enrollments/by-user/${user.id}`, { headers }),
        axios.get(`https://2ise-groupe.com/api/payments/checks/by-user/${user.id}`, { headers })
      ]);

      console.log('Paiements reçus:', paymentsResponse.data);
      console.log('Inscriptions reçues:', enrollmentsResponse.data);
      console.log('Paiements par chèque/virement reçus:', checkPaymentsResponse.data);

      // Convertir les paiements par chèque/virement en format compatible
      const convertedCheckPayments = (checkPaymentsResponse.data || []).map((checkPayment: any) => ({
        id: checkPayment.id,
        amount: checkPayment.amount,
        payment_date: checkPayment.created_at,
        student_id: checkPayment.student_id,
        payment_method: checkPayment.payment_type,
        status: checkPayment.status === 'approved' ? 'completed' : checkPayment.status,
        check_number: checkPayment.check_number,
        bank_name: checkPayment.bank_name,
        issue_date: checkPayment.issue_date
      }));

      // Combiner tous les paiements
      const allPayments = [...(paymentsResponse.data || []), ...convertedCheckPayments];

      setUserDetails({
        payments: allPayments,
        enrollments: enrollmentsResponse.data || []
      });
      
      setDialogOpen(true);
    } catch (err: any) {
      console.error('Erreur lors du chargement des détails:', err);
      console.error('Réponse d\'erreur complète:', err.response);
      setDetailsError(err.response?.data?.message || 'Erreur lors du chargement des détails');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Vérification des permissions
  if (!hasPermission('canViewHistory')) {
    return (
      <Box sx={{ display: 'flex' }}>
        <SecretarySidebar />
        <Box component="main" sx={{ p: 3, flexGrow: 1 }}>
          <Alert severity="error">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </Alert>
        </Box>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <SecretarySidebar />
        <Box component="main" sx={{ p: 3, flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <SecretarySidebar />
      <Box component="main" sx={{ p: 3, flexGrow: 1, bgcolor: '#f7f9fc' }}>
        <Container maxWidth={false}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Historique des Utilisateurs
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Liste de tous les utilisateurs avec des rôles qui peuvent effectuer des paiements et des inscriptions d'élèves
              </Typography>
            </Box>

            {/* Ajouter la section de recherche par date */}
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SearchIcon />
                  Recherche par Date
                </Typography>
                <TextField
                  type="date"
                  label="Sélectionner une date"
                  value={searchDate}
                  onChange={handleDateSearchChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 200 }}
                />
                <Button
                  variant="outlined"
                  onClick={clearSearch}
                  startIcon={<ClearIcon />}
                  disabled={!searchDate}
                >
                  Effacer
                </Button>
                {searchDate && (
                  <Chip
                    label={`Résultats pour le ${new Date(searchDate).toLocaleDateString('fr-FR')}`}
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
            </Paper>

            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Total des Utilisateurs
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {searchDate ? filteredUsers.length : users.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="success.main" gutterBottom>
                      Secrétaires
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" color="success.main">
                      {(searchDate ? filteredUsers : users).filter(u => u.role === 'secretary').length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="warning.main" gutterBottom>
                      Comptables
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" color="warning.main">
                      {(searchDate ? filteredUsers : users).filter(u => u.role === 'comptable').length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="info.main" gutterBottom>
                      Total Paiements
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" color="info.main">
                      {(searchDate ? filteredDailyStats : dailyStats).reduce((sum, stat) => sum + stat.paymentCount, 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                <Tab label={`Utilisateurs ${searchDate ? `(${filteredUsers.length})` : ''}`} />
                <Tab label={`Statistiques par Jour ${searchDate ? `(${filteredDailyStats.length})` : ''}`} />
                <Tab label={`Statistiques par Utilisateur ${searchDate ? `(${filteredUserStats.length})` : ''}`} />
              </Tabs>
              {((activeTab as number) === 1 || (activeTab as number) === 2) && (
                <Button
                  variant="outlined"
                  onClick={loadAllStats}
                  disabled={statsLoading}
                  startIcon={statsLoading ? <CircularProgress size={16} /> : null}
                >
                  Actualiser les statistiques
                </Button>
              )}
            </Box>

            {activeTab === 0 && (
              <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Nom Complet</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Rôle</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Date de Création</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(searchDate ? filteredUsers : users).map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell>
                            <IconButton
                              onClick={() => handleViewDetails(user)}
                              color="primary"
                              size="small"
                              title="Voir les détails"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight="medium">
                              {user.civilité} {user.first_name} {user.last_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {user.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {user.contact || 'Non renseigné'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getRoleLabel(user.role)}
                              sx={{
                                bgcolor: getRoleColor(user.role),
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(user.created_at)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {activeTab === 1 && (
              <>
                {/* Cartes de résumé pour les statistiques quotidiennes */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={2}>
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)' }
                    }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                          Total Paiements
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                          {formatAmount((searchDate ? filteredDailyStats : dailyStats).reduce((sum, stat) => sum + (Number(stat.totalPayments) || 0), 0))} FCFA
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)',
                      color: 'white',
                      boxShadow: '0 8px 32px rgba(46, 125, 50, 0.3)',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(46, 125, 50, 0.4)' }
                    }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                          Nombre Paiements
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                          {(searchDate ? filteredDailyStats : dailyStats).reduce((sum, stat) => sum + stat.paymentCount, 0)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                      color: 'white',
                      boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(25, 118, 210, 0.4)' }
                    }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                          Total Inscriptions
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                          {(searchDate ? filteredDailyStats : dailyStats).reduce((sum, stat) => sum + stat.enrollmentCount, 0)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)',
                      color: 'white',
                      boxShadow: '0 8px 32px rgba(245, 124, 0, 0.3)',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(245, 124, 0, 0.4)' }
                    }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                          Jours Actifs
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                          {(searchDate ? filteredDailyStats : dailyStats).length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, #7b1fa2 0%, #ab47bc 100%)',
                      color: 'white',
                      boxShadow: '0 8px 32px rgba(123, 31, 162, 0.3)',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(123, 31, 162, 0.4)' }
                    }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                          Utilisateurs Actifs
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                          {new Set((searchDate ? filteredDailyStats : dailyStats).flatMap(stat => Object.keys(stat.paymentsByUser))).size}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Paper sx={{ 
                  borderRadius: 3, 
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '& th': { 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          borderBottom: '2px solid rgba(255,255,255,0.2)'
                        }
                      }}>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Total Paiements</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Nombre Paiements</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Paiements par Utilisateur</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Total Inscriptions</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Nombre Inscriptions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(searchDate ? filteredDailyStats : dailyStats).map((stat, index) => (
                        <TableRow 
                          key={stat.date} 
                          hover
                          sx={{ 
                            backgroundColor: index % 2 === 0 ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
                            '&:hover': { 
                              backgroundColor: 'rgba(102, 126, 234, 0.1)',
                              transform: 'scale(1.01)',
                              transition: 'all 0.2s ease'
                            }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body1" fontWeight="bold" sx={{ color: '#333' }}>
                              {stat.date}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" color="success.main" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                              {formatAmount(Number(stat.totalPayments) || 0)} FCFA
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={stat.paymentCount}
                              color="success"
                              size="small"
                              sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box>
                              {Object.values(stat.paymentsByUser).map((userPayment, index) => (
                                <Box key={index} sx={{ 
                                  mb: 1, 
                                  p: 1, 
                                  borderRadius: 1, 
                                  bgcolor: 'rgba(46, 125, 50, 0.1)',
                                  border: '1px solid rgba(46, 125, 50, 0.2)'
                                }}>
                                  <Typography variant="body2" fontWeight="bold" sx={{ color: '#2e7d32' }}>
                                    {userPayment.userName}
                                  </Typography>
                                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                                    {formatAmount(Number(userPayment.total) || 0)} FCFA ({userPayment.count} paiements)
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" color="info.main" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                              {stat.totalEnrollments}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={stat.enrollmentCount}
                              color="info"
                              size="small"
                              sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
              </>
            )}

            {activeTab === 2 && (
              <Paper sx={{ 
                borderRadius: 3, 
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ 
                        background: 'linear-gradient(135deg, #7b1fa2 0%, #ab47bc 100%)',
                        '& th': { 
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          borderBottom: '2px solid rgba(255,255,255,0.2)'
                        }
                      }}>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Utilisateur</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Total Paiements</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Nombre Paiements</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Total Inscriptions</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Nombre Inscriptions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(searchDate ? filteredUserStats : userStats).map((stat, index) => (
                        <TableRow 
                          key={stat.userId} 
                          hover
                          sx={{ 
                            backgroundColor: index % 2 === 0 ? 'rgba(123, 31, 162, 0.05)' : 'transparent',
                            '&:hover': { 
                              backgroundColor: 'rgba(123, 31, 162, 0.1)',
                              transform: 'scale(1.01)',
                              transition: 'all 0.2s ease'
                            }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body1" fontWeight="bold" sx={{ color: '#333' }}>
                              {stat.userName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" color="success.main" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                              {formatAmount(Number(stat.totalPayments) || 0)} FCFA
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={stat.paymentCount}
                              color="success"
                              size="small"
                              sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" color="info.main" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                              {stat.totalEnrollments}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={stat.enrollmentCount}
                              color="info"
                              size="small"
                              sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {statsLoading && (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            )}

            {(activeTab as number) === 1 && (searchDate ? filteredDailyStats : dailyStats).length === 0 && !statsLoading && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {searchDate 
                    ? `Aucune activité trouvée pour le ${new Date(searchDate).toLocaleDateString('fr-FR')}`
                    : 'Aucune statistique quotidienne disponible. Vérifiez la console pour plus de détails.'
                  }
                </Alert>
                <Button 
                  variant="outlined" 
                  onClick={loadAllStats}
                  disabled={statsLoading}
                >
                  Recharger les statistiques
                </Button>
              </Box>
            )}

            {(activeTab as number) === 2 && (searchDate ? filteredUserStats : userStats).length === 0 && !statsLoading && (
              <Alert severity="info">
                {searchDate 
                  ? `Aucune activité utilisateur trouvée pour le ${new Date(searchDate).toLocaleDateString('fr-FR')}`
                  : 'Aucune statistique par utilisateur disponible. Vérifiez la console pour plus de détails.'
                }
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Erreur: {error}
              </Alert>
            )}

            {(searchDate ? filteredUsers : users).length === 0 && (
              <Alert severity="info">
                {searchDate 
                  ? `Aucun utilisateur actif trouvé pour le ${new Date(searchDate).toLocaleDateString('fr-FR')}`
                  : 'Aucun utilisateur trouvé avec les rôles pertinents.'
                }
              </Alert>
            )}
          </Stack>
        </Container>
      </Box>

      {/* Dialog pour les détails utilisateur */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Détails de {selectedUser?.civilité} {selectedUser?.first_name} {selectedUser?.last_name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {detailsLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : detailsError ? (
            <Alert severity="error">{detailsError}</Alert>
          ) : (
            <Box>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                <Tab label={`Paiements (${userDetails.payments.length})`} />
                <Tab label={`Inscriptions (${userDetails.enrollments.length})`} />
              </Tabs>
              
              {userDetails.payments.length === 0 && userDetails.enrollments.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Aucune activité trouvée pour cet utilisateur.
                </Alert>
              )}
              
              {activeTab === 0 && (
                <>
                  {userDetails.payments.length === 0 ? (
                    <Alert severity="info">
                      Aucun paiement trouvé pour cet utilisateur.
                    </Alert>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Montant</TableCell>
                            <TableCell>Méthode</TableCell>
                            <TableCell>Détails</TableCell>
                            <TableCell>Statut</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {userDetails.payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>{formatDate(payment.payment_date)}</TableCell>
                              <TableCell>{formatAmount(payment.amount)} FCFA</TableCell>
                              <TableCell>
                                <Chip 
                                  label={payment.payment_method === 'check' ? 'Chèque' : 
                                         payment.payment_method === 'transfer' ? 'Virement' : 
                                         payment.payment_method === 'cash' ? 'Espèces' : 
                                         payment.payment_method}
                                  color={payment.payment_method === 'check' ? 'warning' : 
                                         payment.payment_method === 'transfer' ? 'info' : 
                                         payment.payment_method === 'cash' ? 'success' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {payment.payment_method === 'check' && (payment as any).check_number && (
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                      N°: {(payment as any).check_number}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {(payment as any).bank_name} - {(payment as any).issue_date && formatDate((payment as any).issue_date)}
                                    </Typography>
                                  </Box>
                                )}
                                {payment.payment_method === 'transfer' && (payment as any).check_number && (
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                      N°: {(payment as any).check_number}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {(payment as any).bank_name}
                                    </Typography>
                                  </Box>
                                )}
                                {payment.payment_method === 'cash' && (
                                  <Typography variant="body2" color="text.secondary">
                                    Paiement en espèces
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={payment.status === 'completed' ? 'Complété' : 
                                         payment.status === 'pending' ? 'En attente' : 
                                         payment.status === 'approved' ? 'Approuvé' : 
                                         payment.status}
                                  color={payment.status === 'completed' || payment.status === 'approved' ? 'success' : 
                                         payment.status === 'pending' ? 'warning' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </>
              )}
              
              {activeTab === 1 && (
                <>
                  {userDetails.enrollments.length === 0 ? (
                    <Alert severity="info">
                      Aucune inscription trouvée pour cet utilisateur.
                    </Alert>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Élève ID</TableCell>
                            <TableCell>Statut</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {userDetails.enrollments.map((enrollment) => (
                            <TableRow key={enrollment.id}>
                              <TableCell>{formatDate(enrollment.enrollment_date)}</TableCell>
                              <TableCell>{enrollment.student_id}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={enrollment.status} 
                                  color={enrollment.status === 'active' ? 'success' : 'warning'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default History;