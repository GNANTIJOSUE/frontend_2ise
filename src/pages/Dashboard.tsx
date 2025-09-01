import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';
import SchoolIcon from '@mui/icons-material/School';
import GradeIcon from '@mui/icons-material/Grade';

const Dashboard = () => {
  const stats = [
    { title: 'Total Étudiants', value: '150', icon: <PeopleIcon sx={{ fontSize: 40 }} /> },
    { title: 'Classes', value: '12', icon: <ClassIcon sx={{ fontSize: 40 }} /> },
    { title: 'Professeurs', value: '25', icon: <SchoolIcon sx={{ fontSize: 40 }} /> },
    { title: 'Moyenne Générale', value: '14.5', icon: <GradeIcon sx={{ fontSize: 40 }} /> },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de bord
      </Typography>
      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: 140,
              }}
            >
              {stat.icon}
              <Typography variant="h6" component="div" sx={{ mt: 1 }}>
                {stat.title}
              </Typography>
              <Typography variant="h4" component="div">
                {stat.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard; 