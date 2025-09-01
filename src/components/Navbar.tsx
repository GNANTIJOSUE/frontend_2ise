import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import LoginIcon from '@mui/icons-material/Login';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <AppBar position="sticky">
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {location.pathname !== '/' && (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ArrowBackIcon />}
              component={RouterLink}
              to="/"
              sx={{
                mr: 2,
                borderColor: 'white',
                color: 'primary.main',
                background: 'white',
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: 2,
                px: 2.5,
                py: 1,
                minWidth: 120,
                fontSize: 16,
                letterSpacing: 1,
                transition: 'all 0.2s',
                '& .MuiButton-startIcon': {
                  color: 'primary.main',
                },
                '&:hover': {
                  background: '#e3f0fc',
                  borderColor: 'primary.main',
                  color: 'primary.dark',
                  boxShadow: 4,
                },
              }}
            >
              Retour
            </Button>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 900, letterSpacing: 2, fontSize: { xs: 22, sm: 32, md: 38 }, textAlign: 'center', userSelect: 'none' }}>
                Code établissement : 189100
              </Typography>
            </Box>
            <Box sx={{ ml: { xs: 1, sm: 4, md: 8 } }}>
              {location.pathname === '/' && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<LoginIcon />}
                  component={RouterLink}
                  to="/login"
                  sx={{ fontWeight: 700, fontSize: 16, px: 3, py: 1.5, borderRadius: 2, boxShadow: 2 }}
                >
                  Connexion
                </Button>
              )}
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 