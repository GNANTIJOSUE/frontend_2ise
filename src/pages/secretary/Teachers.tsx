import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Fade,
  Zoom,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  Class as ClassIcon,
  Subject as SubjectIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import SecretarySidebar from '../../components/SecretarySidebar';
import { blue, green, orange, purple } from '@mui/material/colors';
import axios from 'axios';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionDenied from '../../components/PermissionDenied';
import DeleteButton from '../../components/DeleteButton';

const Teachers = () => {
  const theme = useTheme();
  const { hasPermission } = usePermissions();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [formData, setFormData] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    subject_ids: string[];
    qualification: string;
    address: string;
    city: string;
  }>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    subject_ids: [],
    qualification: '',
    address: '',
    city: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Nouveaux états pour les détails du professeur
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTeacherDetails, setSelectedTeacherDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  const qualifications = [
    'Licence',
    'Master',
    'Doctorat',
    'CAPES',
    'Agrégation',
    'Certification',
    'Autre',
  ];

  const fetchTeachers = useCallback(async () => {
    let isMounted = true;
    
    if (isMounted) {
      setLoading(true);
      setError(null);
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://2ise-groupe.com/api/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (isMounted) {
        setTeachers(res.data);
      }
    } catch (err: any) {
      if (isMounted) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des professeurs');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    let isMounted = true;
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://2ise-groupe.com/api/subjects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (isMounted) {
        setSubjects(res.data);
      }
    } catch (err) {
      if (isMounted) {
        console.error("Erreur lors du chargement des matières", err);
        setError('Erreur lors du chargement des matières. Assurez-vous d\'être connecté.');
      }
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    let isMounted = true;
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://2ise-groupe.com/api/classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (isMounted) {
        setClasses(res.data);
      }
    } catch (err) {
      if (isMounted) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      await fetchTeachers();
      await fetchSubjects();
      await fetchClasses();
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [fetchTeachers, fetchSubjects, fetchClasses]);

  // Vérifier les permissions après tous les hooks
  if (!hasPermission('canManageTeachers')) {
    return <PermissionDenied requiredPermission="canManageTeachers" />;
  }

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch = (teacher.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = !selectedSubject || 
      teacher.subjects?.some((subject: any) => String(subject.id) === selectedSubject);
    
    return matchesSearch && matchesSubject;
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddTeacher = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      subject_ids: [],
      qualification: '',
      address: '',
      city: '',
    });
    setAddModalOpen(true);
  };

  const handleEditTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setFormData({
      first_name: teacher.first_name || '',
      last_name: teacher.last_name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      subject_ids: teacher.subjects ? teacher.subjects.map((s: any) => String(s.id)) : [],
      qualification: teacher.qualification || '',
      address: teacher.address || '',
      city: teacher.city || '',
    });
    setEditModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email) {
      alert('Veuillez remplir les champs obligatoires (Nom, Prénom, Email)');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        ...formData,
        subject_ids: formData.subject_ids.map((id: string) => Number(id)),
      };
      if (editModalOpen && selectedTeacher) {
        await axios.put(`https://2ise-groupe.com/api/teachers/${selectedTeacher.id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('https://2ise-groupe.com/api/teachers', dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setAddModalOpen(false);
      setEditModalOpen(false);
      setSelectedTeacher(null);
      fetchTeachers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: number) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce professeur ?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`https://2ise-groupe.com/api/teachers/${teacherId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchTeachers();
      } catch (err) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  // Nouvelle fonction pour basculer le statut d'un professeur
  const handleToggleStatus = async (teacherId: number) => {
    setUpdatingStatus(teacherId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`https://2ise-groupe.com/api/teachers/${teacherId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mettre à jour la liste des professeurs
      fetchTeachers();
      
      // Afficher un message de succès
      alert(response.data.message);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors du changement de statut');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Nouvelle fonction pour charger les détails d'un professeur
  const handleViewDetails = async (teacherId: number) => {
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://2ise-groupe.com/api/teachers/${teacherId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedTeacherDetails(response.data);
      setDetailsModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors du chargement des détails');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fonction pour gérer le double-clic sur le nom
  const handleNameDoubleClick = (teacher: any) => {
    handleViewDetails(teacher.id);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=900');
    if (printWindow) {
      const title = selectedSubject 
        ? `Liste des professeurs - ${subjects.find(s => String(s.id) === selectedSubject)?.name || 'Matière sélectionnée'}`
        : 'Liste des professeurs';
      
      printWindow.document.write('<html><head><title>' + title + '</title>');
      printWindow.document.write(`
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .print-header { text-align: center; margin-bottom: 20px; font-size: 18px; font-weight: bold; }
          .print-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .print-table th, .print-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          .print-table th { background: #f0f0f0; font-weight: bold; }
          .print-stats { margin-top: 20px; text-align: center; font-weight: bold; }
          @media print {
            .no-print { display: none !important; }
            body { margin: 0; }
          }
        </style>
      `);
      printWindow.document.write('</head><body>');
      printWindow.document.write('<div class="print-header">' + title + '</div>');
      
      // Créer la table d'impression
      let tableHTML = `
        <table class="print-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Matière(s)</th>
              <th>Qualification</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      filteredTeachers.forEach(teacher => {
        const subjectsList = teacher.subjects?.map((s: any) => s.name).join(', ') || 'N/A';
        tableHTML += `
          <tr>
            <td>${teacher.last_name || 'N/A'}</td>
            <td>${teacher.first_name || 'N/A'}</td>
            <td>${teacher.email || 'N/A'}</td>
            <td>${teacher.phone || 'N/A'}</td>
            <td>${subjectsList}</td>
            <td>${teacher.qualification || 'N/A'}</td>
            <td>${teacher.status === 'active' ? 'Actif' : 'Inactif'}</td>
          </tr>
        `;
      });
      
      tableHTML += '</tbody></table>';
      printWindow.document.write(tableHTML);
      
      // Ajouter les statistiques
      const statsHTML = `
        <div class="print-stats">
          Total: ${filteredTeachers.length} professeur(s)
          ${selectedSubject ? ` - Matière: ${subjects.find(s => String(s.id) === selectedSubject)?.name}` : ''}
        </div>
      `;
      printWindow.document.write(statsHTML);
      
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)' }}>
      <SecretarySidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Gestion des Professeurs
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddTeacher}
                sx={{
                  background: `linear-gradient(45deg, ${green[500]} 30%, ${green[700]} 90%)`,
                  color: 'white',
                  '&:hover': {
                    background: `linear-gradient(45deg, ${green[600]} 30%, ${green[800]} 90%)`,
                  },
                  px: 3,
                  py: 1,
                }}
              >
                Nouveau Professeur
              </Button>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{
                  background: `linear-gradient(45deg, ${blue[500]} 30%, ${blue[700]} 90%)`,
                  color: 'white',
                  '&:hover': {
                    background: `linear-gradient(45deg, ${blue[600]} 30%, ${blue[800]} 90%)`,
                  },
                  px: 3,
                  py: 1,
                }}
              >
                Imprimer
              </Button>
            </Box>
          </Box>

          <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Rechercher un professeur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Filtrer par matière</InputLabel>
                    <Select
                      value={selectedSubject}
                      label="Filtrer par matière"
                      onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Toutes les matières</em>
                      </MenuItem>
                      {subjects.map((subject) => (
                        <MenuItem key={subject.id} value={String(subject.id)}>
                          {subject.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedSubject('');
                    }}
                    fullWidth
                    sx={{ height: '56px' }}
                  >
                    Réinitialiser
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Indicateur des filtres actifs */}
          {(searchTerm || selectedSubject) && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                Filtres actifs:
              </Typography>
              {searchTerm && (
                <Chip
                  label={`Recherche: "${searchTerm}"`}
                  size="small"
                  onDelete={() => setSearchTerm('')}
                  color="primary"
                  variant="outlined"
                />
              )}
              {selectedSubject && (
                <Chip
                  label={`Matière: ${subjects.find(s => String(s.id) === selectedSubject)?.name}`}
                  size="small"
                  onDelete={() => setSelectedSubject('')}
                  color="secondary"
                  variant="outlined"
                />
              )}
              <Button
                size="small"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSubject('');
                }}
                sx={{ ml: 1 }}
              >
                Effacer tous les filtres
              </Button>
            </Box>
          )}

          <div ref={tableRef}>
            <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)` }}>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Nom</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Prénom</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Téléphone</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Matière</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Qualification</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Classes</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Statut</TableCell>
                      <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={9} align="center">Chargement...</TableCell>
                      </TableRow>
                    )}
                    {error && (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ color: 'error.main' }}>{error}</TableCell>
                      </TableRow>
                    )}
                    {filteredTeachers
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((teacher, index) => (
                        <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }} key={teacher.id}>
                          <TableRow 
                            hover 
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                cursor: 'pointer',
                              },
                              ...(teacher.status === 'inactive' && {
                                backgroundColor: 'rgba(255, 0, 0, 0.05)',
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 0, 0, 0.08)',
                                }
                              })
                            }}
                          >
                            <TableCell 
                              onClick={() => handleNameDoubleClick(teacher)}
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' },
                                position: 'relative'
                              }}
                            >
                              <Tooltip title="Double-cliquez pour voir les détails">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {teacher.last_name}
                                  <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                </Box>
                              </Tooltip>
                            </TableCell>
                            <TableCell 
                              onClick={() => handleNameDoubleClick(teacher)}
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                              }}
                            >
                              {teacher.first_name}
                            </TableCell>
                            <TableCell 
                              onClick={() => handleNameDoubleClick(teacher)}
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                              }}
                            >
                              {teacher.email}
                            </TableCell>
                            <TableCell 
                              onClick={() => handleNameDoubleClick(teacher)}
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                              }}
                            >
                              {teacher.phone}
                            </TableCell>
                            <TableCell 
                              onClick={() => handleNameDoubleClick(teacher)}
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                              }}
                            >
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {teacher.subjects.map((s: any) => (
                                  <Chip key={s.id} label={s.name} size="small" />
                                ))}
                              </Box>
                            </TableCell>
                            <TableCell 
                              onClick={() => handleNameDoubleClick(teacher)}
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                              }}
                            >
                              {teacher.qualification}
                            </TableCell>
                            <TableCell 
                              onClick={() => handleNameDoubleClick(teacher)}
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                              }}
                            >
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {(teacher.classes || []).map((c: any) => (
                                  <Chip key={c.id} label={c.name} size="small" color="info" />
                                ))}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Tooltip title={teacher.status === 'active' ? 'Cliquez pour désactiver' : 'Cliquez pour activer'}>
                                <Switch
                                  checked={teacher.status === 'active'}
                                  onChange={() => handleToggleStatus(teacher.id)}
                                  size="small"
                                  color="primary"
                                  disabled={updatingStatus === teacher.id}
                                />
                              </Tooltip>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                <Tooltip title="Voir détails">
                                  <IconButton color="primary" size="small" onClick={() => handleViewDetails(teacher.id)}>
                                    <VisibilityIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Modifier">
                                  <IconButton color="primary" size="small" onClick={() => handleEditTeacher(teacher)}>
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <DeleteButton 
                                  onDelete={() => handleDeleteTeacher(teacher.id)}
                                  permission="canDeleteTeachers"
                                  tooltip="Supprimer le professeur"
                                />
                              </Box>
                            </TableCell>
                          </TableRow>
                        </Zoom>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredTeachers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  '.MuiTablePagination-select': {
                    borderRadius: 1,
                  },
                  '.MuiTablePagination-selectIcon': {
                    color: theme.palette.primary.main,
                  },
                }}
              />
            </Paper>
          </div>

          {/* Modal d'ajout/édition */}
          <Dialog open={addModalOpen || editModalOpen} onClose={() => { setAddModalOpen(false); setEditModalOpen(false); }} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${theme.palette.divider}`}}>
              <PersonIcon color="primary" />
              {editModalOpen ? 'Modifier les informations du professeur' : 'Inscrire un nouveau professeur'}
            </DialogTitle>
            <DialogContent sx={{ background: theme.palette.grey[50], pt: '20px !important' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Prénom"
                    required
                    fullWidth
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nom"
                    required
                    fullWidth
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email"
                    required
                    type="email"
                    fullWidth
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Téléphone"
                    fullWidth
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Matière(s) enseignée(s)</InputLabel>
                    <Select
                      multiple
                      value={formData.subject_ids}
                      label="Matière(s) enseignée(s)"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subject_ids: e.target.value as string[],
                        })
                      }
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((id) => {
                            const subj = subjects.find((s) => String(s.id) === id);
                            return subj ? <Chip key={id} label={subj.name} size="small" /> : null;
                          })}
                        </Box>
                      )}
                    >
                      {subjects.map((s) => (
                        <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Plus haute qualification</InputLabel>
                    <Select
                      value={formData.qualification}
                      label="Plus haute qualification"
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    >
                      {qualifications.map((qual) => (
                        <MenuItem key={qual} value={qual}>{qual}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                 <Grid item xs={12} sm={6}>
                  <TextField
                    label="Ville"
                    fullWidth
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Adresse"
                    fullWidth
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px', borderTop: `1px solid ${theme.palette.divider}`}}>
              <Button onClick={() => { setAddModalOpen(false); setEditModalOpen(false); }} color="secondary">
                Annuler
              </Button>
              <Button onClick={handleSubmit} color="primary" variant="contained" disabled={submitting} startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}>
                {submitting ? 'Enregistrement...' : (editModalOpen ? 'Enregistrer les modifications' : 'Ajouter le professeur')}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Modal de détails du professeur */}
          <Dialog 
            open={detailsModalOpen} 
            onClose={() => setDetailsModalOpen(false)} 
            maxWidth="lg" 
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 4,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                overflow: 'hidden'
              }
            }}
          >
            {/* Header avec gradient */}
            <Box sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              p: 3,
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                animation: 'pulse 2s infinite'
              }} />
              <Box sx={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                animation: 'pulse 3s infinite'
              }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}>
                  <InfoIcon sx={{ fontSize: 30, color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                    Détails du Professeur
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    {selectedTeacherDetails?.first_name} {selectedTeacherDetails?.last_name}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <DialogContent sx={{ 
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              p: 0,
              position: 'relative'
            }}>
              {loadingDetails ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  py: 8,
                  background: 'rgba(255,255,255,0.9)'
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={60} sx={{ mb: 2 }} />
                    <Typography variant="h6" color="primary">
                      Chargement des détails...
                    </Typography>
                  </Box>
                </Box>
              ) : selectedTeacherDetails ? (
                <Box sx={{ p: 4 }}>
                  <Grid container spacing={4}>
                    {/* Informations personnelles */}
                    <Grid item xs={12} md={6}>
                      <Fade in={true} timeout={800}>
                        <Card sx={{ 
                          mb: 3, 
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                          }
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 2, 
                              mb: 3,
                              pb: 2,
                              borderBottom: '2px solid rgba(156, 39, 176, 0.1)'
                            }}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                background: 'linear-gradient(45deg, #9c27b0 30%, #e1bee7 90%)',
                                color: 'white',
                                boxShadow: '0 4px 15px rgba(156, 39, 176, 0.3)'
                              }}>
                                <PersonIcon />
                              </Box>
                              <Typography variant="h6" fontWeight="bold" color="primary">
                                Informations Personnelles
                              </Typography>
                            </Box>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <Box sx={{ 
                                  p: 2, 
                                  borderRadius: 3, 
                                  background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
                                  border: '1px solid rgba(76, 175, 80, 0.2)',
                                  mb: 2
                                }}>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Nom complet
                                  </Typography>
                                  <Typography variant="h6" fontWeight="bold" color="primary">
                                    {selectedTeacherDetails.first_name} {selectedTeacherDetails.last_name}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ 
                                  p: 2, 
                                  borderRadius: 3, 
                                  background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                                  border: '1px solid rgba(33, 150, 243, 0.2)',
                                  mb: 2
                                }}>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Email
                                  </Typography>
                                  <Typography variant="body1" fontWeight="medium">
                                    {selectedTeacherDetails.email}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ 
                                  p: 2, 
                                  borderRadius: 3, 
                                  background: 'linear-gradient(135deg, #fff3e0 0%, #fafafa 100%)',
                                  border: '1px solid rgba(255, 152, 0, 0.2)',
                                  mb: 2
                                }}>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Téléphone
                                  </Typography>
                                  <Typography variant="body1" fontWeight="medium">
                                    {selectedTeacherDetails.phone || 'Non renseigné'}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ 
                                  p: 2, 
                                  borderRadius: 3, 
                                  background: 'linear-gradient(135deg, #f3e5f5 0%, #fafafa 100%)',
                                  border: '1px solid rgba(156, 39, 176, 0.2)',
                                  mb: 2
                                }}>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Code d'accès
                                  </Typography>
                                  <Typography variant="body1" fontWeight="bold" color="primary">
                                    {selectedTeacherDetails.code}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ 
                                  p: 2, 
                                  borderRadius: 3, 
                                  background: selectedTeacherDetails.status === 'active' 
                                    ? 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)'
                                    : 'linear-gradient(135deg, #ffebee 0%, #fafafa 100%)',
                                  border: selectedTeacherDetails.status === 'active'
                                    ? '1px solid rgba(76, 175, 80, 0.2)'
                                    : '1px solid rgba(244, 67, 54, 0.2)',
                                  mb: 2
                                }}>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Statut
                                  </Typography>
                                  <Chip 
                                    label={selectedTeacherDetails.status === 'active' ? 'Actif' : 'Inactif'} 
                                    color={selectedTeacherDetails.status === 'active' ? 'success' : 'error'} 
                                    size="medium"
                                    sx={{ fontWeight: 'bold' }}
                                  />
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Box sx={{ 
                                  p: 2, 
                                  borderRadius: 3, 
                                  background: 'linear-gradient(135deg, #e1f5fe 0%, #f3e5f5 100%)',
                                  border: '1px solid rgba(33, 150, 243, 0.2)',
                                  mb: 2
                                }}>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Date d'embauche
                                  </Typography>
                                  <Typography variant="body1" fontWeight="medium">
                                    {selectedTeacherDetails.hire_date ? new Date(selectedTeacherDetails.hire_date).toLocaleDateString('fr-FR', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    }) : 'Non renseignée'}
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Fade>

                      {/* Matières enseignées */}
                      <Fade in={true} timeout={1000}>
                        <Card sx={{ 
                          mb: 3, 
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                          }
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 2, 
                              mb: 3,
                              pb: 2,
                              borderBottom: '2px solid rgba(156, 39, 176, 0.1)'
                            }}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                background: 'linear-gradient(45deg, #9c27b0 30%, #e1bee7 90%)',
                                color: 'white',
                                boxShadow: '0 4px 15px rgba(156, 39, 176, 0.3)'
                              }}>
                                <SubjectIcon />
                              </Box>
                              <Typography variant="h6" fontWeight="bold" color="primary">
                                Matières Enseignées
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                              {selectedTeacherDetails.subjects?.map((subject: any, index: number) => (
                                <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }} key={subject.id}>
                                  <Chip 
                                    label={subject.name} 
                                    color="primary" 
                                    variant="outlined"
                                    icon={<SubjectIcon />}
                                    sx={{ 
                                      fontWeight: 'bold',
                                      fontSize: '0.9rem',
                                      py: 1,
                                      px: 2,
                                      background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                                      border: '2px solid rgba(156, 39, 176, 0.3)',
                                      '&:hover': {
                                        transform: 'scale(1.05)',
                                        boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)'
                                      }
                                    }}
                                  />
                                </Zoom>
                              ))}
                            </Box>
                          </CardContent>
                        </Card>
                      </Fade>
                    </Grid>

                    {/* Adresse, qualification et statistiques */}
                    <Grid item xs={12} md={6}>
                      <Fade in={true} timeout={1200}>
                        <Card sx={{ 
                          mb: 3, 
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                          }
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 2, 
                              mb: 3,
                              pb: 2,
                              borderBottom: '2px solid rgba(255, 152, 0, 0.1)'
                            }}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                background: 'linear-gradient(45deg, #ff9800 30%, #ffcc02 90%)',
                                color: 'white',
                                boxShadow: '0 4px 15px rgba(255, 152, 0, 0.3)'
                              }}>
                                <SchoolIcon />
                              </Box>
                              <Typography variant="h6" fontWeight="bold" color="primary">
                                Qualification & Adresse
                              </Typography>
                            </Box>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <Box sx={{ 
                                  p: 2, 
                                  borderRadius: 3, 
                                  background: 'linear-gradient(135deg, #fff3e0 0%, #fafafa 100%)',
                                  border: '1px solid rgba(255, 152, 0, 0.2)',
                                  mb: 2
                                }}>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Qualification
                                  </Typography>
                                  <Typography variant="body1" fontWeight="bold" color="primary">
                                    {selectedTeacherDetails.qualification || 'Non renseignée'}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ 
                                  p: 2, 
                                  borderRadius: 3, 
                                  background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
                                  border: '1px solid rgba(76, 175, 80, 0.2)',
                                  mb: 2
                                }}>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Ville
                                  </Typography>
                                  <Typography variant="body1" fontWeight="medium">
                                    {selectedTeacherDetails.city || 'Non renseignée'}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ 
                                  p: 2, 
                                  borderRadius: 3, 
                                  background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                                  border: '1px solid rgba(33, 150, 243, 0.2)',
                                  mb: 2
                                }}>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Adresse
                                  </Typography>
                                  <Typography variant="body1" fontWeight="medium">
                                    {selectedTeacherDetails.address || 'Non renseignée'}
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Fade>

                      {/* Statistiques avec design amélioré */}
                      <Fade in={true} timeout={1400}>
                        <Card sx={{ 
                          mb: 3, 
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                          }
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 2, 
                              mb: 3,
                              pb: 2,
                              borderBottom: '2px solid rgba(76, 175, 80, 0.1)'
                            }}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                background: 'linear-gradient(45deg, #4caf50 30%, #81c784 90%)',
                                color: 'white',
                                boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
                              }}>
                                <InfoIcon />
                              </Box>
                              <Typography variant="h6" fontWeight="bold" color="primary">
                                Statistiques
                              </Typography>
                            </Box>
                            
                            <Grid container spacing={3}>
                              <Grid item xs={12} sm={4}>
                                <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                                  <Box sx={{ 
                                    p: 3, 
                                    borderRadius: 4, 
                                    background: 'linear-gradient(135deg, #2196f3 30%, #64b5f6 90%)',
                                    color: 'white',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 8px 25px rgba(33, 150, 243, 0.3)',
                                    '&:hover': {
                                      transform: 'scale(1.05)',
                                      boxShadow: '0 12px 35px rgba(33, 150, 243, 0.4)'
                                    }
                                  }}>
                                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                                      {selectedTeacherDetails.stats?.total_classes || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 'medium' }}>
                                      Classes Enseignées
                                    </Typography>
                                  </Box>
                                </Zoom>
                              </Grid>
                              
                              <Grid item xs={12} sm={4}>
                                <Zoom in={true} style={{ transitionDelay: '400ms' }}>
                                  <Box sx={{ 
                                    p: 3, 
                                    borderRadius: 4, 
                                    background: 'linear-gradient(135deg, #ff9800 30%, #ffb74d 90%)',
                                    color: 'white',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 8px 25px rgba(255, 152, 0, 0.3)',
                                    '&:hover': {
                                      transform: 'scale(1.05)',
                                      boxShadow: '0 12px 35px rgba(255, 152, 0, 0.4)'
                                    }
                                  }}>
                                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                                      {selectedTeacherDetails.stats?.total_subjects || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 'medium' }}>
                                      Matières Enseignées
                                    </Typography>
                                  </Box>
                                </Zoom>
                              </Grid>
                              
                              <Grid item xs={12} sm={4}>
                                <Zoom in={true} style={{ transitionDelay: '600ms' }}>
                                  <Box sx={{ 
                                    p: 3, 
                                    borderRadius: 4, 
                                    background: 'linear-gradient(135deg, #9c27b0 30%, #ba68c8 90%)',
                                    color: 'white',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 8px 25px rgba(156, 39, 176, 0.3)',
                                    '&:hover': {
                                      transform: 'scale(1.05)',
                                      boxShadow: '0 12px 35px rgba(156, 39, 176, 0.4)'
                                    }
                                  }}>
                                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                                      {selectedTeacherDetails.stats?.total_years || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 'medium' }}>
                                      Années d'Enseignement
                                    </Typography>
                                  </Box>
                                </Zoom>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Fade>
                    </Grid>

                    {/* Classes actuelles */}
                    <Grid item xs={12}>
                      <Fade in={true} timeout={1600}>
                        <Card sx={{ 
                          mb: 3, 
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                          }
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 2, 
                              mb: 3,
                              pb: 2,
                              borderBottom: '2px solid rgba(33, 150, 243, 0.1)'
                            }}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                background: 'linear-gradient(45deg, #2196f3 30%, #64b5f6 90%)',
                                color: 'white',
                                boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)'
                              }}>
                                <ClassIcon />
                              </Box>
                              <Typography variant="h6" fontWeight="bold" color="primary">
                                Classes Actuelles ({selectedTeacherDetails.currentClasses?.length || 0})
                              </Typography>
                            </Box>
                            
                            {selectedTeacherDetails.currentClasses?.length > 0 ? (
                              <Grid container spacing={2}>
                                {selectedTeacherDetails.currentClasses.map((course: any, index: number) => (
                                  <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                                      <Card variant="outlined" sx={{ 
                                        borderRadius: 2,
                                        background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                                        border: '1px solid rgba(33, 150, 243, 0.2)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                          transform: 'translateY(-3px)',
                                          boxShadow: '0 8px 25px rgba(33, 150, 243, 0.2)'
                                        }
                                      }}>
                                        <CardContent sx={{ p: 2 }}>
                                          <Typography variant="subtitle1" fontWeight="bold">
                                            {course.class_name}
                                          </Typography>
                                          <Typography variant="body2" color="text.secondary">
                                            Matière: {course.subject_name}
                                          </Typography>
                                          <Typography variant="body2" color="text.secondary">
                                            {course.day_of_week} - {course.start_time} à {course.end_time}
                                          </Typography>
                                        </CardContent>
                                      </Card>
                                    </Zoom>
                                  </Grid>
                                ))}
                              </Grid>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Aucune classe assignée pour l'année scolaire actuelle.
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Fade>
                    </Grid>

                    {/* Historique des classes */}
                    <Grid item xs={12}>
                      <Fade in={true} timeout={1800}>
                        <Card sx={{ 
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                          }
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 2, 
                              mb: 3,
                              pb: 2,
                              borderBottom: '2px solid rgba(156, 39, 176, 0.1)'
                            }}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                background: 'linear-gradient(45deg, #9c27b0 30%, #ba68c8 90%)',
                                color: 'white',
                                boxShadow: '0 4px 15px rgba(156, 39, 176, 0.3)'
                              }}>
                                <HistoryIcon />
                              </Box>
                              <Typography variant="h6" fontWeight="bold" color="primary">
                                Historique des Classes Enseignées
                              </Typography>
                            </Box>
                            
                            {selectedTeacherDetails.classesHistory?.length > 0 ? (
                              <Accordion sx={{ 
                                background: 'transparent',
                                boxShadow: 'none',
                                '&:before': { display: 'none' }
                              }}>
                                <AccordionSummary 
                                  expandIcon={<ExpandMoreIcon />}
                                  sx={{ 
                                    background: 'linear-gradient(135deg, #f3e5f5 0%, #e8f5e8 100%)',
                                    borderRadius: 2,
                                    mb: 2
                                  }}
                                >
                                  <Typography sx={{ fontWeight: 'bold' }}>
                                    Voir l'historique complet ({selectedTeacherDetails.classesHistory.length} entrées)
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Grid container spacing={2}>
                                    {selectedTeacherDetails.classesHistory.map((history: any, index: number) => (
                                      <Grid item xs={12} sm={6} md={4} key={index}>
                                        <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }}>
                                          <Card variant="outlined" sx={{ 
                                            borderRadius: 2,
                                            background: 'linear-gradient(135deg, #f3e5f5 0%, #e8f5e8 100%)',
                                            border: '1px solid rgba(156, 39, 176, 0.2)',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                              transform: 'translateY(-3px)',
                                              boxShadow: '0 8px 25px rgba(156, 39, 176, 0.2)'
                                            }
                                          }}>
                                            <CardContent sx={{ p: 2 }}>
                                              <Typography variant="subtitle1" fontWeight="bold">
                                                {history.name}
                                              </Typography>
                                              <Typography variant="body2" color="text.secondary">
                                                Année: {history.school_year}
                                              </Typography>
                                              <Typography variant="body2" color="text.secondary">
                                                Niveau: {history.level}
                                              </Typography>
                                              <Typography variant="body2" color="text.secondary">
                                                Cours: {history.course_count}
                                              </Typography>
                                            </CardContent>
                                          </Card>
                                        </Zoom>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </AccordionDetails>
                              </Accordion>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Aucun historique disponible.
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Fade>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  py: 8,
                  background: 'rgba(255,255,255,0.9)'
                }}>
                  <Typography variant="body1" color="text.secondary">
                    Aucun détail disponible pour ce professeur.
                  </Typography>
                </Box>
              )}
            </DialogContent>
            
            <DialogActions sx={{ 
              p: '20px 24px', 
              borderTop: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)'
            }}>
              <Button 
                onClick={() => setDetailsModalOpen(false)} 
                variant="contained"
                sx={{
                  background: 'linear-gradient(45deg, #f44336 30%, #ff5722 90%)',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '1rem',
                  boxShadow: '0 4px 15px rgba(244, 67, 54, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #d32f2f 30%, #e64a19 90%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(244, 67, 54, 0.4)'
                  }
                }}
              >
                Fermer
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Box>
  );
};

export default Teachers; 