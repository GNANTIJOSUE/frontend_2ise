import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  Snackbar,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  Fade,
  Zoom,
  Divider,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import frLocale from 'date-fns/locale/fr';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import { blue, green, orange, purple, pink } from '@mui/material/colors';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import SecretarySidebar from '../components/SecretarySidebar';
import { useInscriptionStatus } from '../hooks/useInscriptionStatus';
import InscriptionClosedMessage from '../components/InscriptionClosedMessage';

const steps = ['Inscription complète'];

interface RegistrationForm {
  // Informations personnelles
  matricule: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  gender: string;
  nationality: string;
  birth_place: string;
  address: string;
  city: string;
  phone: string;
  email: string;

  // Informations académiques
  previousSchool: string;
  previousClass: string;
  desiredClass: string | number;
  desiredClassName: string;

  // Informations parent
  parentFirstName: string;
  parentLastName: string;
  parentPhone: string;
  parentEmail: string;
  parentContact: string;

  // Nouveau champ pour le montant payé
  paymentAmount: string;
  paymentMethod: string; // Added for payment method
  checkNumber: string; // Added for check payment
  bankName: string; // Added for check payment
  issueDate: string; // Added for check payment
  transferNumber: string; // Added for transfer payment
  transferBank: string; // Added for transfer payment
  is_assigned?: boolean;
  amountAffecte?: number; // Added for dynamic amount
  amountNonAffecte?: number; // Added for dynamic amount
}

// Ajoute ce type pour éviter l'erreur TypeScript si besoin
declare global {
  interface Window {
    MonnaieFusion?: any;
  }
}

const Receipt = ({ data, onClose, receiptRef, getRoleLabel }: {
  data: any,
  onClose: () => void,
  receiptRef: React.RefObject<HTMLDivElement>,
  getRoleLabel: (role: string) => string,
}) => {
  const isCheckPayment = data.payment_method === 'check';
  // Pour le reste à payer, on utilise la scolarité totale (data.total_due) moins le montant versé
  const remaining = isCheckPayment ? (data.total_due || 0) : (data.total_due || 0) - (data.payment_amount || 0);

  const handlePrint = () => {
    if (receiptRef.current) {
      const printContents = receiptRef.current.innerHTML;
      const printWindow = window.open('', '', 'height=700,width=900');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Reçu d\'inscription</title>');
        printWindow.document.write(`
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Roboto', sans-serif;
              background: #f5f7fa;
              color: #333;
              line-height: 1.6;
            }
            
            .receipt-container {
              max-width: 800px;
              margin: 10px auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 16px rgba(0,0,0,0.1);
              overflow: hidden;
              position: relative;
              padding: 16px;
            }
            
            .receipt-container::before {
              content: "";
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, #1976d2, #42a5f5, #1976d2);
            }
            
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #e0e0e0;
              margin-bottom: 16px;
            }
            
            .logo-section {
              display: flex;
              align-items: center;
              gap: 16px;
            }
            
            .logo-circle {
              width: 60px;
              height: 60px;
              border-radius: 50%;
              background: #1976d2;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 1.5rem;
              font-weight: bold;
              box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
            }
            
            .logo-circle img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              border-radius: 50%;
            }
            
            .school-info h6 {
              font-weight: 700;
              color: #1976d2;
              margin-bottom: 4px;
              font-size: 1.1rem;
            }
            
            .school-info p {
              color: #666;
              font-size: 0.9rem;
            }
            
            .title-section {
              text-align: right;
            }
            
            .title-section h4 {
              font-weight: 700;
              color: #1976d2;
              margin-bottom: 4px;
              font-size: 1.4rem;
            }
            
            .title-section small {
              color: #666;
              font-size: 0.8rem;
            }
            
            .section {
              margin-bottom: 16px;
            }
            
            .section-title {
              font-weight: 600;
              margin-bottom: 12px;
              color: #1976d2;
              border-bottom: 1px solid #e3f2fd;
              padding-bottom: 6px;
              font-size: 1rem;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }
            
            .info-box {
              padding: 12px;
              background: #f8f9fa;
              border-radius: 6px;
              border: 1px solid #e0e0e0;
            }
            
            .info-box h6 {
              font-weight: 600;
              margin-bottom: 8px;
              color: #1976d2;
              font-size: 0.9rem;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 6px;
            }
            
            .info-row:last-child {
              margin-bottom: 0;
            }
            
            .info-label {
              color: #666;
              font-size: 0.9rem;
            }
            
            .info-value {
              font-weight: 600;
              font-size: 0.9rem;
            }
            
            .chip {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 0.75rem;
              font-weight: 500;
              color: white;
            }
            
            .chip-primary {
              background: #1976d2;
            }
            
            .chip-secondary {
              background: #9c27b0;
            }
            
            .chip-success {
              background: #4caf50;
            }
            
            .chip-warning {
              background: #ff9800;
            }
            
            .chip-error {
              background: #f44336;
            }
            
            .payment-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }
            
            .payment-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
            }
            
            .payment-row:last-child {
              margin-bottom: 0;
            }
            
            .payment-label {
              color: #666;
              font-size: 0.9rem;
            }
            
            .payment-value {
              font-weight: 600;
              font-size: 0.9rem;
            }
            
            .payment-value.success {
              color: #4caf50;
            }
            
            .payment-value.warning {
              color: #ff9800;
              font-style: italic;
            }
            
            .remaining-box {
              margin-top: 12px;
              padding: 8px;
              border-radius: 6px;
              border: 2px solid;
            }
            
            .remaining-box.pending {
              background: #ffebee;
              border-color: #f44336;
            }
            
            .remaining-box.paid {
              background: #e8f5e8;
              border-color: #4caf50;
            }
            
            .remaining-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .remaining-title {
              font-weight: 700;
              font-size: 1.1rem;
            }
            
            .remaining-title.pending {
              color: #f44336;
            }
            
            .remaining-title.paid {
              color: #4caf50;
            }
            
            .footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-top: 12px;
              border-top: 1px solid #e0e0e0;
              margin-top: 12px;
            }
            
            .footer small {
              color: #666;
              font-size: 0.8rem;
            }
            
            .footer .status-section {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .footer .status-label {
              font-weight: 600;
              font-size: 0.9rem;
            }
            
            .message-box {
              margin-top: 12px;
              padding: 12px;
              background: linear-gradient(45deg, #fff3e0, #ffe0b2);
              border: 2px solid #ff9800;
              border-radius: 6px;
            }
            
            .message-header {
              display: flex;
              align-items: center;
              margin-bottom: 8px;
            }
            
            .message-icon {
              color: #ff9800;
              margin-right: 12px;
              font-size: 20px;
            }
            
            .message-title {
              font-weight: bold;
              color: #e65100;
              font-size: 1rem;
            }
            
            .message-content {
              color: #333;
              line-height: 1.6;
              font-size: 0.9rem;
            }
            
            .message-content strong {
              font-weight: 600;
            }
            
            .message-footer {
              color: #e65100;
              font-style: italic;
              margin-top: 8px;
              font-size: 0.8rem;
            }
            
            @media print {
              body {
                background: white;
              }
              
              .receipt-container {
                box-shadow: none;
                margin: 0;
                border-radius: 0;
                padding: 8px;
                max-width: 100%;
              }
              
              .receipt-container::before {
                display: none;
              }
              
              .section {
                margin-bottom: 12px;
              }
              
              .info-box {
                padding: 8px;
              }
              
              .payment-row {
                margin-bottom: 6px;
              }
              
              .message-box {
                margin-top: 8px;
                padding: 8px;
              }
            }
          </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="receipt-container">');
        printWindow.document.write(printContents);
        printWindow.document.write('</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 1000);
      }
    }
  };

  const handleDownload = () => {
    if (receiptRef.current) {
      html2pdf().from(receiptRef.current).save('recu-inscription.pdf');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        justifyContent: 'center',
        background: '#f5f7fa',
        py: 4,
        px: 2,
      }}
    >
      <Paper
        ref={receiptRef}
        sx={{
          p: { xs: 3, sm: 6 },
          borderRadius: 2,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          maxWidth: 800,
          width: '100%',
          mx: 'auto',
          background: 'white',
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Header centré avec logo et titre */}
        <Box sx={{
          textAlign: 'center',
          padding: '16px 0',
          borderBottom: '1px solid #1976d2',
          marginBottom: '16px',
        }}>
          {/* Logo centré */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 1
          }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#1976d2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
            }}>
              <img 
                src="/2ISE.jpg" 
                alt="Logo École Excellence" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', 
                  borderRadius: '50%'
                }} 
              />
            </Box>
          </Box>
          
          {/* Titre principal */}
          <Typography variant="h5" sx={{
            fontWeight: 700,
            color: '#1976d2',
            mb: 0.5,
            fontSize: '1.3rem',
            textTransform: 'uppercase'
          }}>
            ÉTABLISSEMENT SCOLAIRE
          </Typography>
          
          {/* Sous-titre */}
          <Typography variant="h6" sx={{
            fontWeight: 600,
            color: '#1976d2',
            mb: 1,
            fontSize: '1.1rem'
          }}>
            REÇU D'INSCRIPTION
          </Typography>
          
          {/* Numéro et date */}
          <Typography variant="body2" sx={{
            color: '#666',
            fontWeight: 500,
            fontSize: '0.9rem'
          }}>
            {data.student_code} - {data.date}
          </Typography>
        </Box>

        {/* Ligne de séparation */}
        <Divider sx={{ my: 3, borderColor: '#1976d2', borderWidth: 1 }} />
        
        {/* Informations de l'élève */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{
            fontWeight: 700,
            color: '#1976d2',
            mb: 2,
            fontSize: '1rem',
            textTransform: 'uppercase',
            borderLeft: '3px solid #1976d2',
            pl: 1.5
          }}>
            INFORMATIONS DE L'ÉLÈVE
          </Typography>
          
          <Grid container spacing={2}>
            {/* Colonne gauche - Informations principales */}
            <Grid item xs={12} md={6}>
              <Box sx={{
                p: 2,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(102, 126, 234, 0.1)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                height: '100%',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #667eea, #764ba2)',
                  borderTopLeftRadius: '12px',
                  borderTopRightRadius: '12px',
                }
              }}>
                <Typography variant="body2" sx={{
                  fontWeight: 700,
                  color: '#667eea',
                  mb: 2,
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Informations personnelles
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, background: 'rgba(102, 126, 234, 0.05)', borderRadius: '6px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>Nom & Prénoms:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8rem' }}>{data.last_name} {data.first_name}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, background: 'rgba(102, 126, 234, 0.05)', borderRadius: '6px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>Matricule:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8rem' }}>{data.registration_number || 'N/A'}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, background: 'rgba(102, 126, 234, 0.05)', borderRadius: '6px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>Code Élève:</Typography>
                    <Chip 
                      label={data.student_code} 
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '20px'
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, background: 'rgba(102, 126, 234, 0.05)', borderRadius: '6px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>Classe:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8rem' }}>{data.desiredClassName}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, background: 'rgba(102, 126, 234, 0.05)', borderRadius: '6px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>Statut:</Typography>
                    <Chip 
                      label={data.is_assigned ? 'Affecté' : 'Non affecté'}
                      sx={{
                        background: data.is_assigned ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '20px'
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Colonne droite - Informations parent */}
            <Grid item xs={12} md={6}>
              <Box sx={{
                p: 2,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(118, 75, 162, 0.1)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                height: '100%',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #764ba2, #f093fb)',
                  borderTopLeftRadius: '12px',
                  borderTopRightRadius: '12px',
                }
              }}>
                <Typography variant="body2" sx={{
                  fontWeight: 700,
                  color: '#764ba2',
                  mb: 2,
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Informations parent
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, background: 'rgba(118, 75, 162, 0.05)', borderRadius: '6px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>Parent:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8rem' }}>{data.parent_first_name} {data.parent_last_name}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, background: 'rgba(118, 75, 162, 0.05)', borderRadius: '6px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>Code Parent:</Typography>
                    <Chip 
                      label={data.parent_code} 
                      sx={{
                        background: 'linear-gradient(135deg, #764ba2 0%, #f093fb 100%)',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '20px'
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, background: 'rgba(118, 75, 162, 0.05)', borderRadius: '6px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>Contact:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8rem' }}>{data.parent_phone}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, background: 'rgba(118, 75, 162, 0.05)', borderRadius: '6px' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>Date d'inscription:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8rem' }}>{data.date}</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        {/* Détails du paiement */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 2,
            p: 1.5,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <Box sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              💰
            </Box>
            <Typography variant="h6" sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.1rem'
            }}>
              Détails du Paiement
            </Typography>
          </Box>
          
          <Box sx={{
            p: 2.5,
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.1)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #10b981, #059669)',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
            }
          }}>
            <Grid container spacing={2}>
              {/* Colonne gauche - Montants principaux */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{
                    p: 1.5,
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%)',
                    borderRadius: '6px',
                    border: '1px solid rgba(102, 126, 234, 0.2)'
                  }}>
                    <Typography variant="caption" sx={{ color: '#667eea', fontWeight: 600, mb: 0.5, textAlign: 'center', fontSize: '0.7rem' }}>
                      Scolarité totale
                    </Typography>
                    <Typography variant="body2" sx={{
                      fontWeight: 700,
                      color: '#667eea',
                      textAlign: 'center',
                      fontSize: '1rem'
                    }}>
                      {Number(data.total_due || 0).toLocaleString('fr-FR')} F CFA
                    </Typography>
                  </Box>
                  
                  <Box sx={{
                    p: 1.5,
                    background: 'linear-gradient(135deg, rgba(118, 75, 162, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
                    borderRadius: '6px',
                    border: '1px solid rgba(118, 75, 162, 0.2)'
                  }}>
                    <Typography variant="caption" sx={{ color: '#764ba2', fontWeight: 600, mb: 0.5, textAlign: 'center', fontSize: '0.7rem' }}>
                      Frais d'inscription
                    </Typography>
                    <Typography variant="body2" sx={{
                      fontWeight: 700,
                      color: '#764ba2',
                      textAlign: 'center',
                      fontSize: '1rem'
                    }}>
                      {Number(data.frais_inscription || 0).toLocaleString('fr-FR')} F CFA
                    </Typography>
                  </Box>
                  
                  <Box sx={{
                    p: 1.5,
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                    borderRadius: '6px',
                    border: '1px solid rgba(245, 158, 11, 0.2)'
                  }}>
                    <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600, mb: 0.5, textAlign: 'center', fontSize: '0.7rem' }}>
                      Moyen de paiement
                    </Typography>
                    <Chip 
                      label={data.payment_method === 'cash' ? 'Espèces' : 
                             data.payment_method === 'check' ? 'Chèque' : 
                             data.payment_method === 'transfer' ? 'Virement' :
                             data.payment_method || 'Non spécifié'}
                      sx={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        padding: '4px 8px',
                        height: 'auto',
                        '& .MuiChip-label': {
                          padding: '2px 6px',
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
              
              {/* Colonne droite - Montant versé et informations supplémentaires */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {!isCheckPayment && (
                    <Box sx={{
                      p: 1.5,
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                      borderRadius: '6px',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, mb: 0.5, textAlign: 'center', fontSize: '0.7rem' }}>
                        Montant versé
                      </Typography>
                      <Typography variant="body2" sx={{
                        fontWeight: 700,
                        color: '#10b981',
                        textAlign: 'center',
                        fontSize: '1rem'
                      }}>
                        {Number(data.payment_amount).toLocaleString('fr-FR')} F CFA
                      </Typography>
                    </Box>
                  )}
                  
                  {data.payment_method === 'check' && (
                    <>
                      <Box sx={{
                        p: 1.5,
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                      }}>
                        <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600, mb: 0.5, textAlign: 'center', fontSize: '0.7rem' }}>
                          Montant du chèque
                        </Typography>
                        <Typography variant="body2" sx={{
                          fontWeight: 700,
                          color: '#ef4444',
                          textAlign: 'center',
                          fontSize: '1rem',
                          fontStyle: 'italic'
                        }}>
                          {Number(data.payment_amount).toLocaleString('fr-FR')} F CFA (en attente)
                        </Typography>
                      </Box>
                      
                      <Box sx={{
                        p: 1.5,
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                        borderRadius: '6px',
                        border: '1px solid rgba(245, 158, 11, 0.2)'
                      }}>
                        <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600, mb: 0.5, fontSize: '0.65rem' }}>
                          Numéro de chèque
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#1e293b', fontWeight: 700, fontSize: '0.8rem' }}>
                          {data.check_number}
                        </Typography>
                      </Box>
                      
                      <Box sx={{
                        p: 1.5,
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                        borderRadius: '6px',
                        border: '1px solid rgba(245, 158, 11, 0.2)'
                      }}>
                        <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600, mb: 0.5, fontSize: '0.65rem' }}>
                          Banque
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#1e293b', fontWeight: 700, fontSize: '0.8rem' }}>
                          {data.bank_name}
                        </Typography>
                      </Box>
                      
                      <Box sx={{
                        p: 1.5,
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                        borderRadius: '6px',
                        border: '1px solid rgba(245, 158, 11, 0.2)'
                      }}>
                        <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600, mb: 0.5, fontSize: '0.65rem' }}>
                          Date d'émission
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#1e293b', fontWeight: 700, fontSize: '0.8rem' }}>
                          {data.issue_date}
                        </Typography>
                      </Box>
                    </>
                  )}
                  
                  {data.payment_method === 'transfer' && (
                    <Box sx={{
                      p: 1.5,
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                      borderRadius: '6px',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                      <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 600, mb: 0.5, textAlign: 'center', fontSize: '0.7rem' }}>
                        Virement approuvé
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#1e293b', fontWeight: 500, textAlign: 'center', fontSize: '0.65rem' }}>
                        Le virement sera traité automatiquement
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
            
            {/* Reste à payer - Mise en évidence */}
            <Box sx={{
              mt: 1.5,
              p: 2,
              background: remaining > 0 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
              borderRadius: '8px',
              border: `1px solid ${remaining > 0 ? '#ef4444' : '#10b981'}`,
              textAlign: 'center',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-1px',
                left: '-1px',
                right: '-1px',
                bottom: '-1px',
                background: remaining > 0 
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '8px',
                zIndex: -1,
                opacity: 0.2,
              }
            }}>
              <Typography variant="body2" sx={{
                fontWeight: 700,
                color: remaining > 0 ? '#ef4444' : '#10b981',
                mb: 1,
                fontSize: '0.9rem'
              }}>
                Reste à payer
              </Typography>
              <Typography variant="h6" sx={{
                fontWeight: 800,
                color: remaining > 0 ? '#ef4444' : '#10b981',
                fontSize: '1.3rem',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                {remaining.toLocaleString('fr-FR')} F CFA
              </Typography>
              <Typography variant="caption" sx={{
                color: remaining > 0 ? '#ef4444' : '#10b981',
                fontWeight: 600,
                mt: 1,
                opacity: 0.8,
                fontSize: '0.75rem'
              }}>
                {remaining > 0 ? 'Paiement incomplet' : 'Paiement complet'}
              </Typography>
            </Box>
            
            {/* Note explicative */}
            <Box sx={{
              mt: 2,
              p: 2,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              position: 'relative'
            }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 1.5
              }}>
                <Box sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  ℹ️
                </Box>
                <Typography variant="body2" sx={{
                  fontWeight: 700,
                  color: '#3b82f6',
                  fontSize: '0.9rem'
                }}>
                  Note importante
                </Typography>
              </Box>
              <Typography variant="caption" sx={{
                color: '#374151',
                lineHeight: 1.4,
                fontSize: '0.8rem'
              }}>
                <strong>Le montant versé ({Number(data.payment_amount || 0).toLocaleString('fr-FR')} F CFA)</strong> est d'abord appliqué aux frais d'inscription ({Number(data.frais_inscription || 0).toLocaleString('fr-FR')} F CFA). Le solde restant sera déduit de la scolarité totale.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer avec statut et utilisateur */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          borderTop: '1px solid rgba(102, 126, 234, 0.1)',
          marginTop: '16px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          borderRadius: '8px',
          p: 2
        }}>
          <Typography variant="caption" sx={{
            color: '#64748b',
            fontWeight: 500,
            fontSize: '0.75rem',
            background: 'rgba(255,255,255,0.8)',
            padding: '6px 12px',
            borderRadius: '16px',
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}>
            {(() => {
              const userInfo = localStorage.getItem('user');
              if (userInfo) {
                try {
                  const userData = JSON.parse(userInfo);
                  const userName = userData.first_name && userData.last_name 
                    ? `${userData.first_name} ${userData.last_name}` 
                    : userData.email || 'Utilisateur connecté';
                  const roleLabel = getRoleLabel(userData.role);
                  return `${userName} (${roleLabel})`;
                } catch {
                  return 'Utilisateur connecté';
                }
              }
              return 'Utilisateur connecté';
            })()}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#64748b' }}>
              Statut:
            </Typography>
            {isCheckPayment ? 
              <Chip 
                label="Chèque en attente"
                sx={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: '20px'
                }}
              /> : 
              remaining > 0 ? 
                <Chip 
                  label="Non soldé"
                  sx={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: '20px'
                  }}
                /> : 
                <Chip 
                  label="Soldé"
                  sx={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: '20px'
                  }}
                />
            }
          </Box>
        </Box>

        <Divider sx={{ my: 3, width: '100%' }} />
        
        {/* Message informatif intégré dans le reçu pour les paiements par chèque */}
        {isCheckPayment && (
          <Box sx={{
            mt: 2,
            p: 2.5,
            background: 'linear-gradient(45deg, rgba(255, 243, 224, 0.8) 0%, rgba(255, 224, 178, 0.8) 100%)',
            border: '2px solid #ff9800',
            borderRadius: '12px',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              right: '-2px',
              bottom: '-2px',
              background: 'linear-gradient(45deg, #ff9800, #f57c00)',
              borderRadius: '12px',
              zIndex: -1,
              opacity: 0.3,
            }
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 2
            }}>
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)'
              }}>
                ⏳
              </Box>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                color: '#e65100',
                fontSize: '1rem'
              }}>
                Paiement par chèque en attente d'approbation
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{
                color: '#333',
                lineHeight: 1.4,
                fontSize: '0.8rem',
                mb: 1.5,
                display: 'block'
              }}>
                <strong>Important :</strong> Votre chèque a été soumis avec succès mais n'a pas encore été approuvé par le service comptabilité. 
                Le montant du chèque n'est donc pas encore pris en compte dans votre solde.
              </Typography>
              
              <Typography variant="caption" sx={{
                color: '#333',
                lineHeight: 1.4,
                fontSize: '0.8rem',
                mb: 1.5,
                display: 'block'
              }}>
                <strong>Prochaines étapes :</strong> Une fois que votre chèque sera approuvé par le service comptabilité, 
                vous pourrez revenir à l'école pour récupérer un reçu en bonne et due forme.
              </Typography>
            </Box>
            
            <Typography variant="caption" sx={{
              color: '#e65100',
              fontStyle: 'italic',
              fontWeight: 600,
              textAlign: 'center',
              p: 1.5,
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '6px',
              border: '1px solid rgba(255, 152, 0, 0.3)',
              fontSize: '0.75rem'
            }}>
              Merci de votre compréhension.
            </Typography>
          </Box>
        )}
      </Paper>

      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        justifyContent: 'center', 
        width: '100%', 
        maxWidth: 700, 
        mt: 2,
        flexWrap: 'wrap'
      }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleDownload}
          sx={{ 
            fontWeight: 600, 
            px: 3, 
            py: 1.5, 
            fontSize: 14,
            borderRadius: '8px',
            borderWidth: '2px',
            borderColor: '#764ba2',
            color: '#764ba2',
            '&:hover': {
              borderColor: '#667eea',
              backgroundColor: 'rgba(118, 75, 162, 0.05)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(118, 75, 162, 0.2)',
            },
            transition: 'all 0.3s ease',
            minWidth: '140px'
          }}
          startIcon={<CloudUploadIcon />}
        >
          Télécharger
        </Button>
        <Button
          variant="contained"
          onClick={handlePrint}
          sx={{ 
            fontWeight: 600, 
            px: 3, 
            py: 1.5, 
            fontSize: 14,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            },
            transition: 'all 0.3s ease',
            minWidth: '140px'
          }}
          startIcon={<PaymentIcon />}
        >
          Imprimer
        </Button>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        width: '100%', 
        maxWidth: 700, 
        mt: 1.5 
      }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ 
            fontWeight: 600, 
            px: 4, 
            py: 1.5, 
            fontSize: 14,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            },
            transition: 'all 0.3s ease',
            minWidth: '120px'
          }}
          startIcon={<CheckCircleIcon />}
        >
          Fermer
        </Button>
      </Box>
    </Box>
  );
};

// Fonction utilitaire pour convertir un étudiant backend en RegistrationForm
function mapStudentToRegistrationForm(student: any): RegistrationForm {
  student = student || {};
  return {
    matricule: student.registration_number || '',
    firstName: student.first_name || student.firstName || '',
    lastName: student.last_name || student.lastName || '',
    dateOfBirth: student.date_of_birth ? new Date(student.date_of_birth) : (student.dateOfBirth || null),
    gender: student.gender || '',
    nationality: student.nationality || '',
    birth_place: student.birth_place || '',
    address: student.address || '',
    city: student.city || '',
    phone: student.phone || '',
    email: student.email || '',
    previousSchool: student.previous_school || student.previousSchool || '',
    previousClass: student.previous_class || student.previousClass || '',
    desiredClass: '',
    desiredClassName: '',
    parentFirstName: student.parent_first_name || student.parentFirstName || '',
    parentLastName: student.parent_last_name || student.parentLastName || '',
    parentPhone: student.parent_phone || student.parentPhone || '',
    parentEmail: student.parent_email || student.parentEmail || '',
    parentContact: student.parent_contact || student.parentContact || '',
    paymentAmount: '',
    paymentMethod: 'cash', // Default to cash
    checkNumber: '',
    bankName: '',
    issueDate: '',
    transferNumber: '',
    transferBank: '',
    is_assigned: student.is_assigned || false,
    amountAffecte: student.amount_affecte || 0,
    amountNonAffecte: student.amount_non_assigned || 0,
  };
}

const InscrptionPre = ({ onClose, initialData }: { onClose: () => void, initialData?: any }) => {
  const theme = useTheme();
  const { isOpen: inscriptionsOpen, loading: statusLoading, error: statusError } = useInscriptionStatus();

  // Fonction pour obtenir le label du rôle
  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'secretary': return 'Secrétaire';
      case 'éducateur': return 'Éducateur';
      case 'comptable': return 'Comptable';
      case 'directeur_etudes': return 'Directeur des études';
      case 'directeur_general': return 'Directeur général';
      case 'censeur': return 'Censeur';
      case 'proviseur': return 'Proviseur';
      case 'principal': return 'Principal';
      case 'econome': return 'Économe';
      default: return role;
    }
  };
  const [activeStep, setActiveStep] = useState(0);
  // Initialisation du formulaire avec initialData si présente
  const [formData, setFormData] = useState<RegistrationForm>(mapStudentToRegistrationForm(initialData));
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [receiptData, setReceiptData] = useState<any | null>(null);
  // Correction : ref ici
  const receiptRef = useRef<HTMLDivElement>(null);
  const [classes, setClasses] = useState<{ id: number, name: string, level_amount: number, level_amount_non_assigned?: number, registration_fee_assigned?: number, registration_fee_non_assigned?: number }[]>([]);
  useEffect(() => {
    let isMounted = true;
    axios.get('https://2ise-groupe.com/api/classes/list', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        if (isMounted) setClasses(res.data);
      })
      .catch(() => {
        if (isMounted) setClasses([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);
  // Ajout : variables globales pour la validation du montant
  const selectedClass = classes.find(c => c.id === Number(formData.desiredClass));
  // 1. Calcul de classAmount (frais d'inscription) :
  const classAmount = selectedClass ? (formData.is_assigned ? (selectedClass.registration_fee_assigned || 0) : (selectedClass.registration_fee_non_assigned || 0)) : 0;
  const paymentAmount = Number(formData.paymentAmount);
  const isPaymentValid = selectedClass && paymentAmount > 0 && paymentAmount >= classAmount;

  // Afficher le message de fermeture si les inscriptions sont fermées
  if (statusLoading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <SecretarySidebar />
        <Box component="main" sx={{ flexGrow: 1, width: '100%', p: { xs: 1, md: 4 }, bgcolor: '#f6f8fa', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <LinearProgress sx={{ width: '50%' }} />
        </Box>
      </Box>
    );
  }

  if (!inscriptionsOpen) {
    return (
      <Box sx={{ display: 'flex' }}>
        <SecretarySidebar />
        <Box component="main" sx={{ flexGrow: 1, width: '100%', p: { xs: 1, md: 4 }, bgcolor: '#f6f8fa', minHeight: '100vh' }}>
          <InscriptionClosedMessage
            title="Inscriptions Temporairement Fermées"
            message="Les inscriptions en présentiel sont actuellement fermées. Veuillez revenir plus tard ou contacter l'administration pour plus d'informations."
            showHomeButton={true}
          />
        </Box>
      </Box>
    );
  }

  const handleNext = () => {
    // Plus besoin avec une seule étape
  };

  const handleBack = () => {
    // Plus besoin avec une seule étape
  };

  const handleSubmit = async () => {
    console.log('=== DÉBUT handleSubmit ===');
    console.log('formData:', formData);
    
    try {
      if (!formData.gender) {
        console.log('Erreur: Genre non sélectionné');
        setSnackbar({
          open: true,
          message: 'Veuillez sélectionner le genre',
          severity: 'error',
        });
        return;
      }

      // Validation pour les chèques
      if (formData.paymentMethod === 'check') {
        if (!formData.checkNumber || !formData.bankName || !formData.issueDate) {
          console.log('Erreur: Champs chèque manquants');
          setSnackbar({
            open: true,
            message: 'Pour un paiement par chèque, le numéro de chèque, la banque et la date d\'émission sont requis.',
            severity: 'error',
          });
          return;
        }
      }

      // Validation pour les virements
      if (formData.paymentMethod === 'transfer') {
        if (!formData.transferNumber || !formData.transferBank) {
          setSnackbar({ open: true, message: 'Pour un paiement par virement, le numéro de virement et la banque sont requis.', severity: 'error' });
          return;
        }
      }

      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth
          ? formData.dateOfBirth instanceof Date
            ? formData.dateOfBirth.toISOString().split('T')[0]
            : formData.dateOfBirth
          : null,
        gender: formData.gender,
        nationality: formData.nationality,
        birth_place: formData.birth_place,
        address: formData.address,
        city: formData.city,
        phone: formData.phone,
        registration_number: formData.matricule,
        email: formData.email,
        password: formData.matricule, // ou un champ mot de passe saisi
        previous_school: formData.previousSchool,
        previous_class: formData.previousClass,
        desired_class: formData.desiredClass,
        special_needs: '',
        additional_info: '',
        registration_mode: 'onsite', // mode présentiel
        parent_first_name: formData.parentFirstName,
        parent_last_name: formData.parentLastName,
        parent_phone: formData.parentPhone,
        parent_email: formData.parentEmail,
        parent_contact: formData.parentContact,
        payment_amount: Number(formData.paymentAmount) || 0,
        payment_method: formData.paymentMethod,
        check_number: formData.paymentMethod === 'check' ? formData.checkNumber : undefined,
        bank_name: formData.paymentMethod === 'check' ? formData.bankName : undefined,
        issue_date: formData.paymentMethod === 'check' ? formData.issueDate : undefined,
        transfer_number: formData.paymentMethod === 'transfer' ? formData.transferNumber : undefined,
        transfer_bank: formData.paymentMethod === 'transfer' ? formData.transferBank : undefined,
        is_assigned: formData.is_assigned,
      };
      console.log('GENRE:', formData.gender);
      console.log('PAYLOAD:', payload);
      console.log('URL:', 'https://2ise-groupe.com/api/students');
      console.log('Token:', localStorage.getItem('token'));

      const response = await axios.post(
        'https://2ise-groupe.com/api/students',
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      console.log('Réponse du serveur:', response.data);
      
          const now = new Date();
          // Calculer le montant total de la scolarité (pas seulement les frais d'inscription)
          const totalScolarite = selectedClass ? (formData.is_assigned ? (selectedClass.level_amount || 0) : (selectedClass.level_amount_non_assigned || 0)) : 0;
          
          setReceiptData({
            ...payload,
            date: now.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' }),
            student_code: response.data.student_code,
            parent_code: response.data.parent_code,
            desiredClassName: formData.desiredClassName,
            total_due: totalScolarite, // Montant total de la scolarité
            frais_inscription: classAmount, // Frais d'inscription séparés
            payment_amount: formData.paymentAmount,
            payment_method: formData.paymentMethod,
            check_number: formData.paymentMethod === 'check' ? formData.checkNumber : undefined,
            bank_name: formData.paymentMethod === 'check' ? formData.bankName : undefined,
            issue_date: formData.paymentMethod === 'check' ? formData.issueDate : undefined,
          });
      
      console.log('ReceiptData défini:', {
        ...payload,
        date: now.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' }),
        student_code: response.data.student_code,
        parent_code: response.data.parent_code,
        desiredClassName: formData.desiredClassName,
        total_due: totalScolarite,
        frais_inscription: classAmount,
        payment_amount: formData.paymentAmount,
        payment_method: formData.paymentMethod,
      });
      
          setSnackbar({
            open: true,
        message: formData.paymentMethod === 'check' 
          ? 'Inscription soumise avec succès ! Le chèque sera traité après approbation.' 
          : 'Inscription soumise avec succès !',
            severity: 'success',
        });
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      console.error('Détails de l\'erreur:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Erreur lors de l\'inscription',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderStepContent = (step: number) => {
    return (
      <Grid container spacing={3}>
        {/* Informations personnelles */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 2, borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
            📋 Informations personnelles
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Matricule"
            value={formData.matricule}
            onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
            helperText="Numéro d'identification unique de l'étudiant"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            required
            fullWidth
            label="Prénom"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            required
            fullWidth
            label="Nom"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={frLocale}>
            <DatePicker
              label="Date de naissance"
              value={formData.dateOfBirth}
              onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
              slotProps={{
                textField: { fullWidth: true },
                popper: { disablePortal: true }
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel id="genre-label">Genre</InputLabel>
            <Select
              labelId="genre-label"
              value={formData.gender}
              label="Genre"
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              MenuProps={{ disablePortal: true }}
            >
              <MenuItem value=""><em>Choisir...</em></MenuItem>
              <MenuItem value="M">Masculin</MenuItem>
              <MenuItem value="F">Féminin</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            required
            fullWidth
            label="Nationalité"
            value={formData.nationality}
            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            required
            fullWidth
            label="Lieu de naissance"
            value={formData.birth_place}
            onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Adresse"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            required
            fullWidth
            label="Ville"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            required
            fullWidth
            label="Téléphone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            required
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </Grid>

        {/* Informations du parent */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mt: 3, mb: 2, borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
            👨‍👩‍👧‍👦 Informations du parent
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            required
            fullWidth
            label="Prénom du parent"
            value={formData.parentFirstName}
            onChange={(e) => setFormData({ ...formData, parentFirstName: e.target.value })}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            required
            fullWidth
            label="Nom du parent"
            value={formData.parentLastName}
            onChange={(e) => setFormData({ ...formData, parentLastName: e.target.value })}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            required
            fullWidth
            label="Téléphone du parent"
            value={formData.parentPhone}
            onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            required
            fullWidth
            label="Email du parent"
            value={formData.parentEmail}
            onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            required
            fullWidth
            label="Contact du parent"
            value={formData.parentContact}
            onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
          />
        </Grid>

        {/* Informations académiques */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mt: 3, mb: 2, borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
            🎓 Informations académiques
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="École précédente"
            value={formData.previousSchool}
            onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            required
            fullWidth
            label="Classe précédente"
            value={formData.previousClass}
            onChange={(e) => setFormData({ ...formData, previousClass: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel id="desired-class-label">Classe souhaitée</InputLabel>
            <Select
              labelId="desired-class-label"
              value={formData.desiredClass}
              label="Classe souhaitée"
              onChange={e => {
                const classId = e.target.value;
                const selected = classes.find(c => c.id === Number(classId));
                setFormData({
                  ...formData,
                  desiredClass: classId,
                  desiredClassName: selected?.name || '',
                  amountAffecte: selected?.level_amount || 0,
                  amountNonAffecte: selected?.level_amount_non_assigned || 0,
                  paymentAmount: ''
                });
              }}
            >
              {classes.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedClass && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Montant de la scolarité : <b>{((formData.is_assigned ? (selectedClass.level_amount || 0) : (selectedClass.level_amount_non_assigned || 0)).toLocaleString('fr-FR'))} F CFA</b>
              </Typography>
              <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                Frais d'inscription requis : <b>{((formData.is_assigned ? (selectedClass.registration_fee_assigned || 0) : (selectedClass.registration_fee_non_assigned || 0)).toLocaleString('fr-FR'))} F CFA</b>
              </Typography>
            </>
          )}
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={<Checkbox checked={formData.is_assigned || false} onChange={e => setFormData({ ...formData, is_assigned: e.target.checked })} />}
            label="Affecté"
          />
        </Grid>

        {/* Informations de paiement */}
        {selectedClass && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mt: 3, mb: 2, borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
                💰 Informations de paiement
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Moyen de paiement</InputLabel>
                <Select
                  value={formData.paymentMethod}
                  label="Moyen de paiement"
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  <MenuItem value="cash">Espèces</MenuItem>
                  <MenuItem value="check">Chèque</MenuItem>
                  <MenuItem value="transfer">Virement</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                required
                fullWidth
                label="Montant du versement"
                type="number"
                value={formData.paymentAmount}
                onChange={e => setFormData({ ...formData, paymentAmount: e.target.value })}
                error={!!formData.paymentAmount && paymentAmount < (classAmount ?? 0)}
                helperText={
                  !!formData.paymentAmount && paymentAmount < (classAmount ?? 0)
                    ? `Montant insuffisant. Vous devez payer au minimum ${(classAmount ?? 0).toLocaleString('fr-FR')} F CFA (frais d'inscription complets)`
                    : ''
                }
                inputProps={{ min: classAmount || 0 }}
              />
            </Grid>
            
            {formData.paymentMethod === 'check' && (
              <>
                <Grid item xs={12} sm={4} md={3}>
                  <TextField
                    required
                    fullWidth
                    label="Numéro de chèque"
                    value={formData.checkNumber}
                    onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4} md={3}>
                  <TextField
                    required
                    fullWidth
                    label="Nom de la banque"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4} md={3}>
                  <TextField
                    required
                    fullWidth
                    label="Date d'émission"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
            
            {formData.paymentMethod === 'transfer' && (
              <>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    required
                    fullWidth
                    label="Numéro de virement"
                    value={formData.transferNumber}
                    onChange={(e) => setFormData({ ...formData, transferNumber: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    required
                    fullWidth
                    label="Nom de la banque"
                    value={formData.transferBank}
                    onChange={(e) => setFormData({ ...formData, transferBank: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="info.main" sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                    <strong>Note:</strong> Les virements sont automatiquement approuvés et impactés directement sur la scolarité de l'étudiant.
                  </Typography>
                </Grid>
              </>
            )}
          </>
        )}
      </Grid>
    );
  }

  function isStepValid(step: number): boolean {
    const basicValidation = (
      !!formData.matricule &&
      !!formData.firstName &&
      !!formData.lastName &&
      !!formData.dateOfBirth &&
      !!formData.gender &&
      !!formData.nationality &&
      !!formData.birth_place &&
      !!formData.address &&
      !!formData.city &&
      !!formData.phone &&
      !!formData.email &&
      !!formData.parentFirstName &&
      !!formData.parentLastName &&
      !!formData.parentPhone &&
      !!formData.parentEmail &&
      !!formData.parentContact &&
      !!formData.previousSchool &&
      !!formData.previousClass &&
      !!formData.desiredClass &&
      paymentAmount > 0 &&
      paymentAmount >= classAmount
    );

    // Validation supplémentaire pour les chèques
    if (formData.paymentMethod === 'check') {
      return basicValidation && 
             !!formData.checkNumber && 
             !!formData.bankName && 
             !!formData.issueDate;
    }

    // Validation supplémentaire pour les virements
    if (formData.paymentMethod === 'transfer') {
      return basicValidation && 
             !!formData.transferNumber && 
             !!formData.transferBank;
    }

    return basicValidation;
  }

  if (receiptData) {
    return (
      <Box sx={{ display: 'flex' }}>
        <SecretarySidebar />
        <Box component="main" sx={{ flexGrow: 1, width: '100%', p: { xs: 1, md: 4 }, bgcolor: '#f6f8fa', minHeight: '100vh' }}>
                          {<Receipt data={receiptData} onClose={onClose} receiptRef={receiptRef} getRoleLabel={getRoleLabel} />}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <SecretarySidebar />
      <Box component="main" sx={{ flexGrow: 1, width: '100%', p: { xs: 1, md: 4 }, bgcolor: '#f6f8fa', minHeight: '100vh' }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: '100%',
            mx: 'auto',
            p: { xs: 1, sm: 3 },
            borderRadius: 5,
            boxShadow: 6,
            background: 'white',
            position: 'relative',
            transition: 'box-shadow 0.3s',
            animation: 'fadeInUp 0.5s',
            '@keyframes fadeInUp': {
              from: { opacity: 0, transform: 'translateY(40px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Fade in={true} timeout={500}>
            <Paper sx={{
              p: { xs: 1, sm: 4 },
              borderRadius: 4,
              boxShadow: 3,
              background: 'white',
              width: '100%',
              mx: 'auto',
              mb: 2,
            }}>
              <Typography 
                variant="h4" 
                gutterBottom 
                align="center"
                sx={{
                  fontWeight: 700,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 4,
                }}
              >
                Inscription en présentiel
              </Typography>

              <Stepper 
                activeStep={activeStep} 
                sx={{ 
                  mb: 4,
                  '& .MuiStepLabel-label': {
                    fontWeight: 600,
                  },
                  '& .MuiStepIcon-root': {
                    color: theme.palette.primary.main,
                  },
                  '& .MuiStepIcon-root.Mui-active': {
                    color: theme.palette.primary.main,
                  },
                  '& .MuiStepIcon-root.Mui-completed': {
                    color: green[500],
                  },
                }}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Zoom in={true} timeout={500}>
                <Box>
                  {renderStepContent(activeStep)}
                </Box>
              </Zoom>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                mt: 4,
                pt: 3,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={onClose}
                    sx={{
                      borderColor: theme.palette.error.main,
                      color: theme.palette.error.main,
                      '&:hover': {
                        borderColor: theme.palette.error.dark,
                        backgroundColor: 'rgba(211, 47, 47, 0.04)',
                      },
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    onClick={handleSubmit}
                    disabled={!isStepValid(activeStep)}
                    sx={{
                      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                      color: 'white',
                      '&:hover': {
                        background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                      },
                      px: 4,
                    }}
                  >
                    Soumettre
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Fade>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity={snackbar.severity}
              sx={{ 
                width: '100%',
                boxShadow: 3,
                '& .MuiAlert-icon': {
                  fontSize: 24,
                },
              }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </Box>
  );
};

export default InscrptionPre; 