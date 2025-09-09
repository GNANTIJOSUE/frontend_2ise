import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  Typography,
  Divider,
  useTheme,
  Collapse
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Class as ClassIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
  Event,
  Assessment,
  Assignment,
  ExitToApp,
  School,
  LibraryBooks,
  LocalOffer as LocalOfferIcon,
  History as HistoryIcon,
  CalendarMonth as CalendarMonthIcon,
  Receipt as ReceiptIcon,
  TableChart as TableChartIcon,
  MeetingRoom as MeetingRoomIcon,
  ExpandLess,
  ExpandMore,
  Description as DescriptionIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermissions, Permission } from '../hooks/usePermissions';

const drawerWidth = 250;

const SecretarySidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission, getRoleLabel } = usePermissions();
  const [excelMenuOpen, setExcelMenuOpen] = useState(false);

  // Définir les éléments de menu avec leurs permissions
  const menuItems: Array<{
    text: string;
    icon: React.ReactElement;
    path: string | null;
    permission: string;
    hasSubmenu?: boolean;
  }> = [
    { 
      text: 'Tableau de bord', 
      icon: <DashboardIcon />, 
      path: '/secretary/dashboard',
      permission: 'canViewDashboard'
    },
    { 
      text: 'Étudiants', 
      icon: <PeopleIcon />, 
      path: '/secretary/students',
      permission: 'canManageStudents'
    },
    { 
      text: 'Gestion des élèves', 
      icon: <GroupIcon />, 
      path: '/secretary/gestion-eleves',
      permission: 'canViewStudents'
    },
    { 
      text: 'Inscription Professeur', 
      icon: <PersonAddIcon />, 
      path: '/secretary/teachers',
      permission: 'canManageTeachers'
    },
    { 
      text: 'Classes', 
      icon: <ClassIcon />, 
      path: '/secretary/classes',
      permission: 'canViewClasses'
    },
    { 
      text: 'Niveaux', 
      icon: <School />, 
      path: '/secretary/levels',
      permission: 'canViewClasses'
    },
    { 
      text: 'Matières', 
      icon: <LibraryBooks />, 
      path: '/secretary/subjects',
      permission: 'canManageSubjects'
    },
    { 
      text: 'Gestion des emplois du temps', 
      icon: <Assignment />, 
      path: '/secretary/timetables',
      permission: 'canViewTimetables'
    },
    { 
      text: 'Gestion des salles', 
      icon: <MeetingRoomIcon />, 
      path: '/secretary/rooms',
      permission: 'canManageRooms'
    },
    { 
      text: 'Gestion des bulletins', 
      icon: <Assessment />, 
      path: '/secretary/report-cards',
      permission: 'canManageReportCards'
    },
    { 
      text: 'Événements', 
      icon: <Event />, 
      path: '/secretary/events',
      permission: 'canManageEvents'
    },
    { 
      text: 'Paiements', 
      icon: <PaymentIcon />, 
      path: '/secretary/payments',
      permission: 'canManagePayments'
    },
    { 
      text: 'Bons et Prises en Charge', 
      icon: <LocalOfferIcon />, 
      path: '/secretary/discounts',
      permission: 'canViewDiscounts'
    },
    { 
      text: 'Gestion des chèques', 
      icon: <ReceiptIcon />, 
      path: '/secretary/checks',
      permission: 'canManageChecks'
    },
    { 
      text: 'Gestion des relances', 
      icon: <PaymentIcon />, 
      path: '/secretary/payment-modalities',
      permission: 'canManagePayments'
    },
    { 
      text: 'Gestion des trimestres', 
      icon: <School />, 
      path: '/secretary/trimesters',
      permission: 'canManageTrimesters'
    },
    { 
      text: 'Gérer les années scolaires et les inscriptions', 
      icon: <CalendarMonthIcon />, 
      path: '/secretary/school-years',
      permission: 'canManageInscriptions'
    },
    { 
      text: 'Paramètres', 
      icon: <SettingsIcon />, 
      path: '/secretary/settings',
      permission: 'canManageSettings'
    },
    { 
      text: 'Gérer les rôles', 
      icon: <SettingsIcon />, 
      path: '/secretary/roles',
      permission: 'canManageRoles'
    },
    { 
      text: 'Historique', 
      icon: <HistoryIcon />, 
      path: '/secretary/history',
      permission: 'canViewHistory'
    },
    { 
      text: 'Frais Annexes', 
      icon: <LocalOfferIcon />, 
      path: '/secretary/annex-fees',
      permission: 'canManagePayments'
    },
    { 
      text: 'Fichier Excel', 
      icon: <TableChartIcon />, 
      path: null, // Pas de navigation directe, on gère le menu déroulant
      permission: 'canManageExcelFiles',
      hasSubmenu: true
    },
  ];

  // Filtrer les éléments de menu selon les permissions
  const filteredMenuItems = menuItems.filter(item => hasPermission(item.permission as keyof Permission));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleExcelMenuToggle = () => {
    setExcelMenuOpen(!excelMenuOpen);
  };

  const handleExcelSubmenuClick = (type: 'moyennes' | 'recap') => {
    // Navigation vers la page ExcelFiles avec un paramètre pour identifier le type
    navigate(`/secretary/excel-files?type=${type}`);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'linear-gradient(135deg, #1976d2 60%, #512da8 100%)',
          color: 'white',
          borderRight: 'none',
          boxShadow: 4,
          background: 'linear-gradient(135deg, #1976d2 60%, #512da8 100%)',
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.06)' }}>
        <img src="https://2ise-groupe.com/2ISE.jpg" alt="Logo" style={{ width: 48, height: 48, borderRadius: 5, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
        <Box>
          <Typography variant="h5" noWrap component="div" sx={{ fontWeight: 700, letterSpacing: 1 }}>
            {user ? getRoleLabel(user.role) : 'Admin'}
          </Typography>
          {user && (
            <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.8rem' }}>
              {user.first_name} {user.last_name}
            </Typography>
          )}
        </Box>
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
      <List sx={{ mt: 2 }}>
        {filteredMenuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  if (item.hasSubmenu) {
                    handleExcelMenuToggle();
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(255,255,255,0.18)',
                    color: '#1976d2',
                    fontWeight: 700,
                    '& .MuiListItemIcon-root': {
                      color: '#1976d2',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.10)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 40, fontSize: 24 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500, fontSize: 17 }} />
                {item.hasSubmenu && (excelMenuOpen ? <ExpandLess /> : <ExpandMore />)}
              </ListItemButton>
            </ListItem>
            
            {/* Menu déroulant pour Fichier Excel */}
            {item.hasSubmenu && (
              <Collapse in={excelMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton
                    sx={{
                      pl: 6,
                      borderRadius: 2,
                      mx: 1,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.08)',
                      },
                      transition: 'all 0.2s',
                    }}
                    onClick={() => handleExcelSubmenuClick('moyennes')}
                  >
                    <ListItemIcon sx={{ color: 'white', minWidth: 36 }}>
                      <BarChartIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Exporter les détails des moyennes et rang des élèves" 
                      primaryTypographyProps={{ fontWeight: 400, fontSize: 15 }}
                    />
                  </ListItemButton>
                  
                  <ListItemButton
                    sx={{
                      pl: 6,
                      borderRadius: 2,
                      mx: 1,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.08)',
                      },
                      transition: 'all 0.2s',
                    }}
                    onClick={() => handleExcelSubmenuClick('recap')}
                  >
                    <ListItemIcon sx={{ color: 'white', minWidth: 36 }}>
                      <DescriptionIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Exporter le récap des élèves" 
                      primaryTypographyProps={{ fontWeight: 400, fontSize: 15 }}
                    />
                  </ListItemButton>
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              mx: 1,
              mb: 2,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.10)',
              },
              transition: 'all 0.2s',
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Déconnexion" primaryTypographyProps={{ fontWeight: 500, fontSize: 17 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default SecretarySidebar; 