import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  MonetizationOn as MoneyIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SecretarySidebar from '../../components/SecretarySidebar';
import axios from 'axios';

interface Level {
  id: number;
  name: string;
  display_name: string;
  order_index: number;
  amount: number | null;
  amount_non_assigned: number | null;
  registration_fee_assigned: number | null;
  registration_fee_non_assigned: number | null;
  classes_count: number;
  students_count: number;
}

interface LevelInstallment {
  id: number;
  level_id: number;
  payment_type: 'assigned' | 'non_assigned';
  installment_number: number;
  amount: number;
  due_date: string;
  percentage: number;
}

const Levels = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [installmentsDialogOpen, setInstallmentsDialogOpen] = useState(false);
  const [levelInstallments, setLevelInstallments] = useState<LevelInstallment[]>([]);
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  const [addInstallmentDialogOpen, setAddInstallmentDialogOpen] = useState(false);
  const [newInstallment, setNewInstallment] = useState({
    payment_type: 'assigned' as 'assigned' | 'non_assigned',
    installment_number: 1,
    amount: 0,
    due_date: '',
    percentage: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
        return;
      }

      console.log('🔍 Tentative de récupération des niveaux...');
      const response = await axios.get('https://2ise-groupe.com/api/levels', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Niveaux récupérés:', response.data.length, 'niveaux');
      setLevels(response.data);
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des niveaux:', err);
      
      if (err.response?.status === 404) {
        setError('L\'API des niveaux n\'est pas disponible. Veuillez vérifier que le serveur backend est démarré.');
      } else if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else if (err.response?.status === 403) {
        setError('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
      } else {
        setError(err.response?.data?.message || 'Erreur lors du chargement des niveaux. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditLevel = (level: Level) => {
    setEditingLevel(level);
    setEditDialogOpen(true);
  };

  const handleSaveLevel = async () => {
    if (!editingLevel) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `https://2ise-groupe.com/api/levels/${editingLevel.id}`,
        {
          name: editingLevel.name,
          display_name: editingLevel.display_name,
          order_index: editingLevel.order_index,
          amount: editingLevel.amount,
          amount_non_assigned: editingLevel.amount_non_assigned,
          registration_fee_assigned: editingLevel.registration_fee_assigned,
          registration_fee_non_assigned: editingLevel.registration_fee_non_assigned
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEditDialogOpen(false);
      setEditingLevel(null);
      fetchLevels(); // Rafraîchir les données
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleViewInstallments = async (level: Level) => {
    setSelectedLevel(level);
    setLoadingInstallments(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `https://2ise-groupe.com/api/levels/${level.id}/installments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setLevelInstallments(response.data.installments || []);
      setInstallmentsDialogOpen(true);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des versements:', err);
      alert(err.response?.data?.message || 'Erreur lors de la récupération des versements');
    } finally {
      setLoadingInstallments(false);
    }
  };

  const handleAddInstallment = async () => {
    if (!selectedLevel) return;

    // Validation des données
    if (!newInstallment.amount || newInstallment.amount <= 0) {
      alert('Le montant doit être supérieur à 0');
      return;
    }

    if (!newInstallment.due_date) {
      alert('La date d\'échéance est obligatoire');
      return;
    }

    // Vérifier si le pourcentage total ne dépasse pas 100%
    const existingInstallments = levelInstallments.filter(
      i => i.payment_type === newInstallment.payment_type
    );
    const totalPercentage = Number((existingInstallments.reduce((sum, i) => sum + (Number(i.percentage) || 0), 0) + (Number(newInstallment.percentage) || 0)) || 0);
    
    // Tolérance pour les erreurs d'arrondi (0.01%)
    if (totalPercentage > 100.01) {
      alert(`Le pourcentage total ne peut pas dépasser 100%. Actuellement: ${totalPercentage.toFixed(2)}%`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `https://2ise-groupe.com/api/levels/${selectedLevel.id}/installments`,
        {
          payment_type: newInstallment.payment_type,
          installment_number: newInstallment.installment_number,
          amount: newInstallment.amount,
          due_date: newInstallment.due_date,
          percentage: newInstallment.percentage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAddInstallmentDialogOpen(false);
      setNewInstallment({
        payment_type: 'assigned',
        installment_number: 1,
        amount: 0,
        due_date: '',
        percentage: 0
      });
      
      alert('Versement ajouté avec succès');
      handleViewInstallments(selectedLevel); // Rafraîchir les versements
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'ajout du versement');
    }
  };

  const handleDeleteInstallment = async (installmentId: number) => {
    if (!selectedLevel) return;

    if (!window.confirm('Voulez-vous vraiment supprimer ce versement ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `https://2ise-groupe.com/api/levels/${selectedLevel.id}/installments/${installmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Versement supprimé avec succès');
      handleViewInstallments(selectedLevel); // Rafraîchir les versements
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression du versement');
    }
  };

  const handleRecalculatePercentages = async (level: Level, paymentType: 'assigned' | 'non_assigned') => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `https://2ise-groupe.com/api/levels/${level.id}/${paymentType}/recalculate-percentages`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Pourcentages recalculés avec succès');
      if (selectedLevel && selectedLevel.id === level.id) {
        handleViewInstallments(level); // Rafraîchir les versements
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors du recalcul des pourcentages');
    }
  };

  const getAssignedInstallments = () => {
    return levelInstallments.filter(i => i.payment_type === 'assigned');
  };

  const getNonAssignedInstallments = () => {
    return levelInstallments.filter(i => i.payment_type === 'non_assigned');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SecretarySidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%' }}>
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e3f0ff 0%, #f8fbff 100%)', p: { xs: 1, md: 4 } }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <IconButton 
              onClick={() => navigate(-1)} 
              sx={{ 
                mr: 2, 
                bgcolor: 'primary.light', 
                color: 'primary.main', 
                '&:hover': { bgcolor: 'primary.main', color: 'white' } 
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight={700} sx={{ color: 'primary.main', letterSpacing: 1 }}>
              Gestion des Niveaux
            </Typography>
          </Box>

          {loading ? (
            <Typography align="center" color="text.secondary">Chargement...</Typography>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={fetchLevels}
                  disabled={loading}
                >
                  Réessayer
                </Button>
              </Box>
            </Alert>
          ) : levels.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              Aucun niveau trouvé.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {levels.map((level) => (
                <Grid item xs={12} md={6} lg={4} key={level.id}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    }
                  }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <SchoolIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                        <Box>
                          <Typography variant="h5" fontWeight={600} color="primary.main">
                            {level.display_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Code: {level.name}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Classes: <strong>{level.classes_count}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Étudiants: <strong>{level.students_count}</strong>
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Scolarité affecté: <strong>{(level.amount || 0).toLocaleString('fr-FR')} F CFA</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Scolarité non affecté: <strong>{(level.amount_non_assigned || 0).toLocaleString('fr-FR')} F CFA</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Inscription affecté: <strong>{(level.registration_fee_assigned || 0).toLocaleString('fr-FR')} F CFA</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Inscription non affecté: <strong>{(level.registration_fee_non_assigned || 0).toLocaleString('fr-FR')} F CFA</strong>
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={`Ordre: ${level.order_index}`} 
                          size="small" 
                          color="info" 
                          variant="outlined"
                        />
                        {level.amount && (
                          <Chip 
                            label="Scolarité affecté" 
                            size="small" 
                            color="success" 
                          />
                        )}
                        {level.amount_non_assigned && (
                          <Chip 
                            label="Scolarité non affecté" 
                            size="small" 
                            color="warning" 
                          />
                        )}
                        {level.registration_fee_assigned && (
                          <Chip 
                            label="Inscription affecté" 
                            size="small" 
                            color="info" 
                          />
                        )}
                        {level.registration_fee_non_assigned && (
                          <Chip 
                            label="Inscription non affecté" 
                            size="small" 
                            color="secondary" 
                          />
                        )}
                      </Box>
                    </CardContent>

                    <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                      <Box>
                        <Tooltip title="Modifier le niveau">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditLevel(level)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Voir les versements">
                          <IconButton 
                            size="small" 
                            color="secondary"
                            onClick={() => handleViewInstallments(level)}
                          >
                            <SettingsIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        onClick={() => navigate('/secretary/classes')}
                      >
                        Voir classes
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Dialog de modification de niveau */}
          <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              Modifier le niveau
              {editingLevel && (
                <Typography variant="body2" color="text.secondary">
                  {editingLevel.display_name}
                </Typography>
              )}
            </DialogTitle>
            <DialogContent>
              {editingLevel && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    label="Code du niveau"
                    fullWidth
                    value={editingLevel.name}
                    onChange={(e) => setEditingLevel({
                      ...editingLevel,
                      name: e.target.value
                    })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Nom d'affichage"
                    fullWidth
                    value={editingLevel.display_name}
                    onChange={(e) => setEditingLevel({
                      ...editingLevel,
                      display_name: e.target.value
                    })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Ordre d'affichage"
                    type="number"
                    fullWidth
                    value={editingLevel.order_index}
                    onChange={(e) => setEditingLevel({
                      ...editingLevel,
                      order_index: parseInt(e.target.value) || 0
                    })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Scolarité affecté (F CFA)"
                    type="number"
                    fullWidth
                    value={editingLevel.amount || ''}
                    onChange={(e) => setEditingLevel({
                      ...editingLevel,
                      amount: e.target.value ? parseInt(e.target.value) : null
                    })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Scolarité non affecté (F CFA)"
                    type="number"
                    fullWidth
                    value={editingLevel.amount_non_assigned || ''}
                    onChange={(e) => setEditingLevel({
                      ...editingLevel,
                      amount_non_assigned: e.target.value ? parseInt(e.target.value) : null
                    })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Frais d'inscription affecté (F CFA)"
                    type="number"
                    fullWidth
                    value={editingLevel.registration_fee_assigned || ''}
                    onChange={(e) => setEditingLevel({
                      ...editingLevel,
                      registration_fee_assigned: e.target.value ? parseInt(e.target.value) : null
                    })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Frais d'inscription non affecté (F CFA)"
                    type="number"
                    fullWidth
                    value={editingLevel.registration_fee_non_assigned || ''}
                    onChange={(e) => setEditingLevel({
                      ...editingLevel,
                      registration_fee_non_assigned: e.target.value ? parseInt(e.target.value) : null
                    })}
                  />
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSaveLevel} variant="contained">Enregistrer</Button>
            </DialogActions>
          </Dialog>

          {/* Dialog des versements */}
          <Dialog 
            open={installmentsDialogOpen} 
            onClose={() => setInstallmentsDialogOpen(false)} 
            maxWidth="lg" 
            fullWidth
          >
            <DialogTitle>
              Versements du niveau {selectedLevel?.display_name}
            </DialogTitle>
            <DialogContent>
              {loadingInstallments ? (
                <Typography align="center" color="text.secondary">Chargement des versements...</Typography>
              ) : (
                <Box>
                  {/* Versements pour étudiants affectés */}
                  <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                    Versements pour étudiants affectés
                  </Typography>
                  
                  {/* Information sur le calcul des versements */}
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Calcul des versements :</strong> Les versements sont calculés sur le montant restant après déduction des frais d'inscription.
                      <br />
                      • Montant total : {(selectedLevel?.amount || 0).toLocaleString('fr-FR')} F CFA
                      <br />
                      • Frais d'inscription : {(selectedLevel?.registration_fee_assigned || 0).toLocaleString('fr-FR')} F CFA
                      <br />
                      • Montant pour versements : {((selectedLevel?.amount || 0) - (selectedLevel?.registration_fee_assigned || 0)).toLocaleString('fr-FR')} F CFA
                    </Typography>
                  </Alert>
                  {getAssignedInstallments().length > 0 ? (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {getAssignedInstallments().length} versement(s)
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => {
                              setNewInstallment({
                                ...newInstallment,
                                payment_type: 'assigned'
                              });
                              setAddInstallmentDialogOpen(true);
                            }}
                          >
                            Ajouter
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            onClick={() => selectedLevel && handleRecalculatePercentages(selectedLevel, 'assigned')}
                          >
                            Recalculer %
                          </Button>
                        </Box>
                      </Box>
                      <TableContainer component={Paper} sx={{ mb: 3 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Échéance</TableCell>
                              <TableCell>Date</TableCell>
                              <TableCell>Montant</TableCell>
                              <TableCell>%</TableCell>
                              <TableCell>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {getAssignedInstallments().map((installment) => (
                              <TableRow key={installment.id}>
                                <TableCell>{installment.installment_number}</TableCell>
                                <TableCell>
                                  {new Date(installment.due_date).toLocaleDateString('fr-FR')}
                                </TableCell>
                                <TableCell>
                                  <strong>{installment.amount.toLocaleString('fr-FR')} F CFA</strong>
                                </TableCell>
                                <TableCell>
                                  <Chip label={`${installment.percentage}%`} size="small" color="primary" />
                                </TableCell>
                                <TableCell>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteInstallment(installment.id)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  ) : (
                    <Alert severity="info" sx={{ mb: 3 }}>
                      Aucun versement configuré pour les étudiants affectés
                      {selectedLevel && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setNewInstallment({
                              ...newInstallment,
                              payment_type: 'assigned'
                            });
                            setAddInstallmentDialogOpen(true);
                          }}
                          sx={{ ml: 2 }}
                        >
                          Ajouter un versement
                        </Button>
                      )}
                    </Alert>
                  )}

                  {/* Versements pour étudiants non affectés */}
                  <Typography variant="h6" sx={{ mb: 2, color: 'warning.main' }}>
                    Versements pour étudiants non affectés
                  </Typography>
                  
                  {/* Information sur le calcul des versements */}
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Calcul des versements :</strong> Les versements sont calculés sur le montant restant après déduction des frais d'inscription.
                      <br />
                      • Montant total : {(selectedLevel?.amount_non_assigned || 0).toLocaleString('fr-FR')} F CFA
                      <br />
                      • Frais d'inscription : {(selectedLevel?.registration_fee_non_assigned || 0).toLocaleString('fr-FR')} F CFA
                      <br />
                      • Montant pour versements : {((selectedLevel?.amount_non_assigned || 0) - (selectedLevel?.registration_fee_non_assigned || 0)).toLocaleString('fr-FR')} F CFA
                      <br />
                      <strong>Surplus automatique :</strong> Si le montant versé lors de l'inscription, finalisation ou réinscription est supérieur aux frais d'inscription, le surplus est automatiquement reversé sur les versements dans l'ordre chronologique.
                    </Typography>
                  </Alert>
                  {getNonAssignedInstallments().length > 0 ? (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {getNonAssignedInstallments().length} versement(s)
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => {
                              setNewInstallment({
                                ...newInstallment,
                                payment_type: 'non_assigned'
                              });
                              setAddInstallmentDialogOpen(true);
                            }}
                          >
                            Ajouter
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            onClick={() => selectedLevel && handleRecalculatePercentages(selectedLevel, 'non_assigned')}
                          >
                            Recalculer %
                          </Button>
                        </Box>
                      </Box>
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Échéance</TableCell>
                              <TableCell>Date</TableCell>
                              <TableCell>Montant</TableCell>
                              <TableCell>%</TableCell>
                              <TableCell>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {getNonAssignedInstallments().map((installment) => (
                              <TableRow key={installment.id}>
                                <TableCell>{installment.installment_number}</TableCell>
                                <TableCell>
                                  {new Date(installment.due_date).toLocaleDateString('fr-FR')}
                                </TableCell>
                                <TableCell>
                                  <strong>{installment.amount.toLocaleString('fr-FR')} F CFA</strong>
                                </TableCell>
                                <TableCell>
                                  <Chip label={`${installment.percentage}%`} size="small" color="warning" />
                                </TableCell>
                                <TableCell>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteInstallment(installment.id)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  ) : (
                    <Alert severity="info">
                      Aucun versement configuré pour les étudiants non affectés
                      {selectedLevel && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setNewInstallment({
                              ...newInstallment,
                              payment_type: 'non_assigned'
                            });
                            setAddInstallmentDialogOpen(true);
                          }}
                          sx={{ ml: 2 }}
                        >
                          Ajouter un versement
                        </Button>
                      )}
                    </Alert>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setInstallmentsDialogOpen(false)}>Fermer</Button>
            </DialogActions>
          </Dialog>

          {/* Dialog d'ajout de versement */}
          <Dialog 
            open={addInstallmentDialogOpen} 
            onClose={() => setAddInstallmentDialogOpen(false)} 
            maxWidth="sm" 
            fullWidth
          >
            <DialogTitle>
              Ajouter un versement
              {selectedLevel && (
                <Typography variant="body2" color="text.secondary">
                  Niveau: {selectedLevel.display_name}
                </Typography>
              )}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Type de paiement</InputLabel>
                    <Select
                      value={newInstallment.payment_type}
                      label="Type de paiement"
                      onChange={(e) => {
                        const paymentType = e.target.value as 'assigned' | 'non_assigned';
                        const totalAmount = paymentType === 'assigned' 
                          ? (selectedLevel?.amount || 0) 
                          : (selectedLevel?.amount_non_assigned || 0);
                        const registrationFee = paymentType === 'assigned'
                          ? (selectedLevel?.registration_fee_assigned || 0)
                          : (selectedLevel?.registration_fee_non_assigned || 0);
                        const amountForInstallments = totalAmount - registrationFee;
                        const percentage = amountForInstallments > 0 ? ((newInstallment.amount / amountForInstallments) * 100) : 0;
                        
                        setNewInstallment({
                          ...newInstallment,
                          payment_type: paymentType,
                          percentage: Math.round(percentage * 100) / 100
                        });
                      }}
                    >
                      <MenuItem value="assigned">Étudiants affectés</MenuItem>
                      <MenuItem value="non_assigned">Étudiants non affectés</MenuItem>
                    </Select>
                  </FormControl>

                <TextField
                  label="Numéro d'échéance"
                  type="number"
                  fullWidth
                  value={newInstallment.installment_number}
                  onChange={(e) => setNewInstallment({
                    ...newInstallment,
                    installment_number: parseInt(e.target.value) || 1
                  })}
                  sx={{ mb: 2 }}
                />

                <TextField
                  label="Montant (F CFA)"
                  type="number"
                  fullWidth
                  value={newInstallment.amount || ''}
                  onChange={(e) => {
                    const amount = parseInt(e.target.value) || 0;
                    const totalAmount = newInstallment.payment_type === 'assigned' 
                      ? (selectedLevel?.amount || 0) 
                      : (selectedLevel?.amount_non_assigned || 0);
                    const registrationFee = newInstallment.payment_type === 'assigned'
                      ? (selectedLevel?.registration_fee_assigned || 0)
                      : (selectedLevel?.registration_fee_non_assigned || 0);
                    const amountForInstallments = totalAmount - registrationFee;
                    const percentage = amountForInstallments > 0 ? ((amount / amountForInstallments) * 100) : 0;
                    
                    setNewInstallment({
                      ...newInstallment,
                      amount: amount,
                      percentage: Math.round(percentage * 100) / 100 // Arrondir à 2 décimales
                    });
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  label="Date d'échéance"
                  type="date"
                  fullWidth
                  value={newInstallment.due_date}
                  onChange={(e) => setNewInstallment({
                    ...newInstallment,
                    due_date: e.target.value
                  })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  label="Pourcentage (%)"
                  type="number"
                  fullWidth
                  value={newInstallment.percentage}
                  onChange={(e) => setNewInstallment({
                    ...newInstallment,
                    percentage: parseFloat(e.target.value) || 0
                  })}
                  inputProps={{ step: 0.01, min: 0, max: 100 }}
                  error={
                    (() => {
                      const existingInstallments = levelInstallments.filter(
                        i => i.payment_type === newInstallment.payment_type
                      );
                      const totalPercentage = Number((existingInstallments.reduce((sum, i) => sum + (Number(i.percentage) || 0), 0) + (Number(newInstallment.percentage) || 0)) || 0);
                      // Tolérance pour les erreurs d'arrondi (0.01%)
                      return totalPercentage > 100.01;
                    })()
                  }
                  helperText={
                    (() => {
                      const existingInstallments = levelInstallments.filter(
                        i => i.payment_type === newInstallment.payment_type
                      );
                      const totalPercentage = Number((existingInstallments.reduce((sum, i) => sum + (Number(i.percentage) || 0), 0) + (Number(newInstallment.percentage) || 0)) || 0);
                      const baseAmount = newInstallment.payment_type === 'assigned' 
                        ? (selectedLevel?.amount || 0) 
                        : (selectedLevel?.amount_non_assigned || 0);
                      const registrationFee = newInstallment.payment_type === 'assigned'
                        ? (selectedLevel?.registration_fee_assigned || 0)
                        : (selectedLevel?.registration_fee_non_assigned || 0);
                      const amountForInstallments = baseAmount - registrationFee;
                      
                      let message = `${newInstallment.payment_type === 'assigned' ? 'Affecté' : 'Non affecté'}: ${baseAmount.toLocaleString('fr-FR')} F CFA (Scolarité) - ${registrationFee.toLocaleString('fr-FR')} F CFA (Inscription) = ${amountForInstallments.toLocaleString('fr-FR')} F CFA (Versements) | Total: ${totalPercentage.toFixed(2)}%`;
                      
                      if (totalPercentage > 100.01) {
                        message += ' ⚠️ Le pourcentage total dépasse 100%';
                      }
                      
                      return message;
                    })()
                  }
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAddInstallmentDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleAddInstallment} variant="contained">Ajouter</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </Box>
  );
};

export default Levels;
