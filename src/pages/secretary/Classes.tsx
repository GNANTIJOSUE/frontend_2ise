import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import SecretarySidebar from '../../components/SecretarySidebar';
import { usePermissions } from '../../hooks/usePermissions';
import axios from 'axios';

const Classes = () => {
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    level: '',
    principalTeacher: '',
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editClass, setEditClass] = useState<any | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });
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

  const [schoolYear, setSchoolYear] = useState(getCurrentSchoolYear());
  const [classTeachers, setClassTeachers] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [loadingAllTeachers, setLoadingAllTeachers] = useState(false);
  const [selectedNiveau, setSelectedNiveau] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // État pour stocker les montants des niveaux
  const [levelAmounts, setLevelAmounts] = useState<{[key: string]: any}>({});

  useEffect(() => {
    let isMounted = true;
    
    const fetchClasses = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('https://2ise-groupe.com/api/classes/list', {
          headers: { Authorization: `Bearer ${token}` },
          params: { school_year: schoolYear }
        });
        if (isMounted) {
          const normalized = res.data.map((c: any) => ({ ...c, id: c.id || c._id }));
          setClasses(normalized);
        }
      } catch (err: any) {
        if (isMounted) setError(err.response?.data?.message || 'Erreur lors du chargement des classes');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const fetchAllLevelAmounts = async () => {
      if (!isMounted) return;
      try {
        const amounts: {[key: string]: any} = {};
        for (const niveau of niveauOrder) {
          const levelData = await fetchLevelAmounts(niveau);
          if (levelData) {
            amounts[niveau] = levelData;
          }
        }
        if (isMounted) {
          setLevelAmounts(amounts);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des montants des niveaux:', error);
      }
    };

    fetchClasses();
    fetchAllLevelAmounts();
    
    return () => {
      isMounted = false;
    };
  }, [schoolYear]);



  // Ajout de la fonction d'ordre des niveaux
  const niveauOrder = [
    '6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale'
  ];
  function getNiveauIndex(niveau: string) {
    return niveauOrder.indexOf(niveau);
  }

  // Trie les classes filtrées par niveau
  const filteredClasses = classes.filter((classe) => {
    // On adapte les champs selon la structure de la classe reçue du backend
    const nom = classe.nom || classe.name || '';
    const niveau = classe.niveau || classe.level || '';
    const prof = classe.professeurPrincipal || classe.teacher || '';
    return (
      nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.toLowerCase().includes(searchTerm.toLowerCase()) ||
      niveau.toLowerCase().includes(searchTerm.toLowerCase())
    );
  })
  .sort((a, b) => {
    const niveauA = a.niveau || a.level || '';
    const niveauB = b.niveau || b.level || '';
    return getNiveauIndex(niveauA) - getNiveauIndex(niveauB);
  });

  // Grouper les classes par niveau
  const groupedClasses = filteredClasses.reduce((groups: any, classe) => {
    const niveau = classe.niveau || classe.level || '';
    if (!groups[niveau]) {
      groups[niveau] = [];
    }
    groups[niveau].push(classe);
    return groups;
  }, {});

  // Afficher tous les niveaux, même ceux sans classes
  const allNiveaux = niveauOrder;

  // Fonction pour compter le nombre de classes par niveau
  const getClassCount = (niveau: string) => {
    return groupedClasses[niveau] ? groupedClasses[niveau].length : 0;
  };

  // Fonction pour gérer le clic sur un niveau
  const handleNiveauClick = (niveau: string) => {
    if (selectedNiveau === niveau) {
      setSelectedNiveau(null); // Fermer si on clique sur le même niveau
      setSelectedClass(null); // Fermer aussi la classe sélectionnée
    } else {
      setSelectedNiveau(niveau); // Ouvrir le niveau sélectionné
      setSelectedClass(null); // Fermer la classe sélectionnée
    }
  };



  // Récupérer les montants d'un niveau
  const fetchLevelAmounts = async (level: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `https://2ise-groupe.com/api/classes/level/${level}/payment-modalities`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.level || null;
    } catch (error) {
      console.error('Erreur lors de la récupération des montants du niveau:', error);
      return null;
    }
  };

  // Fonction pour gérer le clic sur une classe
  const handleClassClick = async (classe: any) => {
    if (selectedClass && selectedClass.id === classe.id) {
      setSelectedClass(null); // Fermer si on clique sur la même classe
    } else {
      setSelectedClass(classe); // Ouvrir la classe sélectionnée
      await fetchClassStudents(classe.id);
    }
  };

  // Récupérer les élèves d'une classe
  const fetchClassStudents = async (classId: number | string) => {
    try {
      setLoadingStudents(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://2ise-groupe.com/api/classes/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { school_year: schoolYear }
      });
      setClassStudents(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des élèves:', error);
      setClassStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Ajout d'une classe
  const handleAddClass = async () => {
    if (!hasPermission('canManageClasses')) {
      setSnackbar({ open: true, message: 'Vous n\'avez pas la permission de créer des classes', severity: 'error' });
      return;
    }



    try {
      const token = localStorage.getItem('token');
      const requestData = {
        name: newClass.name,
        level: newClass.level,
        academic_year: schoolYear,
        principal_teacher: newClass.principalTeacher
      };
      
      const res = await axios.post('https://2ise-groupe.com/api/classes', requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Recharge la liste
      const classesRes = await axios.get('https://2ise-groupe.com/api/classes/list', {
        headers: { Authorization: `Bearer ${token}` },
        params: { school_year: schoolYear }
      });
      setClasses(classesRes.data);
      setOpen(false);
      setNewClass({ name: '', level: '', principalTeacher: '' });
      setSnackbar({ open: true, message: res.data.message || 'Classe ajoutée avec succès', severity: 'success' });
    } catch (err: any) {
      console.error("Erreur lors de l'ajout de la classe :", err, err?.response);
      setSnackbar({ open: true, message: err.response?.data?.message || "Erreur lors de l'ajout de la classe", severity: 'error' });
    }
  };

  // Suppression
  const handleDelete = async (id: number | string) => {
    if (!hasPermission('canDeleteClasses')) {
      setSnackbar({ open: true, message: 'Vous n\'avez pas la permission de supprimer des classes', severity: 'error' });
      return;
    }
    if (!id) {
      console.error('Impossible de supprimer : id manquant');
      return;
    }
    if (window.confirm('Voulez-vous vraiment supprimer cette classe ?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`https://2ise-groupe.com/api/classes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClasses(classes.filter(c => c.id !== id));
        setSnackbar({ open: true, message: 'Classe supprimée', severity: 'success' });
      } catch (err: any) {
        console.error('Erreur lors de la suppression de la classe :', err, err?.response);
        setSnackbar({ open: true, message: 'Erreur lors de la suppression', severity: 'error' });
      }
    }
  };

  // Récupérer les professeurs d'une classe depuis la table schedule
  const fetchClassTeachers = async (classId: number | string) => {
    try {
      setLoadingTeachers(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://2ise-groupe.com/api/classes/${classId}/teachers-schedule`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { school_year: schoolYear }
      });
      setClassTeachers(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des professeurs:', error);
      setClassTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Récupérer tous les professeurs
  const fetchAllTeachers = async () => {
    try {
      setLoadingAllTeachers(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('https://2ise-groupe.com/api/classes/teachers/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllTeachers(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les professeurs:', error);
      setAllTeachers([]);
    } finally {
      setLoadingAllTeachers(false);
    }
  };



  // Edition
  const handleEditOpen = async (classe: any) => {
    if (!classe.id) {
      console.error('Impossible de modifier : id manquant', classe);
      return;
    }
    setEditClass({
      ...classe,
      name: classe.nom || classe.name || '',
      level: classe.niveau || classe.level || '',
      principalTeacher: classe.main_teacher_id || classe.principal_teacher || classe.principalTeacher || '',
    });
    setEditOpen(true);
    
    // Récupérer les professeurs de la classe
    await fetchClassTeachers(classe.id);
    

  };
  const handleEditClose = () => {
    setEditOpen(false);
    setEditClass(null);
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string, value: any } }) => {
    setEditClass((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleEditSubmit = async () => {
    if (!hasPermission('canManageClasses')) {
      setSnackbar({ open: true, message: 'Vous n\'avez pas la permission de modifier des classes', severity: 'error' });
      return;
    }
    if (!editClass) return;
    

    
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(`https://2ise-groupe.com/api/classes/${editClass.id}`, {
        name: editClass.name,
        level: editClass.level,
        academic_year: editClass.academic_year,
        principal_teacher: editClass.principalTeacher
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Recharge la liste
      const res = await axios.get('https://2ise-groupe.com/api/classes/list', {
        headers: { Authorization: `Bearer ${token}` },
        params: { school_year: schoolYear }
      });
      setClasses(res.data);
      setEditOpen(false);
      setEditClass(null);
      setSnackbar({ open: true, message: 'Classe modifiée avec succès', severity: 'success' });
    } catch (err: any) {
      console.error('Erreur lors de la modification de la classe :', err, err?.response);
      setSnackbar({ open: true, message: 'Erreur lors de la modification', severity: 'error' });
    }
  };





  console.log(classes);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SecretarySidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%' }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1">
              Gestion des Classes
            </Typography>
            {hasPermission('canManageClasses') && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => {
                  setOpen(true);
                  fetchAllTeachers();
                }}
              >
                Nouvelle Classe
              </Button>
            )}
          </Box>

          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">Année scolaire :</Typography>
            <FormControl size="small">
              <Select value={schoolYear} onChange={e => setSchoolYear(e.target.value)}>
                {(() => {
                  // Générer les 5 dernières années scolaires en utilisant la même logique
                  const currentYear = parseInt(schoolYear.split('-')[0]);
                  return Array.from({ length: 5 }, (_, i) => {
                    const startYear = currentYear - i;
                    const label = `${startYear}-${startYear + 1}`;
                    return <MenuItem key={label} value={label}>{label}</MenuItem>;
                  });
                })()}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Rechercher une classe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Grid container spacing={3}>
            {loading && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>Chargement...</Paper>
              </Grid>
            )}
            {error && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center', color: 'red' }}>{error}</Paper>
              </Grid>
            )}
            {/* Affichage des niveaux sous forme de rectangles */}
            {allNiveaux.map((niveau) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={niveau}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                    backgroundColor: selectedNiveau === niveau ? 'primary.light' : 'white',
                    border: selectedNiveau === niveau ? '2px solid' : '1px solid',
                    borderColor: selectedNiveau === niveau ? 'primary.main' : 'grey.300'
                  }}
                  onClick={() => handleNiveauClick(niveau)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <SchoolIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h5" component="h2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      {niveau}
                    </Typography>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {getClassCount(niveau)} classe{getClassCount(niveau) !== 1 ? 's' : ''}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {getClassCount(niveau) === 0 ? 'Aucune classe' : 'Cliquez pour voir les classes'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            
            {/* Affichage des classes du niveau sélectionné */}
            {selectedNiveau && groupedClasses[selectedNiveau] && groupedClasses[selectedNiveau].length > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, backgroundColor: 'primary.main', color: 'white', mb: 2 }}>
                  <Typography variant="h5" component="h2">
                    Classes de {selectedNiveau}
                  </Typography>
                </Paper>
                <Grid container spacing={3}>
                  {groupedClasses[selectedNiveau].map((classe: any) => {
                     console.log('Classe affichée:', classe);
                     const isSelected = selectedClass && selectedClass.id === classe.id;
                     return (
                       <Grid item xs={12} md={6} lg={4} key={classe.id}>
                         <Card 
                           sx={{ 
                             cursor: 'pointer',
                             transition: 'all 0.3s ease',
                             '&:hover': {
                               transform: 'translateY(-2px)',
                               boxShadow: 3,
                             },
                             backgroundColor: isSelected ? 'primary.light' : 'white',
                             border: isSelected ? '2px solid' : '1px solid',
                             borderColor: isSelected ? 'primary.main' : 'grey.300'
                           }}
                           onClick={() => handleClassClick(classe)}
                         >
                           <CardContent>
                             <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                               <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                               <Box>
                                 <Typography variant="h5" component="div">
                                   {classe.nom || classe.name}
                                 </Typography>
                                 <Typography variant="body2" color="text.secondary">
                                   Niveau: {classe.niveau || classe.level}
                                 </Typography>
                               </Box>
                             </Box>

                             <List dense>
                               <ListItem>
                                 <ListItemAvatar>
                                   <Avatar>
                                     <PersonIcon />
                                   </Avatar>
                                 </ListItemAvatar>
                                 <ListItemText
                                   primary="Professeur Principal"
                                   secondary={classe.principal_teacher_name || classe.professeurPrincipal || classe.teacher || 'Non assigné'}
                                 />
                               </ListItem>
                               <ListItem>
                                 <ListItemText
                                   primary="Effectif"
                                   secondary={`${classe.students_count || 0} élèves`}
                                 />
                               </ListItem>
                               <ListItem>
                                 <ListItemText
                                   primary="Scolarité (élève affecté)"
                                   secondary={
                                     levelAmounts[classe.niveau || classe.level]?.amount 
                                       ? `${Number(levelAmounts[classe.niveau || classe.level].amount).toLocaleString('fr-FR')} F CFA`
                                       : 'Non définie'
                                   }
                                 />
                               </ListItem>
                               <ListItem>
                                 <ListItemText
                                   primary="Scolarité (élève non affecté)"
                                   secondary={
                                     levelAmounts[classe.niveau || classe.level]?.amount_non_assigned 
                                       ? `${Number(levelAmounts[classe.niveau || classe.level].amount_non_assigned).toLocaleString('fr-FR')} F CFA`
                                       : 'Non définie'
                                   }
                                 />
                               </ListItem>
                             </List>

                             <Box sx={{ mt: 2 }}>
                               <Chip
                                 label={classe.statut || 'Active'}
                                 color="success"
                                 size="small"
                               />
                             </Box>
                           </CardContent>
                           <CardActions>
                             <Button size="small" color="primary" onClick={(e) => {
                               e.stopPropagation();
                               handleClassClick(classe);
                             }}>
                               {isSelected ? 'Masquer détails' : 'Voir détails'}
                             </Button>
                             {hasPermission('canManageClasses') && (
                               <Button size="small" startIcon={<EditIcon />} onClick={(e) => {
                                 e.stopPropagation();
                                 handleEditOpen(classe);
                               }}>
                                 Modifier
                               </Button>
                             )}
                             <Button 
                               size="small" 
                               color="secondary" 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 navigate('/secretary/payment-modalities');
                               }}
                             >
                               Modalités de paiement
                             </Button>
                             {hasPermission('canDeleteClasses') && (
                               <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={(e) => {
                                 e.stopPropagation();
                                 handleDelete(classe.id);
                               }}>
                                 Supprimer
                               </Button>
                             )}
                             {!hasPermission('canManageClasses') && hasPermission('canViewClasses') && (
                               <Typography variant="caption" color="text.secondary">
                                 Consultation uniquement
                               </Typography>
                             )}
                           </CardActions>
                         </Card>
                         
                         {/* Détails de la classe sélectionnée */}
                         {isSelected && (
                           <Grid item xs={12} sx={{ mt: 2 }}>
                             <Paper sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
                               <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                                 Détails de la classe {classe.nom || classe.name}
                               </Typography>
                               
                               {/* Informations du professeur principal */}
                               <Box sx={{ mb: 3 }}>
                                 <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                   Professeur Principal
                                 </Typography>
                                 <Paper sx={{ p: 2, backgroundColor: 'white' }}>
                                   <Typography variant="body1">
                                     {classe.principal_teacher_name || classe.professeurPrincipal || classe.teacher || 'Non assigné'}
                                   </Typography>
                                 </Paper>
                               </Box>

                               {/* Liste des élèves */}
                               <Box>
                                 <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                   Liste des élèves ({classStudents.length})
                                 </Typography>
                                 {loadingStudents ? (
                                   <Paper sx={{ p: 2, backgroundColor: 'white', textAlign: 'center' }}>
                                     <Typography>Chargement des élèves...</Typography>
                                   </Paper>
                                 ) : classStudents.length > 0 ? (
                                   <Paper sx={{ backgroundColor: 'white' }}>
                                     <List dense>
                                       {classStudents.map((student: any, index: number) => (
                                         <ListItem key={student.id || index} divider>
                                           <ListItemAvatar>
                                             <Avatar>
                                               <PersonIcon />
                                             </Avatar>
                                           </ListItemAvatar>
                                           <ListItemText
                                             primary={`${student.first_name || student.prenom || ''} ${student.last_name || student.nom || ''}`}
                                             secondary={`Matricule: ${student.registration_number || student.matricule || student.student_id || 'N/A'}`}
                                           />
                                         </ListItem>
                                       ))}
                                     </List>
                                   </Paper>
                                 ) : (
                                   <Paper sx={{ p: 2, backgroundColor: 'white', textAlign: 'center' }}>
                                     <Typography color="text.secondary">
                                       Aucun élève trouvé dans cette classe
                                     </Typography>
                                   </Paper>
                                 )}
                               </Box>
                             </Paper>
                           </Grid>
                         )}
                       </Grid>
                     );
                   })}
                 </Grid>
              </Grid>
            )}

            {/* Message si le niveau sélectionné n'a pas de classes */}
            {selectedNiveau && (!groupedClasses[selectedNiveau] || groupedClasses[selectedNiveau].length === 0) && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    Aucune classe pour le niveau {selectedNiveau}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Vous pouvez créer une nouvelle classe pour ce niveau en utilisant le bouton "Nouvelle Classe".
                  </Typography>
                </Paper>
              </Grid>
            )}

          </Grid>
        </Container>
        <Dialog open={open} onClose={() => {
          setOpen(false);
        }}>
          <DialogTitle>Ajouter une nouvelle classe</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nom de la classe"
              fullWidth
              value={newClass.name}
              onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
              name="name"
            />
            <FormControl fullWidth margin="dense">
              <InputLabel id="niveau-label">Niveau</InputLabel>
              <Select
                labelId="niveau-label"
                value={newClass.level}
                label="Niveau"
                onChange={(e) => {
                  setNewClass({ ...newClass, level: e.target.value });
                }}
                name="level"
              >
                <MenuItem value="6ème">6ème</MenuItem>
                <MenuItem value="5ème">5ème</MenuItem>
                <MenuItem value="4ème">4ème</MenuItem>
                <MenuItem value="3ème">3ème</MenuItem>
                <MenuItem value="Seconde">Seconde</MenuItem>
                <MenuItem value="Première">Première</MenuItem>
                <MenuItem value="Terminale">Terminale</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel id="add-teacher-label">Professeur principal</InputLabel>
              <Select
                labelId="add-teacher-label"
                value={newClass.principalTeacher || ''}
                label="Professeur principal"
                onChange={(e) => setNewClass({ ...newClass, principalTeacher: e.target.value })}
                name="principalTeacher"
                disabled={loadingAllTeachers}
              >
                <MenuItem value="">
                  <em>Sélectionner un professeur</em>
                </MenuItem>
                {allTeachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {loadingAllTeachers && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Chargement des professeurs...
              </Typography>
            )}

            
            {/* Information sur les modalités de paiement */}
            <Alert severity="info" sx={{ mt: 3, mb: 2 }}>
              <Typography variant="body2">
                <strong>Modalités de paiement :</strong> Les modalités de paiement sont automatiquement assignées depuis le niveau sélectionné.
                <br />
                • Pour modifier les modalités, utilisez la page "Gestion des Niveaux"
                • Toutes les classes d'un même niveau auront les mêmes modalités
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Annuler</Button>
            <Button variant="contained" onClick={handleAddClass}>Ajouter</Button>
          </DialogActions>
        </Dialog>
        {/* Modale d'édition */}
        <Dialog open={editOpen} onClose={handleEditClose}>
          <DialogTitle>Modifier la classe</DialogTitle>
          <DialogContent>
            {editClass && (
              <>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Nom de la classe"
                  fullWidth
                  value={editClass.name}
                  onChange={handleEditChange}
                  name="name"
                />
                <FormControl fullWidth margin="dense">
                  <InputLabel id="edit-niveau-label">Niveau</InputLabel>
                  <Select
                    labelId="edit-niveau-label"
                    value={editClass.level}
                    label="Niveau"
                    onChange={(e) => {
                      handleEditChange({ target: { name: 'level', value: e.target.value } });
                    }}
                    name="level"
                  >
                    <MenuItem value="6ème">6ème</MenuItem>
                    <MenuItem value="5ème">5ème</MenuItem>
                    <MenuItem value="4ème">4ème</MenuItem>
                    <MenuItem value="3ème">3ème</MenuItem>
                    <MenuItem value="Seconde">Seconde</MenuItem>
                    <MenuItem value="Première">Première</MenuItem>
                    <MenuItem value="Terminale">Terminale</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <InputLabel id="edit-teacher-label">Professeur principal</InputLabel>
                  <Select
                    labelId="edit-teacher-label"
                    value={editClass.principalTeacher || ''}
                    label="Professeur principal"
                    onChange={(e) => handleEditChange({ target: { name: 'principalTeacher', value: e.target.value } })}
                    name="principalTeacher"
                    disabled={loadingTeachers}
                  >
                    <MenuItem value="">
                      <em>Sélectionner un professeur</em>
                    </MenuItem>
                    {classTeachers.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {loadingTeachers && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Chargement des professeurs...
                  </Typography>
                )}
                {!loadingTeachers && classTeachers.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Aucun professeur trouvé pour cette classe dans l'année scolaire {schoolYear}
                  </Typography>
                )}

                
                {/* Information sur les modalités de paiement */}
                <Alert severity="info" sx={{ mt: 3, mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Modalités de paiement :</strong> Les modalités de paiement sont automatiquement assignées depuis le niveau sélectionné.
                    <br />
                    • Pour modifier les modalités, utilisez la page "Gestion des Niveaux"
                    • Toutes les classes d'un même niveau auront les mêmes modalités
                  </Typography>
                </Alert>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditClose}>Annuler</Button>
            <Button variant="contained" onClick={handleEditSubmit}>Enregistrer</Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};



export default Classes; 