import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  CircularProgress,
  InputAdornment,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  AccountBalanceWallet as WalletIcon,
  Print as PrintIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import SecretarySidebar from '../../components/SecretarySidebar';
import axios from 'axios';

// Types
interface FeeType {
  id: number;
  name: string;
  description: string;
  amount: number;
  is_active: boolean;
  is_installment: boolean;
  installment_period: string;
  total_installments: number;
  is_level_based: boolean;
}

interface Level {
  id: number;
  name: string;
}

interface LevelAmount {
  id: number;
  fee_type_id: number;
  level_id: number;
  amount: number;
  level_name: string;
}

interface Payment {
  id: number;
  student_id: number;
  fee_type_id: number;
  amount: number | string;
  payment_date: string;
  payment_method: string;
  reference_number: string;
  description: string;
  status: string;
  school_year: string;
  trimester: string;
  installment_number: number;
  installment_period: string;
  due_date: string;
  first_name: string;
  last_name: string;
  registration_number: string;
  class_name: string;
  fee_type_name: string;
  created_by_first_name: string;
  created_by_last_name: string;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  registration_number: string;
  class_name: string;
}

const AnnexFees = () => {
  // États
  const [activeTab, setActiveTab] = useState(0);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [levelAmounts, setLevelAmounts] = useState<LevelAmount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les modales
  const [feeTypeModalOpen, setFeeTypeModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [levelAmountsModalOpen, setLevelAmountsModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [editingFeeType, setEditingFeeType] = useState<FeeType | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedFeeTypeForLevels, setSelectedFeeTypeForLevels] = useState<FeeType | null>(null);
  
  // États pour les formulaires
  const [feeTypeForm, setFeeTypeForm] = useState({
    name: '',
    description: '',
    amount: 0,
    is_active: true,
    is_installment: false,
    installment_period: 'monthly',
    total_installments: 1,
    is_level_based: false
  });
  
  const [paymentForm, setPaymentForm] = useState({
    student_id: '',
    fee_type_id: '',
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference_number: '',
    description: '',
    school_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    trimester: '1er trimestre',
    installment_number: 1,
    installment_period: '',
    due_date: '',
    status: 'paid'
  });
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    student_search: '',
    fee_type_filter: '',
    status_filter: '',
    date_from: '',
    date_to: ''
  });

  // États pour l'impression
  const [printFilters, setPrintFilters] = useState({
    level_filter: '',
    class_filter: '',
    fee_type_filter: '',
    status_filter: '',
    school_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
  });
  
  // États pour les notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Charger les données au montage du composant
  useEffect(() => {
    loadFeeTypes();
    loadPayments();
    loadStudents();
    loadLevels();
  }, []);

  // Fonctions de chargement des données
  const loadFeeTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://2ise-groupe.com/api/annex-fees/fee-types', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeeTypes(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des types de frais:', error);
      setError('Erreur lors du chargement des types de frais');
    }
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.student_search) params.append('student_id', filters.student_search);
      if (filters.fee_type_filter) params.append('fee_type_id', filters.fee_type_filter);
      if (filters.status_filter) params.append('status', filters.status_filter);
      if (filters.date_from) params.append('start_date', filters.date_from);
      if (filters.date_to) params.append('end_date', filters.date_to);
      
      const response = await axios.get(`https://2ise-groupe.com/api/annex-fees/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data.payments || response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error);
      setError('Erreur lors du chargement des paiements');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://2ise-groupe.com/api/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des étudiants:', error);
    }
  };

  const loadLevels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://2ise-groupe.com/api/annex-fees/levels', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLevels(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des niveaux:', error);
    }
  };

  const loadLevelAmounts = async (feeTypeId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://2ise-groupe.com/api/annex-fees/fee-types/${feeTypeId}/level-amounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLevelAmounts(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des montants par niveau:', error);
    }
  };

  // Fonctions pour les types de frais
  const handleCreateFeeType = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('https://2ise-groupe.com/api/annex-fees/fee-types', feeTypeForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSnackbar({
        open: true,
        message: 'Type de frais créé avec succès',
        severity: 'success'
      });
      
      setFeeTypeModalOpen(false);
      setFeeTypeForm({ 
        name: '', 
        description: '', 
        amount: 0,
        is_active: true,
        is_installment: false,
        installment_period: 'monthly',
        total_installments: 1,
        is_level_based: false
      });
      loadFeeTypes();
    } catch (error) {
      console.error('Erreur lors de la création du type de frais:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la création du type de frais',
        severity: 'error'
      });
    }
  };

  const handleUpdateFeeType = async () => {
    if (!editingFeeType) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`https://2ise-groupe.com/api/annex-fees/fee-types/${editingFeeType.id}`, feeTypeForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSnackbar({
        open: true,
        message: 'Type de frais mis à jour avec succès',
        severity: 'success'
      });
      
      setFeeTypeModalOpen(false);
      setEditingFeeType(null);
      setFeeTypeForm({ 
        name: '', 
        description: '', 
        amount: 0,
        is_active: true,
        is_installment: false,
        installment_period: 'monthly',
        total_installments: 1,
        is_level_based: false
      });
      loadFeeTypes();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du type de frais:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la mise à jour du type de frais',
        severity: 'error'
      });
    }
  };

  const handleDeleteFeeType = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce type de frais ?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://2ise-groupe.com/api/annex-fees/fee-types/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSnackbar({
        open: true,
        message: 'Type de frais supprimé avec succès',
        severity: 'success'
      });
      
      loadFeeTypes();
    } catch (error) {
      console.error('Erreur lors de la suppression du type de frais:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la suppression du type de frais',
        severity: 'error'
      });
    }
  };

  const handleManageLevelAmounts = async (feeType: FeeType) => {
    setSelectedFeeTypeForLevels(feeType);
    await loadLevelAmounts(feeType.id);
    setLevelAmountsModalOpen(true);
  };

  const handleUpdateLevelAmounts = async () => {
    if (!selectedFeeTypeForLevels) return;
    
    try {
      const token = localStorage.getItem('token');
      const levelAmountsData = levels.map(level => {
        const existingAmount = levelAmounts.find(la => la.level_id === level.id);
        return {
          level_id: level.id,
          amount: existingAmount ? existingAmount.amount : 0
        };
      });

      await axios.put(`https://2ise-groupe.com/api/annex-fees/fee-types/${selectedFeeTypeForLevels.id}/level-amounts`, {
        levelAmounts: levelAmountsData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSnackbar({
        open: true,
        message: 'Montants par niveau mis à jour avec succès',
        severity: 'success'
      });
      
      setLevelAmountsModalOpen(false);
      setSelectedFeeTypeForLevels(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des montants par niveau:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la mise à jour des montants par niveau',
        severity: 'error'
      });
    }
  };

  // Fonctions pour les paiements
  const handleCreatePayment = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Si c'est un paiement par tranches, générer automatiquement la période et la date d'échéance
      const selectedFeeType = feeTypes.find(ft => ft.id.toString() === paymentForm.fee_type_id);
      let formData = { ...paymentForm };
      
      // Définir automatiquement le statut selon le type de paiement
      if (selectedFeeType) {
        if (selectedFeeType.is_installment) {
          formData.status = 'pending'; // Les paiements par tranches commencent en attente
        } else {
          formData.status = 'paid'; // Les paiements uniques sont automatiquement payés
        }
      }
      
      // Validation côté client pour les paiements uniques
      if (selectedFeeType && !selectedFeeType.is_installment) {
        if (selectedFeeType.is_level_based) {
          // Pour les frais par niveau, on ne peut pas valider côté client car on ne connaît pas le niveau
          // La validation se fera côté serveur
        } else {
          // Pour les frais avec montant fixe, vérifier que le montant est exact
          if (paymentForm.amount !== selectedFeeType.amount) {
            setSnackbar({
              open: true,
              message: `Le montant doit être exactement ${selectedFeeType.amount.toLocaleString()} FCFA pour ce type de frais`,
              severity: 'error'
            });
            return;
          }
        }
      }
      
      if (selectedFeeType?.is_installment) {
        formData.installment_period = generateInstallmentPeriod(
          paymentForm.installment_number, 
          selectedFeeType.installment_period, 
          paymentForm.school_year
        );
        formData.due_date = generateDueDate(
          paymentForm.installment_number, 
          selectedFeeType.installment_period, 
          paymentForm.school_year
        );
      }
      
      await axios.post('https://2ise-groupe.com/api/annex-fees/payments', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSnackbar({
        open: true,
        message: 'Paiement créé avec succès',
        severity: 'success'
      });
      
      setPaymentModalOpen(false);
      setPaymentForm({
        student_id: '',
        fee_type_id: '',
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        reference_number: '',
        description: '',
        school_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        trimester: '1er trimestre',
        installment_number: 1,
        installment_period: '',
        due_date: '',
        status: 'paid'
      });
      loadPayments();
    } catch (error) {
      console.error('Erreur lors de la création du paiement:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la création du paiement',
        severity: 'error'
      });
    }
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Validation côté client pour les paiements uniques
      const selectedFeeType = feeTypes.find(ft => ft.id.toString() === paymentForm.fee_type_id);
      if (selectedFeeType && !selectedFeeType.is_installment) {
        if (selectedFeeType.is_level_based) {
          // Pour les frais par niveau, on ne peut pas valider côté client car on ne connaît pas le niveau
          // La validation se fera côté serveur
        } else {
          // Pour les frais avec montant fixe, vérifier que le montant est exact
          if (paymentForm.amount !== selectedFeeType.amount) {
            setSnackbar({
              open: true,
              message: `Le montant doit être exactement ${selectedFeeType.amount.toLocaleString()} FCFA pour ce type de frais`,
              severity: 'error'
            });
            return;
          }
        }
      }
      
      await axios.put(`https://2ise-groupe.com/api/annex-fees/payments/${editingPayment.id}`, paymentForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSnackbar({
        open: true,
        message: 'Paiement mis à jour avec succès',
        severity: 'success'
      });
      
      setPaymentModalOpen(false);
      setEditingPayment(null);
      setPaymentForm({
        student_id: '',
        fee_type_id: '',
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        reference_number: '',
        description: '',
        school_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        trimester: '1er trimestre',
        installment_number: 1,
        installment_period: '',
        due_date: '',
        status: 'paid'
      });
      loadPayments();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paiement:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la mise à jour du paiement',
        severity: 'error'
      });
    }
  };

  const handleDeletePayment = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://2ise-groupe.com/api/annex-fees/payments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSnackbar({
        open: true,
        message: 'Paiement supprimé avec succès',
        severity: 'success'
      });
      
      loadPayments();
    } catch (error) {
      console.error('Erreur lors de la suppression du paiement:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la suppression du paiement',
        severity: 'error'
      });
    }
  };

  // Fonctions utilitaires
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Fonction pour générer la période d'une tranche
  const generateInstallmentPeriod = (installmentNumber: number, period: string, schoolYear: string) => {
    const year = schoolYear ? schoolYear.split('-')[0] : new Date().getFullYear().toString();
    
    switch (period) {
      case 'monthly':
        const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        const monthIndex = (installmentNumber - 1) % 12;
        return `${months[monthIndex]} ${year}`;
      case 'weekly':
        return `Semaine ${installmentNumber}`;
      case 'daily':
        return `Jour ${installmentNumber}`;
      default:
        return `Période ${installmentNumber}`;
    }
  };

  // Fonction pour générer la date d'échéance
  const generateDueDate = (installmentNumber: number, period: string, schoolYear: string) => {
    const year = schoolYear ? parseInt(schoolYear.split('-')[0]) : new Date().getFullYear();
    const baseDate = new Date(year, 8, 1); // 1er septembre
    
    switch (period) {
      case 'monthly':
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + installmentNumber - 1);
        return dueDate.toISOString().split('T')[0];
      case 'weekly':
        const weekDate = new Date(baseDate);
        weekDate.setDate(weekDate.getDate() + (installmentNumber - 1) * 7);
        return weekDate.toISOString().split('T')[0];
      case 'daily':
        const dayDate = new Date(baseDate);
        dayDate.setDate(dayDate.getDate() + installmentNumber - 1);
        return dayDate.toISOString().split('T')[0];
      default:
        return baseDate.toISOString().split('T')[0];
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Payé';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Espèces';
      case 'check': return 'Chèque';
      case 'transfer': return 'Virement';
      case 'mobile_money': return 'Mobile Money';
      default: return method;
    }
  };

  // Fonctions pour l'impression
  const handlePrintStudents = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Filtrer les paiements selon les critères d'impression
    const filteredPayments = payments.filter(payment => {
      if (printFilters.level_filter && !payment.class_name.toLowerCase().includes(printFilters.level_filter.toLowerCase())) {
        return false;
      }
      if (printFilters.class_filter && payment.class_name !== printFilters.class_filter) {
        return false;
      }
      if (printFilters.fee_type_filter && payment.fee_type_id.toString() !== printFilters.fee_type_filter) {
        return false;
      }
      if (printFilters.status_filter && payment.status !== printFilters.status_filter) {
        return false;
      }
      if (printFilters.school_year && payment.school_year !== printFilters.school_year) {
        return false;
      }
      return true;
    });

    // Grouper par classe et niveau
    const groupedData = filteredPayments.reduce((acc, payment) => {
      const key = `${payment.class_name}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(payment);
      return acc;
    }, {} as Record<string, Payment[]>);

    // Générer le contenu HTML pour l'impression
    const printContent = generatePrintContent(groupedData, filteredPayments);
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const generatePrintContent = (groupedData: Record<string, Payment[]>, filteredPayments: Payment[]) => {
    const currentDate = new Date().toLocaleDateString('fr-FR');
    const selectedFeeType = feeTypes.find(ft => ft.id.toString() === printFilters.fee_type_filter);
    const selectedLevel = printFilters.level_filter;
    const selectedClass = printFilters.class_filter;
    const selectedStatus = printFilters.status_filter;

    let title = 'Liste des Élèves - Frais Annexes';
    if (selectedFeeType) title += ` - ${selectedFeeType.name}`;
    if (selectedLevel) title += ` - Niveau ${selectedLevel}`;
    if (selectedClass) title += ` - Classe ${selectedClass}`;
    if (selectedStatus) title += ` - Statut ${getStatusLabel(selectedStatus)}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #1976d2;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #1976d2;
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          .filters {
            background: #f5f5f5;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
          }
          .filters h3 {
            margin: 0 0 10px 0;
            color: #1976d2;
          }
          .filter-item {
            display: inline-block;
            margin-right: 20px;
            margin-bottom: 5px;
          }
          .filter-label {
            font-weight: bold;
            color: #555;
          }
          .class-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .class-header {
            background: #1976d2;
            color: white;
            padding: 10px;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
          }
          .student-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .student-table th {
            background: #f5f5f5;
            padding: 8px;
            text-align: left;
            border: 1px solid #ddd;
            font-weight: bold;
          }
          .student-table td {
            padding: 8px;
            border: 1px solid #ddd;
          }
          .student-table tr:nth-child(even) {
            background: #f9f9f9;
          }
          .status-paid { color: #4caf50; font-weight: bold; }
          .status-pending { color: #ff9800; font-weight: bold; }
          .status-cancelled { color: #f44336; font-weight: bold; }
          .summary {
            background: #e3f2fd;
            padding: 15px;
            margin-top: 20px;
            border-radius: 5px;
          }
          .summary h3 {
            margin: 0 0 10px 0;
            color: #1976d2;
          }
          .summary-item {
            margin: 5px 0;
          }
          @media print {
            body { margin: 0; }
            .class-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Date d'impression: ${currentDate}</p>
          <p>Année scolaire: ${printFilters.school_year}</p>
        </div>

        <div class="filters">
          <h3>Filtres appliqués:</h3>
          ${selectedFeeType ? `<div class="filter-item"><span class="filter-label">Type de frais:</span> ${selectedFeeType.name}</div>` : ''}
          ${selectedLevel ? `<div class="filter-item"><span class="filter-label">Niveau:</span> ${selectedLevel}</div>` : ''}
          ${selectedClass ? `<div class="filter-item"><span class="filter-label">Classe:</span> ${selectedClass}</div>` : ''}
          ${selectedStatus ? `<div class="filter-item"><span class="filter-label">Statut:</span> ${getStatusLabel(selectedStatus)}</div>` : ''}
        </div>

        ${Object.entries(groupedData).map(([className, classPayments]) => `
          <div class="class-section">
            <div class="class-header">
              Classe: ${className} (${classPayments.length} élève(s))
            </div>
            <table class="student-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Nom et Prénom</th>
                  <th>Matricule</th>
                  <th>Type de frais</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Date de paiement</th>
                  <th>Méthode</th>
                </tr>
              </thead>
              <tbody>
                ${classPayments.map((payment, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${payment.first_name} ${payment.last_name}</td>
                    <td>${payment.registration_number}</td>
                    <td>${payment.fee_type_name}</td>
                    <td>${(parseFloat(String(payment.amount)) || 0).toLocaleString()} FCFA</td>
                    <td class="status-${payment.status}">${getStatusLabel(payment.status)}</td>
                    <td>${new Date(payment.payment_date).toLocaleDateString('fr-FR')}</td>
                    <td>${getPaymentMethodLabel(payment.payment_method)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}

        <div class="summary">
          <h3>Résumé</h3>
          <div class="summary-item"><strong>Total des élèves:</strong> ${filteredPayments.length}</div>
          <div class="summary-item"><strong>Total payé:</strong> ${filteredPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0).toLocaleString()} FCFA</div>
          <div class="summary-item"><strong>Total en attente:</strong> ${filteredPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0).toLocaleString()} FCFA</div>
          <div class="summary-item"><strong>Nombre de classes:</strong> ${Object.keys(groupedData).length}</div>
        </div>
      </body>
      </html>
    `;
  };

  // Calculer les statistiques
  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);

  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);

  const totalCancelled = payments
    .filter(p => p.status === 'cancelled')
    .reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);

  const totalAmount = payments.reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SecretarySidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Container maxWidth="xl">
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              mb: 3, 
              fontWeight: 600,
              color: '#1976d2',
              borderBottom: '2px solid #1976d2',
              paddingBottom: 1
            }}
          >
            Gestion des Frais Annexes
          </Typography>

          {/* Statistiques */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        Total Payé
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#4caf50', mb: 1 }}>
                        {totalPaid.toLocaleString()} FCFA
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {payments.filter(p => p.status === 'paid').length} paiement(s)
                      </Typography>
                    </Box>
                    <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        En Attente
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#ff9800', mb: 1 }}>
                        {totalPending.toLocaleString()} FCFA
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {payments.filter(p => p.status === 'pending').length} paiement(s)
                      </Typography>
                    </Box>
                    <PendingIcon sx={{ fontSize: 40, color: '#ff9800' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        Total Paiements
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#2196f3', mb: 1 }}>
                        {payments.length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {totalAmount.toLocaleString()} FCFA total
                      </Typography>
                    </Box>
                    <WalletIcon sx={{ fontSize: 40, color: '#2196f3' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        Types de Frais
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#9c27b0', mb: 1 }}>
                        {feeTypes.length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {feeTypes.filter(ft => ft.is_active).length} actif(s)
                      </Typography>
                    </Box>
                    <AssessmentIcon sx={{ fontSize: 40, color: '#9c27b0' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Onglets */}
          <Paper 
            sx={{ 
              mb: 3, 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0'
            }}
          >
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  minHeight: 48,
                  '&.Mui-selected': {
                    color: '#1976d2',
                  }
                },
                '& .MuiTabs-indicator': {
                  height: 2,
                  backgroundColor: '#1976d2'
                }
              }}
            >
              <Tab label="Types de Frais" />
              <Tab label="Paiements" />
            </Tabs>
          </Paper>

          {/* Onglet Types de Frais */}
          {activeTab === 0 && (
            <Paper 
              sx={{ 
                p: 3, 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#1976d2'
                  }}
                >
                  Types de Frais Annexes
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{
                    backgroundColor: '#1976d2',
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: '#1565c0'
                    }
                  }}
                  onClick={() => {
                    setEditingFeeType(null);
                    setFeeTypeForm({ 
                      name: '', 
                      description: '', 
                      amount: 0,
                      is_active: true,
                      is_installment: false,
                      installment_period: 'monthly',
                      total_installments: 1,
                      is_level_based: false
                    });
                    setFeeTypeModalOpen(true);
                  }}
                >
                  Ajouter un Type
                </Button>
              </Box>

              <TableContainer 
                sx={{ 
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Nom</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Paiement</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Statut</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {feeTypes.map((feeType) => (
                      <TableRow key={feeType.id}>
                        <TableCell>{feeType.name}</TableCell>
                        <TableCell>{feeType.description}</TableCell>
                        <TableCell>
                          <Chip
                            label={feeType.is_level_based ? 'Par niveau' : 'Montant fixe'}
                            color={feeType.is_level_based ? 'primary' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={feeType.is_installment ? 'Par tranches' : 'Paiement unique'}
                            color={feeType.is_installment ? 'secondary' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={feeType.is_active ? 'Actif' : 'Inactif'}
                            color={feeType.is_active ? 'success' : 'error'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              onClick={() => {
                                setEditingFeeType(feeType);
                                setFeeTypeForm({
                                  name: feeType.name,
                                  description: feeType.description,
                                  amount: feeType.amount,
                                  is_active: feeType.is_active,
                                  is_installment: feeType.is_installment,
                                  installment_period: feeType.installment_period,
                                  total_installments: feeType.total_installments,
                                  is_level_based: feeType.is_level_based
                                });
                                setFeeTypeModalOpen(true);
                              }}
                              color="primary"
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                            {feeType.is_level_based && (
                              <IconButton
                                onClick={() => handleManageLevelAmounts(feeType)}
                                color="secondary"
                                size="small"
                                title="Gérer les montants par niveau"
                              >
                                <AssessmentIcon />
                              </IconButton>
                            )}
                            <IconButton
                              onClick={() => handleDeleteFeeType(feeType.id)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Onglet Paiements */}
          {activeTab === 1 && (
            <Paper 
              sx={{ 
                p: 3, 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#1976d2'
                  }}
                >
                  Paiements des Frais Annexes
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    sx={{
                      borderColor: '#1976d2',
                      color: '#1976d2',
                      textTransform: 'none',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      '&:hover': {
                        borderColor: '#1565c0',
                        backgroundColor: '#e3f2fd'
                      }
                    }}
                    onClick={() => setPrintModalOpen(true)}
                  >
                    Imprimer
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{
                      backgroundColor: '#4caf50',
                      textTransform: 'none',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: '#388e3c'
                      }
                    }}
                    onClick={() => {
                      setEditingPayment(null);
                      setPaymentForm({
                        student_id: '',
                        fee_type_id: '',
                        amount: 0,
                        payment_date: new Date().toISOString().split('T')[0],
                        payment_method: 'cash',
                        reference_number: '',
                        description: '',
                        school_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
                        trimester: '1er trimestre',
                        installment_number: 1,
                        installment_period: '',
                        due_date: '',
                        status: 'paid'
                      });
                      setPaymentModalOpen(true);
                    }}
                  >
                    Nouveau Paiement
                  </Button>
                </Box>
              </Box>

              {/* Filtres */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Autocomplete
                    options={students}
                    getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.registration_number})`}
                    value={students.find(s => s.id.toString() === filters.student_search) || null}
                    onChange={(event, newValue) => {
                      setFilters({ ...filters, student_search: newValue?.id.toString() || '' });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Rechercher un étudiant"
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: <SearchIcon />
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type de frais</InputLabel>
                    <Select
                      value={filters.fee_type_filter}
                      label="Type de frais"
                      onChange={(e) => setFilters({ ...filters, fee_type_filter: e.target.value })}
                    >
                      <MenuItem value="">Tous</MenuItem>
                      {feeTypes.map((feeType) => (
                        <MenuItem key={feeType.id} value={feeType.id.toString()}>
                          {feeType.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={filters.status_filter}
                      label="Statut"
                      onChange={(e) => setFilters({ ...filters, status_filter: e.target.value })}
                    >
                      <MenuItem value="">Tous</MenuItem>
                      <MenuItem value="paid">Payé</MenuItem>
                      <MenuItem value="pending">En attente</MenuItem>
                      <MenuItem value="cancelled">Annulé</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="contained"
                    onClick={loadPayments}
                    sx={{ 
                      height: '40px',
                      backgroundColor: '#ff9800',
                      textTransform: 'none',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: '#f57c00'
                      }
                    }}
                  >
                    Appliquer les filtres
                  </Button>
                </Grid>
              </Grid>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer 
                  sx={{ 
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Étudiant</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Type de frais</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Montant</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Tranche</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Méthode</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Statut</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {payment.first_name} {payment.last_name}
                            <br />
                            <Typography variant="caption" color="textSecondary">
                              {payment.registration_number} - {payment.class_name}
                            </Typography>
                          </TableCell>
                          <TableCell>{payment.fee_type_name}</TableCell>
                          <TableCell>{(parseFloat(String(payment.amount)) || 0).toLocaleString()} FCFA</TableCell>
                          <TableCell>
                            {payment.installment_number && payment.installment_number > 1 ? (
                              <Box>
                                <Typography variant="body2">
                                  Tranche {payment.installment_number}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {payment.installment_period}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                Paiement unique
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{new Date(payment.payment_date).toLocaleDateString('fr-FR')}</TableCell>
                          <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(payment.status)}
                              color={
                                payment.status === 'paid' ? 'success' :
                                payment.status === 'pending' ? 'warning' : 'error'
                              }
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                onClick={() => {
                                  setEditingPayment(payment);
                        setPaymentForm({
                          student_id: payment.student_id.toString(),
                          fee_type_id: payment.fee_type_id.toString(),
                          amount: parseFloat(String(payment.amount)) || 0,
                          payment_date: payment.payment_date,
                          payment_method: payment.payment_method,
                          reference_number: payment.reference_number,
                          description: payment.description,
                          school_year: payment.school_year,
                          trimester: payment.trimester,
                          installment_number: payment.installment_number || 1,
                          installment_period: payment.installment_period || '',
                          due_date: payment.due_date || '',
                          status: payment.status
                        });
                                  setPaymentModalOpen(true);
                                }}
                                color="primary"
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                onClick={() => handleDeletePayment(payment.id)}
                                color="error"
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          )}

          {/* Modale pour les types de frais */}
          <Dialog open={feeTypeModalOpen} onClose={() => setFeeTypeModalOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              {editingFeeType ? 'Modifier le type de frais' : 'Nouveau type de frais'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nom du type de frais"
                    value={feeTypeForm.name}
                    onChange={(e) => setFeeTypeForm({ ...feeTypeForm, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={feeTypeForm.description}
                    onChange={(e) => setFeeTypeForm({ ...feeTypeForm, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Basé sur le niveau</InputLabel>
                    <Select
                      value={feeTypeForm.is_level_based.toString()}
                      label="Basé sur le niveau"
                      onChange={(e) => setFeeTypeForm({ ...feeTypeForm, is_level_based: e.target.value === 'true' })}
                    >
                      <MenuItem value="false">Montant fixe</MenuItem>
                      <MenuItem value="true">Montant variable par niveau</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {!feeTypeForm.is_level_based && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Montant fixe (FCFA)"
                      type="number"
                      value={feeTypeForm.amount}
                      onChange={(e) => setFeeTypeForm({ ...feeTypeForm, amount: parseFloat(e.target.value) || 0 })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">FCFA</InputAdornment>
                      }}
                      required
                      helperText="Montant obligatoire pour les frais avec montant fixe"
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Type de paiement</InputLabel>
                    <Select
                      value={feeTypeForm.is_installment.toString()}
                      label="Type de paiement"
                      onChange={(e) => setFeeTypeForm({ ...feeTypeForm, is_installment: e.target.value === 'true' })}
                    >
                      <MenuItem value="false">Paiement unique</MenuItem>
                      <MenuItem value="true">Paiement par tranches</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {feeTypeForm.is_installment && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Période des tranches</InputLabel>
                        <Select
                          value={feeTypeForm.installment_period}
                          label="Période des tranches"
                          onChange={(e) => setFeeTypeForm({ ...feeTypeForm, installment_period: e.target.value })}
                        >
                          <MenuItem value="monthly">Mensuel</MenuItem>
                          <MenuItem value="weekly">Hebdomadaire</MenuItem>
                          <MenuItem value="daily">Quotidien</MenuItem>
                          <MenuItem value="custom">Personnalisé</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Nombre total de tranches"
                        type="number"
                        value={feeTypeForm.total_installments}
                        onChange={(e) => setFeeTypeForm({ ...feeTypeForm, total_installments: parseInt(e.target.value) || 1 })}
                        inputProps={{ min: 1, max: 12 }}
                        helperText="Ex: 10 pour 10 mois"
                      />
                    </Grid>
                  </>
                )}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={feeTypeForm.is_active.toString()}
                      label="Statut"
                      onChange={(e) => setFeeTypeForm({ ...feeTypeForm, is_active: e.target.value === 'true' })}
                    >
                      <MenuItem value="true">Actif</MenuItem>
                      <MenuItem value="false">Inactif</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setFeeTypeModalOpen(false)}>Annuler</Button>
              <Button
                onClick={editingFeeType ? handleUpdateFeeType : handleCreateFeeType}
                variant="contained"
              >
                {editingFeeType ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Modale pour les paiements */}
          <Dialog open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              {editingPayment ? 'Modifier le paiement' : 'Nouveau paiement'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={students}
                    getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.registration_number})`}
                    value={students.find(s => s.id.toString() === paymentForm.student_id) || null}
                    onChange={(event, newValue) => {
                      setPaymentForm({ ...paymentForm, student_id: newValue?.id.toString() || '' });
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Étudiant" required />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Type de frais</InputLabel>
                    <Select
                      value={paymentForm.fee_type_id}
                      label="Type de frais"
                      onChange={(e) => {
                        const selectedFeeType = feeTypes.find(ft => ft.id.toString() === e.target.value);
                        let newAmount = 0;
                        
                        if (selectedFeeType) {
                          if (selectedFeeType.is_level_based) {
                            // Pour les frais par niveau, on laisse l'utilisateur saisir le montant
                            newAmount = 0;
                          } else {
                            // Pour les frais avec montant fixe, on remplit automatiquement
                            newAmount = selectedFeeType.amount;
                          }
                        }
                        
                        setPaymentForm({ 
                          ...paymentForm, 
                          fee_type_id: e.target.value,
                          amount: newAmount
                        });
                      }}
                    >
                      {feeTypes.map((feeType) => (
                        <MenuItem key={feeType.id} value={feeType.id.toString()}>
                          {feeType.name} {feeType.is_level_based ? '(Montant par niveau)' : `(${feeType.amount.toLocaleString()} FCFA)`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Montant (FCFA)"
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">FCFA</InputAdornment>,
                      readOnly: (() => {
                        const selectedFeeType = feeTypes.find(ft => ft.id.toString() === paymentForm.fee_type_id);
                        return selectedFeeType && !selectedFeeType.is_installment && !selectedFeeType.is_level_based;
                      })()
                    }}
                    required
                    helperText={(() => {
                      const selectedFeeType = feeTypes.find(ft => ft.id.toString() === paymentForm.fee_type_id);
                      if (selectedFeeType && !selectedFeeType.is_installment && !selectedFeeType.is_level_based) {
                        return "Montant fixe - non modifiable";
                      } else if (selectedFeeType && selectedFeeType.is_level_based) {
                        return "Saisissez le montant selon le niveau de l'étudiant";
                      }
                      return "";
                    })()}
                  />
                </Grid>
                {/* Champs pour les paiements par tranches */}
                {feeTypes.find(ft => ft.id.toString() === paymentForm.fee_type_id)?.is_installment && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Numéro de tranche"
                        type="number"
                        value={paymentForm.installment_number}
                        onChange={(e) => {
                          const installmentNumber = parseInt(e.target.value) || 1;
                          const selectedFeeType = feeTypes.find(ft => ft.id.toString() === paymentForm.fee_type_id);
                          setPaymentForm({ 
                            ...paymentForm, 
                            installment_number: installmentNumber,
                            installment_period: selectedFeeType ? generateInstallmentPeriod(installmentNumber, selectedFeeType.installment_period, paymentForm.school_year) : '',
                            due_date: selectedFeeType ? generateDueDate(installmentNumber, selectedFeeType.installment_period, paymentForm.school_year) : ''
                          });
                        }}
                        inputProps={{ min: 1, max: feeTypes.find(ft => ft.id.toString() === paymentForm.fee_type_id)?.total_installments || 1 }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Période de la tranche"
                        value={paymentForm.installment_period}
                        InputProps={{ readOnly: true }}
                        helperText="Généré automatiquement"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Date d'échéance"
                        type="date"
                        value={paymentForm.due_date}
                        InputProps={{ readOnly: true }}
                        helperText="Générée automatiquement"
                      />
                    </Grid>
                  </>
                )}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date de paiement"
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Méthode de paiement</InputLabel>
                    <Select
                      value={paymentForm.payment_method}
                      label="Méthode de paiement"
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    >
                      <MenuItem value="cash">Espèces</MenuItem>
                      <MenuItem value="check">Chèque</MenuItem>
                      <MenuItem value="transfer">Virement</MenuItem>
                      <MenuItem value="mobile_money">Mobile Money</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Numéro de référence"
                    value={paymentForm.reference_number}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Année scolaire"
                    value={paymentForm.school_year}
                    onChange={(e) => setPaymentForm({ ...paymentForm, school_year: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Trimestre</InputLabel>
                    <Select
                      value={paymentForm.trimester}
                      label="Trimestre"
                      onChange={(e) => setPaymentForm({ ...paymentForm, trimester: e.target.value })}
                    >
                      <MenuItem value="1er trimestre">1er trimestre</MenuItem>
                      <MenuItem value="2e trimestre">2e trimestre</MenuItem>
                      <MenuItem value="3e trimestre">3e trimestre</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={paymentForm.status}
                      label="Statut"
                      onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
                    >
                      <MenuItem value="paid">Payé</MenuItem>
                      <MenuItem value="pending">En attente</MenuItem>
                      <MenuItem value="cancelled">Annulé</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={paymentForm.description}
                    onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPaymentModalOpen(false)}>Annuler</Button>
              <Button
                onClick={editingPayment ? handleUpdatePayment : handleCreatePayment}
                variant="contained"
              >
                {editingPayment ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Modale pour gérer les montants par niveau */}
          <Dialog open={levelAmountsModalOpen} onClose={() => setLevelAmountsModalOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              Gérer les montants par niveau - {selectedFeeTypeForLevels?.name}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {levels.map((level) => {
                  const existingAmount = levelAmounts.find(la => la.level_id === level.id);
                  return (
                    <Grid item xs={12} sm={6} key={level.id}>
                      <TextField
                        fullWidth
                        label={`${level.name} (FCFA)`}
                        type="number"
                        value={existingAmount ? existingAmount.amount : 0}
                        onChange={(e) => {
                          const newAmount = parseFloat(e.target.value) || 0;
                          setLevelAmounts(prev => {
                            const existing = prev.find(la => la.level_id === level.id);
                            if (existing) {
                              return prev.map(la => 
                                la.level_id === level.id ? { ...la, amount: newAmount } : la
                              );
                            } else {
                              return [...prev, {
                                id: 0,
                                fee_type_id: selectedFeeTypeForLevels?.id || 0,
                                level_id: level.id,
                                amount: newAmount,
                                level_name: level.name
                              }];
                            }
                          });
                        }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">FCFA</InputAdornment>
                        }}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setLevelAmountsModalOpen(false)}>Annuler</Button>
              <Button onClick={handleUpdateLevelAmounts} variant="contained">
                Mettre à jour
              </Button>
            </DialogActions>
          </Dialog>

          {/* Modale pour l'impression */}
          <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PrintIcon color="primary" />
                <Typography variant="h6">Imprimer la liste des élèves</Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Niveau</InputLabel>
                    <Select
                      value={printFilters.level_filter}
                      label="Niveau"
                      onChange={(e) => setPrintFilters({ ...printFilters, level_filter: e.target.value })}
                    >
                      <MenuItem value="">Tous les niveaux</MenuItem>
                      <MenuItem value="6ème">6ème</MenuItem>
                      <MenuItem value="5ème">5ème</MenuItem>
                      <MenuItem value="4ème">4ème</MenuItem>
                      <MenuItem value="3ème">3ème</MenuItem>
                      <MenuItem value="2nde">2nde</MenuItem>
                      <MenuItem value="1ère">1ère</MenuItem>
                      <MenuItem value="Tle">Tle</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Classe</InputLabel>
                    <Select
                      value={printFilters.class_filter}
                      label="Classe"
                      onChange={(e) => setPrintFilters({ ...printFilters, class_filter: e.target.value })}
                    >
                      <MenuItem value="">Toutes les classes</MenuItem>
                      {Array.from(new Set(payments.map(p => p.class_name))).map(className => (
                        <MenuItem key={className} value={className}>
                          {className}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type de frais</InputLabel>
                    <Select
                      value={printFilters.fee_type_filter}
                      label="Type de frais"
                      onChange={(e) => setPrintFilters({ ...printFilters, fee_type_filter: e.target.value })}
                    >
                      <MenuItem value="">Tous les types</MenuItem>
                      {feeTypes.map((feeType) => (
                        <MenuItem key={feeType.id} value={feeType.id.toString()}>
                          {feeType.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={printFilters.status_filter}
                      label="Statut"
                      onChange={(e) => setPrintFilters({ ...printFilters, status_filter: e.target.value })}
                    >
                      <MenuItem value="">Tous les statuts</MenuItem>
                      <MenuItem value="paid">Payé</MenuItem>
                      <MenuItem value="pending">En attente</MenuItem>
                      <MenuItem value="cancelled">Annulé</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Année scolaire"
                    value={printFilters.school_year}
                    onChange={(e) => setPrintFilters({ ...printFilters, school_year: e.target.value })}
                    helperText="Format: 2024-2025"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPrintModalOpen(false)}>Annuler</Button>
              <Button
                onClick={handlePrintStudents}
                variant="contained"
                startIcon={<PrintIcon />}
                sx={{
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#1565c0'
                  }
                }}
              >
                Imprimer
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar pour les notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              severity={snackbar.severity}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </Box>
  );
};

export default AnnexFees;
