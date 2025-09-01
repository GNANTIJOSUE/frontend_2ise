import React, { useState, useRef } from 'react';
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
  Alert,
  Snackbar,
  Card,
  CardContent,
  IconButton,
  useTheme,
  Fade,
  Zoom,
  Divider,
  CircularProgress,
} from '@mui/material';
import { DatePicker, MobileDatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import frLocale from 'date-fns/locale/fr';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import { green } from '@mui/material/colors';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { useMediaQuery } from '@mui/material';
import { format } from 'date-fns';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useInscriptionStatus } from '../hooks/useInscriptionStatus';
import InscriptionClosedMessage from '../components/InscriptionClosedMessage';
import { 
  validateName, 
  validateAddress, 
  validateCity, 
  validatePhone, 
  validateMatricule, 
  validateSchool, 
  validateClass, 
  validateNationality, 
  validateBirthPlace 
} from '../utils/validationUtils';

const steps = ['Informations personnelles', 'Informations académiques'];

interface Document {
  id: string;
  name: string;
  file: File | null;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
}

interface RegistrationForm {
  // Informations personnelles
  matricule: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // string au lieu de Date | null
  gender: string;
  nationality: string;
  birthPlace: string;
  address: string;
  city: string;
  phone: string;

  // Informations académiques
  previousSchool: string;
  previousClass: string;
  specialNeeds: string;
  additionalInfo: string;

  // Documents
  documents: Document[];

  // Informations parent
  parentFirstName: string;
  parentLastName: string;
  parentPhone: string;
}

const Receipt = ({ data, onClose, receiptRef, handleDownload }: {
  data: any,
  onClose: () => void,
  receiptRef: React.RefObject<HTMLDivElement>,
  handleDownload: () => void,
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      justifyContent: 'center',
      background: '#f5f7fa',
      py: 4,
    }}
  >
    <Paper
      ref={receiptRef}
      sx={{
        p: 4,
        borderRadius: 4,
        boxShadow: 6,
        maxWidth: 400,
        width: '100%',
        mx: 'auto',
        mb: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <img src="https://2ise-groupe.com/2ISE.jpg" alt="Logo" style={{ width: 90, height: 90, objectFit: 'contain' }} />
      </Box>
      <Typography align="center" color="primary" sx={{ fontWeight: 700, mb: 1, fontSize: 20, letterSpacing: 1 }}>
        Pré-inscription en ligne
      </Typography>
      <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
        Reçu de pré-inscription
      </Typography>
      <Divider sx={{ mb: 2, width: '100%' }} />
      <Box sx={{ width: '100%' }}>
        <Typography sx={{ mb: 1 }}>
          <b>Nom :</b> {data.last_name} {data.first_name}
        </Typography>
        <Typography sx={{ mb: 1 }}>
          <b>Matricule :</b> {data.registration_number}
        </Typography>
        <Typography sx={{ mb: 1 }}>
          <b>Date et heure :</b> {data.date}
        </Typography>
        <Divider sx={{ my: 2, width: '100%' }} />
        <Typography sx={{ mb: 1 }}>
          <b>Parent :</b> {data.parent_first_name} {data.parent_last_name}
        </Typography>
        <Typography sx={{ mb: 1 }}>
          <b>Téléphone parent :</b> {data.parent_phone}
        </Typography>
      </Box>
      <Divider sx={{ my: 2, width: '100%' }} />
      <Typography variant="body1" align="center" color="primary" sx={{ mt: 2, fontWeight: 500 }}>
        Veuillez vous présenter à l'établissement avec ce reçu pour finaliser votre inscription et obtenir vos codes d'accès. Le code parent vous sera fourni lors de la finalisation.
      </Typography>
    </Paper>
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', width: '100%', maxWidth: 400 }}>
      <Button
        variant="outlined"
        color="secondary"
        fullWidth
        onClick={handleDownload}
        sx={{ fontWeight: 600 }}
      >
        Télécharger le reçu
      </Button>
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={onClose}
        sx={{ fontWeight: 600 }}
      >
        Fermer
      </Button>
    </Box>
  </Box>
);

const Registration = ({ onClose }: { onClose: () => void }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const { isOpen: inscriptionsOpen, loading: statusLoading, error: statusError } = useInscriptionStatus();
  const [activeStep, setActiveStep] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState<RegistrationForm>({
    matricule: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '', // string vide
    gender: '',
    nationality: '',
    birthPlace: '',
    address: '',
    city: '',
    phone: '',
    previousSchool: '',
    previousClass: '',
    specialNeeds: '',
    additionalInfo: '',
    documents: [
      { id: 'birth', name: 'Acte de naissance', file: null, status: 'pending' },
      { id: 'report', name: 'Bulletin scolaire', file: null, status: 'pending' },
      { id: 'id', name: 'Carte d\'identité', file: null, status: 'pending' },
      { id: 'vaccine', name: 'Carnet de vaccination', file: null, status: 'pending' },
    ],
    parentFirstName: '',
    parentLastName: '',
    parentPhone: '',
  });

  const [studentPhoto, setStudentPhoto] = useState<File | null>(null);
  const [studentPhotoPreview, setStudentPhotoPreview] = useState<string | null>(null);

  // Suppression de la vérification inscriptionOpen/inscriptionError

  React.useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const [receiptData, setReceiptData] = useState<any | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);

  // Afficher le message de fermeture si les inscriptions sont fermées
  if (statusLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!inscriptionsOpen) {
    return (
      <InscriptionClosedMessage
        title="Inscriptions Temporairement Fermées"
        message="Les inscriptions sont actuellement fermées. Veuillez revenir plus tard ou contacter l'administration pour plus d'informations."
        showHomeButton={true}
      />
    );
  }
  const handleDownload = () => {
    if (receiptRef.current) {
      html2pdf().from(receiptRef.current).save('recu-inscription.pdf');
    }
  };

  const isValidDateFormat = (dateStr: string) => {
    // Vérifie le format AAAA-MM-JJ strictement
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  };

  const handleNext = () => {
    // Validation des champs selon l'étape
    if (activeStep === 0) {
      // Validation des informations personnelles
      const dateStr = formData.dateOfBirth;
      if (!formData.matricule || !formData.firstName || !formData.lastName || 
          !formData.dateOfBirth || !formData.gender || !formData.address || 
          !formData.city || !formData.phone || 
          !formData.parentFirstName || !formData.parentLastName || 
          !formData.parentPhone) {
        setSnackbar({
          open: true,
          message: 'Veuillez remplir tous les champs obligatoires',
          severity: 'error',
        });
        return;
      }
      if (!isValidDateFormat(dateStr)) {
        setSnackbar({
          open: true,
          message: 'Veuillez saisir une date de naissance valide (format AAAA-MM-JJ, pas de date future, ni de date impossible).',
          severity: 'error',
        });
        return;
      }
    } else if (activeStep === 1) {
      // Validation des informations académiques
      if (!formData.previousSchool || !formData.previousClass) {
        setSnackbar({
          open: true,
          message: 'Veuillez remplir les informations académiques',
          severity: 'error',
        });
        return;
      }
    }
    
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleFileUpload = (documentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        documents: prev.documents.map(doc =>
          doc.id === documentId
            ? { ...doc, file, status: 'uploaded' }
            : doc
        ),
      }));
    }
  };

  const handleDeleteFile = (documentId: string) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map(doc =>
        doc.id === documentId
          ? { ...doc, file: null, status: 'pending' }
          : doc
      ),
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setStudentPhoto(file);
      setStudentPhotoPreview(URL.createObjectURL(file));
    }
  };

  const getPhotoButtonText = () => {
    return studentPhoto ? 'Photo importée' : 'Importer la photo (optionnel)';
  };

  const handleSubmit = async () => {
    try {
      // Validation finale avant soumission
      const dateStr = formData.dateOfBirth;
      if (!formData.matricule || !formData.firstName || !formData.lastName || 
          !formData.dateOfBirth || !formData.gender || !formData.address || 
          !formData.city || !formData.phone ||
          !formData.previousSchool || !formData.previousClass ||
          !formData.parentFirstName || !formData.parentLastName || 
          !formData.parentPhone) {
        setSnackbar({
          open: true,
          message: 'Veuillez remplir tous les champs obligatoires',
          severity: 'error',
        });
        return;
      }
      if (!isValidDateFormat(dateStr)) {
        setSnackbar({
          open: true,
          message: 'Veuillez saisir une date de naissance valide (format AAAA-MM-JJ, pas de date future, ni de date impossible).',
          severity: 'error',
        });
        return;
      }

      // Utilisation de FormData pour envoyer la photo et les champs texte
      const formDataToSend = new FormData();
      formDataToSend.append('first_name', formData.firstName);
      formDataToSend.append('last_name', formData.lastName);
      formDataToSend.append('date_of_birth', formData.dateOfBirth);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('nationality', formData.nationality || 'Ivoirienne');
      formDataToSend.append('birth_place', formData.birthPlace || formData.city);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('registration_number', formData.matricule);
      formDataToSend.append('email', ''); // Pas d'email à la pré-inscription
      formDataToSend.append('password', formData.matricule);
      formDataToSend.append('previous_school', formData.previousSchool);
      formDataToSend.append('previous_class', formData.previousClass);
      formDataToSend.append('special_needs', formData.specialNeeds);
      formDataToSend.append('additional_info', formData.additionalInfo);
      formDataToSend.append('registration_mode', 'online');
      formDataToSend.append('parent_first_name', formData.parentFirstName);
      formDataToSend.append('parent_last_name', formData.parentLastName);
      formDataToSend.append('parent_phone', formData.parentPhone);
      formDataToSend.append('parent_email', ''); // Pas d'email parent à la pré-inscription
      if (studentPhoto) {
        formDataToSend.append('student_photo', studentPhoto);
      }

              const response = await axios.post('https://2ise-groupe.com/api/students/public-register', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const now = new Date();
      setReceiptData({
        ...formData,
        last_name: formData.lastName,
        first_name: formData.firstName,
        registration_number: formData.matricule,
        parent_first_name: formData.parentFirstName,
        parent_last_name: formData.parentLastName,
        parent_phone: formData.parentPhone,
        date: now.toLocaleString(),
        student_code: response.data.student_code,
        parent_code: null, // Le code parent sera généré à la finalisation
      });
      setSnackbar({
        open: true,
        message: 'Inscription soumise avec succès !',
        severity: 'success',
      });
    } catch (error: any) {
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

  const getDocumentStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircleIcon color="success" />;
      case 'uploaded':
        return <PendingIcon color="primary" />;
      case 'rejected':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3} key={`step-${step}`}>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 1 }}
              >
                {studentPhoto ? 'Photo importée' : 'Importer la photo de l’élève'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePhotoChange}
                />
              </Button>
              {studentPhotoPreview && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  <img src={studentPhotoPreview} alt="Aperçu" style={{ maxHeight: 120, borderRadius: 8 }} />
                </Box>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 1 }}>
                La photo est optionnelle. Si fournie, elle doit être une photo d'identité récente (format JPG ou PNG, max 2 Mo).
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Matricule"
                value={formData.matricule}
                onChange={(e) => setFormData({ ...formData, matricule: validateMatricule(e.target.value) })}
                helperText="Numéro d'identification unique de l'étudiant (lettres, chiffres et tirets uniquement)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Prénom"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: validateName(e.target.value) })}
                helperText="Lettres, espaces, tirets et apostrophes uniquement"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Nom"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: validateName(e.target.value) })}
                helperText="Lettres, espaces, tirets et apostrophes uniquement"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              {isMobile ? (
                <>
                  <label htmlFor="date-naissance" style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>Date de naissance *</label>
                  <input
                    id="date-naissance"
                    type="text"
                    placeholder="AAAA-MM-JJ"
                    value={formData.dateOfBirth}
                    onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    style={{ width: '100%', marginBottom: 4, fontSize: 16, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                    required
                  />
                  <span style={{ fontSize: 12, color: '#888' }}>
                    Format attendu : AAAA-MM-JJ. Saisissez la date manuellement.
                  </span>
                </>
              ) : (
                <TextField
                  required
                  fullWidth
                  label="Date de naissance"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText="Format attendu : AAAA-MM-JJ. Si le sélecteur ne s'ouvre pas, saisissez la date manuellement."
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
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
                  <MenuItem value="Masculin">Masculin</MenuItem>
                  <MenuItem value="Féminin">Féminin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nationalité"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: validateNationality(e.target.value) })}
                placeholder="Ex: Ivoirienne"
                helperText="Lettres, espaces, tirets et apostrophes uniquement"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lieu de naissance"
                value={formData.birthPlace}
                onChange={(e) => setFormData({ ...formData, birthPlace: validateBirthPlace(e.target.value) })}
                placeholder="Ex: Abidjan"
                helperText="Lettres, espaces, tirets et apostrophes uniquement"
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
                onChange={(e) => setFormData({ ...formData, address: validateAddress(e.target.value) })}
                helperText="Caractères spéciaux dangereux interdits"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Téléphone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: validatePhone(e.target.value) })}
                helperText="Chiffres, espaces, tirets, parenthèses et + uniquement"
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
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mt: 2, mb: 1 }}>
                Informations du parent
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Prénom du parent"
                value={formData.parentFirstName}
                onChange={(e) => setFormData({ ...formData, parentFirstName: validateName(e.target.value) })}
                helperText="Lettres, espaces, tirets et apostrophes uniquement"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Nom du parent"
                value={formData.parentLastName}
                onChange={(e) => setFormData({ ...formData, parentLastName: validateName(e.target.value) })}
                helperText="Lettres, espaces, tirets et apostrophes uniquement"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Téléphone du parent"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: validatePhone(e.target.value) })}
                helperText="Chiffres, espaces, tirets, parenthèses et + uniquement"
              />
            </Grid>

          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3} key={`step-${step}`}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="École précédente"
                value={formData.previousSchool}
                onChange={(e) => setFormData({ ...formData, previousSchool: validateSchool(e.target.value) })}
                helperText="Lettres, espaces, tirets et apostrophes uniquement"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Classe précédente"
                value={formData.previousClass}
                onChange={(e) => setFormData({ ...formData, previousClass: validateClass(e.target.value) })}
                helperText="Lettres, espaces, tirets et apostrophes uniquement"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 700,
        mx: 'auto',
        p: { xs: 1, sm: 3 },
        borderRadius: 5,
        boxShadow: 6,
        background: 'white',
        position: 'relative',
        transition: 'box-shadow 0.3s',
        animation: 'fadeInUp 0.5s',
        // Correction : aucun overflow sur mobile
        maxHeight: { sm: '98vh', xs: 'none' },
        overflowY: { sm: 'auto', xs: 'visible' },
        pb: { xs: 8, sm: 4 },
        '@keyframes fadeInUp': {
          from: { opacity: 0, transform: 'translateY(40px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      {receiptData ? (
        <Receipt data={receiptData} onClose={onClose} receiptRef={receiptRef} handleDownload={handleDownload} />
      ) : (
        <Fade in={isMounted} timeout={500}>
          <Paper sx={{
            p: { xs: 1, sm: 4 },
            borderRadius: 4,
            boxShadow: 3,
            background: 'white',
            minWidth: { xs: '100%', sm: 500 },
            maxWidth: 700,
            mx: 'auto',
            mb: 2,
          }}>
            <Typography 
              variant={window.innerWidth < 600 ? 'h5' : 'h4'}
              gutterBottom 
              align="center"
              sx={{
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 4,
                fontSize: { xs: 24, sm: 32 },
              }}
            >
              Inscription en ligne
            </Typography>

            <Stepper 
              activeStep={activeStep} 
              sx={{ 
                mb: 4,
                '& .MuiStepLabel-label': {
                  fontWeight: 600,
                  fontSize: { xs: 13, sm: 16 },
                },
                '& .MuiStepIcon-root': {
                  color: theme.palette.primary.main,
                  fontSize: { xs: 20, sm: 24 },
                },
                '& .MuiStepIcon-root.Mui-active': {
                  color: theme.palette.primary.main,
                },
                '& .MuiStepIcon-root.Mui-completed': {
                  color: green[500],
                },
              }}
            >
              {steps.map((label, index) => (
                <Step key={`step-${index}-${label}`}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Zoom in={isMounted} timeout={500}>
              <Box key={`step-content-${activeStep}`}
                sx={{
                  px: { xs: 0, sm: 2 },
                }}
              >
                {renderStepContent(activeStep)}
              </Box>
            </Zoom>

            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              mt: 4,
              pt: 3,
              borderTop: '1px solid',
              borderColor: 'divider',
              gap: { xs: 2, sm: 0 },
            }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
                sx={{
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  },
                  width: { xs: '100%', sm: 'auto' },
                }}
                fullWidth={window.innerWidth < 600}
              >
                Retour
              </Button>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', sm: 'auto' } }}>
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
                    width: { xs: '100%', sm: 'auto' },
                  }}
                  fullWidth={window.innerWidth < 600}
                >
                  Annuler
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={handleNext}
                  sx={{
                    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                    color: 'white',
                    '&:hover': {
                      background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                    },
                    px: 4,
                    width: { xs: '100%', sm: 'auto' },
                  }}
                  fullWidth={window.innerWidth < 600}
                >
                  {activeStep === steps.length - 1 ? 'Soumettre' : 'Suivant'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Fade>
      )}

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
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export function RegistrationMinimal({ onClose }: { onClose?: () => void }) {
  const { isOpen: inscriptionsOpen, loading: statusLoading, error: statusError } = useInscriptionStatus();
  const [formData, setFormData] = React.useState({
    matricule: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    birthPlace: '',
    address: '',
    city: '',
    phone: '',
    parentFirstName: '',
    parentLastName: '',
    parentPhone: '',
    previousSchool: '',
    previousClass: '',
    specialNeeds: '',
    additionalInfo: '',
  });
  const [files, setFiles] = React.useState<{ [key: string]: File | null }>({
    birth: null,
    report: null,
    id: null,
    vaccine: null,
  });
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [receiptData, setReceiptData] = React.useState<any | null>(null);
  const receiptRef = React.useRef<HTMLDivElement>(null);
  const isValidDateFormat = (dateStr: string) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

  // Afficher le message de fermeture si les inscriptions sont fermées
  if (statusLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!inscriptionsOpen) {
    return (
      <InscriptionClosedMessage
        title="Inscriptions Temporairement Fermées"
        message="Les inscriptions sont actuellement fermées. Veuillez revenir plus tard ou contacter l'administration pour plus d'informations."
        showHomeButton={true}
      />
    );
  }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let validatedValue = value;
    
    // Appliquer la validation selon le type de champ
    switch (name) {
      case 'matricule':
        validatedValue = validateMatricule(value);
        break;
      case 'firstName':
      case 'lastName':
      case 'parentFirstName':
      case 'parentLastName':
        validatedValue = validateName(value);
        break;
      case 'nationality':
        validatedValue = validateNationality(value);
        break;
      case 'birthPlace':
        validatedValue = validateBirthPlace(value);
        break;
      case 'phone':
      case 'parentPhone':
        validatedValue = validatePhone(value);
        break;
      case 'previousSchool':
        validatedValue = validateSchool(value);
        break;
      case 'previousClass':
        validatedValue = validateClass(value);
        break;
      case 'address':
        validatedValue = validateAddress(value);
        break;
      default:
        validatedValue = value;
    }
    
    setFormData({ ...formData, [name]: validatedValue });
  };
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: fileList } = e.target;
    if (fileList && fileList[0]) {
      setFiles((prev) => ({ ...prev, [name]: fileList[0] }));
    }
  };
  const handleDownload = () => {
    if (receiptRef.current) {
      // @ts-ignore
      if (window.html2pdf) {
        // @ts-ignore
        window.html2pdf().from(receiptRef.current).save('recu-inscription.pdf');
      } else if (typeof html2pdf !== 'undefined') {
        html2pdf().from(receiptRef.current).save('recu-inscription.pdf');
      }
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.matricule || !formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.gender || !formData.address || !formData.city || !formData.phone || !formData.parentFirstName || !formData.parentLastName || !formData.parentPhone || !formData.previousSchool || !formData.previousClass) {
      setError('Veuillez remplir tous les champs obligatoires.');
      setSuccess('');
      return;
    }
    if (!isValidDateFormat(formData.dateOfBirth)) {
      setError('La date de naissance doit être au format AAAA-MM-JJ.');
      setSuccess('');
      return;
    }
    // On n'envoie plus les fichiers, seulement les champs texte
    setError('');
    setLoading(true);
    try {
      const payload = {
        registration_number: formData.matricule,
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        nationality: formData.nationality || 'Ivoirienne',
        birth_place: formData.birthPlace || formData.city,
        address: formData.address,
        city: formData.city,
        phone: formData.phone,
        email: '', // Pas d'email à la pré-inscription
        password: formData.matricule,
        previous_school: formData.previousSchool,
        previous_class: formData.previousClass,
        special_needs: formData.specialNeeds,
        additional_info: formData.additionalInfo,
        registration_mode: 'online',
        parent_first_name: formData.parentFirstName,
        parent_last_name: formData.parentLastName,
        parent_phone: formData.parentPhone,
        parent_email: '', // Pas d'email parent à la pré-inscription
      };
              const response = await axios.post('https://2ise-groupe.com/api/students/public-register', payload);
      setSuccess('Inscription enregistrée avec succès !');
      setError('');
      setLoading(false);
      // Remplir le reçu avec les données du formulaire
      const now = new Date();
      const receipt = {
        last_name: formData.lastName,
        first_name: formData.firstName,
        registration_number: formData.matricule,
        date: now.toLocaleString(),
        parent_first_name: formData.parentFirstName,
        parent_last_name: formData.parentLastName,
        parent_phone: formData.parentPhone,
      };
      setReceiptData(receipt);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission.');
      setSuccess('');
      setLoading(false);
    }
  };
  if (receiptData) {
    return (
      <Receipt
        data={receiptData}
        onClose={onClose || (() => setReceiptData(null))}
        receiptRef={receiptRef}
        handleDownload={handleDownload}
      />
    );
  }
  return (
    <Paper elevation={3} sx={{ p: 2, maxWidth: 500, mx: 'auto', mt: 2, borderRadius: 3 }}>
      <Typography variant="h5" align="center" sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}>
        Inscription en ligne (mobile)
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Box component="form" onSubmit={handleSubmit} autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label="Matricule" name="matricule" value={formData.matricule} onChange={handleInputChange} required fullWidth size="small" />
        <TextField 
          label="Date de naissance" 
          name="dateOfBirth" 
          type="date"
          value={formData.dateOfBirth} 
          onChange={handleInputChange} 
          required 
          fullWidth 
          size="small" 
          InputLabelProps={{ shrink: true }}
          helperText="Sélectionnez la date de naissance"
        />
        <TextField label="Prénom" name="firstName" value={formData.firstName} onChange={handleInputChange} required fullWidth size="small" />
        <TextField label="Nom" name="lastName" value={formData.lastName} onChange={handleInputChange} required fullWidth size="small" />
        <FormControl fullWidth size="small" required>
          <InputLabel id="gender-label">Genre</InputLabel>
          <Select labelId="gender-label" name="gender" value={formData.gender} label="Genre" onChange={handleSelectChange}>
            <MenuItem value="">Sélectionner</MenuItem>
            <MenuItem value="Masculin">Masculin</MenuItem>
            <MenuItem value="Féminin">Féminin</MenuItem>
            <MenuItem value="Autre">Autre</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Nationalité" name="nationality" value={formData.nationality} onChange={handleInputChange} fullWidth size="small" placeholder="Ex: Ivoirienne" />
        <TextField label="Lieu de naissance" name="birthPlace" value={formData.birthPlace} onChange={handleInputChange} fullWidth size="small" placeholder="Ex: Abidjan" />
        <TextField label="Adresse" name="address" value={formData.address} onChange={handleInputChange} required fullWidth size="small" />
        <TextField label="Ville" name="city" value={formData.city} onChange={handleInputChange} required fullWidth size="small" />
        <TextField label="Téléphone" name="phone" value={formData.phone} onChange={handleInputChange} required fullWidth size="small" />

        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>Informations du parent</Typography>
        <TextField label="Prénom du parent" name="parentFirstName" value={formData.parentFirstName} onChange={handleInputChange} required fullWidth size="small" />
        <TextField label="Nom du parent" name="parentLastName" value={formData.parentLastName} onChange={handleInputChange} required fullWidth size="small" />
        <TextField label="Téléphone du parent" name="parentPhone" value={formData.parentPhone} onChange={handleInputChange} required fullWidth size="small" />

        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>Informations académiques</Typography>
        <TextField label="École précédente" name="previousSchool" value={formData.previousSchool} onChange={handleInputChange} required fullWidth size="small" />
        <TextField label="Classe précédente" name="previousClass" value={formData.previousClass} onChange={handleInputChange} required fullWidth size="small" />
        <Divider sx={{ my: 1 }} />
        <Button type="submit" variant="contained" color="primary" fullWidth size="large" sx={{ fontWeight: 700, mt: 2 }} disabled={loading}>
          {loading ? 'Envoi...' : 'Valider'}
        </Button>
      </Box>
    </Paper>
  );
}

export default Registration; 