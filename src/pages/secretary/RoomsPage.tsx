import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  Fab
} from '@mui/material';
import SecretarySidebar from '../../components/SecretarySidebar';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MeetingRoom as RoomIcon,
  People as PeopleIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { API_URLS } from '../../config/api';

interface Room {
  id: number;
  name: string;
  capacity: number | null;
  room_type: string;
  description: string | null;
  is_active: boolean;
}

interface RoomFormData {
  name: string;
  capacity: string;
  room_type: string;
  description: string;
}

const roomTypes = [
  { value: 'classroom', label: 'Salle de classe' },
  { value: 'laboratory', label: 'Laboratoire' },
  { value: 'library', label: 'Bibliothèque' },
  { value: 'computer_room', label: 'Salle informatique' },
  { value: 'meeting_room', label: 'Salle de réunion' },
  { value: 'auditorium', label: 'Amphithéâtre' },
  { value: 'gym', label: 'Gymnase' },
  { value: 'office', label: 'Bureau' },
  { value: 'other', label: 'Autre' }
];

const RoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomFormData>({
    name: '',
    capacity: '',
    room_type: 'classroom',
    description: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    room: Room | null;
  }>({ open: false, room: null });

  // Charger les salles
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(API_URLS.ROOMS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      } else {
        throw new Error('Erreur lors du chargement des salles');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors du chargement des salles',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Ouvrir le dialogue de création/modification
  const handleOpenDialog = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        capacity: room.capacity?.toString() || '',
        room_type: room.room_type,
        description: room.description || ''
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: '',
        capacity: '',
        room_type: 'classroom',
        description: ''
      });
    }
    setOpenDialog(true);
  };

  // Fermer le dialogue
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRoom(null);
    setFormData({
      name: '',
      capacity: '',
      room_type: 'classroom',
      description: ''
    });
  };

  // Gérer les changements du formulaire
  const handleFormChange = (field: keyof RoomFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // Sauvegarder la salle
  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingRoom ? `${API_URLS.ROOMS}/${editingRoom.id}` : API_URLS.ROOMS;
      const method = editingRoom ? 'PUT' : 'POST';

      const payload = {
        name: formData.name,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        room_type: formData.room_type,
        description: formData.description || null
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: editingRoom ? 'Salle mise à jour avec succès' : 'Salle créée avec succès',
          severity: 'success'
        });
        handleCloseDialog();
        fetchRooms();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Erreur lors de la sauvegarde',
        severity: 'error'
      });
    }
  };

  // Ouvrir le dialogue de suppression
  const handleDeleteClick = (room: Room) => {
    setDeleteDialog({ open: true, room });
  };

  // Fermer le dialogue de suppression
  const handleCloseDeleteDialog = () => {
    setDeleteDialog({ open: false, room: null });
  };

  // Supprimer la salle
  const handleDelete = async () => {
    if (!deleteDialog.room) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URLS.ROOMS}/${deleteDialog.room.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Salle supprimée avec succès',
          severity: 'success'
        });
        handleCloseDeleteDialog();
        fetchRooms();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Erreur lors de la suppression',
        severity: 'error'
      });
    }
  };

  // Obtenir le label du type de salle
  const getRoomTypeLabel = (type: string) => {
    const roomType = roomTypes.find(rt => rt.value === type);
    return roomType ? roomType.label : type;
  };

  // Obtenir la couleur du chip selon le statut
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <SecretarySidebar />
        <Box component="main" sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <SecretarySidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {/* En-tête */}
        <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          fontWeight: 700, 
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <RoomIcon sx={{ fontSize: 40 }} />
          Gestion des Salles
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gérez les salles de classe, laboratoires et autres espaces de votre établissement
        </Typography>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    {rooms.length}
                  </Typography>
                  <Typography variant="body2">
                    Total des salles
                  </Typography>
                </Box>
                <RoomIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    {rooms.filter(r => r.is_active).length}
                  </Typography>
                  <Typography variant="body2">
                    Salles actives
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f57c00 0%, #ffb74d 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    {rooms.filter(r => r.room_type === 'classroom').length}
                  </Typography>
                  <Typography variant="body2">
                    Salles de classe
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #7b1fa2 0%, #ba68c8 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    {rooms.reduce((sum, r) => sum + (r.capacity || 0), 0)}
                  </Typography>
                  <Typography variant="body2">
                    Capacité totale
                  </Typography>
                </Box>
                <InfoIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tableau des salles */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Liste des Salles
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              }
            }}
          >
            Ajouter une salle
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Nom</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Capacité</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <RoomIcon color="primary" />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {room.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getRoomTypeLabel(room.room_type)} 
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {room.capacity ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <PeopleIcon color="action" sx={{ fontSize: 16 }} />
                        <Typography variant="body2">
                          {room.capacity} places
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Non spécifié
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {room.description || 'Aucune description'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={room.is_active ? 'Active' : 'Inactive'} 
                      size="small"
                      color={getStatusColor(room.is_active)}
                      icon={room.is_active ? <CheckCircleIcon /> : <CancelIcon />}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={1} justifyContent="center">
                      <Tooltip title="Modifier">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(room)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(room)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialogue de création/modification */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          fontWeight: 600
        }}>
          {editingRoom ? 'Modifier la salle' : 'Nouvelle salle'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom de la salle"
                value={formData.name}
                onChange={handleFormChange('name')}
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacité"
                type="number"
                value={formData.capacity}
                onChange={handleFormChange('capacity')}
                variant="outlined"
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type de salle</InputLabel>
                <Select
                  value={formData.room_type}
                  onChange={handleFormChange('room_type')}
                  label="Type de salle"
                >
                  {roomTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleFormChange('description')}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!formData.name.trim()}
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              }
            }}
          >
            {editingRoom ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de suppression */}
      <Dialog open={deleteDialog.open} onClose={handleCloseDeleteDialog}>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 600 }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer la salle "{deleteDialog.room?.name}" ?
            Cette action ne peut pas être annulée.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            Annuler
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
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

export default RoomsPage;
