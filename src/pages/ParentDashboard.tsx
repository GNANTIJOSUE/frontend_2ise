import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, IconButton, Badge, Menu, MenuItem, ListItemText, ListItemIcon, Paper, Stack, FormControl, InputLabel, Select, Card, CardContent, Grid, Chip, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LogoutIcon from '@mui/icons-material/Logout';
import SchoolIcon from '@mui/icons-material/School';
import VisibilityIcon from '@mui/icons-material/Visibility';

const ParentDashboard = () => {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifCount, setNotifCount] = useState(0);

  // Pour le menu déroulant
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleNotifClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleNotifClose = () => {
    setAnchorEl(null);
  };

  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const handleNotifDetail = (notif: any) => {
    setSelectedNotif(notif);
    setOpenDialog(true);
    handleNotifClose();
    // Marquer la notification comme lue
    markNotificationAsRead(notif.id);
  };
  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedNotif(null);
  };

  // Fonction pour marquer une notification comme lue
  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`https://2ise-groupe.com/api/events/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Mettre à jour l'état local
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: 1 } : n
      ));
      setNotifCount(prev => Math.max(0, notifications.filter(n => !n.is_read && n.id !== notificationId).length));
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
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setNotifCount(0);
      // Fermer le menu après le marquage
      setAnchorEl(null);
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
    }
  };

  const getCurrentSchoolYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    if (month >= 9) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };
  const getSchoolYears = (count = 5) => {
    const current = getCurrentSchoolYear();
    const startYear = parseInt(current.split('-')[0], 10);
    return Array.from({ length: count }, (_, i) => {
      const start = startYear - i;
      return `${start}-${start + 1}`;
    });
  };

  const [schoolYear, setSchoolYear] = useState(getCurrentSchoolYear());
  const [publishedBulletins, setPublishedBulletins] = useState<{ [childId: string]: any[] }>({});
  const [loadingBulletins, setLoadingBulletins] = useState<{ [childId: string]: boolean }>({});
  const [parent, setParent] = useState<any>(null);
  const [parentLoading, setParentLoading] = useState(false);
  const [parentError, setParentError] = useState<string | null>(null);

  // Fonction pour récupérer les bulletins publiés d'un enfant
  const fetchChildBulletins = async (childId: string) => {
    try {
      setLoadingBulletins(prev => ({ ...prev, [childId]: true }));
      const token = localStorage.getItem('token');
      console.log(`[ParentDashboard] Récupération des bulletins pour l'étudiant ${childId}, année ${schoolYear}`);
      
      const { data } = await axios.get(`https://2ise-groupe.com/api/report-cards/student-bulletins?student_id=${childId}&school_year=${schoolYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`[ParentDashboard] Bulletins reçus pour ${childId}:`, data.bulletins);
      setPublishedBulletins(prev => ({ ...prev, [childId]: data.bulletins }));
    } catch (error) {
      console.error('Erreur lors de la récupération des bulletins:', error);
      setPublishedBulletins(prev => ({ ...prev, [childId]: [] }));
    } finally {
      setLoadingBulletins(prev => ({ ...prev, [childId]: false }));
    }
  };

  // Fonction pour voir les détails d'un bulletin
  const handleViewBulletin = (childId: string, semester: string) => {
    navigate(`/parent/bulletin/${childId}/${encodeURIComponent(semester)}`);
  };

  // Fonction pour récupérer les informations du parent
  const fetchParent = async () => {
    const token = localStorage.getItem('token');
    setParentLoading(true);
    setParentError(null);
    try {
      const { data } = await axios.get(`https://2ise-groupe.com/api/parents/me?school_year=${schoolYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParent(data);
      console.log(`[ParentDashboard] Informations parent récupérées pour l'année ${schoolYear}:`, data);
      
      // Vérifier s'il y a des enfants pour cette année scolaire
      if (data.children && data.children.length === 0) {
        setParentError(`Aucun enfant inscrit pour l'année scolaire ${schoolYear}`);
      }
    } catch (error: any) {
      console.error(`[ParentDashboard] Erreur lors de la récupération des informations parent pour l'année ${schoolYear}:`, error);
      
      if (error.response?.status === 404) {
        // Vérifier si c'est l'erreur "Paiement non trouvé" (conflit de routes)
        if (error.response?.data?.message === 'Paiement non trouvé') {
          setParentError(`Erreur temporaire du serveur. Veuillez réessayer dans quelques minutes ou contacter l'administration.`);
          console.error('[ParentDashboard] Erreur de conflit de routes détectée - serveur non redémarré');
        } else {
          setParentError(`Aucun enfant inscrit pour l'année scolaire ${schoolYear}`);
        }
      } else {
        setParentError('Erreur lors de la récupération des informations parent');
      }
      setParent(null);
    } finally {
      setParentLoading(false);
    }
  };

  useEffect(() => {
    const fetchChildren = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const parent_code = user.parent_code;
      if (!parent_code) {
        setChildren([]);
        setLoading(false);
        return;
      }
      try {
        // Utiliser l'API parent au lieu de students/list pour avoir toutes les informations
        const { data } = await axios.get(`https://2ise-groupe.com/api/parents/me?school_year=${schoolYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Données des enfants reçues via API parent:', data);
        
        // Extraire les enfants des données parent et regrouper par ID d'élève
        if (data.children && data.children.length > 0) {
          // Regrouper les inscriptions par élève
          const childrenMap = new Map();
          
          data.children.forEach((child: any) => {
            if (!childrenMap.has(child.id)) {
              // Premier enregistrement de cet élève
              childrenMap.set(child.id, {
                ...child,
                enrollments: [{
                  schoolYear: child.schoolYear,
                  className: child.className,
                  enrollmentDate: child.enrollmentDate,
                  enrollmentStatus: child.enrollmentStatus,
                  enrollmentType: child.enrollmentType
                }]
              });
            } else {
              // Ajouter cette inscription à l'élève existant
              const existingChild = childrenMap.get(child.id);
              existingChild.enrollments.push({
                schoolYear: child.schoolYear,
                className: child.className,
                enrollmentDate: child.enrollmentDate,
                enrollmentStatus: child.enrollmentStatus,
                enrollmentType: child.enrollmentType
              });
            }
          });
          
          // Convertir la Map en tableau
          const uniqueChildren = Array.from(childrenMap.values());
          console.log('Enfants uniques avec inscriptions groupées:', uniqueChildren);
          setChildren(uniqueChildren);
          
          // Récupérer les bulletins publiés pour chaque enfant
          uniqueChildren.forEach((child: any) => {
            fetchChildBulletins(child.id);
          });
        } else {
          setChildren([]);
        }
      } catch (e) {
        console.error('Erreur lors de la récupération des enfants:', e);
        setChildren([]);
      }
      setLoading(false);
    };
    fetchChildren();

    // Récupère les notifications réelles (tous types) filtrées par année scolaire
    const fetchNotifications = async () => {
      const token = localStorage.getItem('token');
      try {
        const { data } = await axios.get(`https://2ise-groupe.com/api/events/my-notifications?school_year=${schoolYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('[FRONT][ParentDashboard] Notifications reçues pour année', schoolYear, ':', data);
        setNotifications(data);
        setNotifCount(data.filter((n: any) => !n.is_read).length);
      } catch (e) {
        setNotifications([]);
        setNotifCount(0);
      }
    };
    fetchNotifications();

    // Appeler fetchParent au chargement initial
    fetchParent();
  }, [schoolYear]);

  // Déconnexion
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (loading) return <CircularProgress />;
  if (!children.length) return <Typography>
    Aucun enfant trouvé pour ce compte parent.
  </Typography>;

  return (
    <Box sx={{ p: 4, minHeight: '100vh', background: 'linear-gradient(135deg, #e3f0ff 0%, #f8e1ff 100%)' }}>
      {/* En-tête avec notifications */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="primary.main">
          Tableau de bord Parent
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Année scolaire</InputLabel>
            <Select
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              label="Année scolaire"
            >
              {getSchoolYears().map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton color="primary" onClick={handleNotifClick}>
            <Badge badgeContent={notifCount} color="error">
              <NotificationsIcon sx={{ fontSize: 32 }} />
            </Badge>
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ 
              borderRadius: 3,
              // Sur mobile, masquer le texte et garder seulement l'icône
              '& .MuiButton-startIcon': {
                margin: 0,
                '@media (max-width: 600px)': {
                  margin: 0
                }
              },
              '@media (max-width: 600px)': {
                minWidth: 'auto',
                width: 48,
                height: 48,
                padding: 0,
                '& .MuiButton-startIcon': {
                  margin: 0
                }
              }
            }}
          >
            <Box sx={{ 
              display: { xs: 'none', sm: 'block' } // Masquer le texte sur mobile
            }}>
              Déconnexion
            </Box>
          </Button>
        </Box>
      </Box>

      {/* Section des bulletins publiés */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #f3e5f5 0%, #e8f5e8 100%)' }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3, color: '#2e7d32', display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon /> Bulletins publiés de vos enfants
        </Typography>
        
        {/* Message d'information pour l'année scolaire */}
                    {parentError && (
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                <Typography variant="body1">
                  {parentError}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {parentError.includes('Erreur temporaire') ? (
                    <>
                      Le serveur est en cours de maintenance. 
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={fetchParent}
                        sx={{ ml: 2 }}
                      >
                        Réessayer
                      </Button>
                    </>
                  ) : (
                    'Changez d\'année scolaire pour voir les bulletins d\'autres années.'
                  )}
                </Typography>
              </Alert>
            )}
        
        <Grid container spacing={3}>
          {children.map((child) => (
            <Grid item xs={12} md={6} key={child.id}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, border: '2px solid #e0e0e0' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={700} color="primary.main">
                      {child.last_name} {child.first_name}
                    </Typography>
                    <Chip 
                      label={child.classe || child.class_name || child.classe_name || 'Non assigné'} 
                      color="secondary" 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                  
                  {loadingBulletins[child.id] ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <Box>
                      {publishedBulletins[child.id] && publishedBulletins[child.id].length > 0 ? (
                        <Stack spacing={1}>
                          {publishedBulletins[child.id].map((bulletin: any) => (
                            <Paper 
                              key={bulletin.id} 
                              sx={{ 
                                p: 2, 
                                borderRadius: 2, 
                                background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)',
                                border: '1px solid #4caf50'
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight={600} color="#2e7d32">
                                    {bulletin.semester}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Publié le {new Date(bulletin.published_at).toLocaleDateString('fr-FR')}
                                  </Typography>
                                </Box>
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<VisibilityIcon />}
                                  onClick={() => handleViewBulletin(child.id, bulletin.semester)}
                                  sx={{ borderRadius: 2, px: 2 }}
                                >
                                  Voir le bulletin
                                </Button>
                              </Box>
                            </Paper>
                          ))}
                        </Stack>
                      ) : (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          <Typography variant="body2">
                            Aucun bulletin publié pour {child.first_name} pour l'année scolaire {schoolYear}.
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Section des enfants */}
      <Paper sx={{ p: 3, borderRadius: 3, background: 'white' }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3, color: 'primary.main' }}>
          Vos enfants
        </Typography>
        
        {/* Message d'information sur les inscriptions */}
        {parent && parent.summary && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body1">
              {parent.message}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Résumé : {parent.summary.currentYear} enfant(s) pour l'année {schoolYear}, 
              {parent.summary.previousYear} enfant(s) pour les années précédentes
            </Typography>
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {children.map((child) => (
            <Grid item xs={12} md={6} key={child.id}>
              <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                        {child.lastName} {child.firstName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Matricule: {child.registrationNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Classe actuelle: {child.className || 'Non assigné'}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`${child.enrollments?.length || 0} inscription(s)`}
                      color="primary" 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                  
                  {/* Historique des inscriptions */}
                  {child.enrollments && child.enrollments.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        📚 Historique des inscriptions
                      </Typography>
                      {child.enrollments.map((enrollment: any, index: number) => (
                        <Box key={index} sx={{ 
                          mb: 1, 
                          p: 1.5, 
                          bgcolor: enrollment.enrollmentType === 'current_year' ? '#e8f5e8' : 
                                    enrollment.enrollmentType === 'previous_year' ? '#fff3e0' : '#f5f5f5',
                          borderRadius: 1.5,
                          border: `1px solid ${enrollment.enrollmentType === 'current_year' ? '#4caf50' : 
                                               enrollment.enrollmentType === 'previous_year' ? '#ff9800' : '#e0e0e0'}`
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {enrollment.className}
                            </Typography>
                            <Chip 
                              label={enrollment.enrollmentType === 'current_year' ? 'Année courante' : 
                                     enrollment.enrollmentType === 'previous_year' ? 'Année précédente' : 
                                     'Sans inscription'} 
                              color={enrollment.enrollmentType === 'current_year' ? 'success' : 
                                     enrollment.enrollmentType === 'previous_year' ? 'warning' : 'default'} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Année scolaire: {enrollment.schoolYear}
                          </Typography>
                          {enrollment.enrollmentDate && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Date d'inscription: {new Date(enrollment.enrollmentDate).toLocaleDateString('fr-FR')}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            Statut: {enrollment.enrollmentStatus === 'active' ? 'Active' : enrollment.enrollmentStatus}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                  
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/parent/child/${child.id}`)}
                    sx={{ borderRadius: 2 }}
                  >
                    Voir le profil complet
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {/* Message si aucun enfant trouvé */}
        {children.length === 0 && !loading && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body1">
              Aucun enfant trouvé pour cette année scolaire.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Changez d'année scolaire pour voir les informations de vos enfants.
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Menu des notifications */}
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
            Notifications
          </Typography>
          {notifications.length > 0 && (
            <Button
              size="small"
              onClick={markAllNotificationsAsRead}
              sx={{ fontSize: 12 }}
            >
              Tout marquer comme lu
            </Button>
          )}
        </Box>
        {notifications.length === 0 ? (
          <MenuItem>
            <ListItemText primary="Aucune notification" />
          </MenuItem>
        ) : (
          notifications.map((notif) => (
            <MenuItem key={notif.id} onClick={() => handleNotifDetail(notif)}>
              <ListItemIcon>
                {notif.is_read ? <CheckCircleIcon color="success" /> : <InfoIcon color="primary" />}
              </ListItemIcon>
              <ListItemText
                primary={notif.title}
                secondary={
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: 12 }}>
                      {notif.message}
                    </Typography>
                    {notif.event_date && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, display: 'block', mt: 0.5 }}>
                        📅 {new Date(notif.event_date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    )}
                  </Box>
                }
                sx={{ '& .MuiListItemText-secondary': { fontSize: 12 } }}
              />
            </MenuItem>
          ))
        )}
      </Menu>

      {/* Dialog pour les détails de notification */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box>
            <Typography variant="h6">{selectedNotif?.title}</Typography>
            {selectedNotif?.event_date && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                📅 Événement prévu le {new Date(selectedNotif.event_date).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {selectedNotif?.message}
          </Typography>
          {selectedNotif?.event_date && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                📅 Détails de l'événement
              </Typography>
              <Typography variant="body2">
                Date et heure : {new Date(selectedNotif.event_date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParentDashboard; 