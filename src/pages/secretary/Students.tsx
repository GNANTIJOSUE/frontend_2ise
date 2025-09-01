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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  SelectChangeEvent,
  Tooltip,
  useTheme,
  Fade,
  Zoom,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  Alert,
  Avatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MonetizationOn as MonetizationOnIcon,
  Print as PrintIcon,
  School as SchoolIcon,
  Check as CheckIcon,
  Payment as PaymentIcon,
  Replay as ReplayIcon,
  PhotoCamera as PhotoCameraIcon,
  History as HistoryIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import SecretarySidebar from '../../components/SecretarySidebar';
import { useNavigate } from 'react-router-dom';
import InscrptionPre from '../InscrptionPre';
import { clearServiceWorkerCache, forceAppRefresh, addNoCacheHeaders } from '../../utils/cacheUtils';
import { blue, green, orange, purple } from '@mui/material/colors';
import { apiGet, testApiConnection, apiPost, apiPut, apiDelete } from '../../utils/apiUtils';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionDenied from '../../components/PermissionDenied';
import DeleteButton from '../../components/DeleteButton';
import ApiConnectionTest from '../../components/ApiConnectionTest';

// Interface pour le type Student
interface Student {
  id: number;
  first_name: string;
  last_name: string;
  registration_number: string;
  gender: string;
  date_of_birth: string;
  nationality: string;
  birth_place: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  previous_school: string;
  previous_class: string;
  student_code: string;
  parent_code: string;
  photo_path?: string;
  class_amount?: number;
  total_paid?: number;
  total_discount?: number;
  reste_a_payer?: number;
  installments?: any[];
  payment_type?: string;
  class_name?: string;
  // Propriétés supplémentaires utilisées dans le code
  classe?: string;
  is_assigned?: boolean;
  amount?: number;
  amount_non_assigned?: number;
  registration_mode?: string;
  registration_status?: string;
  // Propriétés pour l'édition
  special_needs?: string;
  additional_info?: string;
  class_id?: string | number;
  // Propriétés alternatives (pour compatibilité)
  nom?: string;
  prenom?: string;
  // Propriétés parentales
  parent_first_name?: string;
  parent_last_name?: string;
  parent_phone?: string;
  parent_email?: string;
  parent_contact?: string;
  // Propriétés supplémentaires
  photo_url?: string;
  class_size?: string | number;
  is_repeater?: boolean;
  regime?: string;
  is_boarder?: boolean;
  amount_affecte?: number;
}

const genreOptions = ['Tous', 'Masculin', 'Féminin'];

const Students = () => {
  const theme = useTheme();
  const { hasPermission, user } = usePermissions();

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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('Toutes les classes');
  const [scolariteFilter, setScolariteFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('Tous');
  const tableRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentSchoolYear, setCurrentSchoolYear] = useState<any | null>(null);
  const [selectedSchoolYearStatus, setSelectedSchoolYearStatus] = useState<any | null>(null);

  // State pour la modale de paiement
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [studentToPay, setStudentToPay] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentReceiptData, setPaymentReceiptData] = useState<any | null>(null);
  const [showPaymentReceipt, setShowPaymentReceipt] = useState(false);
  const paymentReceiptRef = useRef<HTMLDivElement>(null);

  // State pour la modale de finalisation
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [finalizeClassId, setFinalizeClassId] = useState('');
  const [finalizePayment, setFinalizePayment] = useState('');
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  // États pour les emails lors de la finalisation
  const [studentEmail, setStudentEmail] = useState('');
  const [parentEmail, setParentEmail] = useState('');

  // State pour les classes
  const [classes, setClasses] = useState<{ id: number; name: string; level?: string; level_amount?: number | string; level_amount_non_assigned?: number | string; registration_fee_assigned?: number | string; registration_fee_non_assigned?: number | string }[]>([]);

  // Réinscription
  const [reinscriptionOpen, setReinscriptionOpen] = useState(false);
  const [matriculeSearch, setMatriculeSearch] = useState('');
  const [reinscriptionStudent, setReinscriptionStudent] = useState<any | null>(null);
  const [reinscriptionError, setReinscriptionError] = useState<string | null>(null);
  const [reinscriptionLoading, setReinscriptionLoading] = useState(false);
  const [reinscriptionClassId, setReinscriptionClassId] = useState('');
  const [reinscriptionPayment, setReinscriptionPayment] = useState('');
  const [reinscriptionSubmitting, setReinscriptionSubmitting] = useState(false);
  // Ajout pour édition parent
  const [parentFields, setParentFields] = useState({
    parent_first_name: '',
    parent_last_name: '',
    parent_phone: '',
    parent_email: '',
    parent_contact: ''
  });
  // Ajout pour message d'erreur API réinscription
  const [reinscriptionApiError, setReinscriptionApiError] = useState<string | null>(null);

  // Année scolaire
  const [schoolYear, setSchoolYear] = useState('2024-2025');
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  // Ajout pour le niveau suivant et admission
  const niveaux = ["6ème", "5ème", "4ème", "3ème", "Seconde", "Première", "Terminale"];
  const [annualAverage, setAnnualAverage] = useState<{ moyenne_annuelle: number, rank: number, total: number, isAdmis: boolean } | null>(null);
  const [nextLevel, setNextLevel] = useState<string>("");
  const [targetLevel, setTargetLevel] = useState<string>("");

  // Utilitaire pour obtenir l'année scolaire courante
  function getCurrentSchoolYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    if (month >= 9) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }
  // Ajout des useState manquants pour la gestion du reliquat année précédente (dans le composant)
  const [previousYearDue, setPreviousYearDue] = useState(0);
  const [previousYearPayment, setPreviousYearPayment] = useState('');
  // Fonction utilitaire pour obtenir l'année scolaire précédente
  function getPreviousSchoolYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    let previousSchoolYear = '';
    if (month >= 9) {
      previousSchoolYear = `${year - 1}-${year}`;
    } else {
      previousSchoolYear = `${year - 2}-${year - 1}`;
    }
    console.log('[REINSCRIPTION] Année scolaire précédente calculée:', previousSchoolYear);
    return previousSchoolYear;
  }

  // Ajout d'un état pour l'erreur de montant
  const [paymentAmountError, setPaymentAmountError] = useState<string>("");
  
  // États pour le paiement par chèque
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [checkNumber, setCheckNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  const [transferBank, setTransferBank] = useState('');

  // Ajout pour reçu de réinscription
  const [reinscriptionReceiptData, setReinscriptionReceiptData] = useState<any>(null);
  const [showReinscriptionReceipt, setShowReinscriptionReceipt] = useState(false);
  const reinscriptionReceiptRef = useRef<HTMLDivElement>(null);

  // Ajout des states

  // États pour l'historique des reçus
  const [receiptHistoryOpen, setReceiptHistoryOpen] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<any | null>(null);
  const [receiptHistoryData, setReceiptHistoryData] = useState<any | null>(null);
  const [receiptHistoryLoading, setReceiptHistoryLoading] = useState(false);
  const [selectedHistorySchoolYear, setSelectedHistorySchoolYear] = useState<string>('');

  // États pour les reçus de paiement HTML
  const [paymentReceiptHtml, setPaymentReceiptHtml] = useState<string>('');
  const [paymentReceiptOpen, setPaymentReceiptOpen] = useState(false);
  const [paymentReceiptLoading, setPaymentReceiptLoading] = useState(false);
  const [showFinalizeForm, setShowFinalizeForm] = useState(false);
  const [studentToFinalize, setStudentToFinalize] = useState<any | null>(null);

  // Ajout des états pour la classe précédente et son niveau
  const [previousClass, setPreviousClass] = useState('');
  const [previousLevel, setPreviousLevel] = useState('');

  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // 1. Ajoute un état isAssigned dans le composant principal :
  const [isAssigned, setIsAssigned] = useState(false);

  // 1. Ajoute un état pour le montant dynamique dans la modale de réinscription :
  const [reinscriptionAmountAffecte, setReinscriptionAmountAffecte] = useState(0);
  const [reinscriptionAmountNonAffecte, setReinscriptionAmountNonAffecte] = useState(0);

  const [reinscriptionData, setReinscriptionData] = useState({
    studentId: null,
    parent_first_name: '',
    parent_last_name: '',
    parent_phone: '',
    parent_email: '',
    parent_contact: '',
    isAssigned: false,
    previousYearSummary: null as any,
    reliquatAPayer: 0,
    resteAPayer: 0,
    firstPayment: 0,
  });

  // 2. Lorsqu'une classe est sélectionnée, récupère les deux montants :
  useEffect(() => {
    if (reinscriptionClassId) {
      const classeObj = classes.find(c => c.id === parseInt(reinscriptionClassId));
      setReinscriptionAmountAffecte(Number(classeObj?.level_amount || 0));
      setReinscriptionAmountNonAffecte(Number(classeObj?.level_amount_non_assigned || 0));
      // Pré-remplir le champ paiement avec le montant minimum requis
      const montantCible = isAssigned ? (Number(classeObj?.registration_fee_assigned || 0)) : (Number(classeObj?.registration_fee_non_assigned || 0));
      if (!reinscriptionPayment || Number(reinscriptionPayment) < montantCible) {
        setReinscriptionPayment(montantCible.toString());
      }
    }
    // eslint-disable-next-line
  }, [reinscriptionClassId, isAssigned]);



  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClassChange = (event: any) => {
    setSelectedClass(event.target.value);
    setPage(0);
  };

  const handleScolariteFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setScolariteFilter(event.target.value);
    setPage(0);
  };

  const handleGenreFilterChange = (event: SelectChangeEvent) => {
    setGenreFilter(event.target.value);
    setPage(0);
  };

  const handlePrint = () => {
    if (tableRef.current) {
      // Créer un titre dynamique basé sur les critères de recherche
      let title = 'Liste des élèves';
      const filters = [];
      
      // Ajouter les critères de recherche
      if (searchTerm) {
        filters.push(`Recherche: "${searchTerm}"`);
      }
      if (selectedClass !== 'Toutes les classes') {
        filters.push(`Classe: ${selectedClass}`);
      }
      if (genreFilter !== 'Tous') {
        filters.push(`Genre: ${genreFilter}`);
      }
      if (scolariteFilter) {
        let montantText = '';
        if (scolariteFilter.includes('-')) {
          const [min, max] = scolariteFilter.split('-');
          montantText = `Montant dû: ${parseInt(min).toLocaleString('fr-FR')} - ${parseInt(max).toLocaleString('fr-FR')} F CFA`;
        } else if (scolariteFilter.startsWith('>')) {
          const amount = parseInt(scolariteFilter.substring(1));
          montantText = `Montant dû > ${amount.toLocaleString('fr-FR')} F CFA`;
        } else if (scolariteFilter.startsWith('<')) {
          const amount = parseInt(scolariteFilter.substring(1));
          montantText = `Montant dû < ${amount.toLocaleString('fr-FR')} F CFA`;
        } else if (scolariteFilter.startsWith('>=')) {
          const amount = parseInt(scolariteFilter.substring(2));
          montantText = `Montant dû ≥ ${amount.toLocaleString('fr-FR')} F CFA`;
        } else if (scolariteFilter.startsWith('<=')) {
          const amount = parseInt(scolariteFilter.substring(2));
          montantText = `Montant dû ≤ ${amount.toLocaleString('fr-FR')} F CFA`;
        } else {
          const amount = parseInt(scolariteFilter);
          montantText = `Montant dû: ${amount.toLocaleString('fr-FR')} F CFA`;
        }
        filters.push(montantText);
      }
      
      if (filters.length > 0) {
        title += ` - ${filters.join(', ')}`;
      }
      
      // Ajouter l'année scolaire
      title += ` (${schoolYear})`;
      
      // Créer une copie du contenu du tableau pour l'impression
      const printTable = tableRef.current.cloneNode(true) as HTMLElement;
      
      // Masquer la colonne Actions
      const actionCells = printTable.querySelectorAll('th:last-child, td:last-child');
      actionCells.forEach(cell => {
        (cell as HTMLElement).style.display = 'none';
      });
      
      // Masquer les boutons et éléments d'interface
      const buttons = printTable.querySelectorAll('button, .MuiButton-root, .MuiIconButton-root');
      buttons.forEach(button => {
        (button as HTMLElement).style.display = 'none';
      });
      
      // Masquer les tooltips et autres éléments d'interface
      const tooltips = printTable.querySelectorAll('[role="tooltip"], .MuiTooltip-root');
      tooltips.forEach(tooltip => {
        (tooltip as HTMLElement).style.display = 'none';
      });
      
      const printWindow = window.open('', '', 'height=600,width=900');
      if (printWindow) {
        printWindow.document.write('<html><head><title>' + title + '</title>');
        printWindow.document.write(`
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            } 
            .print-header { 
              text-align: center; 
              margin-bottom: 20px; 
              font-size: 18px; 
              font-weight: bold;
              color: #1976d2;
            }
            .print-subtitle {
              text-align: center;
              margin-bottom: 20px;
              font-size: 14px;
              color: #666;
            }
            .print-stats {
              text-align: center;
              margin-bottom: 20px;
              font-size: 12px;
              color: #888;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
            } 
            th, td { 
              border: 1px solid #ccc; 
              padding: 8px; 
              text-align: left; 
              font-size: 12px;
            } 
            th { 
              background: #1976d2; 
              color: #fff; 
              font-weight: bold;
            }
            .success { color: green; font-weight: bold; }
            .error { color: red; font-weight: bold; }
            .warning { color: orange; font-weight: bold; }
            .chip {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: bold;
              text-align: center;
            }
            .chip-primary { background: #1976d2; color: white; }
            .chip-success { background: #4caf50; color: white; }
            .chip-warning { background: #ff9800; color: white; }
            .chip-default { background: #9e9e9e; color: white; }
            @media print {
              .no-print { display: none !important; }
              body { margin: 0; }
            }
          </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="print-header">' + title + '</div>');
        printWindow.document.write('<div class="print-subtitle">École 2ISE-GROUPE</div>');
        printWindow.document.write('<div class="print-stats">' + filteredStudents.length + ' étudiant(s) trouvé(s) sur ' + students.length + ' total</div>');
        printWindow.document.write(printTable.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  const fetchStudents = useCallback(async () => {
    let isMounted = true;
    
    if (isMounted) {
      setLoading(true);
      setError(null);
    }
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Debug: Afficher les informations d'authentification
      console.log('=== DEBUG AUTHENTIFICATION ===');
      console.log('User:', user);
      console.log('Role:', user.role);
      console.log('==============================');
      
      // Test de connexion API d'abord
      const isConnected = await testApiConnection();
      if (!isConnected) {
        throw new Error('Impossible de se connecter à l\'API');
      }
      
      const data = await apiGet('/students/list', { school_year: schoolYear });
      
      if (isMounted) {
        setStudents(data);
        // Log pour debug
        console.log('Données reçues du backend:', data);
      }
    } catch (err: any) {
      if (isMounted) {
        // Debug: Afficher les détails de l'erreur
        console.log('=== DEBUG ERREUR ===');
        console.log('Error:', err);
        console.log('Type:', err.type);
        console.log('Message:', err.message);
        console.log('Context:', err.context);
        console.log('====================');
        
        setError(err.message || 'Erreur lors du chargement des étudiants');
        // Log pour debug
        console.error('Erreur dans fetchStudents:', err);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [schoolYear]);

  // Fonction pour rafraîchir les données après un paiement
  const refreshAfterPayment = useCallback(() => {
    console.log('[REFRESH] Début du rafraîchissement après paiement');
    
    // Rafraîchissement immédiat
    console.log('[REFRESH] Rafraîchissement immédiat');
    fetchStudents();

    // Premier rafraîchissement après 1 seconde
    setTimeout(() => {
      console.log('[REFRESH] Premier rafraîchissement (1s)');
      fetchStudents();
    }, 1000);

    // Deuxième rafraîchissement après 2 secondes
    setTimeout(() => {
      console.log('[REFRESH] Deuxième rafraîchissement (2s)');
      fetchStudents();
    }, 2000);

    // Troisième rafraîchissement après 5 secondes pour s'assurer que tout est à jour
    setTimeout(() => {
      console.log('[REFRESH] Troisième rafraîchissement (5s)');
      fetchStudents();
    }, 5000);
  }, [fetchStudents]);

  // Fonction pour vider le cache et forcer le rafraîchissement
  const handleClearCache = useCallback(async () => {
    try {
      console.log('[CACHE] Début du vidage du cache');
      await clearServiceWorkerCache();
      await fetchStudents();
      console.log('[CACHE] Cache vidé et données rafraîchies');
    } catch (error) {
      console.error('[CACHE] Erreur lors du vidage du cache:', error);
    }
  }, [fetchStudents]);

  // Fonction pour forcer le rafraîchissement complet
  const handleForceRefresh = useCallback(async () => {
    try {
      console.log('[FORCE REFRESH] Début du rafraîchissement forcé');
      await forceAppRefresh();
    } catch (error) {
      console.error('[FORCE REFRESH] Erreur:', error);
      // En cas d'erreur, recharger quand même
      window.location.reload();
    }
  }, []);

  const fetchClasses = async () => {
    let isMounted = true;
    
    try {
      const data = await apiGet('/classes/list');
      
      if (isMounted) {
        setClasses(data.map((c: any) => ({ ...c, level: c.level || '' })));
      }
    } catch (err) {
      if (isMounted) {
        console.error("Erreur lors de la récupération des classes", err);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (isMounted) {
        await fetchStudents();
        await fetchClasses();
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [fetchStudents]);

  // Ajoute la fonction utilitaire pour générer les 5 dernières années scolaires
  function getSchoolYears(count = 5) {
    const now = new Date();
    const currentYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    return Array.from({ length: count }, (_, i) => {
      const start = currentYear - (count - 1 - i);
      return `${start}-${start + 1}`;
    }).reverse();
  }

  // Fonction pour récupérer l'année scolaire courante
  const fetchCurrentSchoolYear = async () => {
    try {
      const response = await fetch('https://2ise-groupe.com/api/school-years/current');
      if (response.ok) {
        const data = await response.json();
        setCurrentSchoolYear(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'année scolaire courante:', error);
    }
  };

  // Fonction pour récupérer le statut de l'année scolaire sélectionnée
  const fetchSelectedSchoolYearStatus = async (yearName: string) => {
    try {
      const response = await fetch(`https://2ise-groupe.com/api/school-years/by-name/${encodeURIComponent(yearName)}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedSchoolYearStatus(data);
      } else {
        // Si l'année n'existe pas dans la base, on considère qu'elle est fermée
        setSelectedSchoolYearStatus({ is_active: false });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du statut de l\'année scolaire:', error);
      // En cas d'erreur, on considère qu'elle est fermée
      setSelectedSchoolYearStatus({ is_active: false });
    }
  };
  
  // Remplace le useEffect qui déduisait les années à partir des élèves
  useEffect(() => {
    let isMounted = true;
    
    if (isMounted) {
      setAvailableYears(getSchoolYears(5));
      fetchCurrentSchoolYear(); // Récupérer l'année scolaire courante
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Modifie le fetch des élèves pour inclure l'année scolaire
  useEffect(() => {
    let isMounted = true;
    
    if (isMounted) {
      fetchStudents();
    }
    
    return () => {
      isMounted = false;
    };
  }, [schoolYear, fetchStudents]);

  // Récupérer le statut de l'année scolaire sélectionnée quand elle change
  useEffect(() => {
    if (schoolYear) {
      fetchSelectedSchoolYearStatus(schoolYear);
    }
  }, [schoolYear]);

  // Afficher tous les étudiants inscrits pour l'année en cours (présentiel et en ligne)
  const filteredStudents = Array.isArray(students) ? students.filter((student) => {
    const matchClass = selectedClass === 'Toutes les classes' || student.classe === selectedClass;
    const matchSearch =
      (student.registration_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.first_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Calcul du montant dû (reste à payer) - utiliser la même logique que dans le tableau
    const resteAPayer = Number(student.reste_a_payer ?? 0);
    
    // Debug pour vérifier les calculs
    if (scolariteFilter && scolariteFilter.includes('<')) {
      console.log(`[DEBUG] Étudiant ${student.registration_number}:`, {
        reste_a_payer: student.reste_a_payer,
        resteAPayer,
        filtre: scolariteFilter,
        match: resteAPayer < parseInt(scolariteFilter.substring(1))
      });
    }
    
    // Filtrage par montant dû - recherche flexible
    let matchScolarite = true;
    if (scolariteFilter !== '') {
      // Recherche par plage de montants
      if (scolariteFilter.includes('-')) {
        // Format: "min-max" (ex: "50000-100000")
        const [min, max] = scolariteFilter.split('-').map(s => parseInt(s.trim()));
        if (!isNaN(min) && !isNaN(max)) {
          matchScolarite = resteAPayer >= min && resteAPayer <= max;
        }
      } else if (scolariteFilter.startsWith('>=')) {
        // Format: ">=montant" (ex: ">=50000")
        const amount = parseInt(scolariteFilter.substring(2));
        if (!isNaN(amount)) {
          matchScolarite = resteAPayer >= amount;
        }
      } else if (scolariteFilter.startsWith('<=')) {
        // Format: "<=montant" (ex: "<=50000")
        const amount = parseInt(scolariteFilter.substring(2));
        if (!isNaN(amount)) {
          matchScolarite = resteAPayer <= amount;
        }
      } else if (scolariteFilter.startsWith('>')) {
        // Format: ">montant" (ex: ">50000")
        const amount = parseInt(scolariteFilter.substring(1));
        if (!isNaN(amount)) {
          matchScolarite = resteAPayer > amount;
        }
      } else if (scolariteFilter.startsWith('<')) {
        // Format: "<montant" (ex: "<50000")
        const amount = parseInt(scolariteFilter.substring(1));
        if (!isNaN(amount)) {
          matchScolarite = resteAPayer < amount;
        }
      } else {
        // Recherche exacte ou approximation (±10%)
        const filterAmount = parseInt(scolariteFilter);
        if (!isNaN(filterAmount)) {
          const tolerance = filterAmount * 0.1;
          matchScolarite = Math.abs(resteAPayer - filterAmount) <= tolerance;
        }
      }
    }
    
    const genderValue = (student.gender || '').toLowerCase();
    const matchGenre =
      genreFilter === 'Tous' ||
      ((['masculin', 'm', 'homme'].includes(genderValue)) && genreFilter === 'Masculin') ||
      ((['féminin', 'f', 'femme'].includes(genderValue)) && genreFilter === 'Féminin');
    return matchClass && matchSearch && matchScolarite && matchGenre;
  }) : [];

  // Log filteredStudents juste avant le rendu du tableau
  console.log('filteredStudents:', filteredStudents);

  // Suppression
  const handleDelete = async (studentId: number) => {
    // Vérifier si l'année scolaire sélectionnée est fermée
    if (selectedSchoolYearStatus && !selectedSchoolYearStatus.is_active) {
      alert(`Impossible de supprimer un étudiant car l'année scolaire ${schoolYear} est fermée.`);
      return;
    }

    if (window.confirm('Voulez-vous vraiment supprimer cet étudiant ?')) {
      try {
        const token = localStorage.getItem('token');
        await apiDelete(`/students/${studentId}`);
        fetchStudents();
      } catch (err: any) {
        alert(err.response?.data?.message || err.message || 'Erreur lors de la suppression');
        console.error('Erreur lors de la suppression:', err.response?.data || err);
      }
    }
  };

  // Edition
  const handleEditOpen = (student: any) => {
    // Vérifier si l'année scolaire sélectionnée est fermée
    if (selectedSchoolYearStatus && !selectedSchoolYearStatus.is_active) {
      alert(`Impossible de modifier un étudiant car l'année scolaire ${schoolYear} est fermée.`);
      return;
    }

    setEditStudent({ ...student });
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setEditOpen(true);
  };
  const handleEditClose = () => {
    setEditOpen(false);
    setEditStudent(null);
    setEditSuccess(null);
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditStudent((prev: Student | null) => prev ? { ...prev, [e.target.name]: e.target.value } : null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleEditSubmit = async () => {
    if (!editStudent) return;
    setEditLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Ajouter les données de l'étudiant
      formData.append('first_name', editStudent.first_name);
      formData.append('last_name', editStudent.last_name);
      formData.append('date_of_birth', editStudent.date_of_birth);
      formData.append('gender', editStudent.gender);
      formData.append('nationality', editStudent.nationality);
      formData.append('birth_place', editStudent.birth_place);
      formData.append('address', editStudent.address);
      formData.append('city', editStudent.city);
      formData.append('phone', editStudent.phone);
      formData.append('previous_school', editStudent.previous_school || '');
      formData.append('previous_class', editStudent.previous_class || '');
      formData.append('special_needs', editStudent.special_needs || '');
      formData.append('additional_info', editStudent.additional_info || '');
      formData.append('class_id', String(editStudent.class_id || ''));

      // Ajouter la photo si sélectionnée
      if (selectedPhoto) {
        formData.append('student_photo', selectedPhoto);
      }


      // Pour les requêtes avec FormData, on doit utiliser axios directement
      const axios = (await import('axios')).default;
      await axios.put(`https://2ise-groupe.com/api/students/${editStudent.id}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setEditSuccess('Modification enregistrée avec succès !');
      fetchStudents();
      setTimeout(() => {
        setEditSuccess(null);
        handleEditClose();
      }, 1500);
    } catch (err: any) {
      alert('Erreur lors de la modification');
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  // Fonctions pour la modale de paiement
  const handlePaymentOpen = async (student: any) => {
    setStudentToPay({
      ...student,
      class_amount: student.class_amount ?? 0,
      total_paid: student.total_paid ?? 0,
      total_discount: student.total_discount ?? 0,
    });
    setPaymentModalOpen(true);
    setPaymentAmount("");
    setPaymentAmountError("");

    // Récupérer les informations sur les versements de l'étudiant
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/installments/student/${student.id}?school_year=${schoolYear}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const installmentData = await response.json();
        setStudentToPay((prev: Student | null) => {
          if (!prev) return null;
          return {
            ...prev,
            installments: installmentData.installments || [],
            payment_type: installmentData.payment_type,
            class_name: installmentData.class_name
          };
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des versements:', error);
    }
  };
  const handlePaymentClose = () => {
    setPaymentModalOpen(false);
    setStudentToPay(null);
    setPaymentAmount('');
    setPaymentMethod('cash');
    setCheckNumber('');
    setBankName('');
    setIssueDate('');
    setTransferNumber('');
    setTransferBank('');
    setPaymentAmountError('');
  };

  const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPaymentAmount(value);
    if (studentToPay) {
      const totalDue = studentToPay.class_amount ?? 0;
      const totalPaid = studentToPay.total_paid ?? 0;
      const remaining = totalDue - totalPaid;
      if (Number(value) > remaining) {
        setPaymentAmountError('Le montant versé ne peut pas être supérieur au montant restant de la scolarité.');
      } else {
        setPaymentAmountError("");
      }
    }
  };

  const handlePaymentSubmit = async () => {
    if (!studentToPay || !paymentAmount || Number(paymentAmount) <= 0) {
      alert('Veuillez saisir un montant valide.');
      return;
    }
    // Empêcher un paiement supérieur au montant dû
    const totalDue = studentToPay.class_amount ?? 0;
    const totalPaid = studentToPay.total_paid ?? 0;
    const totalDiscount = studentToPay.total_discount ?? 0;
    const remaining = totalDue - totalDiscount - totalPaid;
    if (Number(paymentAmount) > remaining) {
      alert('Le montant versé ne peut pas être supérieur au montant restant de la scolarité.');
      console.error('[PAYMENT ERROR] Montant versé supérieur au reste à payer:', { paymentAmount, remaining });
      return;
    }
    setPaymentLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Vérification du payload avant envoi
      if (!studentToPay.id || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
        alert('Payload de paiement invalide.');
        console.error('[PAYLOAD ERROR] Payload de paiement invalide:', { student_id: studentToPay.id, amount: paymentAmount });
        setPaymentLoading(false);
        return;
      }
      const paymentData: any = {
        student_id: studentToPay.id,
        amount: Number(paymentAmount),
        school_year: schoolYear,
        payment_method: paymentMethod,
      };

      // Ajouter les données du chèque si c'est un paiement par chèque
      if (paymentMethod === 'check') {
        if (!checkNumber || !bankName || !issueDate) {
          alert('Pour un paiement par chèque, veuillez remplir tous les champs requis.');
          return;
        }
        paymentData.check_number = checkNumber;
        paymentData.bank_name = bankName;
        paymentData.issue_date = issueDate;
      }

      // Ajouter les données du virement si c'est un paiement par virement
      if (paymentMethod === 'transfer') {
        if (!transferNumber || !transferBank) {
          alert('Pour un paiement par virement, veuillez remplir tous les champs requis.');
          return;
        }
        paymentData.transfer_number = transferNumber;
        paymentData.transfer_bank = transferBank;
      }

      const data = await apiPost(`/payments`, paymentData);
      

      
      if (paymentMethod === 'check') {
        // Pour les chèques, afficher un message de confirmation
        alert(data.message || 'Chèque soumis avec succès. Il sera traité après approbation.');
        handlePaymentClose();
        refreshAfterPayment(); // Rafraîchir la liste après le paiement
      } else if (paymentMethod === 'transfer') {
        alert(data.message || 'Virement approuvé automatiquement et paiement créé avec succès.');
        
        // Afficher le reçu si disponible
        if (data.receiptData && data.receiptData.success && data.receiptData.html) {
          setPaymentReceiptHtml(data.receiptData.html);
          setPaymentReceiptOpen(true);
        }
        
        handlePaymentClose();
        refreshAfterPayment(); // Rafraîchir la liste après le paiement
      } else {
        // Pour les paiements en espèces, afficher le reçu
        if (!data || !data.receiptData) {
          alert('Réponse inattendue du serveur lors du paiement.');
          console.error('[PAYMENT ERROR] Réponse inattendue:', data);
          setPaymentLoading(false);
          return;
        }
        
        // Vérifier si c'est le nouveau format HTML ou l'ancien format JSON
        if (data.receiptData.success && data.receiptData.html) {
          // Nouveau format HTML
          setPaymentReceiptHtml(data.receiptData.html);
          setPaymentReceiptOpen(true);
        } else {
          // Ancien format JSON (fallback)
          setPaymentReceiptData(data.receiptData);
          setShowPaymentReceipt(true);
        }
        handlePaymentClose();
        refreshAfterPayment(); // Rafraîchir la liste après le paiement
      }
    } catch (err: any) {
      console.error('Erreur lors du paiement:', err);
      alert(err.response?.data?.message || 'Erreur lors du paiement.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handler Finaliser
  const handleFinalizeOpen = (student: any) => {
    console.log('handleFinalizeOpen appelé avec:', student);
    console.log('registration_mode:', student.registration_mode);
    console.log('isToFinalize:', student.registration_mode === 'online');
    
    if (student.registration_mode === 'online') {
      console.log('Étudiant en ligne détecté, ouverture du formulaire complet');
      setStudentToFinalize(student);
      setShowFinalizeForm(true);
      setFinalizeModalOpen(false); // Masquer la modale rapide
    } else {
      console.log('Étudiant présentiel, ouverture de la modale rapide');
      setStudentToFinalize(student);
      setShowFinalizeForm(false);
      setFinalizeModalOpen(true);
    }
  };

  const handleFinalizeClose = () => {
    setFinalizeModalOpen(false);
    setShowFinalizeForm(false);
    setReinscriptionStudent(null);
    setStudentToFinalize(null);
    setFinalizeClassId('');
    setFinalizePayment('');
    setReceiptData(null);
    setShowReceipt(false);
    // Réinitialiser les champs de paiement
    setPaymentMethod('cash');
    setCheckNumber('');
    setBankName('');
    setIssueDate('');
    setTransferNumber('');
    setTransferBank('');
    // Réinitialiser les emails
    setStudentEmail('');
    setParentEmail('');
  };

  const handleFinalizeSubmit = async () => {
    const student = studentToFinalize;
    if (!student || !finalizeClassId || !finalizePayment || !studentEmail || !parentEmail) {
      alert('Veuillez remplir tous les champs, y compris les emails de l\'élève et du parent.');
      return;
    }
    setFinalizeLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await apiPost(`/students/${student.id}/finalize`, {
        class_id: finalizeClassId,
        payment_amount: finalizePayment,
        payment_method: paymentMethod,
        is_assigned: isAssigned ? 1 : 0, // <-- Correction : on envoie le statut affecté
        student_email: studentEmail,
        parent_email: parentEmail,
        // Informations pour chèque
        check_number: paymentMethod === 'check' ? checkNumber : null,
        bank_name: paymentMethod === 'check' ? bankName : null,
        issue_date: paymentMethod === 'check' ? issueDate : null,
        // Informations pour virement
        transfer_number: paymentMethod === 'transfer' ? transferNumber : null,
        transfer_bank: paymentMethod === 'transfer' ? transferBank : null,
      });

      console.log('Réponse du backend après finalisation:', data);

      // Utiliser les données mises à jour du backend pour le reçu
      const updatedStudentData = data.updatedStudentData;
      const finalizedClass = classes.find(c => String(c.id) === String(finalizeClassId));
      
      const newReceiptData = {
        ...updatedStudentData, // Utiliser les données mises à jour du backend
        student_code: data.student_code,
        parent_code: data.parent_code,
        classe: finalizedClass?.name,
        payment_amount: finalizePayment,
        class_amount: data.class_amount,
        total_paid: data.total_paid,
        total_discount: data.total_discount,
        reste_a_payer: data.reste_a_payer,
        date: new Date().toLocaleDateString('fr-FR'),
        is_assigned: data.is_assigned !== undefined ? data.is_assigned : (isAssigned ? 1 : 0), // Utiliser le statut du backend en priorité
        // S'assurer que les emails sont bien inclus
        parent_email: data.parent_email,
        student_email: data.student_email
      };

      console.log('Données du reçu préparées:', newReceiptData);

      setReceiptData(newReceiptData);
      setShowReceipt(true);
      // Ne pas fermer la modale ici, la fermer seulement après fermeture du reçu
      fetchStudents(); // Refresh the list
    } catch (err) {
      alert('Erreur lors de la finalisation.');
    } finally {
      setFinalizeLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    const printContent = receiptRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank', 'height=700,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Reçu d\'Inscription</title>');
        printWindow.document.write(`
            <style>
                body { font-family: 'Arial', sans-serif; margin: 20px; color: #333; }
                .receipt-container { border: 1px solid #eee; padding: 30px; width: 100%; max-width: 650px; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 30px; }
                .header h2 { margin: 0; color: #1976d2; }
                .header p { margin: 5px 0 0; }
                .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px 30px; margin-bottom: 30px;}
                .content-grid p { margin: 5px 0; font-size: 1.1em; }
                .content-grid .label { font-weight: bold; color: #555; }
                .content-grid .value { font-weight: bold; color: #1976d2; }
                .footer { text-align: center; margin-top: 40px; font-style: italic; font-size: 0.9em; color: #777; }
                .total { font-size: 1.3em; font-weight: bold; margin-top: 30px; text-align: right; color: #333; }
                .school-stamp { text-align: right; margin-top: 50px; }
                .school-stamp p { margin: 0; }
            </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
      }
    }
  };

  // Réinscription
  const handleReinscriptionOpen = () => {
    setReinscriptionOpen(true);
    setMatriculeSearch('');
    setReinscriptionStudent(null);
    setReinscriptionError(null);
    setReinscriptionClassId('');
    setReinscriptionPayment('');
    setReinscriptionApiError(null); // reset
    // Réinitialiser les champs de paiement
    setPaymentMethod('cash');
    setCheckNumber('');
    setBankName('');
    setIssueDate('');
    setTransferNumber('');
    setTransferBank('');
  };
  const handleReinscriptionClose = () => {
    setReinscriptionOpen(false);
    setMatriculeSearch('');
    setReinscriptionStudent(null);
    setReinscriptionError(null);
    setReinscriptionClassId('');
    setReinscriptionPayment('');
    setReinscriptionApiError(null); // reset
  };
  const handleMatriculeSearch = async () => {
    setReinscriptionLoading(true);
    setReinscriptionError(null);
    setReinscriptionStudent(null);
    setPreviousYearDue(0); // reset
    setPreviousYearPayment(''); // reset
    setPreviousClass(''); // reset
    setPreviousLevel(''); // reset
    try {
      const token = localStorage.getItem('token');
      const data = await apiGet(`/students/list`, { registration_number: matriculeSearch });
      console.log('[REINSCRIPTION] Données étudiant trouvé:', data);
      
      if (data && data.length > 0) {
        console.log('[REINSCRIPTION] Données étudiant complètes:', data[0]);
        setReinscriptionStudent(data[0]);
        // Récupérer le total dû et payé de l'année précédente
        const prevYear = getPreviousSchoolYear();
        console.log('[REINSCRIPTION] Année précédente:', prevYear);
        
        const [enrollmentsRes, paymentsRes, prevYearSummaryRes] = await Promise.all([
          apiGet(`/students/${data[0].id}/classes`, { school_year: prevYear }),
          apiGet(`/students/${data[0].id}/payments`, { school_year: prevYear }),
          apiGet(`/students/${data[0].id}/previous-year-summary`, { school_year: prevYear })
        ]);
        
        console.log('[REINSCRIPTION] Réponse enrollments:', enrollmentsRes);
        console.log('[REINSCRIPTION] Réponse payments:', paymentsRes);
        console.log('[REINSCRIPTION] Réponse previous-year-summary:', prevYearSummaryRes);
        
        let totalDue = 0;
        if (enrollmentsRes && enrollmentsRes.length > 0) {
          const enrollment = enrollmentsRes[0];
          console.log('[REINSCRIPTION] Inscription trouvée:', enrollment);
          setPreviousClass(enrollment.name || '');
          // Trouver le niveau de la classe précédente dans la liste des classes
          const prevClassObj = classes.find(c => c.name === enrollment.name);
          setPreviousLevel(prevClassObj?.level || '');
          totalDue = enrollment.amount || 0;
        } else {
          // Si pas d'inscription trouvée, essayer de récupérer depuis les données de l'étudiant
          console.log('[REINSCRIPTION] Aucune inscription trouvée, données étudiant:', data[0]);
          console.log('[REINSCRIPTION] Classes disponibles:', classes);
          
          // Essayer de trouver la classe dans les données de l'étudiant
          const studentClass = data[0].classe || data[0].class_name || '';
          setPreviousClass(studentClass || 'Non renseignée');
          
          if (studentClass) {
            const currentClassObj = classes.find(c => c.name === studentClass);
            setPreviousLevel(currentClassObj?.level || '');
          } else {
            setPreviousLevel('');
          }
        }
        let totalPaid = 0;
        if (paymentsRes && paymentsRes.length > 0) {
          totalPaid = paymentsRes.reduce((acc: number, p: any) => acc + Number(p.amount), 0);
        }
        
        // Utiliser le reliquat calculé par le backend (prend en compte l'affectation)
        // Le backend retourne directement l'objet, pas dans .data
        const prevYearSummary = prevYearSummaryRes;
        console.log('[REINSCRIPTION] Résumé année précédente:', prevYearSummary);
        
        // Vérifier si prevYearSummary a la bonne structure
        const reliquat = prevYearSummary?.reste_a_payer || prevYearSummary?.data?.reste_a_payer || 0;
        console.log('[REINSCRIPTION] Reliquat extrait:', reliquat);
        
        // Convertir en nombre pour s'assurer que la comparaison fonctionne
        const reliquatNumber = Number(reliquat) || 0;
        console.log('[REINSCRIPTION] Reliquat converti en nombre:', reliquatNumber);
        
        setPreviousYearDue(reliquatNumber);
        setReinscriptionData(prev => ({ ...prev, previousYearSummary: prevYearSummary }));
        if (reliquatNumber > 0) {
          setReinscriptionData(prev => ({ ...prev, reliquatAPayer: reliquatNumber }));
        }
        
        console.log('[REINSCRIPTION] Reliquat défini:', prevYearSummary?.reste_a_payer || 0);
      } else {
        setReinscriptionError("Désolé, ce matricule n'existe pas dans la base de données.");
      }
    } catch (error) {
      console.error('[REINSCRIPTION] Erreur lors de la recherche:', error);
      setReinscriptionError('Erreur lors de la recherche du matricule.');
    }
    setReinscriptionLoading(false);
  };
  const handleParentFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParentFields(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleReinscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReinscriptionApiError('');

    // Vérifier que le reliquat est payé si nécessaire
    if (previousYearDue > 0 && (!previousYearPayment || Number(previousYearPayment) < previousYearDue)) {
      setReinscriptionApiError(`Le reliquat de l'année précédente (${previousYearDue.toLocaleString('fr-FR')} F CFA) doit être entièrement payé avant la réinscription.`);
      return;
    }

    // Création de l'objet de données à envoyer
    const reinscriptionPayload = {
      class_id: reinscriptionClassId,
      school_year: schoolYear,
      payment_amount: reinscriptionPayment,
      payment_method: paymentMethod,
      reliquat_payment: Number(previousYearPayment) || 0, // Utiliser le montant réellement payé pour le reliquat
      parent_first_name: parentFields.parent_first_name,
      parent_last_name: parentFields.parent_last_name,
      parent_phone: parentFields.parent_phone,
      parent_email: parentFields.parent_email,
      parent_contact: parentFields.parent_contact,
      is_assigned: isAssigned ? 1 : 0,
      // Informations pour chèque
      check_number: paymentMethod === 'check' ? checkNumber : null,
      bank_name: paymentMethod === 'check' ? bankName : null,
      issue_date: paymentMethod === 'check' ? issueDate : null,
      // Informations pour virement
      transfer_number: paymentMethod === 'transfer' ? transferNumber : null,
      transfer_bank: paymentMethod === 'transfer' ? transferBank : null,
    };

    try {
      const response = await apiPost(`/students/${reinscriptionStudent.id}/reinscription`, reinscriptionPayload);

      setReinscriptionReceiptData(response.data);
      setShowReinscriptionReceipt(true);
      setReinscriptionOpen(false); // Fermer le dialogue de réinscription
    } catch (error: any) {
      console.error("Erreur lors de la soumission de la réinscription:", error);
      setReinscriptionApiError(error.response?.data?.message || "Une erreur s'est produite.");
    }
  };

  // Quand on trouve l'élève, préremplir les champs parent
  useEffect(() => {
    if (reinscriptionStudent) {
      setParentFields({
        parent_first_name: reinscriptionStudent.parent_first_name || '',
        parent_last_name: reinscriptionStudent.parent_last_name || '',
        parent_phone: reinscriptionStudent.parent_phone || '',
        parent_email: reinscriptionStudent.parent_email || '',
        parent_contact: reinscriptionStudent.parent_contact || ''
      });
    }
  }, [reinscriptionStudent]);

  // Récupérer la moyenne annuelle et admission à chaque recherche d'élève
  useEffect(() => {
    const fetchAnnualAverage = async () => {
      if (reinscriptionStudent) {
        try {
          const token = localStorage.getItem('token');
          const data = await apiGet(`/students/${reinscriptionStudent.id}/annual-average`);
          // Admis si moyenne >= 10
          setAnnualAverage({ ...data, isAdmis: data.moyenne_annuelle >= 10 });
        } catch {
          setAnnualAverage(null);
        }
      } else {
        setAnnualAverage(null);
      }
    };
    fetchAnnualAverage();
  }, [reinscriptionStudent]);

  // Calcul du niveau cible pour la réinscription à partir du niveau de la classe précédente
  useEffect(() => {
    if (previousLevel && annualAverage) {
      const index = niveaux.findIndex(n => n.toLowerCase() === previousLevel.toLowerCase());
      let target = previousLevel;
      if (annualAverage.isAdmis && index >= 0 && index < niveaux.length - 1) {
        target = niveaux[index + 1];
      }
      setTargetLevel(target);
    } else {
      setTargetLevel('');
    }
  }, [previousLevel, annualAverage]);

  // Filtrer les classes du niveau cible (redoublement ou passage)
  const classesNiveauCible = targetLevel && Array.isArray(classes) ? classes.filter(c => c.level && c.level.toLowerCase() === targetLevel.toLowerCase()) : (Array.isArray(classes) ? classes : []);

  // Impression du reçu de paiement
  const handlePrintPaymentReceipt = () => {
    const printContent = paymentReceiptRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank', 'height=700,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Reçu de Paiement</title>');
        printWindow.document.write(`
            <style>
                body { font-family: 'Arial', sans-serif; margin: 20px; color: #333; }
                .receipt-container { border: 1px solid #1976d2; padding: 30px; width: 100%; max-width: 650px; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
                .header { text-align: center; border-bottom: 2px solid #1976d2; padding-bottom: 10px; margin-bottom: 30px; }
                .header h2 { margin: 0; color: #1976d2; }
                .header p { margin: 5px 0 0; }
                .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px 30px; margin-bottom: 30px;}
                .content-grid p { margin: 5px 0; font-size: 1.1em; }
                .content-grid .label { font-weight: bold; color: #555; }
                .content-grid .value { font-weight: bold; color: #1976d2; }
                .footer { text-align: center; margin-top: 40px; font-style: italic; font-size: 0.9em; color: #777; }
                .total { font-size: 1.3em; font-weight: bold; margin-top: 30px; text-align: right; color: #333; }
                .school-stamp { text-align: right; margin-top: 50px; }
                .school-stamp p { margin: 0; }
            </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
      }
    }
  };

  // Impression du reçu de réinscription (remplace useReactToPrint)
  const handlePrintReinscriptionReceipt = () => {
    const printContent = reinscriptionReceiptRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank', 'height=700,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Reçu de Réinscription</title>');
        printWindow.document.write(`
          <style>
            @page { size: A4; }
            body { font-family: Arial; font-size: 12pt; }
            .receipt-container { width: 100%; max-width: 650px; margin: 0 auto; padding: 30px; border: 1px solid #1976d2; }
            .header { text-align: center; border-bottom: 2px solid #1976d2; padding-bottom: 10px; margin-bottom: 30px; }
            .header h2 { margin: 0; color: #1976d2; }
            .header p { margin: 5px 0 0; }
            .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px 30px; margin-bottom: 30px; }
            .content-grid p { margin: 5px 0; font-size: 1.1em; }
            .content-grid .label { font-weight: bold; color: #555; }
            .content-grid .value { font-weight: bold; color: #1976d2; }
            .footer { text-align: center; margin-top: 40px; font-style: italic; font-size: 0.9em; color: #777; }
            .total { font-size: 1.3em; font-weight: bold; margin-top: 30px; text-align: right; color: #333; }
            .school-stamp { text-align: right; margin-top: 50px; }
            .school-stamp p { margin: 0; }
          </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const handleShowReceipt = async (paymentId: number | string) => {
    try {
      setPaymentReceiptLoading(true);
      const token = localStorage.getItem('token');
      const data = await apiGet(`/payments/${paymentId}/receipt`);
      
      if (data.success && data.html) {
        // Nouveau format HTML
        setPaymentReceiptHtml(data.html);
        setPaymentReceiptOpen(true);
      } else {
        // Ancien format JSON (fallback)
        setPaymentReceiptData(data);
        setShowPaymentReceipt(true);
      }
    } catch (err) {
      alert('Erreur lors de la récupération du reçu.');
    } finally {
      setPaymentReceiptLoading(false);
    }
  };

  const openReinscriptionDialog = async (student: any) => {
    setReinscriptionData({
      studentId: student.id,
      parent_first_name: student.parent_first_name || '',
      parent_last_name: student.parent_last_name || '',
      parent_phone: student.parent_phone || '',
      parent_email: student.parent_email || '',
      parent_contact: student.parent_contact || '',
      isAssigned: student.is_assigned,
      previousYearSummary: null as any,
      reliquatAPayer: 0,
      resteAPayer: 0,
      firstPayment: 0,
    });
    setReinscriptionOpen(true);
  };

  const handleFirstPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReinscriptionData(prev => ({ ...prev, resteAPayer: Number(e.target.value) || 0, firstPayment: Number(e.target.value) || 0 }));
  };

  const handleReliquatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReinscriptionData(prev => ({ ...prev, reliquatAPayer: Number(e.target.value) || 0 }));
  };

  // Fonctions pour l'historique des reçus
  const handleReceiptHistoryOpen = async (student: any) => {
    setSelectedStudentForHistory(student);
    setSelectedHistorySchoolYear(schoolYear);
    setReceiptHistoryOpen(true);
    setReceiptHistoryLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const data = await apiGet(
        `/payments/student/${student.id}/receipt-history`,
        { school_year: schoolYear }
      );
      setReceiptHistoryData(data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'historique des reçus:', error);
      alert('Erreur lors de la récupération de l\'historique des reçus');
    } finally {
      setReceiptHistoryLoading(false);
    }
  };

  const handleReceiptHistoryClose = () => {
    setReceiptHistoryOpen(false);
    setSelectedStudentForHistory(null);
    setReceiptHistoryData(null);
    setSelectedHistorySchoolYear('');
  };

  const handleHistorySchoolYearChange = async (newSchoolYear: string) => {
    if (!selectedStudentForHistory) return;
    
    setSelectedHistorySchoolYear(newSchoolYear);
    setReceiptHistoryLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const data = await apiGet(
        `/payments/student/${selectedStudentForHistory.id}/receipt-history`,
        { school_year: newSchoolYear }
      );
      setReceiptHistoryData(data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'historique des reçus:', error);
      alert('Erreur lors de la récupération de l\'historique des reçus');
    } finally {
      setReceiptHistoryLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0';
    }
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Ajout d'un état pour l'erreur de montant de versement
  const [finalizePaymentError, setFinalizePaymentError] = useState<string>("");

  // États pour les reçus d'inscription
  const [enrollmentReceiptOpen, setEnrollmentReceiptOpen] = useState(false);
  const [enrollmentReceiptHtml, setEnrollmentReceiptHtml] = useState<string>('');
  const [enrollmentReceiptLoading, setEnrollmentReceiptLoading] = useState(false);

  // Fonction pour afficher le reçu d'inscription
  const handleShowEnrollmentReceipt = async (enrollmentId: number) => {
    setEnrollmentReceiptLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await apiGet(
        `/students/enrollments/${enrollmentId}/receipt`
      );
      
      if (data.success && data.html) {
        setEnrollmentReceiptHtml(data.html);
        setEnrollmentReceiptOpen(true);
      } else {
        alert('Erreur lors de la génération du reçu d\'inscription');
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération du reçu d\'inscription:', error);
      alert('Erreur lors de la récupération du reçu d\'inscription');
    } finally {
      setEnrollmentReceiptLoading(false);
    }
  };

  const handleEnrollmentReceiptClose = () => {
    setEnrollmentReceiptOpen(false);
    setEnrollmentReceiptHtml('');
  };

  const handlePaymentReceiptClose = () => {
    setPaymentReceiptOpen(false);
    setPaymentReceiptHtml('');
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
          {/* Sélecteur d'année scolaire */}
          <Box sx={{ mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="school-year-label">Année scolaire</InputLabel>
              <Select
                labelId="school-year-label"
                value={schoolYear}
                label="Année scolaire"
                onChange={e => setSchoolYear(e.target.value)}
              >
                {availableYears.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {showRegistrationForm ? (
            <InscrptionPre onClose={() => {
              setShowRegistrationForm(false);
              fetchStudents();
            }} />
          ) : (
            <>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SchoolIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                  <Typography variant="h4" component="h1" sx={{ 
                    fontWeight: 700,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Gestion des Étudiants
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {selectedSchoolYearStatus && !selectedSchoolYearStatus.is_active && (
                    <Alert 
                      severity="warning" 
                      sx={{ 
                        mb: 2,
                        background: 'linear-gradient(45deg, #ff9800, #f57c00)',
                        color: 'white',
                        '& .MuiAlert-icon': {
                          color: 'white'
                        }
                      }}
                    >
                      ⚠️ Année scolaire {schoolYear} fermée - Les modifications et suppressions sont désactivées
                    </Alert>
                  )}
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setShowRegistrationForm(true)}
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
                    Nouvel Étudiant
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<ReplayIcon />}
                    onClick={handleReinscriptionOpen}
                    sx={{
                      background: `linear-gradient(45deg, ${purple[500]} 30%, ${purple[700]} 90%)`,
                      color: 'white',
                      '&:hover': {
                        background: `linear-gradient(45deg, ${purple[600]} 30%, ${purple[800]} 90%)`,
                      },
                      px: 3,
                      py: 1,
                    }}
                  >
                    Réinscription
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

              {/* Boutons de gestion du cache */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={fetchStudents}
                  startIcon={<ReplayIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Rafraîchir les données
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleClearCache}
                  startIcon={<ReplayIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Vider le cache
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleForceRefresh}
                  startIcon={<ReplayIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Rafraîchissement forcé
                </Button>
              </Box>

              {/* Test de connectivité API */}
              {error && (
                <ApiConnectionTest />
              )}

              <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Rechercher un étudiant..."
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
                    <Grid item xs={6} md={2}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Classe</InputLabel>
                        <Select
                          value={selectedClass}
                          onChange={handleClassChange}
                          label="Classe"
                          sx={{
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: theme.palette.primary.main,
                            },
                          }}
                        >
                          <MenuItem value="Toutes les classes">Toutes les classes</MenuItem>
                          {classes.map((classe) => (
                            <MenuItem key={classe.id} value={classe.name}>{classe.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Genre</InputLabel>
                        <Select
                          value={genreFilter}
                          onChange={handleGenreFilterChange}
                          label="Genre"
                          sx={{
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: theme.palette.primary.main,
                            },
                          }}
                        >
                          {genreOptions.map((option) => (
                            <MenuItem key={option} value={option}>{option}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        label="Montant dû (F CFA)"
                        placeholder="Ex: 50000, >50000, 50000-100000"
                        value={scolariteFilter}
                        onChange={handleScolariteFilterChange}
                        helperText="Formats: montant exact, >montant, <montant, min-max"
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
                </CardContent>
              </Card>

              {/* Indicateur de résultats */}
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredStudents.length} étudiant(s) trouvé(s) sur {students.length} total
                  {scolariteFilter && (
                    <span style={{ marginLeft: '8px', color: '#1976d2' }}>
                      • Filtre montant: {scolariteFilter}
                    </span>
                  )}
                </Typography>
                {filteredStudents.length === 0 && students.length > 0 && (
                  <Alert severity="info" sx={{ py: 0 }}>
                    Aucun étudiant ne correspond aux critères de recherche
                  </Alert>
                )}
              </Box>


              <div ref={tableRef}>
                <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)` }}>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Matricule</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Nom</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Prénom</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Genre</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Classe</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Affecté</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Scolarité due (F CFA)</TableCell>
                          <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loading && (
                          <TableRow>
                            <TableCell colSpan={8} align="center">Chargement...</TableCell>
                          </TableRow>
                        )}
                        {error && (
                          <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ color: 'error.main' }}>{error}</TableCell>
                          </TableRow>
                        )}
                        {filteredStudents
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((student) => {
                            const montantClasse = student.is_assigned
                              ? Number(student.class_amount ?? student.amount ?? 0)
                              : Number(student.amount_non_assigned ?? 0);
                            const totalDiscount = Number(student.total_discount ?? 0);
                            const totalPaid = Number(student.total_paid ?? 0);
                            const remaining = montantClasse - totalDiscount - totalPaid;
                            
                            const isToFinalize = student.registration_mode === 'online' || student.registration_status === 'online' || !student.classe;
                            
                            // Log pour debug
                            console.log('Étudiant:', student.registration_number, 'registration_mode:', student.registration_mode, 'isToFinalize:', isToFinalize);
                            
                            return (
                              <Zoom in key={student.id}>
                                <TableRow hover>
                                  <TableCell>{student.registration_number}</TableCell>
                                  <TableCell>{student.last_name}</TableCell>
                                  <TableCell>{student.first_name}</TableCell>
                                  <TableCell>{student.gender}</TableCell>
                                  <TableCell>
                                    {student.classe ? (
                                      <Chip label={student.classe} color="primary" size="small" />
                                    ) : (
                                      <Chip label="Non assigné" size="small" />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {student.is_assigned ? (
                                      <Chip label="Affecté" color="success" size="small" />
                                    ) : (
                                      <Chip label="Non affecté" color="warning" size="small" />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Typography sx={{ color: (student.reste_a_payer || 0) > 0 ? 'error.main' : 'success.main', fontWeight: 600 }}>
                                      {Number(student.reste_a_payer || 0).toLocaleString('fr-FR')} F CFA
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    {isToFinalize ? (
                                      <Tooltip title="Finaliser l'inscription">
                                        <Button
                                          variant="contained"
                                          color="secondary"
                                          size="small"
                                          onClick={() => handleFinalizeOpen(student)}
                                          startIcon={<CheckIcon />}
                                        >
                                          Finaliser
                                        </Button>
                                      </Tooltip>
                                    ) : (
                                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                        {(student.reste_a_payer || 0) > 0 && (
                                          <Tooltip title="Effectuer un versement">
                                            <Button
                                              variant="contained"
                                              color="success"
                                              size="small"
                                              onClick={() => handlePaymentOpen(student)}
                                            >
                                              Payer
                                            </Button>
                                          </Tooltip>
                                        )}
                                        <Tooltip title="Voir détails">
                                          <IconButton color="primary" size="small" onClick={() => navigate(`/secretary/students/${student.id}`)}>
                                            <VisibilityIcon />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Historique des reçus">
                                          <IconButton color="info" size="small" onClick={() => handleReceiptHistoryOpen(student)}>
                                            <HistoryIcon />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title={selectedSchoolYearStatus && !selectedSchoolYearStatus.is_active ? `Impossible de modifier - Année scolaire ${schoolYear} fermée` : "Modifier"}>
                                          <span>
                                            <IconButton 
                                              color="primary" 
                                              size="small" 
                                              onClick={() => handleEditOpen(student)}
                                              disabled={selectedSchoolYearStatus && !selectedSchoolYearStatus.is_active}
                                              sx={{ 
                                                opacity: selectedSchoolYearStatus && !selectedSchoolYearStatus.is_active ? 0.5 : 1 
                                              }}
                                            >
                                              <EditIcon />
                                            </IconButton>
                                          </span>
                                        </Tooltip>
                                        <DeleteButton 
                                          onDelete={() => handleDelete(student.id)}
                                          permission="canDeleteStudents"
                                          tooltip={selectedSchoolYearStatus && !selectedSchoolYearStatus.is_active ? `Impossible de supprimer - Année scolaire ${schoolYear} fermée` : "Supprimer l'étudiant"}
                                          disabled={selectedSchoolYearStatus && !selectedSchoolYearStatus.is_active}
                                        />
                                      </Box>
                                    )}
                                  </TableCell>
                                </TableRow>
                              </Zoom>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredStudents.length}
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

              {/* Modale d'édition */}
              <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
                <DialogTitle>Modifier l'étudiant</DialogTitle>
                <DialogContent>
                  {editSuccess ? (
                    <Box sx={{ mb: 2, minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography color="success.main" sx={{ fontWeight: 'bold', fontSize: 18 }}>{editSuccess}</Typography>
                    </Box>
                  ) : (
                    editStudent && (
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Prénom"
                            name="first_name"
                            value={editStudent.first_name || editStudent.nom || ''}
                            onChange={handleEditChange}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Nom"
                            name="last_name"
                            value={editStudent.last_name || editStudent.prenom || ''}
                            onChange={handleEditChange}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Date de naissance"
                            name="date_of_birth"
                            value={editStudent.date_of_birth || ''}
                            onChange={handleEditChange}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel id="edit-gender-label">Genre</InputLabel>
                            <Select
                              labelId="edit-gender-label"
                              name="gender"
                              value={editStudent.gender || ''}
                              label="Genre"
                              onChange={(e) => setEditStudent((prev: Student | null) => prev ? { ...prev, gender: e.target.value } : null)}
                            >
                              <MenuItem value="M">Masculin</MenuItem>
                              <MenuItem value="F">Féminin</MenuItem>
                              <MenuItem value="Other">Autre</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Nationalité"
                            name="nationality"
                            value={editStudent.nationality || ''}
                            onChange={handleEditChange}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Lieu de naissance"
                            name="birth_place"
                            value={editStudent.birth_place || ''}
                            onChange={handleEditChange}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Adresse"
                            name="address"
                            value={editStudent.address || ''}
                            onChange={handleEditChange}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Ville"
                            name="city"
                            value={editStudent.city || ''}
                            onChange={handleEditChange}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Téléphone"
                            name="phone"
                            value={editStudent.phone || ''}
                            onChange={handleEditChange}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="École précédente"
                            name="previous_school"
                            value={editStudent.previous_school || ''}
                            onChange={handleEditChange}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Classe précédente"
                            name="previous_class"
                            value={editStudent.previous_class || ''}
                            onChange={handleEditChange}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Classe</InputLabel>
                            <Select
                              name="class_id"
                              value={editStudent.class_id || ''}
                              label="Classe"
                              onChange={(e) => setEditStudent((prev: Student | null) => prev ? { ...prev, class_id: e.target.value } : null)}
                            >
                              <MenuItem value="">
                                <em>Non assigné</em>
                              </MenuItem>
                              {classes.map((c) => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Besoins particuliers"
                            name="special_needs"
                            value={editStudent.special_needs || ''}
                            onChange={handleEditChange}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Informations supplémentaires"
                            name="additional_info"
                            value={editStudent.additional_info || ''}
                            onChange={handleEditChange}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {editStudent.id ? (
                                <Avatar 
                                  src={`https://2ise-groupe.com/api/students/${editStudent.id}/photo`} 
                                  sx={{ width: 60, height: 60, border: '2px solid #1976d2' }}
                                  onError={(e) => {
                                    console.error('[STUDENTS] Erreur de chargement photo pour', editStudent.first_name, editStudent.last_name);
                                    // En cas d'erreur, afficher les initiales
                                    const target = e.currentTarget;
                                    target.style.display = 'none';
                                    const initialsElement = target.parentElement?.querySelector('.edit-student-initials');
                                    if (initialsElement) {
                                      (initialsElement as HTMLElement).style.display = 'flex';
                                    }
                                  }}
                                  onLoad={() => {
                                    console.log('[STUDENTS] ✅ Photo chargée avec succès pour', editStudent.first_name, editStudent.last_name);
                                  }}
                                />
                              ) : null}
                              {/* Avatar de fallback avec initiales */}
                              <Avatar 
                                className="edit-student-initials"
                                sx={{ 
                                  width: 60, 
                                  height: 60, 
                                  bgcolor: 'primary.main',
                                  display: editStudent.id ? 'none' : 'flex'
                                }}
                              >
                                {editStudent.first_name?.[0]}{editStudent.last_name?.[0]}
                              </Avatar>
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Photo de l'étudiant
                              </Typography>
                              <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="photo-upload"
                                type="file"
                                onChange={handlePhotoChange}
                              />
                              <label htmlFor="photo-upload">
                                <Button
                                  variant="outlined"
                                  component="span"
                                  startIcon={<PhotoCameraIcon />}
                                  size="small"
                                >
                                  {selectedPhoto ? 'Photo sélectionnée' : 'Choisir une photo'}
                                </Button>
                              </label>
                              {selectedPhoto && (
                                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.main' }}>
                                  ✓ {selectedPhoto.name}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          {photoPreview && (
                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Aperçu de la nouvelle photo :
                              </Typography>
                              <Avatar 
                                src={photoPreview} 
                                sx={{ width: 80, height: 80, mx: 'auto', border: '3px solid #4caf50' }} 
                              />
                            </Box>
                          )}
                        </Grid>
                      </Grid>
                    )
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleEditClose} color="secondary">Fermer</Button>
                  {!editSuccess && (
                    <Button onClick={handleEditSubmit} color="primary" variant="contained" disabled={editLoading}>
                      {editLoading ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  )}
                </DialogActions>
              </Dialog>

              {/* Modale de Paiement */}
              <Dialog open={paymentModalOpen} onClose={handlePaymentClose} maxWidth="sm" fullWidth>
                <DialogTitle>Effectuer un Paiement</DialogTitle>
                <DialogContent>
                  {studentToPay && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6">{`${studentToPay.first_name} ${studentToPay.last_name}`}</Typography>
                      <Typography color="text.secondary" gutterBottom>Matricule: {studentToPay.registration_number}</Typography>
                       <Typography color="error" sx={{mt: 2}}>
                        Reste à payer: <b>{(((studentToPay?.class_amount ?? 0) - (studentToPay?.total_discount ?? 0) - (studentToPay?.total_paid ?? 0)).toLocaleString('fr-FR'))} F CFA</b>
                      </Typography>

                      {/* Affichage des versements */}
                      {studentToPay?.installments && studentToPay.installments.length > 0 && (
                        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            📋 Versements de la classe {studentToPay.class_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Type de paiement: {studentToPay.payment_type === 'assigned' ? 'Affecté' : 'Non affecté'}
                          </Typography>
                          
                          <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                            {studentToPay.installments.map((installment: any, index: number) => (
                              <Box 
                                key={installment.id} 
                                sx={{ 
                                  p: 1.5, 
                                  mb: 1, 
                                  border: '1px solid', 
                                  borderColor: installment.status === 'paid' ? 'success.main' : 
                                             installment.status === 'overdue' ? 'error.main' : 'warning.main',
                                  borderRadius: 1,
                                  bgcolor: installment.status === 'paid' ? 'success.light' : 
                                          installment.status === 'overdue' ? 'error.light' : 'warning.light'
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                      Versement {installment.installment_number}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Échéance: {new Date(installment.due_date).toLocaleDateString('fr-FR')}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                      {installment.amount?.toLocaleString('fr-FR')} F CFA
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Payé: {installment.amount_paid?.toLocaleString('fr-FR') || '0'} F CFA
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ mt: 1 }}>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      px: 1, 
                                      py: 0.5, 
                                      borderRadius: 0.5,
                                      bgcolor: installment.status === 'paid' ? 'success.main' : 
                                              installment.status === 'overdue' ? 'error.main' : 'warning.main',
                                      color: 'white',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {installment.status === 'paid' ? '✅ Payé' : 
                                     installment.status === 'overdue' ? '⚠️ En retard' : '⏳ En attente'}
                                  </Typography>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                          
                          <Typography variant="body2" color="info.main" sx={{ mt: 2, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                            💡 Le système associera automatiquement votre paiement au versement approprié selon la date.
                          </Typography>
                        </Box>
                      )}
                      
                      <FormControl fullWidth sx={{ mt: 3 }}>
                        <InputLabel>Moyen de paiement</InputLabel>
                        <Select
                          value={paymentMethod}
                          label="Moyen de paiement"
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <MenuItem value="cash">Espèces</MenuItem>
                          <MenuItem value="check">Chèque</MenuItem>
                          <MenuItem value="transfer">Virement</MenuItem>
                        </Select>
                      </FormControl>

                      {paymentMethod === 'check' && (
                        <Box sx={{ mt: 2 }}>
                          <TextField
                            label="Numéro de chèque"
                            fullWidth
                            value={checkNumber}
                            onChange={(e) => setCheckNumber(e.target.value)}
                            sx={{ mb: 2 }}
                            required
                          />
                          <TextField
                            label="Nom de la banque"
                            fullWidth
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            sx={{ mb: 2 }}
                            required
                          />
                          <TextField
                            label="Date d'émission"
                            type="date"
                            fullWidth
                            value={issueDate}
                            onChange={(e) => setIssueDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            required
                          />
                        </Box>
                      )}
                      
                      {paymentMethod === 'transfer' && (
                        <Box sx={{ mt: 2 }}>
                          <TextField
                            label="Numéro de virement"
                            fullWidth
                            value={transferNumber}
                            onChange={(e) => setTransferNumber(e.target.value)}
                            sx={{ mb: 2 }}
                            required
                          />
                          <TextField
                            label="Nom de la banque"
                            fullWidth
                            value={transferBank}
                            onChange={(e) => setTransferBank(e.target.value)}
                            sx={{ mb: 2 }}
                            required
                          />
                          <Typography variant="body2" color="info.main" sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                            <strong>Note:</strong> Les virements sont automatiquement approuvés et impactés directement sur la scolarité de l'étudiant.
                          </Typography>
                        </Box>
                      )}
                      
                      <TextField
                        label="Montant du paiement"
                        type="number"
                        fullWidth
                        placeholder="Saisir le montant..."
                        value={paymentAmount ?? ''}
                        onChange={handlePaymentAmountChange}
                        sx={{ mt: 3 }}
                        error={!!paymentAmountError}
                        helperText={paymentAmountError || "Le système déterminera automatiquement s'il s'agit d'un versement, d'une inscription, d'une finalisation ou d'une réinscription"}
                        inputProps={{ min: 1, step: 1 }}
                        disabled={false}
                      />
                    </Box>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={handlePaymentClose} color="secondary">Annuler</Button>
                  <Button onClick={handlePaymentSubmit} color="primary" variant="contained" disabled={paymentLoading || !!paymentAmountError}>
                    {paymentLoading ? <CircularProgress size={24} /> : 'Confirmer le Paiement'}
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Modale de Finalisation */}
              {finalizeModalOpen && reinscriptionStudent && reinscriptionStudent.registration_mode !== 'online' && (
                <Dialog open={finalizeModalOpen} onClose={handleFinalizeClose} maxWidth="sm" fullWidth>
                  <DialogTitle>Finaliser l'Inscription</DialogTitle>
                  <DialogContent>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6">{`${reinscriptionStudent.first_name} ${reinscriptionStudent.last_name}`}</Typography>
                      <Typography color="text.secondary" gutterBottom>Matricule: {reinscriptionStudent.registration_number}</Typography>
                      
                      <FormControl fullWidth sx={{ mt: 3 }}>
                        <InputLabel>Assigner une classe</InputLabel>
                        <Select
                          value={finalizeClassId}
                          label="Assigner une classe"
                          onChange={(e) => setFinalizeClassId(e.target.value)}
                        >
                          {classes.map((c) => (
                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <FormControl fullWidth sx={{ mt: 3 }}>
                        <InputLabel>Moyen de paiement</InputLabel>
                        <Select
                          value={paymentMethod}
                          label="Moyen de paiement"
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <MenuItem value="cash">Espèces</MenuItem>
                          <MenuItem value="check">Chèque</MenuItem>
                          <MenuItem value="transfer">Virement</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <TextField
                        label="Montant du premier versement"
                        type="number"
                        placeholder="Ex: 50000"
                        value={finalizePayment}
                        onChange={e => {
                          const value = e.target.value;
                          setFinalizePayment(value);
                          // Calcul du montant à payer selon le statut affecté
                          let montantCible = 0;
                          if (finalizeClassId) {
                            const classeObj = classes.find(c => c.id === parseInt(finalizeClassId));
                            montantCible = isAssigned ? Number(classeObj?.registration_fee_assigned || 0) : Number(classeObj?.registration_fee_non_assigned || 0);
                          }
                                                        if (Number(value) < montantCible) {
                                setFinalizePaymentError(`Montant insuffisant. Vous devez payer au minimum ${montantCible.toLocaleString('fr-FR')} F CFA (frais d'inscription complets).`);
                              } else {
                                setFinalizePaymentError("");
                              }
                        }}
                        fullWidth
                        inputProps={{ min: 0, step: 1000 }}
                        disabled={finalizeLoading}
                        sx={{ '& .MuiInputBase-input': { backgroundColor: '#fff', border: '2px solid #1976d2' } }}
                        error={!!finalizePaymentError}
                        helperText={finalizePaymentError}
                      />
                      
                      {paymentMethod === 'check' && (
                        <>
                          <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                required
                                fullWidth
                                label="Numéro de chèque"
                                value={checkNumber}
                                onChange={(e) => setCheckNumber(e.target.value)}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                required
                                fullWidth
                                label="Nom de la banque"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                required
                                fullWidth
                                label="Date d'émission"
                                type="date"
                                value={issueDate}
                                onChange={(e) => setIssueDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                              />
                            </Grid>
                          </Grid>
                        </>
                      )}
                      
                      {paymentMethod === 'transfer' && (
                        <>
                          <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                required
                                fullWidth
                                label="Numéro de virement"
                                value={transferNumber}
                                onChange={(e) => setTransferNumber(e.target.value)}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                required
                                fullWidth
                                label="Nom de la banque"
                                value={transferBank}
                                onChange={(e) => setTransferBank(e.target.value)}
                              />
                            </Grid>
                          </Grid>
                          <Typography variant="body2" color="info.main" sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                            <strong>Note:</strong> Les virements sont automatiquement approuvés et impactés directement sur la scolarité de l'étudiant.
                          </Typography>
                        </>
                      )}
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleFinalizeClose} color="secondary">Annuler</Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleFinalizeSubmit}
                      disabled={!finalizeClassId || !finalizePayment || !studentEmail || !parentEmail || finalizeLoading || !!finalizePaymentError ||
                        (paymentMethod === 'check' && (!checkNumber || !bankName || !issueDate)) ||
                        (paymentMethod === 'transfer' && (!transferNumber || !transferBank))
                      }
                    >
                      {finalizeLoading ? <CircularProgress size={24} /> : "Finaliser l'inscription"}
                    </Button>
                  </DialogActions>
                </Dialog>
              )}

              {/* Formulaire complet d'inscription pour les étudiants en ligne */}
              {showFinalizeForm && studentToFinalize && (
                <Dialog 
                  open={showFinalizeForm} 
                  onClose={() => setShowFinalizeForm(false)} 
                  maxWidth="md" 
                  fullWidth
                  PaperProps={{
                    sx: {
                      maxHeight: '90vh',
                      overflow: 'auto'
                    }
                  }}
                >
                  <DialogTitle>
                    Finaliser l'inscription - {studentToFinalize.first_name} {studentToFinalize.last_name}
                  </DialogTitle>
                  <DialogContent>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" gutterBottom>Informations de l'étudiant</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Matricule"
                            value={studentToFinalize.registration_number || ''}
                            fullWidth
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Nom"
                            value={studentToFinalize.last_name || ''}
                            fullWidth
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Prénom"
                            value={studentToFinalize.first_name || ''}
                            fullWidth
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Date de naissance"
                            value={studentToFinalize.date_of_birth ? new Date(studentToFinalize.date_of_birth).toLocaleDateString('fr-FR') : ''}
                            fullWidth
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Genre"
                            value={studentToFinalize.gender || ''}
                            fullWidth
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Nationalité"
                            value={studentToFinalize.nationality || ''}
                            fullWidth
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Lieu de naissance"
                            value={studentToFinalize.birth_place || ''}
                            fullWidth
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Ville"
                            value={studentToFinalize.city || ''}
                            fullWidth
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Adresse"
                            value={studentToFinalize.address || ''}
                            fullWidth
                            disabled
                          />
                        </Grid>
                      </Grid>

                      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Informations du parent</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Prénom du parent"
                            value={studentToFinalize.parent_first_name || ''}
                            fullWidth
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Nom du parent"
                            value={studentToFinalize.parent_last_name || ''}
                            fullWidth
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Téléphone du parent"
                            value={studentToFinalize.parent_phone || ''}
                            fullWidth
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Email du parent"
                            value={studentToFinalize.parent_email || ''}
                            fullWidth
                            disabled
                          />
                        </Grid>
                      </Grid>

                      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Emails pour la finalisation</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Email de l'élève *"
                            type="email"
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            fullWidth
                            required
                            helperText="Email requis pour créer le compte élève"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Email du parent *"
                            type="email"
                            value={parentEmail}
                            onChange={(e) => setParentEmail(e.target.value)}
                            fullWidth
                            required
                            helperText="Email requis pour créer le compte parent"
                          />
                        </Grid>
                      </Grid>

                      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Finalisation de l'inscription</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        Debug - Valeur actuelle du montant: {finalizePayment || 'vide'}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Classe à assigner</InputLabel>
                            <Select
                              value={finalizeClassId}
                              label="Classe à assigner"
                              onChange={(e) => setFinalizeClassId(e.target.value)}
                            >
                              {classes.map((c) => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={<Checkbox checked={isAssigned} onChange={e => setIsAssigned(e.target.checked)} />}
                            label="Affecté"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          {finalizeClassId && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Montant de la scolarité : <b>{(() => {
                                const classeObj = classes.find(c => c.id === parseInt(finalizeClassId));
                                return (isAssigned ? Number(classeObj?.level_amount || 0) : Number(classeObj?.level_amount_non_assigned || 0)).toLocaleString('fr-FR');
                              })()} F CFA</b>
                            </Typography>
                          )}
                          {finalizeClassId && (
                            <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                              Frais d'inscription requis : <b>{(() => {
                                const classeObj = classes.find(c => c.id === parseInt(finalizeClassId));
                                return (isAssigned ? Number(classeObj?.registration_fee_assigned || 0) : Number(classeObj?.registration_fee_non_assigned || 0)).toLocaleString('fr-FR');
                              })()} F CFA</b>
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Montant du premier versement"
                            type="number"
                            value={finalizePayment}
                            onChange={e => {
                              const value = e.target.value;
                              setFinalizePayment(value);
                              // Calcul du montant à payer selon le statut affecté
                              let montantCible = 0;
                              if (finalizeClassId) {
                                const classeObj = classes.find(c => c.id === parseInt(finalizeClassId));
                                montantCible = isAssigned ? Number(classeObj?.registration_fee_assigned || 0) : Number(classeObj?.registration_fee_non_assigned || 0);
                              }
                              if (Number(value) < montantCible) {
                                setFinalizePaymentError(`Montant insuffisant. Vous devez payer au minimum ${montantCible.toLocaleString('fr-FR')} F CFA (frais d'inscription complets).`);
                              } else {
                                setFinalizePaymentError("");
                              }
                            }}
                            fullWidth
                            inputProps={{ min: 0, step: 1000 }}
                            disabled={finalizeLoading}
                            sx={{ '& .MuiInputBase-input': { backgroundColor: '#fff', border: '2px solid #1976d2' } }}
                            error={!!finalizePaymentError}
                            helperText={finalizePaymentError}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setShowFinalizeForm(false)}>Annuler</Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleFinalizeSubmit}
                      disabled={!finalizeClassId || !finalizePayment || !studentEmail || !parentEmail || finalizeLoading || !!finalizePaymentError ||
                        (paymentMethod === 'check' && (!checkNumber || !bankName || !issueDate)) ||
                        (paymentMethod === 'transfer' && (!transferNumber || !transferBank))
                      }
                    >
                      {finalizeLoading ? <CircularProgress size={24} /> : "Finaliser l'inscription"}
                    </Button>
                  </DialogActions>
                </Dialog>
              )}

              {/* Modale de reçu de paiement */}
              <Dialog open={showPaymentReceipt} onClose={() => setShowPaymentReceipt(false)} maxWidth="md" fullWidth>
                <DialogTitle>Reçu de Paiement</DialogTitle>
                <DialogContent>
                    {paymentReceiptData && (
                      <Box ref={paymentReceiptRef} sx={{ p: 4, border: '1px solid #ddd', borderRadius: '8px', bgcolor: '#fff' }}>
                        <Box sx={{ textAlign: 'center', mb: 4, pb: 2, borderBottom: '2px solid #1976d2' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                            <img 
                              src="https://2ise-groupe.com/2ISE.jpg" 
                              alt="Logo École" 
                              style={{ 
                                height: '60px', 
                                width: 'auto', 
                                marginRight: '15px',
                                borderRadius: '8px'
                              }} 
                            />
                            <Typography variant="h4" component="h1" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                              2ISE-GROUPE
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Typography variant="h5" align="center" sx={{ my: 2, fontWeight: 'bold' }}>
                          REÇU DE PAIEMENT DE SCOLARITÉ
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                          <Typography><b>Date:</b> {new Date(paymentReceiptData.date).toLocaleString('fr-FR')}</Typography>
                          <Typography><b>Matricule:</b> {paymentReceiptData.registration_number}</Typography>
                        </Box>

                        <Divider sx={{ my: 2 }}><Chip label="Informations de l'Élève" /></Divider>
                        <Grid container spacing={1}>
                          <Grid item xs={12}><Typography><b>Élève:</b> {paymentReceiptData.first_name} {paymentReceiptData.last_name}</Typography></Grid>
                          <Grid item xs={12}><Typography><b>Classe:</b> {paymentReceiptData.classe}</Typography></Grid>
                          <Grid item xs={12}><Typography><b>Statut d'affectation:</b> {paymentReceiptData.is_assigned === 1 ? 'Affecté' : paymentReceiptData.is_assigned === 0 ? 'Non affecté' : 'Inconnu'}</Typography></Grid>
                        </Grid>
                        
                        <Divider sx={{ my: 2, mt: 3 }}><Chip label="Détails du Paiement" /></Divider>
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                {paymentReceiptData.is_assigned === 1
                                  ? 'Montant total de la scolarité (affecté)'
                                  : paymentReceiptData.is_assigned === 0
                                  ? 'Montant total de la scolarité (non affecté)'
                                  : 'Montant total de la scolarité'}
                              </TableCell>
                              <TableCell align="right">{Number(paymentReceiptData.montant_total_scolarite || 0).toLocaleString('fr-FR')} F CFA</TableCell>
                            </TableRow>
                            
                            <TableRow>
                              <TableCell>Total des réductions</TableCell>
                              <TableCell align="right">{Number(paymentReceiptData.total_reductions || 0).toLocaleString('fr-FR')} F CFA</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Montant dû avant ce paiement</TableCell>
                              <TableCell align="right"><b>{Number(paymentReceiptData.montant_du_avant || 0).toLocaleString('fr-FR')} F CFA</b></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Montant de ce versement</TableCell>
                              <TableCell align="right"><b>{Number(paymentReceiptData.montant_verse || 0).toLocaleString('fr-FR')} F CFA</b></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Total déjà versé (ce paiement inclus)</TableCell>
                              <TableCell align="right">{Number(paymentReceiptData.total_deja_verse || 0).toLocaleString('fr-FR')} F CFA</TableCell>
                            </TableRow>
                             <TableRow sx={{ '& td, & th': { border: 0 }, background: (theme) => (paymentReceiptData.reste_a_payer > 0 ? 'rgba(255, 0, 0, 0.05)' : 'rgba(0, 255, 0, 0.05)')}}>
                              <TableCell sx={{ fontWeight: 'bold' }}>Reste à payer</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                {Number(paymentReceiptData.reste_a_payer || 0).toLocaleString('fr-FR')} F CFA
                              </TableCell>
                            </TableRow>
                          
                          </TableBody>
                        </Table>

                        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <Typography variant="caption" color="text.secondary">
                             Statut: {paymentReceiptData.reste_a_payer > 0 ? <Chip label="Non soldé" color="error" size="small"/> : <Chip label="Soldé" color="success" size="small"/>}
                          </Typography>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography>
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
                          </Box>
                        </Box>

                        {/* Affichage debug et warning pour diagnostic */}

                      </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                  <Button onClick={() => setShowPaymentReceipt(false)}>Fermer</Button>
                  <Button color="primary" variant="contained" startIcon={<PrintIcon />} onClick={handlePrintPaymentReceipt}>Imprimer</Button>
                </DialogActions>
              </Dialog>

              {/* Modale de réinscription */}
              <Dialog open={reinscriptionOpen} onClose={handleReinscriptionClose} maxWidth="sm" fullWidth>
                <DialogTitle>Réinscription d'un élève</DialogTitle>
                <DialogContent>
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      label="Matricule de l'élève"
                      value={matriculeSearch}
                      onChange={e => setMatriculeSearch(e.target.value)}
                      fullWidth
                      sx={{ mb: 2 }}
                      onKeyDown={e => { if (e.key === 'Enter') handleMatriculeSearch(); }}
                      disabled={reinscriptionLoading}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleMatriculeSearch}
                      disabled={reinscriptionLoading || !matriculeSearch}
                      sx={{ mb: 2 }}
                    >
                      {reinscriptionLoading ? <CircularProgress size={22} /> : 'Rechercher'}
                    </Button>
                    {reinscriptionError && (
                      <Typography color="error" sx={{ mt: 1 }}>{reinscriptionError}</Typography>
                    )}
                    {reinscriptionStudent && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" mb={2}>Informations de l'élève</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}><TextField label="Nom" value={reinscriptionStudent.last_name} fullWidth disabled /></Grid>
                          <Grid item xs={12} sm={6}><TextField label="Prénom" value={reinscriptionStudent.first_name} fullWidth disabled /></Grid>
                          <Grid item xs={12} sm={6}><TextField label="Date de naissance" value={reinscriptionStudent.date_of_birth ? new Date(reinscriptionStudent.date_of_birth).toLocaleDateString('fr-FR') : ''} fullWidth disabled /></Grid>
                          <Grid item xs={12} sm={6}><TextField label="Classe actuelle" value={reinscriptionStudent.classe || previousClass || 'Non renseignée'} fullWidth disabled /></Grid>
                          <Grid item xs={12} sm={6}><TextField label="Matricule" value={reinscriptionStudent.registration_number} fullWidth disabled /></Grid>
                          <Grid item xs={12} sm={6}><TextField label="Ville" value={reinscriptionStudent.city} fullWidth disabled /></Grid>
                        </Grid>
                        {/* Affichage du niveau suivant */}
                        {targetLevel && (
                          <Box sx={{ mt: 3 }}>
                            <TextField label="Niveau pour la nouvelle année" value={targetLevel} fullWidth disabled />
                            {annualAverage && (
                              <Typography variant="caption" color={annualAverage.isAdmis ? 'success.main' : 'error.main'}>
                                {annualAverage.isAdmis ? 'Admis en classe supérieure' : 'Non admis, redoublement'}
                              </Typography>
                            )}
                          </Box>
                        )}
                        
                        {previousYearDue > 0 && (
                          <Box sx={{ mt: 3, mb: 2 }}>
                            <Typography color="error" sx={{ fontWeight: 'bold' }}>
                              Reliquat à payer pour l'année précédente : {Number(previousYearDue).toLocaleString('fr-FR')} F CFA
                            </Typography>
                            <TextField
                              label="Montant à régler pour l'année précédente"
                              type="number"
                              fullWidth
                              value={previousYearPayment}
                              onChange={e => {
                                const value = e.target.value;
                                const numValue = Number(value);
                                if (numValue > previousYearDue) {
                                  setPreviousYearPayment(previousYearDue.toString());
                                } else {
                                  setPreviousYearPayment(value);
                                }
                              }}
                              inputProps={{ min: 0, max: previousYearDue, step: 1000 }}
                              sx={{ mt: 1 }}
                              required
                              helperText={`Montant maximum: ${previousYearDue.toLocaleString('fr-FR')} F CFA`}
                            />
                            <Box sx={{ mt: 1, mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                Statut reliquat année précédente :
                              </Typography>
                              <Chip
                                label={Number(previousYearPayment) >= previousYearDue ? 'Reliquat soldé' : 'Reliquat non soldé'}
                                color={Number(previousYearPayment) >= previousYearDue ? 'success' : 'error'}
                                size="small"
                                sx={{ fontWeight: 600 }}
                              />
                              {Number(previousYearPayment) >= previousYearDue && (
                                <Typography variant="caption" color="success.main" sx={{ ml: 1, fontWeight: 600 }}>
                                  ✓ Prêt pour la réinscription
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              L'élève doit s'acquitter de ce reliquat avant de pouvoir être réinscrit. 
                              Le paiement du reliquat sera automatiquement traité lors de la réinscription.
                            </Typography>
                          </Box>
                        )}
                        <Typography variant="h6" mt={4} mb={2}>Informations du parent</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}><TextField label="Prénom du parent" name="parent_first_name" value={parentFields.parent_first_name} onChange={handleParentFieldChange} fullWidth /></Grid>
                          <Grid item xs={12} sm={6}><TextField label="Nom du parent" name="parent_last_name" value={parentFields.parent_last_name} onChange={handleParentFieldChange} fullWidth /></Grid>
                          <Grid item xs={12} sm={6}><TextField label="Téléphone du parent" name="parent_phone" value={parentFields.parent_phone} onChange={handleParentFieldChange} fullWidth /></Grid>
                          <Grid item xs={12} sm={6}><TextField label="Email du parent" name="parent_email" value={parentFields.parent_email} onChange={handleParentFieldChange} fullWidth /></Grid>
                          <Grid item xs={12}><TextField label="Contact du parent" name="parent_contact" value={parentFields.parent_contact} onChange={handleParentFieldChange} fullWidth /></Grid>
                        </Grid>
                        {/* Affichage de la classe précédente et statut admission/doublant */}
                        <Box sx={{ mt: 3 }}>
                          <TextField
                            label="Classe précédente"
                            value={previousClass || 'Non renseignée'}
                            fullWidth
                            disabled
                          />
                          
                          {annualAverage && (
                            <Typography variant="caption" color={annualAverage.isAdmis ? 'success.main' : 'error.main'}>
                              {annualAverage.isAdmis
                                ? 'Admis en classe supérieure (choisissez une classe du niveau supérieur)'
                                : 'Non admis, redoublement (choisissez une classe du même niveau)'}
                            </Typography>
                          )}
                        </Box>
                        <FormControl fullWidth sx={{ mt: 3 }}>
                          <InputLabel>Nouvelle classe</InputLabel>
                          <Select
                            value={reinscriptionClassId}
                            label="Nouvelle classe"
                            onChange={e => setReinscriptionClassId(e.target.value)}
                          >
                            {classesNiveauCible.map((c) => (
                              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl fullWidth sx={{ mt: 3 }}>
                          <InputLabel>Moyen de paiement</InputLabel>
                          <Select
                            value={paymentMethod}
                            label="Moyen de paiement"
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          >
                            <MenuItem value="cash">Espèces</MenuItem>
                            <MenuItem value="check">Chèque</MenuItem>
                            <MenuItem value="transfer">Virement</MenuItem>
                          </Select>
                        </FormControl>
                        
                        <TextField
                          label="Montant du premier versement"
                          type="number"
                          fullWidth
                          placeholder="Ex: 50000"
                          value={reinscriptionPayment}
                          onChange={e => setReinscriptionPayment(e.target.value)}
                          inputProps={{ min: 0, step: 1000 }}
                          sx={{ mt: 3 }}
                        />
                        
                        {paymentMethod === 'check' && (
                          <>
                            <Grid container spacing={2} sx={{ mt: 2 }}>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  required
                                  fullWidth
                                  label="Numéro de chèque"
                                  value={checkNumber}
                                  onChange={(e) => setCheckNumber(e.target.value)}
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  required
                                  fullWidth
                                  label="Nom de la banque"
                                  value={bankName}
                                  onChange={(e) => setBankName(e.target.value)}
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  required
                                  fullWidth
                                  label="Date d'émission"
                                  type="date"
                                  value={issueDate}
                                  onChange={(e) => setIssueDate(e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Grid>
                            </Grid>
                          </>
                        )}
                        
                        {paymentMethod === 'transfer' && (
                          <>
                            <Grid container spacing={2} sx={{ mt: 2 }}>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  required
                                  fullWidth
                                  label="Numéro de virement"
                                  value={transferNumber}
                                  onChange={(e) => setTransferNumber(e.target.value)}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  required
                                  fullWidth
                                  label="Nom de la banque"
                                  value={transferBank}
                                  onChange={(e) => setTransferBank(e.target.value)}
                                />
                              </Grid>
                            </Grid>
                            <Typography variant="body2" color="info.main" sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                              <strong>Note:</strong> Les virements sont automatiquement approuvés et impactés directement sur la scolarité de l'étudiant.
                            </Typography>
                          </>
                        )}
                        {reinscriptionClassId && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Montant de la scolarité : <b>{(isAssigned ? reinscriptionAmountAffecte : reinscriptionAmountNonAffecte).toLocaleString('fr-FR')} F CFA</b>
                          </Typography>
                        )}
                        {reinscriptionClassId && (
                          <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                            Frais d'inscription requis : <b>{(() => {
                              const classeObj = classes.find(c => c.id === parseInt(reinscriptionClassId));
                              return (isAssigned ? Number(classeObj?.registration_fee_assigned || 0) : Number(classeObj?.registration_fee_non_assigned || 0)).toLocaleString('fr-FR');
                            })()} F CFA</b>
                          </Typography>
                        )}
                        {/* Affichage du message d'erreur juste en dessous du formulaire */}
                        {reinscriptionApiError && (
                          <Box sx={{ my: 2 }}>
                            <Typography color="error" sx={{ fontWeight: 'bold' }}>
                              {reinscriptionApiError}
                            </Typography>
                          </Box>
                        )}
                        <FormControlLabel
                          control={<Checkbox checked={isAssigned} onChange={e => setIsAssigned(e.target.checked)} />}
                          label="Affecté"
                          sx={{ mt: 2 }}
                        />
                        {reinscriptionData.previousYearSummary && reinscriptionData.previousYearSummary.reste_a_payer > 0 && (
                          <TextField
                            margin="dense"
                            label={`Paiement du reliquat (${reinscriptionData.previousYearSummary.reste_a_payer.toLocaleString('fr-FR')} F CFA)`}
                            type="number"
                            fullWidth
                            variant="outlined"
                            value={reinscriptionData.reliquatAPayer}
                            onChange={handleReliquatChange}
                            helperText="Montant à payer pour le solde de l'année précédente."
                            InputProps={{
                              endAdornment: <InputAdornment position="end">F CFA</InputAdornment>,
                            }}
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleReinscriptionClose} color="secondary">Annuler</Button>
                  <Button
                    onClick={handleReinscriptionSubmit}
                    color="primary"
                    variant="contained"
                    disabled={
                      !reinscriptionStudent || !reinscriptionClassId || !reinscriptionPayment || reinscriptionSubmitting ||
                      (previousYearDue > 0 && (!previousYearPayment || Number(previousYearPayment) < previousYearDue)) ||
                      (paymentMethod === 'check' && (!checkNumber || !bankName || !issueDate)) ||
                      (paymentMethod === 'transfer' && (!transferNumber || !transferBank))
                    }
                  >
                    {reinscriptionSubmitting ? <CircularProgress size={22} /> : 'Valider la réinscription'}
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Modale de reçu de finalisation */}
              <Dialog open={showReceipt} onClose={() => {
                setShowReceipt(false);
                handleFinalizeClose(); // Fermer aussi la modale de finalisation
              }} maxWidth="md" fullWidth>
                <DialogTitle>Reçu de Finalisation</DialogTitle>
                <DialogContent>
                  {console.log('showReceipt:', showReceipt, 'receiptData:', receiptData)}
                  {receiptData && (
                    <Box ref={receiptRef} sx={{ p: 4, border: '1px solid #1976d2', borderRadius: '16px', bgcolor: '#fafdff', boxShadow: 4, maxWidth: 700, mx: 'auto', my: 2 }}>
                      <Box sx={{ textAlign: 'center', mb: 4, pb: 2, borderBottom: '3px solid #1976d2', position: 'relative' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                          <img 
                            src="https://2ise-groupe.com/2ISE.jpg" 
                            alt="Logo École" 
                            style={{ 
                              height: '80px', 
                              width: 'auto', 
                              marginRight: '20px',
                              borderRadius: '12px'
                            }} 
                          />
                          <Typography variant="h3" component="h1" sx={{ color: '#1976d2', fontWeight: 'bold', letterSpacing: 1, mb: 1, fontFamily: 'Montserrat, Arial' }}>
                            2ISE-GROUPE
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="h4" align="center" sx={{ my: 2, fontWeight: 'bold', color: '#222', letterSpacing: 1 }}>
                        REÇU DE FINALISATION D'INSCRIPTION
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Typography sx={{ fontWeight: 500, color: '#555' }}><b>Date:</b> {new Date(receiptData.date).toLocaleDateString('fr-FR')}</Typography>
                        <Typography sx={{ fontWeight: 500, color: '#555' }}><b>Matricule:</b> {receiptData.registration_number}</Typography>
                      </Box>
                      <Divider sx={{ my: 2 }}><Chip label="Informations de l'Élève" sx={{ fontWeight: 700, fontSize: 16, bgcolor: '#e3f2fd', color: '#1976d2' }} /></Divider>
                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={6}><Typography><b>Nom:</b> {receiptData.last_name}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><b>Prénom:</b> {receiptData.first_name}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><b>Date de naissance:</b> {receiptData.date_of_birth ? new Date(receiptData.date_of_birth).toLocaleDateString('fr-FR') : ''}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><b>Classe:</b> {receiptData.classe}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><b>Code élève:</b> {receiptData.student_code}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><b>Code parent:</b> {receiptData.parent_code}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><b>Statut d'affectation:</b> {receiptData.is_assigned === 1 ? 'Affecté' : 'Non affecté'}</Typography></Grid>
                      </Grid>
                      <Divider sx={{ my: 2, mt: 3 }}><Chip label="Informations du Parent" sx={{ fontWeight: 700, fontSize: 16, bgcolor: '#e3f2fd', color: '#1976d2' }} /></Divider>
                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={6}><Typography><b>Nom du parent:</b> {receiptData.parent_last_name}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><b>Prénom du parent:</b> {receiptData.parent_first_name}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><b>Téléphone:</b> {receiptData.parent_phone}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><b>Email:</b> {receiptData.parent_email}</Typography></Grid>
                        <Grid item xs={12}><Typography><b>Contact:</b> {receiptData.parent_contact}</Typography></Grid>
                      </Grid>
                      <Divider sx={{ my: 2, mt: 3 }}><Chip label="Détails du Paiement" sx={{ fontWeight: 700, fontSize: 16, bgcolor: '#e3f2fd', color: '#1976d2' }} /></Divider>
                      <Table size="medium" sx={{ mb: 2 }}>
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2', fontSize: 16 }}>Montant total de la scolarité</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#1976d2', fontSize: 18 }}>
                              {Number(receiptData.class_amount).toLocaleString('fr-FR')} F CFA
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2', fontSize: 16 }}>Total des réductions (bourses, bons, prises en charge...)</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#388e3c', fontSize: 18 }}>
                              {Number(receiptData.total_discount).toLocaleString('fr-FR')} F CFA
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2', fontSize: 16 }}>Montant du premier versement</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#388e3c', fontSize: 18 }}>
                              {Number(receiptData.payment_amount).toLocaleString('fr-FR')} F CFA
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2', fontSize: 16 }}>Total déjà versé</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#388e3c', fontSize: 18 }}>
                              {Number(receiptData.total_paid).toLocaleString('fr-FR')} F CFA
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2', fontSize: 16 }}>Reste à payer</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#d32f2f', fontSize: 18 }}>
                              {Number(receiptData.reste_a_payer) <= 0 ? 'Soldé' : `${Number(receiptData.reste_a_payer).toLocaleString('fr-FR')} F CFA`}
                            </TableCell>
                          </TableRow>
                          {/* Détail des réductions */}
                          {receiptData.reductions && receiptData.reductions.length > 0 && (
                            <>
                              <TableRow>
                                <TableCell colSpan={2} sx={{ fontWeight: 700, color: '#1976d2', fontSize: 16, background: '#e3f2fd' }}>
                                  Détail des réductions
                                </TableCell>
                              </TableRow>
                              {receiptData.reductions.map((reduction: any, idx: number) => (
                                <TableRow key={idx}>
                                  <TableCell>
                                    {reduction.name}
                                    {reduction.is_percentage ? ` (${reduction.percentage}%)` : ''}
                                  </TableCell>
                                  <TableCell align="right">
                                    -{Number(reduction.montant_applique).toLocaleString('fr-FR')} F CFA
                                  </TableCell>
                                </TableRow>
                              ))}
                            </>
                          )}
                        </TableBody>
                      </Table>
                      <Box sx={{ mt: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: 16 }}>
                          Statut: <Chip label="Inscription finalisée" color="success" size="medium" sx={{ fontWeight: 700, fontSize: 16 }} />
                        </Typography>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography sx={{ fontStyle: 'italic', color: '#1976d2', fontWeight: 600 }}>
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
                        </Box>
                      </Box>
                    </Box>
                  )}
                  {!receiptData && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography color="error">Aucune donnée de reçu disponible</Typography>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                  <Button onClick={() => {
                    setShowReceipt(false);
                    handleFinalizeClose(); // Fermer aussi la modale de finalisation
                  }}>Fermer</Button>
                  <Button color="primary" variant="contained" startIcon={<PrintIcon />} onClick={handlePrintReceipt}>Imprimer</Button>
                </DialogActions>
              </Dialog>

              {/* Modale de reçu de réinscription */}
              <Dialog open={showReinscriptionReceipt} onClose={() => setShowReinscriptionReceipt(false)} maxWidth="md" fullWidth>
                <DialogTitle>Reçu de Réinscription</DialogTitle>
                <DialogContent>
                  {reinscriptionReceiptData && (
                    <Box ref={reinscriptionReceiptRef} sx={{ p: 4, border: '1px solid #1976d2', borderRadius: '16px', bgcolor: '#fafdff', boxShadow: 4, maxWidth: 700, mx: 'auto', my: 2 }}>
                      <Box sx={{ textAlign: 'center', mb: 4, pb: 2, borderBottom: '3px solid #1976d2', position: 'relative' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                          <img 
                            src="https://2ise-groupe.com/2ISE.jpg" 
                            alt="Logo École" 
                            style={{ 
                              height: '80px', 
                              width: 'auto', 
                              marginRight: '20px',
                              borderRadius: '12px'
                            }} 
                          />
                          <Typography variant="h3" component="h1" sx={{ color: '#1976d2', fontWeight: 'bold', letterSpacing: 1, mb: 1, fontFamily: 'Montserrat, Arial' }}>
                            2ISE-GROUPE
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="h4" align="center" sx={{ my: 2, fontWeight: 'bold', color: '#222', letterSpacing: 1 }}>
                        REÇU DE RÉINSCRIPTION
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Typography sx={{ fontWeight: 500, color: '#555' }}><b>Date:</b> {reinscriptionReceiptData.date}</Typography>
                        <Typography sx={{ fontWeight: 500, color: '#555' }}><b>Matricule:</b> {reinscriptionReceiptData.student_identity?.registration_number}</Typography>
                      </Box>
                      <Divider sx={{ my: 2 }}><Chip label="Informations de l'Élève" sx={{ fontWeight: 700, fontSize: 16, bgcolor: '#e3f2fd', color: '#1976d2' }} /></Divider>
                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={6}><Typography><b>Nom:</b> {reinscriptionReceiptData.student_identity?.last_name}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><b>Prénom:</b> {reinscriptionReceiptData.student_identity?.first_name}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><b>Date de naissance:</b> {new Date(reinscriptionReceiptData.student_identity?.date_of_birth).toLocaleDateString('fr-FR')}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><b>Ville:</b> {reinscriptionReceiptData.student_identity?.city}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><b>Code élève:</b> {reinscriptionReceiptData.student_code}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><b>Code parent:</b> {reinscriptionReceiptData.parent_code}</Typography></Grid>
                      </Grid>
                      <Divider sx={{ my: 2, mt: 3 }}><Chip label="Informations du Parent" sx={{ fontWeight: 700, fontSize: 16, bgcolor: '#e3f2fd', color: '#1976d2' }} /></Divider>
                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={6}><Typography><b>Nom du parent:</b> {reinscriptionReceiptData.student_identity?.parent_last_name}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><b>Prénom du parent:</b> {reinscriptionReceiptData.student_identity?.parent_first_name}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><b>Téléphone:</b> {reinscriptionReceiptData.student_identity?.parent_phone}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><b>Email:</b> {reinscriptionReceiptData.student_identity?.parent_email}</Typography></Grid>
                        <Grid item xs={12}><Typography><b>Contact:</b> {reinscriptionReceiptData.student_identity?.parent_contact}</Typography></Grid>
                      </Grid>
                      <Divider sx={{ my: 2, mt: 3 }}><Chip label="Détails du Paiement Année Courante" sx={{ fontWeight: 700, fontSize: 16, bgcolor: '#e3f2fd', color: '#1976d2' }} /></Divider>
                      <Table size="medium" sx={{ mb: 2 }}>
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2', fontSize: 16 }}>Montant total de la scolarité</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#1976d2', fontSize: 18 }}>
                              {Number(reinscriptionReceiptData.summary?.class_amount || 0).toLocaleString('fr-FR')} F CFA
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2', fontSize: 16 }}>Total des réductions</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#388e3c', fontSize: 18 }}>
                              {Number(reinscriptionReceiptData.summary?.total_discount || 0).toLocaleString('fr-FR')} F CFA
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2', fontSize: 16 }}>Montant du premier versement</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#388e3c', fontSize: 18 }}>
                              {Number(reinscriptionReceiptData.summary?.total_paid || 0).toLocaleString('fr-FR')} F CFA
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2', fontSize: 16 }}>Reste à payer</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#d32f2f', fontSize: 18 }}>
                              {Number(reinscriptionReceiptData.summary?.reste_a_payer || 0).toLocaleString('fr-FR')} F CFA
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      <Divider sx={{ my: 2, mt: 3 }}><Chip label="Reliquat Année Précédente" sx={{ fontWeight: 700, fontSize: 16, bgcolor: '#e3f2fd', color: '#1976d2' }} /></Divider>
                      <Table size="medium" sx={{ mb: 2 }}>
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2', fontSize: 16 }}>Montant total de la scolarité</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#1976d2', fontSize: 18 }}>
                              {Number(reinscriptionReceiptData.summaryPreviousYear?.class_amount || 0).toLocaleString('fr-FR')} F CFA
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2', fontSize: 16 }}>Total des réductions</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#388e3c', fontSize: 18 }}>
                              {Number(reinscriptionReceiptData.summaryPreviousYear?.total_discount || 0).toLocaleString('fr-FR')} F CFA
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2', fontSize: 16 }}>Total déjà versé</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#388e3c', fontSize: 18 }}>
                              {Number(reinscriptionReceiptData.summaryPreviousYear?.total_paid || 0).toLocaleString('fr-FR')} F CFA
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#d32f2f', fontSize: 16 }}>Reliquat à payer</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#d32f2f', fontSize: 18 }}>
                              {Number(reinscriptionReceiptData.summaryPreviousYear?.reste_a_payer || 0).toLocaleString('fr-FR')} F CFA
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      <Box sx={{ mt: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: 16 }}>
                          Statut: <Chip label="Réinscrit" color="success" size="medium" sx={{ fontWeight: 700, fontSize: 16 }} />
                        </Typography>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography sx={{ fontStyle: 'italic', color: '#1976d2', fontWeight: 600 }}>
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
                        </Box>
                      </Box>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                  <Button onClick={() => setShowReinscriptionReceipt(false)}>Fermer</Button>
                  <Button color="primary" variant="contained" startIcon={<PrintIcon />} onClick={handlePrintReinscriptionReceipt}>Imprimer</Button>
                </DialogActions>
              </Dialog>

              {/* Modale d'historique des reçus */}
              <Dialog open={receiptHistoryOpen} onClose={handleReceiptHistoryClose} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <HistoryIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" component="div">
                    Historique des Reçus - {selectedStudentForHistory?.first_name} {selectedStudentForHistory?.last_name}
                  </Typography>
                </DialogTitle>
                <DialogContent>
                  {receiptHistoryLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : receiptHistoryData ? (
                    <Box>
                      {/* Sélecteur d'année scolaire */}
                      <Box sx={{ mb: 3 }}>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                          <InputLabel>Année scolaire</InputLabel>
                          <Select
                            value={selectedHistorySchoolYear}
                            label="Année scolaire"
                            onChange={(e) => handleHistorySchoolYearChange(e.target.value)}
                          >
                            {availableYears.map(year => (
                              <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>

                      {/* Informations de l'étudiant */}
                      <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Informations de l'étudiant
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography><strong>Nom complet:</strong> {receiptHistoryData.student?.first_name} {receiptHistoryData.student?.last_name}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography><strong>Matricule:</strong> {receiptHistoryData.student?.registration_number}</Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>

                      {/* Historique des paiements */}
                      <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                        Historique des Paiements ({receiptHistoryData.payments?.length || 0} paiements)
                      </Typography>
                      
                      {receiptHistoryData.payments && receiptHistoryData.payments.length > 0 ? (
                        <TableContainer component={Paper} sx={{ mb: 3 }}>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell><strong>N° Reçu</strong></TableCell>
                                <TableCell><strong>Date</strong></TableCell>
                                <TableCell><strong>Montant</strong></TableCell>
                                <TableCell><strong>Méthode</strong></TableCell>
                                <TableCell><strong>Détails</strong></TableCell>
                                <TableCell><strong>Statut</strong></TableCell>
                                <TableCell><strong>Année</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {receiptHistoryData.payments.map((payment: any) => (
                                <TableRow key={payment.id}>
                                  <TableCell>
                                    <Chip 
                                      label={payment.receipt_number} 
                                      color="primary" 
                                      size="small"
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell>{formatDate(payment.payment_date)}</TableCell>
                                  <TableCell>
                                    <Typography sx={{ fontWeight: 600, color: 'success.main' }}>
                                      {formatAmount(Number(payment.montant_verse || payment.amount) || 0)} FCFA
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={
                                        payment.payment_method === 'cash' ? 'Espèces' : 
                                        payment.payment_method === 'check' ? 'Chèque' :
                                        payment.payment_method === 'transfer' ? 'Virement' :
                                        payment.payment_method === 'Monnaie Fusion' ? 'Monnaie Fusion' :
                                        payment.payment_method || 'Non spécifié'
                                      } 
                                      color={
                                        payment.payment_method === 'cash' ? 'success' : 
                                        payment.payment_method === 'check' ? 'warning' :
                                        payment.payment_method === 'transfer' ? 'info' :
                                        payment.payment_method === 'Monnaie Fusion' ? 'secondary' :
                                        'default'
                                      }
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {payment.payment_method === 'check' && payment.check_number ? (
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                          N°: {payment.check_number}
                                        </Typography>
                                        {payment.bank_name && (
                                          <Typography variant="caption" color="text.secondary">
                                            {payment.bank_name}
                                          </Typography>
                                        )}
                                        {payment.issue_date && (
                                          <Typography variant="caption" color="text.secondary">
                                            {new Date(payment.issue_date).toLocaleDateString('fr-FR')}
                                          </Typography>
                                        )}
                                      </Box>
                                    ) : payment.payment_method === 'transfer' && payment.check_number ? (
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                          N°: {payment.check_number}
                                        </Typography>
                                        {payment.bank_name && (
                                          <Typography variant="caption" color="text.secondary">
                                            {payment.bank_name}
                                          </Typography>
                                        )}
                                      </Box>
                                    ) : (
                                      <Typography variant="caption" color="text.secondary">
                                        -
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={payment.status === 'completed' ? 'Complété' : payment.status} 
                                      color={payment.status === 'completed' ? 'success' : 'default'}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>{payment.school_year}</TableCell>
                                  <TableCell>
                                    <Tooltip title="Voir le reçu">
                                      <IconButton 
                                        size="small" 
                                        color="primary"
                                        onClick={() => handleShowReceipt(payment.id)}
                                      >
                                        <ReceiptIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Alert severity="info" sx={{ mb: 3 }}>
                          Aucun paiement trouvé pour cette année scolaire.
                        </Alert>
                      )}

                      {/* Historique des inscriptions */}
                      {receiptHistoryData.enrollments && receiptHistoryData.enrollments.length > 0 && (
                        <>
                          <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                            Historique des Inscriptions ({receiptHistoryData.enrollments.length} inscriptions)
                          </Typography>
                          <TableContainer component={Paper}>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell><strong>Date d'inscription</strong></TableCell>
                                  <TableCell><strong>Classe</strong></TableCell>
                                  <TableCell><strong>Statut</strong></TableCell>
                                  <TableCell><strong>Année</strong></TableCell>
                                  <TableCell><strong>Enregistré par</strong></TableCell>
                                  <TableCell><strong>Actions</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {receiptHistoryData.enrollments.map((enrollment: any) => (
                                  <TableRow key={enrollment.id}>
                                    <TableCell>{formatDate(enrollment.enrollment_date)}</TableCell>
                                    <TableCell>{enrollment.class_name}</TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={enrollment.status === 'active' ? 'Active' : enrollment.status} 
                                        color={enrollment.status === 'active' ? 'success' : 'default'}
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell>{enrollment.school_year}</TableCell>
                                    <TableCell>
                                      {enrollment.user_first_name && enrollment.user_last_name 
                                        ? `${enrollment.user_first_name} ${enrollment.user_last_name}`
                                        : enrollment.created_by 
                                          ? `Utilisateur ${enrollment.created_by}`
                                          : 'Non renseigné'
                                      }
                                    </TableCell>
                                    <TableCell>
                                      <Tooltip title="Voir le reçu d'inscription">
                                        <IconButton 
                                          size="small" 
                                          color="primary"
                                          onClick={() => handleShowEnrollmentReceipt(enrollment.id)}
                                        >
                                          <ReceiptIcon />
                                        </IconButton>
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </>
                      )}
                    </Box>
                  ) : (
                    <Alert severity="error">
                      Erreur lors du chargement de l'historique des reçus.
                    </Alert>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleReceiptHistoryClose}>Fermer</Button>
                </DialogActions>
              </Dialog>

              {/* Modale pour le reçu d'inscription */}
              <Dialog 
                open={enrollmentReceiptOpen} 
                onClose={handleEnrollmentReceiptClose} 
                maxWidth="lg" 
                fullWidth
              >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ReceiptIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" component="div">
                    Reçu d'Inscription
                  </Typography>
                </DialogTitle>
                <DialogContent>
                  {enrollmentReceiptLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : enrollmentReceiptHtml ? (
                    <Box 
                      sx={{ 
                        maxHeight: '70vh', 
                        overflow: 'auto',
                        '& iframe': {
                          width: '100%',
                          height: '600px',
                          border: 'none'
                        }
                      }}
                    >
                      <iframe
                        srcDoc={enrollmentReceiptHtml}
                        title="Reçu d'inscription"
                        style={{ width: '100%', height: '600px', border: 'none' }}
                      />
                    </Box>
                  ) : (
                    <Alert severity="error">
                      Erreur lors du chargement du reçu d'inscription.
                    </Alert>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleEnrollmentReceiptClose}>Fermer</Button>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => {
                      const newWindow = window.open();
                      if (newWindow) {
                        newWindow.document.write(enrollmentReceiptHtml);
                        newWindow.document.close();
                        newWindow.print();
                      }
                    }}
                    disabled={!enrollmentReceiptHtml}
                  >
                    Imprimer
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Modale pour le reçu de paiement */}
              <Dialog 
                open={paymentReceiptOpen} 
                onClose={handlePaymentReceiptClose} 
                maxWidth="lg" 
                fullWidth
              >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ReceiptIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" component="div">
                    Reçu de Paiement
                  </Typography>
                </DialogTitle>
                <DialogContent>
                  {paymentReceiptLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : paymentReceiptHtml ? (
                    <Box 
                      sx={{ 
                        maxHeight: '70vh', 
                        overflow: 'auto',
                        '& iframe': {
                          width: '100%',
                          height: '600px',
                          border: 'none'
                        }
                      }}
                    >
                      <iframe
                        srcDoc={paymentReceiptHtml}
                        title="Reçu de paiement"
                        style={{ width: '100%', height: '600px', border: 'none' }}
                      />
                    </Box>
                  ) : (
                    <Alert severity="error">
                      Erreur lors du chargement du reçu de paiement.
                    </Alert>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={handlePaymentReceiptClose}>Fermer</Button>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => {
                      const newWindow = window.open();
                      if (newWindow) {
                        newWindow.document.write(paymentReceiptHtml);
                        newWindow.document.close();
                        newWindow.print();
                      }
                    }}
                    disabled={!paymentReceiptHtml}
                  >
                    Imprimer
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default Students; 