import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface DebugStatsProps {
  studentId?: number;
  studentName?: string;
}

const DebugStats: React.FC<DebugStatsProps> = ({ studentId, studentName }) => {
  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
      <Typography variant="h6" color="primary" gutterBottom>
        Debug Info
      </Typography>
      <Box>
        <Typography variant="body2">
          <strong>Student ID:</strong> {studentId || 'N/A'}
        </Typography>
        <Typography variant="body2">
          <strong>Student Name:</strong> {studentName || 'N/A'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <em>Debug component - Remove in production</em>
        </Typography>
      </Box>
    </Paper>
  );
};

export default DebugStats; 