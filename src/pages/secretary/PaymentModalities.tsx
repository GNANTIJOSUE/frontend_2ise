import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Add as AddIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  MonetizationOn as MoneyIcon,
  AutoFixHigh as AutoFixHighIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  MoreVert as MoreVertIcon,
  FileDownload as FileDownloadIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SecretarySidebar from '../../components/SecretarySidebar';
import axios from 'axios';

interface PaymentModality {
  id: number;
  class_id?: number;
  level_id?: number;
  payment_type: 'assigned' | 'non_assigned';
  installment_number: number;
  amount: number;
  due_date: string;
  percentage: number;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  registration_number: string;
  is_assigned: number;
  payment_type: 'assigned' | 'non_assigned';
  installments: StudentInstallment[];
  total_amount_due: number;
  total_amount_paid: number;
  total_remaining: number;
  total_tuition_fee?: number; // Montant total de la scolarité
  initial_fees?: number; // Paiements initiaux (inscription, finalisation, réinscription)
  registration_fee?: number; // Frais d'inscription
  surplus_from_initial?: number; // Surplus des paiements initiaux reversé sur les versements
}

interface StudentInstallment {
  id: number;
  installment_number: number;
  amount: number;
  due_date: string;
  percentage: number;
  payments: any[];
  total_paid: number;
  remaining_amount: number;
  is_overdue: boolean;
  carried_over_amount: number;
  is_paid: boolean;
  amount_with_carried_over: number;
  remaining_with_carried_over: number;
  surplus_applied?: number; // Montant du surplus des paiements initiaux appliqué à ce versement
  surplus_source?: string; // Source du surplus (initial_payments, etc.)
}

interface Class {
  id: number;
  name: string;
  level: string;
  academic_year: string;
  amount: number;
  amount_non_assigned: number;
  registration_fee_assigned?: number;
  registration_fee_non_assigned?: number;
  payment_modalities: PaymentModality[];
  students?: Student[];
  assigned_amount?: number; // Added for clarity
  non_assigned_amount?: number; // Added for clarity
}

interface OverduePayment {
  student_id: number;
  student_name: string;
  registration_number: string;
  class_name: string;
  level: string;
  installment_number: number;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  remaining_amount: number;
  days_overdue: number;
  payment_type: 'assigned' | 'non_assigned';
}

interface StudentOverdueSummary {
  student_id: number;
  student_name: string;
  registration_number: string;
  class_name: string;
  level: string;
  payment_type: 'assigned' | 'non_assigned';
  total_amount_due: number;
  total_amount_paid: number;
  total_remaining_amount: number;
  max_days_overdue: number;
  overdue_installments_count: number;
  overdue_installments: OverduePayment[];
}

const PaymentModalities = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingModality, setEditingModality] = useState<PaymentModality | null>(null);
  const [studentsPerClass, setStudentsPerClass] = useState<{ [classId: number]: number }>({});
  
  // Nouvelles variables pour l'impression
  const [overduePayments, setOverduePayments] = useState<OverduePayment[]>([]);
  const [studentOverdueSummaries, setStudentOverdueSummaries] = useState<StudentOverdueSummary[]>([]);
  const [printAnchorEl, setPrintAnchorEl] = useState<null | HTMLElement>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [currentReportScope, setCurrentReportScope] = useState<'class' | 'level' | 'school' | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Nouvelle variable pour l'année scolaire - Défaut sur 2024-2025 où il y a plus de retards
  const [currentSchoolYear, setCurrentSchoolYear] = useState<string>('2024-2025');

  const navigate = useNavigate();

  // Fonction utilitaire pour calculer les montants financiers d'un étudiant
  const calculateStudentFinancials = (student: Student, classItem: Class) => {
    const tuitionFee = Math.round(student.total_tuition_fee || (student.payment_type === 'assigned' ? 
      (classItem.assigned_amount || classItem.amount || 0) : 
      (classItem.non_assigned_amount || classItem.amount_non_assigned || 0)
    ));
    
    const registrationFee = Math.round(student.registration_fee || (student.payment_type === 'assigned' ? 
      (classItem.registration_fee_assigned || 0) : 
      (classItem.registration_fee_non_assigned || 0)
    ));
    
    const initialFees = Math.round(student.initial_fees || 0);
    const surplusFromInitial = Math.round(Number(student.surplus_from_initial || 0));
    const totalAmountPaid = Math.round(student.total_amount_paid || 0);
    
    const amountDueForInstallments = Math.round(tuitionFee - registrationFee);
    const totalPaidWithSurplus = Math.round(totalAmountPaid + surplusFromInitial);
    const remainingAmount = Math.round(Math.max(0, amountDueForInstallments - totalPaidWithSurplus));
    
    return {
      tuitionFee,
      registrationFee,
      initialFees,
      surplusFromInitial,
      totalAmountPaid,
      amountDueForInstallments,
      totalPaidWithSurplus,
      remainingAmount
    };
  };

  // Niveaux disponibles
  const niveaux = [
    "6ème", "5ème", "4ème", "3ème", 
    "Seconde", "Première", "Terminale"
  ];

  useEffect(() => {
    fetchClasses();
  }, []);

  // Rafraîchir les données quand l'année scolaire change
  useEffect(() => {
    if (classes.length > 0) {
      fetchClasses();
    }
  }, [currentSchoolYear]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
        return;
      }

      console.log('🔍 Tentative de récupération des classes...');
      const response = await axios.get('https://2ise-groupe.com/api/classes/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Classes récupérées:', response.data.length, 'classes');
      
      // Récupérer les modalités de paiement pour chaque classe (depuis le niveau)
      const classesWithModalities = await Promise.all(
        response.data.map(async (classItem: Class) => {
          try {
            // Récupérer les modalités du niveau de la classe
            const levelModalitiesResponse = await axios.get(
              `https://2ise-groupe.com/api/classes/level/${classItem.level}/payment-modalities`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Récupérer les étudiants et leurs paiements pour cette classe - FILTRER PAR ANNÉE SCOLAIRE
            console.log(`🔍 Récupération des étudiants pour la classe ${classItem.name} - Année: ${currentSchoolYear}`);
            const studentsResponse = await axios.get(
              `https://2ise-groupe.com/api/installments/class/${classItem.id}/payment-modalities?school_year=${currentSchoolYear}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            console.log(`📊 Étudiants récupérés pour ${classItem.name}:`, studentsResponse.data.students?.length || 0);
            
            // Filtrage côté frontend au cas où l'API ne filtre pas correctement
            let filteredStudents = studentsResponse.data.students || [];
            if (filteredStudents.length > 0) {
              const beforeFilter = filteredStudents.length;
              filteredStudents = filteredStudents.filter((student: any) => {
                // Vérifier différents champs possibles pour l'année scolaire
                const studentYear = student.school_year || student.academic_year || student.enrollment_school_year;
                const matches = !studentYear || studentYear === currentSchoolYear;
                
                if (!matches) {
                  console.log(`🚫 Étudiant ${student.full_name} exclu - Année: ${studentYear} vs ${currentSchoolYear}`);
                }
                
                return matches;
              });
              
              console.log(`📝 Filtrage: ${beforeFilter} → ${filteredStudents.length} étudiants pour l'année ${currentSchoolYear}`);
            }
            
            return {
              ...classItem,
              payment_modalities: [
                ...(levelModalitiesResponse.data.assigned_modalities || []),
                ...(levelModalitiesResponse.data.non_assigned_modalities || [])
              ],
              students: filteredStudents,
              // Utiliser les montants du niveau
              assigned_amount: levelModalitiesResponse.data.level?.amount || 0,
              non_assigned_amount: levelModalitiesResponse.data.level?.amount_non_assigned || 0,
              registration_fee_assigned: levelModalitiesResponse.data.level?.registration_fee_assigned || 0,
              registration_fee_non_assigned: levelModalitiesResponse.data.level?.registration_fee_non_assigned || 0
            };
          } catch (err: any) {
            console.log(`⚠️ Pas de modalités pour la classe ${classItem.name}:`, err.response?.status);
            return {
              ...classItem,
              payment_modalities: [],
              students: [],
              assigned_amount: 0,
              non_assigned_amount: 0,
              registration_fee_assigned: 0,
              registration_fee_non_assigned: 0
            };
          }
        })
      );
      
      setClasses(classesWithModalities);
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des classes:', err);
      
      if (err.response?.status === 404) {
        setError('L\'API des classes n\'est pas disponible. Veuillez vérifier que le serveur backend est démarré.');
      } else if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else if (err.response?.status === 403) {
        setError('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
      } else {
        setError(err.response?.data?.message || 'Erreur lors du chargement des classes. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditModality = (modality: PaymentModality, classItem: Class) => {
    setEditingModality(modality);
    setSelectedClass(classItem);
    setEditDialogOpen(true);
  };

  const handleSaveModality = async () => {
    if (!editingModality || !selectedClass) return;

    try {
      const token = localStorage.getItem('token');
      
      // Pour l'instant, utiliser l'API des installments de classe
      // Les modalités sont maintenant gérées au niveau des niveaux
      await axios.put(
        `https://2ise-groupe.com/api/installments/${editingModality.id}`,
        {
          amount: editingModality.amount,
          due_date: editingModality.due_date,
          percentage: editingModality.percentage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEditDialogOpen(false);
      setEditingModality(null);
      setSelectedClass(null);
      fetchClasses(); // Rafraîchir les données
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };



  const handleRecalculatePercentages = async (classItem: Class, paymentType: 'assigned' | 'non_assigned') => {
    try {
      const token = localStorage.getItem('token');
      
      // Récupérer le niveau de la classe
      const levelResponse = await axios.get(
        `https://2ise-groupe.com/api/classes/level/${classItem.level}/payment-modalities`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (levelResponse.data.level?.id) {
        // Recalculer les pourcentages au niveau du niveau
        await axios.post(
          `https://2ise-groupe.com/api/levels/${levelResponse.data.level.id}/installments/${paymentType}/recalculate-percentages`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        alert('Pourcentages recalculés avec succès au niveau du niveau');
      } else {
        // Fallback vers l'ancienne méthode pour les classes
        await axios.post(
          `https://2ise-groupe.com/api/installments/class/${classItem.id}/${paymentType}/recalculate-percentages`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        alert('Pourcentages recalculés avec succès');
      }
      
      fetchClasses(); // Rafraîchir les données
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors du recalcul des pourcentages');
    }
  };

  const handleFixSurplusPayments = async (studentId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://2ise-groupe.com/api/installments/fix-surplus/${studentId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`Corrections appliquées: ${response.data.corrections_made} paiement(s) corrigé(s)`);
      
      // Rafraîchir les données avec un délai pour s'assurer que les modifications sont appliquées
      setTimeout(() => {
        fetchClasses();
      }, 1000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la correction des paiements');
    }
  };

  // Fonction utilitaire pour calculer les jours de retard
  const calculateDaysOverdue = (dueDate: string): number => {
    const due = new Date(dueDate).getTime();
    const now = new Date().getTime();
    return Math.floor((now - due) / (1000 * 60 * 60 * 24));
  };

  const handleCreateDefaultInstallments = async (classId: number, paymentType: 'assigned' | 'non_assigned') => {
    try {
      const token = localStorage.getItem('token');
      
      // Récupérer les informations de la classe pour obtenir son niveau
      const classResponse = await axios.get(
        `https://2ise-groupe.com/api/classes/${classId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (classResponse.data.level) {
        // Créer les versements par défaut au niveau du niveau
        await axios.post(
          `https://2ise-groupe.com/api/levels/${classResponse.data.level}/installments/create-default`,
          { payment_type: paymentType },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        alert(`Versements par défaut créés avec succès au niveau ${classResponse.data.level} pour le type ${paymentType === 'assigned' ? 'affecté' : 'non affecté'}`);
      } else {
        // Fallback vers l'ancienne méthode
        await axios.post(
          `https://2ise-groupe.com/api/installments/create-default`,
          { class_id: classId, payment_type: paymentType },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        alert(`Versements par défaut créés avec succès pour le type ${paymentType === 'assigned' ? 'affecté' : 'non affecté'}`);
      }
      
      fetchClasses(); // Rafraîchir les données
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la création des versements par défaut');
    }
  };

  const handleSendReminders = async (classId: number, installmentId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://2ise-groupe.com/api/installments/class/${classId}/installment/${installmentId}/send-reminders`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`Relances envoyées: ${response.data.emails_sent} email(s) envoyé(s) sur ${response.data.total_unpaid} étudiant(s) en retard`);
      fetchClasses(); // Rafraîchir les données
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'envoi des relances');
    }
  };

  const handleSendRemindersForLevel = async (level: string) => {
    if (!window.confirm(`Voulez-vous envoyer des relances pour tous les étudiants en retard du niveau ${level} ?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://2ise-groupe.com/api/installments/level/${level}/send-reminders`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`Relances envoyées pour le niveau ${level}: ${response.data.emails_sent} email(s) envoyé(s) sur ${response.data.total_unpaid} étudiant(s) en retard`);
      fetchClasses(); // Rafraîchir les données
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'envoi des relances pour le niveau');
    }
  };

  const handleSendRemindersForAllSchool = async () => {
    if (!window.confirm('Voulez-vous envoyer des relances pour tous les étudiants en retard de toute l\'école ? Cette opération peut prendre quelques minutes.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://2ise-groupe.com/api/installments/school/send-reminders`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`Relances envoyées pour toute l'école: ${response.data.emails_sent} email(s) envoyé(s) sur ${response.data.total_unpaid} étudiant(s) en retard`);
      fetchClasses(); // Rafraîchir les données
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'envoi des relances pour toute l\'école');
    }
  };

  const handleFixAllSurplus = async () => {
    if (!window.confirm('Voulez-vous corriger automatiquement tous les surplus de paiements ? Cette opération peut prendre quelques minutes.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://2ise-groupe.com/api/installments/fix-all-surplus`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`Correction terminée: ${response.data.total_corrections_made} correction(s) appliquée(s) pour ${response.data.total_students_processed} étudiant(s)`);
      
      // Rafraîchir les données avec un délai pour s'assurer que les modifications sont appliquées
      setTimeout(() => {
        fetchClasses();
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la correction automatique');
    }
  };

  const handleFixPaymentDisplay = async () => {
    if (!window.confirm('Voulez-vous corriger l\'affichage des paiements ? Cette opération va recalculer tous les soldes pour s\'assurer de la cohérence.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://2ise-groupe.com/api/installments/fix-payment-display`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`Affichage corrigé: ${response.data.results.map((r: any) => `${r.description}: ${r.count}`).join(', ')}`);
      fetchClasses(); // Rafraîchir les données
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la correction de l\'affichage');
    }
  };

  // ===== FONCTIONS D'IMPRESSION =====
  
  const generateOverduePaymentsReport = async (scope: 'class' | 'level' | 'school', classId?: number, level?: string) => {
    setIsGeneratingReport(true);
    try {
      console.log('🔍 Génération du rapport avec année scolaire:', currentSchoolYear);
      console.log('📊 Scope du rapport:', scope);
      
      // Utiliser directement la génération locale car l'API n'est pas disponible
      console.log('🔄 Génération locale du rapport...');
      const localReport = generateLocalOverdueReport(scope, classId, level);
      
      setOverduePayments(localReport);
      return localReport;
    } catch (err: any) {
      console.error('❌ Erreur lors de la génération du rapport:', err);
      return [];
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const generateLocalOverdueReport = (scope: 'class' | 'level' | 'school', classId?: number, level?: string): OverduePayment[] => {
    const overduePayments: OverduePayment[] = [];
    
    console.log('🔍 Génération du rapport local pour le scope:', scope);
    console.log('📚 Classes disponibles:', classes.length);
    console.log('📅 Année scolaire filtrée:', currentSchoolYear);
    
    classes.forEach(classItem => {
      // Filtrer selon le scope
      if (scope === 'class' && classItem.id !== classId) return;
      if (scope === 'level' && classItem.level !== level) return;
      
      console.log(`📖 Traitement de la classe: ${classItem.name} (${classItem.students?.length || 0} étudiants)`);
      
      classItem.students?.forEach(student => {
        console.log(`👤 Étudiant: ${student.full_name} (${student.installments.length} versements)`);
        
        student.installments.forEach((installment: StudentInstallment) => {
          const daysOverdue = calculateDaysOverdue(installment.due_date);
          const isOverdueByDate = daysOverdue > 0;
          const hasRemainingAmount = (installment.remaining_with_carried_over || installment.remaining_amount || 0) > 0;
          
          console.log(`💰 Versement ${installment.installment_number} (${student.full_name}):`, {
            due_date: installment.due_date,
            is_overdue_flag: installment.is_overdue,
            is_overdue_by_date: isOverdueByDate,
            days_overdue: daysOverdue,
            remaining_with_carried_over: installment.remaining_with_carried_over,
            remaining_amount: installment.remaining_amount,
            has_remaining: hasRemainingAmount,
            amount_due: installment.amount_with_carried_over || installment.amount,
            amount_paid: installment.total_paid
          });
          
          // Utiliser à la fois le flag is_overdue ET le calcul de date
          const isActuallyOverdue = (installment.is_overdue || isOverdueByDate) && hasRemainingAmount;
          
          if (isActuallyOverdue) {
            const overduePayment = {
              student_id: student.id,
              student_name: student.full_name,
              registration_number: student.registration_number,
              class_name: classItem.name,
              level: classItem.level,
              installment_number: installment.installment_number,
              due_date: installment.due_date,
                          amount_due: installment.amount_with_carried_over || installment.amount || 0,
            amount_paid: installment.total_paid || 0,
            remaining_amount: installment.remaining_with_carried_over || installment.remaining_amount || 0,
            days_overdue: Math.max(daysOverdue, 0),
              payment_type: student.payment_type
            };
            
            console.log('✅ Ajout du versement en retard:', overduePayment);
            overduePayments.push(overduePayment);
          } else {
            console.log(`❌ Versement non ajouté - Raisons:`, {
              not_overdue: !installment.is_overdue && !isOverdueByDate,
              no_remaining: !hasRemainingAmount
            });
          }
        });
      });
    });
    
    console.log('📊 Total des versements en retard trouvés:', overduePayments.length);
    return overduePayments.sort((a, b) => b.days_overdue - a.days_overdue);
  };

  const generateStudentOverdueSummaries = (overduePayments: OverduePayment[]): StudentOverdueSummary[] => {
    const studentMap = new Map<number, StudentOverdueSummary>();
    
    console.log('🔍 Génération des résumés par étudiant...');
    console.log('📊 Nombre de versements en retard:', overduePayments.length);
    
    overduePayments.forEach((payment, index) => {
      console.log(`📋 Versement ${index + 1}:`, {
        student: payment.student_name,
        student_id: payment.student_id,
        installment: payment.installment_number,
        amount_due: payment.amount_due,
        amount_paid: payment.amount_paid,
        remaining: payment.remaining_amount,
        days_overdue: payment.days_overdue
      });
      
      if (!studentMap.has(payment.student_id)) {
        studentMap.set(payment.student_id, {
          student_id: payment.student_id,
          student_name: payment.student_name,
          registration_number: payment.registration_number,
          class_name: payment.class_name,
          level: payment.level,
          payment_type: payment.payment_type,
          total_amount_due: 0,
          total_amount_paid: 0,
          total_remaining_amount: 0,
          max_days_overdue: 0,
          overdue_installments_count: 0,
          overdue_installments: []
        });
      }
      
      const summary = studentMap.get(payment.student_id)!;
      summary.total_amount_due += payment.amount_due;
      summary.total_amount_paid += payment.amount_paid;
      summary.total_remaining_amount += payment.remaining_amount;
      summary.max_days_overdue = Math.max(summary.max_days_overdue, payment.days_overdue);
      summary.overdue_installments_count += 1;
      summary.overdue_installments.push(payment);
    });
    
    const summaries = Array.from(studentMap.values()).sort((a, b) => b.total_remaining_amount - a.total_remaining_amount);
  
    console.log('✅ Résumés générés:', summaries.length, 'étudiants');
    summaries.forEach((summary, index) => {
      console.log(`👤 Étudiant ${index + 1}:`, {
        name: summary.student_name,
        installments_count: summary.overdue_installments_count,
        total_due: summary.total_amount_due,
        total_paid: summary.total_amount_paid,
        total_remaining: summary.total_remaining_amount,
        max_days: summary.max_days_overdue
      });
    });
    
    return summaries;
  };

  const handlePrintMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setPrintAnchorEl(event.currentTarget);
  };

  const handlePrintMenuClose = () => {
    setPrintAnchorEl(null);
  };

  const handlePrintOverdueReport = async (scope: 'class' | 'level' | 'school') => {
    handlePrintMenuClose();
    
    let overdueData: OverduePayment[] = [];
    let reportTitle = '';
    
    console.log('🖨️ Début de la génération du rapport pour le scope:', scope);
    console.log('📅 Année scolaire utilisée:', currentSchoolYear);
    
    switch (scope) {
      case 'class':
        if (!selectedClass) return;
        overdueData = await generateOverduePaymentsReport('class', selectedClass.id);
        reportTitle = `Retards de paiement - ${selectedClass.name} (${currentSchoolYear})`;
        break;
      case 'level':
        if (!selectedLevel) return;
        overdueData = await generateOverduePaymentsReport('level', undefined, selectedLevel);
        reportTitle = `Retards de paiement - Niveau ${selectedLevel} (${currentSchoolYear})`;
        break;
      case 'school':
        overdueData = await generateOverduePaymentsReport('school');
        reportTitle = `Retards de paiement - Établissement complet (${currentSchoolYear})`;
        break;
    }
    
    console.log('📊 Données brutes récupérées:', overdueData.length, 'versements');
    console.log('📋 Détail des données:', overdueData);
    
    if (overdueData.length === 0) {
      alert(`Aucun retard de paiement trouvé pour ce périmètre pour l'année scolaire ${currentSchoolYear}.`);
      return;
    }
    
    // Générer les résumés par étudiant
    const studentSummaries = generateStudentOverdueSummaries(overdueData);
    
    console.log('✅ Résumés par étudiant générés:', studentSummaries);
    
    console.log('💾 Mise à jour de l\'état avec les données...');
    setOverduePayments(overdueData);
    setStudentOverdueSummaries(studentSummaries);
    setCurrentReportScope(scope);
    
    // Vérification immédiate
    console.log('🔍 Vérification des données dans l\'état:');
    console.log('- OverduePayments:', overdueData.length);
    console.log('- StudentSummaries:', studentSummaries.length);
    console.log('- ReportScope:', scope);
    
    // Attendre que le DOM soit mis à jour puis imprimer
    setTimeout(() => {
      if (printRef.current) {
        console.log('🖨️ Lancement de l\'impression...');
        window.print();
      }
    }, 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTotalOverdueAmount = () => {
    return studentOverdueSummaries.reduce((total, summary) => total + summary.total_remaining_amount, 0);
  };

  const getTotalOverdueStudents = () => {
    return studentOverdueSummaries.length;
  };

  const getTotalOverdueInstallments = () => {
    return overduePayments.length;
  };

  // Fonction pour gérer l'affichage de plus d'étudiants
  const handleShowMoreStudents = (classId: number) => {
    setStudentsPerClass(prev => ({
      ...prev,
      [classId]: (prev[classId] || 3) + 5
    }));
  };

  // Fonction pour obtenir le nombre d'étudiants à afficher pour une classe
  const getStudentsToShow = (classItem: Class) => {
    const currentCount = studentsPerClass[classItem.id] || 3;
    const totalStudents = classItem.students?.length || 0;
    return Math.min(currentCount, totalStudents);
  };

  // Fonction pour vérifier s'il y a plus d'étudiants à afficher
  const hasMoreStudents = (classItem: Class) => {
    const currentCount = studentsPerClass[classItem.id] || 3;
    const totalStudents = classItem.students?.length || 0;
    return currentCount < totalStudents;
  };

  const groupClassesByLevel = () => {
    const grouped: { [key: string]: Class[] } = {};
    niveaux.forEach(niveau => {
      grouped[niveau] = classes.filter(c => c.level === niveau);
    });
    return grouped;
  };

  const getAssignedModalities = (classItem: Class) => {
    return classItem.payment_modalities.filter(m => m.payment_type === 'assigned');
  };

  const getNonAssignedModalities = (classItem: Class) => {
    return classItem.payment_modalities.filter(m => m.payment_type === 'non_assigned');
  };

  const groupedClasses = groupClassesByLevel();

  // Fonction pour gérer le clic sur un niveau
  const handleLevelClick = (level: string) => {
    setSelectedLevel(level);
    setSelectedClass(null);
  };

  // Fonction pour gérer le clic sur une classe
  const handleClassClick = (classItem: Class) => {
    setSelectedClass(classItem);
  };

  // Fonction pour revenir aux niveaux
  const handleBackToLevels = () => {
    setSelectedLevel(null);
    setSelectedClass(null);
  };

  // Fonction pour revenir aux classes
  const handleBackToClasses = () => {
    setSelectedClass(null);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SecretarySidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%' }}>
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e3f0ff 0%, #f8fbff 100%)', p: { xs: 1, md: 4 } }}>
          {/* Header avec navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                onClick={() => navigate(-1)} 
                sx={{ 
                  mr: 2, 
                  bgcolor: 'primary.light', 
                  color: 'primary.main', 
                  '&:hover': { bgcolor: 'primary.main', color: 'white' } 
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" fontWeight={700} sx={{ color: 'primary.main', letterSpacing: 1 }}>
                Gestion des relances
              </Typography>
              
              {/* Breadcrumb de navigation */}
              {selectedLevel && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }} onClick={handleBackToLevels}>
                    Niveaux
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>/</Typography>
                  <Typography variant="body2" color="primary.main" fontWeight={600}>
                    {selectedLevel}
                  </Typography>
                  {selectedClass && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>/</Typography>
                      <Typography variant="body2" color="primary.main" fontWeight={600}>
                        {selectedClass.name}
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </Box>
            
            {!selectedClass && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {/* Sélecteur d'année scolaire */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Année scolaire:
                  </Typography>
                  <TextField
                    select
                    size="small"
                    value={currentSchoolYear}
                    onChange={(e) => setCurrentSchoolYear(e.target.value)}
                    sx={{ 
                      minWidth: 120,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        borderRadius: 2
                      }
                    }}
                  >
                    <MenuItem value="2024-2025">2024-2025</MenuItem>
                    <MenuItem value="2025-2026">2025-2026</MenuItem>
                    <MenuItem value="2026-2027">2026-2027</MenuItem>
                  </TextField>
                </Box>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SchoolIcon />}
                  onClick={() => navigate('/secretary/levels')}
                  sx={{ ml: 2 }}
                >
                  Gérer les niveaux
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<MoneyIcon />}
                  onClick={handleSendRemindersForAllSchool}
                >
                  Relances globales
                </Button>
                <Button
                  variant="contained"
                  color="info"
                  startIcon={<PrintIcon />}
                  onClick={handlePrintMenuOpen}
                  disabled={isGeneratingReport}
                >
                  {isGeneratingReport ? 'Génération...' : 'Imprimer rapports'}
                </Button>
                <Menu
                  anchorEl={printAnchorEl}
                  open={Boolean(printAnchorEl)}
                  onClose={handlePrintMenuClose}
                >
                  <MenuItem onClick={() => handlePrintOverdueReport('school')}>
                    <ListItemIcon>
                      <AssessmentIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Rapport complet de l'établissement" 
                      secondary="Tous les retards de paiement"
                    />
                  </MenuItem>
                </Menu>
              </Box>
            )}
          </Box>

                     {loading ? (
             <Typography align="center" color="text.secondary">Chargement...</Typography>
           ) : error ? (
             <Alert severity="error" sx={{ mb: 3 }}>
               {error}
               <Box sx={{ mt: 2 }}>
                 <Button 
                   variant="outlined" 
                   onClick={fetchClasses}
                   disabled={loading}
                 >
                   Réessayer
                 </Button>
               </Box>
             </Alert>
           ) : classes.length === 0 ? (
             <Alert severity="info" sx={{ mb: 3 }}>
               Aucune classe trouvée. Veuillez d'abord créer des classes avec leurs modalités de paiement.
             </Alert>
           ) : (
            <Box>
              {/* Vue des niveaux */}
              {!selectedLevel && (
                <Grid container spacing={3}>
                  {niveaux.map((niveau) => {
                    const classesForLevel = groupedClasses[niveau];
                    const classCount = classesForLevel ? classesForLevel.length : 0;
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={niveau}>
                        <Card 
                          sx={{ 
                            height: 200, 
                            borderRadius: 3, 
                            boxShadow: 3,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            '&:hover': {
                              transform: 'translateY(-8px)',
                              boxShadow: 6,
                              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                            }
                          }}
                          onClick={() => handleLevelClick(niveau)}
                        >
                          <CardContent sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            textAlign: 'center'
                          }}>
                            <SchoolIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                            <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                              {niveau}
                            </Typography>
                            <Typography variant="body1" sx={{ opacity: 0.9 }}>
                              {classCount} classe{classCount > 1 ? 's' : ''}
                            </Typography>
                            {classCount > 0 && (
                              <Chip 
                                label="Cliquer pour voir" 
                                sx={{ 
                                  mt: 2, 
                                  bgcolor: 'rgba(255,255,255,0.2)', 
                                  color: 'white',
                                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                }} 
                              />
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}

              {/* Vue des classes d'un niveau */}
              {selectedLevel && !selectedClass && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton 
                        onClick={handleBackToLevels}
                        sx={{ mr: 2, bgcolor: 'primary.light', color: 'primary.main' }}
                      >
                        <ArrowBackIcon />
                      </IconButton>
                      <Typography variant="h4" fontWeight={700} color="primary.main">
                        Classes de {selectedLevel}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<MoneyIcon />}
                      onClick={() => handleSendRemindersForLevel(selectedLevel)}
                    >
                      Relances pour {selectedLevel}
                    </Button>
                    <Button
                      variant="contained"
                      color="info"
                      startIcon={<PrintIcon />}
                      onClick={() => handlePrintOverdueReport('level')}
                      disabled={isGeneratingReport}
                    >
                      {isGeneratingReport ? 'Génération...' : 'Imprimer rapport'}
                    </Button>
                  </Box>

                  <Grid container spacing={3}>
                    {groupedClasses[selectedLevel]?.map((classItem) => (
                      <Grid item xs={12} md={6} lg={4} key={classItem.id}>
                        <Card 
                          sx={{ 
                            borderRadius: 3, 
                            boxShadow: 3,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 6
                            }
                          }}
                          onClick={() => handleClassClick(classItem)}
                        >
                          <CardContent>
                            <Typography variant="h5" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                              {classItem.name}
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Scolarité affecté: <strong>{(classItem.assigned_amount || classItem.amount || 0).toLocaleString('fr-FR')} F CFA</strong>
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Scolarité non affecté: <strong>{(classItem.non_assigned_amount || classItem.amount_non_assigned || 0).toLocaleString('fr-FR')} F CFA</strong>
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Inscription affecté: <strong>{(classItem.registration_fee_assigned || 0).toLocaleString('fr-FR')} F CFA</strong>
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Inscription non affecté: <strong>{(classItem.registration_fee_non_assigned || 0).toLocaleString('fr-FR')} F CFA</strong>
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                              <Chip 
                                label={`${getAssignedModalities(classItem).length} versements affectés`} 
                                size="small" 
                                color="success" 
                                variant="outlined"
                              />
                              <Chip 
                                label={`${getNonAssignedModalities(classItem).length} versements non affectés`} 
                                size="small" 
                                color="warning" 
                                variant="outlined"
                              />
                            </Box>

                            <Button
                              variant="contained"
                              fullWidth
                              sx={{ 
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600
                              }}
                            >
                              Voir les détails
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Vue détaillée d'une classe */}
              {selectedClass && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton 
                        onClick={handleBackToClasses}
                        sx={{ mr: 2, bgcolor: 'primary.light', color: 'primary.main' }}
                      >
                        <ArrowBackIcon />
                      </IconButton>
                      <Typography variant="h4" fontWeight={700} color="primary.main">
                        {selectedClass.name}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="info"
                      startIcon={<PrintIcon />}
                      onClick={() => handlePrintOverdueReport('class')}
                      disabled={isGeneratingReport}
                    >
                      {isGeneratingReport ? 'Génération...' : 'Imprimer rapport'}
                    </Button>
                  </Box>

                  <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                        {selectedClass.name}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Scolarité affecté: <strong>{(selectedClass.assigned_amount || selectedClass.amount || 0).toLocaleString('fr-FR')} F CFA</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Scolarité non affecté: <strong>{(selectedClass.non_assigned_amount || selectedClass.amount_non_assigned || 0).toLocaleString('fr-FR')} F CFA</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Inscription affecté: <strong>{(selectedClass.registration_fee_assigned || 0).toLocaleString('fr-FR')} F CFA</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Inscription non affecté: <strong>{(selectedClass.registration_fee_non_assigned || 0).toLocaleString('fr-FR')} F CFA</strong>
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Information sur les modalités */}
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>Modalités de paiement :</strong> Les modalités de paiement sont maintenant gérées au niveau des niveaux pour assurer la cohérence entre toutes les classes d'un même niveau.
                          <br />
                          • Pour modifier les modalités, utilisez la page "Gestion des Niveaux"
                          • Les classes d'un même niveau auront automatiquement les mêmes modalités
                          <br />
                          <strong>Calcul des versements :</strong> Les versements sont calculés sur le montant restant après déduction des frais d'inscription.
                        </Typography>
                      </Alert>

                      {/* Modalités pour étudiants affectés */}
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: 'success.main' }}>
                        Étudiants Affectés
                      </Typography>
                      {getAssignedModalities(selectedClass).length > 0 ? (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {getAssignedModalities(selectedClass).length} versement(s)
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              color="secondary"
                              onClick={() => navigate('/secretary/levels')}
                            >
                              Modifier dans "Niveaux"
                            </Button>
                          </Box>
                          <TableContainer component={Paper} sx={{ mb: 2, maxHeight: 200 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Échéance</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Montant</TableCell>
                                <TableCell>%</TableCell>
                                <TableCell>Action</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {getAssignedModalities(selectedClass).map((modality) => (
                             <TableRow key={modality.id}>
                               <TableCell>
                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                   {modality.installment_number}
                                   {new Date(modality.due_date) < new Date() && (
                                     <Chip 
                                       label="En retard" 
                                       size="small" 
                                       color="error" 
                                       variant="outlined"
                                     />
                                   )}
                                 </Box>
                               </TableCell>
                               <TableCell>
                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                   {new Date(modality.due_date).toLocaleDateString('fr-FR')}
                                   {new Date(modality.due_date) < new Date() && (
                                     <Typography variant="caption" color="error">
                                       ({calculateDaysOverdue(modality.due_date)} jour(s) de retard)
                                     </Typography>
                                   )}
                                 </Box>
                               </TableCell>
                               <TableCell>
                                 <strong>{(modality.amount || 0).toLocaleString('fr-FR')} F CFA</strong>
                                 <Typography variant="caption" display="block" color="text.secondary">
                                   {(((modality.amount || 0) / (selectedClass.assigned_amount || selectedClass.amount || 1)) * 100).toFixed(1)}% du total
                                 </Typography>
                               </TableCell>
                               <TableCell>
                                 <Chip label={`${modality.percentage}%`} size="small" color="primary" />
                               </TableCell>
                               <TableCell>
                                 <Box sx={{ display: 'flex', gap: 1 }}>
                                   <Tooltip title="Modifier dans Gestion des Niveaux">
                                     <IconButton 
                                       size="small" 
                                       color="primary"
                                       onClick={() => navigate('/secretary/levels')}
                                     >
                                       <EditIcon fontSize="small" />
                                     </IconButton>
                                   </Tooltip>
                                   {new Date(modality.due_date) < new Date() && (
                                     <Tooltip title="Envoyer des relances">
                                       <IconButton 
                                         size="small" 
                                         color="warning"
                                         onClick={() => handleSendReminders(selectedClass.id, modality.id)}
                                       >
                                         <MoneyIcon fontSize="small" />
                                       </IconButton>
                                     </Tooltip>
                                   )}
                                 </Box>
                               </TableCell>
                             </TableRow>
                           ))}
                         </TableBody>
                       </Table>
                     </TableContainer>
                     </>
                     ) : (
                       <Alert severity="info" sx={{ mb: 2 }}>
                         Aucune modalité de paiement configurée pour les étudiants affectés
                         <Box sx={{ mt: 2 }}>
                           <Button
                             size="small"
                             variant="outlined"
                             color="primary"
                             onClick={() => navigate('/secretary/levels')}
                             startIcon={<SchoolIcon />}
                           >
                             Configurer les modalités dans "Gestion des Niveaux"
                           </Button>
                         </Box>
                       </Alert>
                     )}

                     {/* Modalités pour étudiants non affectés */}
                     <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: 'warning.main' }}>
                       Étudiants Non Affectés
                     </Typography>
                     {getNonAssignedModalities(selectedClass).length > 0 ? (
                       <>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                           <Typography variant="body2" color="text.secondary">
                             {getNonAssignedModalities(selectedClass).length} versement(s)
                           </Typography>
                                                       <Button
                              size="small"
                              variant="outlined"
                              color="secondary"
                              onClick={() => navigate('/secretary/levels')}
                            >
                              Modifier dans "Niveaux"
                            </Button>
                         </Box>
                         <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
                         <Table size="small">
                           <TableHead>
                             <TableRow>
                               <TableCell>Échéance</TableCell>
                               <TableCell>Date</TableCell>
                               <TableCell>Montant</TableCell>
                               <TableCell>%</TableCell>
                               <TableCell>Action</TableCell>
                             </TableRow>
                           </TableHead>
                           <TableBody>
                             {getNonAssignedModalities(selectedClass).map((modality) => (
                           <TableRow key={modality.id}>
                             <TableCell>
                               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                 {modality.installment_number}
                                 {new Date(modality.due_date) < new Date() && (
                                   <Chip 
                                     label="En retard" 
                                     size="small" 
                                     color="error" 
                                     variant="outlined"
                                   />
                                 )}
                               </Box>
                             </TableCell>
                             <TableCell>
                               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                 {new Date(modality.due_date).toLocaleDateString('fr-FR')}
                                 {new Date(modality.due_date) < new Date() && (
                                   <Typography variant="caption" color="error">
                                     ({calculateDaysOverdue(modality.due_date)} jour(s) de retard)
                                   </Typography>
                                 )}
                               </Box>
                             </TableCell>
                             <TableCell>
                               <strong>{(modality.amount || 0).toLocaleString('fr-FR')} F CFA</strong>
                               <Typography variant="caption" display="block" color="text.secondary">
                                 {(((modality.amount || 0) / (selectedClass.non_assigned_amount || selectedClass.amount_non_assigned || 1)) * 100).toFixed(1)}% du total
                               </Typography>
                             </TableCell>
                             <TableCell>
                               <Chip label={`${modality.percentage}%`} size="small" color="warning" />
                             </TableCell>
                             <TableCell>
                               <Box sx={{ display: 'flex', gap: 1 }}>
                                 <Tooltip title="Modifier dans Gestion des Niveaux">
                                   <IconButton 
                                     size="small" 
                                     color="primary"
                                     onClick={() => navigate('/secretary/levels')}
                                   >
                                     <EditIcon fontSize="small" />
                                   </IconButton>
                                 </Tooltip>
                                 {new Date(modality.due_date) < new Date() && (
                                   <Tooltip title="Envoyer des relances">
                                     <IconButton 
                                       size="small" 
                                       color="warning"
                                       onClick={() => handleSendReminders(selectedClass.id, modality.id)}
                                     >
                                       <MoneyIcon fontSize="small" />
                                     </IconButton>
                                   </Tooltip>
                                 )}
                               </Box>
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   </TableContainer>
                   </>
                   ) : (
                     <Alert severity="info" sx={{ mb: 2 }}>
                       Aucune modalité de paiement configurée pour les étudiants non affectés
                                                <Box sx={{ mt: 2 }}>
                           <Button
                             size="small"
                             variant="outlined"
                             color="warning"
                             onClick={() => navigate('/secretary/levels')}
                             startIcon={<SchoolIcon />}
                           >
                             Configurer les modalités dans "Gestion des Niveaux"
                           </Button>
                         </Box>
                     </Alert>
                   )}

                   {/* Section des étudiants et leurs paiements */}
                   {selectedClass.students && selectedClass.students.length > 0 && (
                     <>
                       <Divider sx={{ my: 3 }} />
                       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                         <Typography variant="h6" fontWeight={600} sx={{ color: 'primary.main' }}>
                           Paiements des Étudiants
                         </Typography>
                         <Chip 
                           label={`${getStudentsToShow(selectedClass)} / ${selectedClass.students.length} étudiants`} 
                           color="primary" 
                           variant="outlined" 
                           size="small"
                         />
                       </Box>
                       
                       {selectedClass.students.slice(0, getStudentsToShow(selectedClass)).map((student) => (
                         <Card key={student.id} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                           <CardContent>
                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                               <Typography variant="subtitle1" fontWeight={600}>
                                 {student.full_name} ({student.registration_number})
                               </Typography>
                               <Chip 
                                 label={student.payment_type === 'assigned' ? 'Affecté' : 'Non affecté'} 
                                 color={student.payment_type === 'assigned' ? 'success' : 'warning'} 
                                 size="small" 
                               />
                             </Box>
                             
                             <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                               <Box sx={{ display: 'flex', gap: 2 }}>
                                 {(() => {
                                   const financials = calculateStudentFinancials(student, selectedClass);
                                   return (
                                     <>
                                       <Typography variant="body2">
                                         <strong>Versements dûs:</strong> <span style={{ color: 'blue' }}>{Math.round(financials.amountDueForInstallments).toLocaleString('fr-FR')} F CFA</span>
                                       </Typography>
                                       <Typography variant="body2">
                                         <strong>Versements payés:</strong> <span style={{ color: 'green' }}>{Math.round(financials.totalAmountPaid).toLocaleString('fr-FR')} F CFA</span>
                                         {financials.surplusFromInitial > 0 && (
                                           <Typography variant="caption" display="block" color="success.main" fontWeight="bold">
                                             + {Math.round(financials.surplusFromInitial).toLocaleString('fr-FR')} surplus = {Math.round(financials.totalPaidWithSurplus).toLocaleString('fr-FR')} F CFA
                                           </Typography>
                                         )}
                                       </Typography>
                                       <Typography variant="body2">
                                         <strong>Reste versements:</strong> <span style={{ color: financials.remainingAmount > 0 ? 'red' : 'green' }}>
                                           {Math.round(financials.remainingAmount).toLocaleString('fr-FR')} F CFA
                                         </span>
                                       </Typography>
                                     </>
                                   );
                                 })()}
                               </Box>
                               <Button
                                 size="small"
                                 variant="outlined"
                                 color="warning"
                                 onClick={() => handleFixSurplusPayments(student.id)}
                                 sx={{ ml: 2 }}
                               >
                                 Corriger surplus
                               </Button>
                             </Box>

                             {/* Résumé financier global incluant les paiements d'inscription */}
                             <Box sx={{ 
                               bgcolor: '#f8f9fa', 
                               p: 2, 
                               borderRadius: 2, 
                               mb: 2, 
                               border: '1px solid #e9ecef' 
                             }}>
                               <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: 'primary.main' }}>
                                 📊 Résumé Financier Global (incluant paiements initiaux et surplus)
                               </Typography>
                               <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                 {(() => {
                                   const financials = calculateStudentFinancials(student, selectedClass);
                                   return (
                                     <>
                                       <Typography variant="body2">
                                         <strong>Scolarité totale:</strong> <span style={{ color: 'blue' }}>
                                           {Math.round(financials.tuitionFee).toLocaleString('fr-FR')} F CFA
                                         </span>
                                       </Typography>
                                       <Typography variant="body2">
                                         <strong>Frais d'inscription:</strong> <span style={{ color: 'purple' }}>
                                           {Math.round(financials.registrationFee).toLocaleString('fr-FR')} F CFA
                                         </span>
                                       </Typography>
                                       <Typography variant="body2">
                                         <strong>Paiements initiaux:</strong> <span style={{ color: 'orange' }}>
                                           {Math.round(financials.registrationFee).toLocaleString('fr-FR')} F CFA
                                         </span>
                                       </Typography>
                                       {financials.surplusFromInitial > 0 && (
                                         <Typography variant="body2">
                                           <strong>Surplus reversé sur versements:</strong> <span style={{ color: 'green', fontWeight: 'bold' }}>
                                             ✅ {Math.round(financials.surplusFromInitial).toLocaleString('fr-FR')} F CFA
                                           </span>
                                         </Typography>
                                       )}
                                       <Typography variant="body2">
                                         <strong>Reste à payer:</strong> <span style={{ color: 'red' }}>
                                           {Math.round(financials.amountDueForInstallments).toLocaleString('fr-FR')} F CFA
                                         </span>
                                       </Typography>
                                       <Typography variant="body2">
                                         <strong>Paiements versements:</strong> <span style={{ color: 'green' }}>
                                           {Math.round(financials.totalAmountPaid).toLocaleString('fr-FR')} F CFA
                                         </span>
                                         {financials.surplusFromInitial > 0 && (
                                           <Typography variant="caption" display="block" color="success.main" fontWeight="bold">
                                             + {Math.round(financials.surplusFromInitial).toLocaleString('fr-FR')} surplus = {Math.round(financials.totalPaidWithSurplus).toLocaleString('fr-FR')} F CFA
                                           </Typography>
                                         )}
                                       </Typography>
                                       <Typography variant="body2">
                                         <strong>Paiements totaux (incluant paiements initiaux):</strong> <span style={{ color: 'green' }}>
                                           {Math.round(financials.registrationFee + financials.totalAmountPaid + financials.surplusFromInitial).toLocaleString('fr-FR')} F CFA
                                         </span>
                                       </Typography>
                                       <Typography variant="body2">
                                         <strong>Solde final:</strong> <span style={{ 
                                           color: financials.remainingAmount > 0 ? 'red' : 'green' 
                                         }}>
                                           {Math.round(financials.remainingAmount).toLocaleString('fr-FR')} F CFA
                                         </span>
                                       </Typography>
                                     </>
                                   );
                                 })()}
                               </Box>
                               <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                 {(() => {
                                   const financials = calculateStudentFinancials(student, selectedClass);
                                   return (
                                     <>
                                       💡 Les versements sont calculés sur le reste à payer (après déduction des frais d'inscription)
                                       {financials.surplusFromInitial > 0 && (
                                         <span style={{ color: 'green', fontWeight: 'bold' }}>
                                           {' '}✅ Surplus des paiements initiaux automatiquement reversé sur les versements
                                         </span>
                                       )}
                                       {(financials.registrationFee >= financials.amountDueForInstallments) && (
                                         <span style={{ color: 'green', fontWeight: 'bold' }}>
                                           {' '}✅ Scolarité entièrement payée aux paiements initiaux
                                         </span>
                                       )}
                                     </>
                                   );
                                 })()}
                               </Typography>
                             </Box>

                             <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                               <Table size="small">
                                 <TableHead>
                                   <TableRow>
                                     <TableCell>Échéance</TableCell>
                                     <TableCell>Date limite</TableCell>
                                     <TableCell>Montant</TableCell>
                                     <TableCell>Payé</TableCell>
                                     <TableCell>Reste</TableCell>
                                     <TableCell>Statut</TableCell>
                                   </TableRow>
                                 </TableHead>
                                 <TableBody>
                                   {student.installments.map((installment) => (
                                     <TableRow key={installment.id}>
                                       <TableCell>{installment.installment_number}</TableCell>
                                       <TableCell>
                                         {new Date(installment.due_date).toLocaleDateString('fr-FR')}
                                       </TableCell>
                                       <TableCell>
                                         <strong>{Math.round(installment.amount_with_carried_over || installment.amount || 0).toLocaleString('fr-FR')} F CFA</strong>
                                         {(installment.carried_over_amount || 0) > 0 && (
                                           <Typography variant="caption" display="block" color="warning.main">
                                             + {Math.round(installment.carried_over_amount || 0).toLocaleString('fr-FR')} reporté
                                           </Typography>
                                         )}
                                         {(Number(installment.surplus_applied || 0)) > 0 && (
                                           <Typography variant="caption" display="block" color="success.main" fontWeight="bold">
                                             ✅ - {Math.round(Number(installment.surplus_applied || 0)).toLocaleString('fr-FR')} surplus appliqué
                                           </Typography>
                                         )}
                                       </TableCell>
                                       <TableCell>
                                         <span style={{ color: 'green' }}>
                                           {Math.round(Number(installment.total_paid || 0) + Number(installment.surplus_applied || 0)).toLocaleString('fr-FR')} F CFA
                                         </span>
                                         {(Number(installment.surplus_applied || 0)) > 0 && (
                                           <Typography variant="caption" display="block" color="success.main" fontWeight="bold">
                                             (incluant {Math.round(Number(installment.surplus_applied || 0)).toLocaleString('fr-FR')} surplus)
                                           </Typography>
                                         )}
                                         {/* Afficher le nombre de paiements si disponible */}
                                         {installment.payments && installment.payments.length > 0 && (
                                           <Typography variant="caption" display="block" color="text.secondary">
                                             {installment.payments.length} paiement(s)
                                           </Typography>
                                         )}
                                       </TableCell>
                                       <TableCell>
                                         <span style={{ color: (installment.remaining_with_carried_over || installment.remaining_amount || 0) > 0 ? 'red' : 'green' }}>
                                           {Math.round(installment.remaining_with_carried_over || installment.remaining_amount || 0).toLocaleString('fr-FR')} F CFA
                                         </span>
                                       </TableCell>
                                       <TableCell>
                                         {installment.is_paid ? (
                                           <Chip label="Payé" size="small" color="success" />
                                         ) : installment.is_overdue ? (
                                           <Chip label="En retard" size="small" color="error" />
                                         ) : (
                                           <Chip label="En attente" size="small" color="warning" />
                                         )}
                                       </TableCell>
                                     </TableRow>
                                   ))}
                                 </TableBody>
                               </Table>
                             </TableContainer>
                           </CardContent>
                         </Card>
                       ))}
                       
                       {hasMoreStudents(selectedClass) && (
                         <Box sx={{ mt: 3, textAlign: 'center' }}>
                           <Button 
                             variant="outlined" 
                             color="primary" 
                             onClick={() => handleShowMoreStudents(selectedClass.id)}
                             startIcon={<AddIcon />}
                             sx={{ 
                               px: 3, 
                               py: 1,
                               borderRadius: 2,
                               textTransform: 'none',
                               fontWeight: 600
                             }}
                           >
                             Voir {Math.min(5, selectedClass.students.length - getStudentsToShow(selectedClass))} étudiant(s) de plus
                           </Button>
                         </Box>
                       )}
                     </>
                   )}
                 </CardContent>
               </Card>
             </Box>
           )}

           
         </Box>
       )}

          {/* Dialog de modification */}
          <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              Modifier la modalité de paiement
              {selectedClass && (
                <Typography variant="body2" color="text.secondary">
                  {selectedClass.name} - {editingModality?.payment_type === 'assigned' ? 'Affecté' : 'Non affecté'}
                </Typography>
              )}
            </DialogTitle>
            <DialogContent>
              {editingModality && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    label="Montant (F CFA)"
                    type="number"
                    fullWidth
                    value={editingModality.amount}
                    onChange={(e) => setEditingModality({
                      ...editingModality,
                      amount: parseInt(e.target.value) || 0
                    })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Date d'échéance"
                    type="date"
                    fullWidth
                    value={editingModality.due_date}
                    onChange={(e) => setEditingModality({
                      ...editingModality,
                      due_date: e.target.value
                    })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Pourcentage (%)"
                    type="number"
                    fullWidth
                    value={editingModality.percentage}
                    onChange={(e) => setEditingModality({
                      ...editingModality,
                      percentage: parseFloat(e.target.value) || 0
                    })}
                    inputProps={{ step: 0.01, min: 0, max: 100 }}
                  />
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSaveModality} variant="contained">Enregistrer</Button>
            </DialogActions>
          </Dialog>

          {/* Composant d'impression pour les retards de paiement */}
          <Box
            ref={printRef}
            className="print-content"
            sx={{
              display: 'none',
              '@media print': {
                display: 'block',
                width: '100%',
                padding: '20px',
                backgroundColor: 'white',
                color: 'black'
              }
            }}
          >
            {studentOverdueSummaries.length > 0 && (
              <Box sx={{ 
                width: '100%', 
                maxWidth: '1200px', 
                margin: '0 auto',
                fontFamily: 'Arial, sans-serif'
              }}>
                {/* En-tête du rapport */}
                <Box sx={{ 
                  textAlign: 'center', 
                  mb: 4, 
                  borderBottom: '3px solid #1976d2',
                  pb: 2
                }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    color: '#1976d2',
                    mb: 1
                  }}>
                    RAPPORT DES RETARDS DE PAIEMENT
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#666' }}>
                    {(() => {
                      // Utiliser le scope actuel et les données pour déterminer l'affichage
                      const uniqueLevels = new Set(studentOverdueSummaries.map(s => s.level));
                      const uniqueClasses = new Set(studentOverdueSummaries.map(s => s.class_name));
                      
                      if (currentReportScope === 'class') {
                        // Rapport pour une classe spécifique
                        return `Niveau: ${studentOverdueSummaries[0]?.level || ''} - Classe: ${studentOverdueSummaries[0]?.class_name || ''}`;
                      } else if (currentReportScope === 'level') {
                        // Rapport pour un niveau spécifique
                        return `Niveau: ${studentOverdueSummaries[0]?.level || ''}`;
                      } else if (currentReportScope === 'school') {
                        // Rapport pour tout l'établissement
                        return 'Établissement complet';
                      } else {
                        // Fallback basé sur les données
                        if (uniqueLevels.size === 1 && uniqueClasses.size === 1) {
                          return `Niveau: ${studentOverdueSummaries[0]?.level || ''} - Classe: ${studentOverdueSummaries[0]?.class_name || ''}`;
                        } else if (uniqueLevels.size === 1 && uniqueClasses.size > 1) {
                          return `Niveau: ${studentOverdueSummaries[0]?.level || ''}`;
                        } else {
                          return 'Établissement complet';
                        }
                      }
                    })()}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold', mt: 1 }}>
                    Année scolaire: {currentSchoolYear}
                  </Typography>
                  {(() => {
                    const uniqueLevels = new Set(studentOverdueSummaries.map(s => s.level));
                    const uniqueClasses = new Set(studentOverdueSummaries.map(s => s.class_name));
                    
                    if (currentReportScope === 'level' && uniqueClasses.size > 1) {
                      // Rapport pour un niveau avec plusieurs classes
                      return (
                        <Typography variant="body2" sx={{ color: '#888', mt: 0.5 }}>
                          {uniqueClasses.size} classe{uniqueClasses.size > 1 ? 's' : ''} concernée{uniqueClasses.size > 1 ? 's' : ''}
                        </Typography>
                      );
                    } else if (currentReportScope === 'school') {
                      // Rapport pour tout l'établissement
                      return (
                        <Typography variant="body2" sx={{ color: '#888', mt: 0.5 }}>
                          {uniqueLevels.size} niveau{uniqueLevels.size > 1 ? 'x' : ''} • {uniqueClasses.size} classe{uniqueClasses.size > 1 ? 's' : ''} concernée{uniqueClasses.size > 1 ? 's' : ''}
                        </Typography>
                      );
                    }
                    return null;
                  })()}
                  <Typography variant="body2" sx={{ color: '#888', mt: 1 }}>
                    Généré le {new Date().toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Box>

                {/* Résumé statistiques */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  mb: 3,
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1
                }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                      {getTotalOverdueStudents()} étudiant(s) en retard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Nombre d'étudiants concernés
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                      {getTotalOverdueInstallments()} versement(s) en retard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Nombre total de versements
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                      {formatCurrency(getTotalOverdueAmount())}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Montant total en retard
                    </Typography>
                  </Box>
                </Box>

                {/* Tableau des retards */}
                <TableContainer component={Paper} sx={{ 
                  boxShadow: 'none',
                  border: '2px solid #e0e0e0',
                  overflowX: 'auto',
                  '@media print': {
                    overflowX: 'visible'
                  }
                }}>
                  <Table sx={{ 
                    minWidth: 1000,
                    tableLayout: 'fixed',
                    '& th': {
                      backgroundColor: '#1976d2',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      textAlign: 'center',
                      border: '1px solid #1565c0',
                      padding: '8px 4px',
                      wordWrap: 'break-word',
                      whiteSpace: 'normal'
                    },
                    '& td': {
                      border: '1px solid #e0e0e0',
                      fontSize: '11px',
                      textAlign: 'center',
                      padding: '6px 4px',
                      wordWrap: 'break-word',
                      whiteSpace: 'normal'
                    },
                    '& tr:nth-of-type(even)': {
                      backgroundColor: '#f9f9f9'
                    },
                    '& tr:hover': {
                      backgroundColor: '#f0f0f0'
                    },
                    '@media print': {
                      fontSize: '10px',
                      '& th': {
                        fontSize: '10px',
                        padding: '6px 2px'
                      },
                      '& td': {
                        fontSize: '9px',
                        padding: '4px 2px'
                      }
                    }
                  }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '4%', minWidth: '40px' }}>N°</TableCell>
                        <TableCell sx={{ width: '18%', minWidth: '150px' }}>Étudiant</TableCell>
                        <TableCell sx={{ width: '10%', minWidth: '100px' }}>Matricule</TableCell>
                        <TableCell sx={{ width: '10%', minWidth: '100px' }}>Classe</TableCell>
                        <TableCell sx={{ width: '7%', minWidth: '80px' }}>Type</TableCell>
                        <TableCell sx={{ width: '7%', minWidth: '80px' }}>Versements</TableCell>
                        <TableCell sx={{ width: '11%', minWidth: '100px' }}>Total dû</TableCell>
                        <TableCell sx={{ width: '11%', minWidth: '100px' }}>Total payé</TableCell>
                        <TableCell sx={{ width: '11%', minWidth: '100px' }}>Reste à payer</TableCell>
                        <TableCell sx={{ width: '11%', minWidth: '100px' }}>Max retard</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {studentOverdueSummaries.map((summary, index) => (
                        <TableRow key={summary.student_id}>
                          <TableCell sx={{ 
                            fontWeight: 'bold',
                            fontSize: '11px',
                            padding: '6px 4px'
                          }}>
                            {index + 1}
                          </TableCell>
                          <TableCell sx={{ 
                            textAlign: 'left', 
                            fontWeight: 'bold',
                            fontSize: '11px',
                            padding: '6px 4px',
                            wordWrap: 'break-word',
                            whiteSpace: 'normal'
                          }}>
                            {summary.student_name}
                          </TableCell>
                          <TableCell sx={{
                            fontSize: '11px',
                            padding: '6px 4px',
                            wordWrap: 'break-word',
                            whiteSpace: 'normal'
                          }}>
                            {summary.registration_number}
                          </TableCell>
                          <TableCell sx={{
                            fontSize: '11px',
                            padding: '6px 4px',
                            wordWrap: 'break-word',
                            whiteSpace: 'normal'
                          }}>
                            {summary.class_name}
                          </TableCell>
                          <TableCell sx={{
                            fontSize: '11px',
                            padding: '6px 4px'
                          }}>
                            <Chip 
                              label={summary.payment_type === 'assigned' ? 'Affecté' : 'Non affecté'} 
                              size="small" 
                              color={summary.payment_type === 'assigned' ? 'success' : 'warning'} 
                              variant="outlined"
                              sx={{ fontSize: '10px' }}
                            />
                          </TableCell>
                          <TableCell sx={{ 
                            fontWeight: 'bold', 
                            color: '#1976d2',
                            fontSize: '11px',
                            padding: '6px 4px'
                          }}>
                            {summary.overdue_installments_count}
                          </TableCell>
                          <TableCell sx={{ 
                            fontWeight: 'bold', 
                            color: '#1976d2',
                            fontSize: '11px',
                            padding: '6px 4px',
                            wordWrap: 'break-word',
                            whiteSpace: 'normal'
                          }}>
                            {formatCurrency(summary.total_amount_due)}
                          </TableCell>
                          <TableCell sx={{ 
                            color: '#2e7d32',
                            fontSize: '11px',
                            padding: '6px 4px',
                            wordWrap: 'break-word',
                            whiteSpace: 'normal'
                          }}>
                            {formatCurrency(summary.total_amount_paid)}
                          </TableCell>
                          <TableCell sx={{ 
                            fontWeight: 'bold', 
                            color: '#d32f2f',
                            backgroundColor: '#ffebee',
                            fontSize: '11px',
                            padding: '6px 4px',
                            wordWrap: 'break-word',
                            whiteSpace: 'normal'
                          }}>
                            {formatCurrency(summary.total_remaining_amount)}
                          </TableCell>
                          <TableCell 
                            className={summary.max_days_overdue > 30 ? 'overdue-high' : 'overdue-medium'}
                            sx={{ 
                              fontWeight: 'bold', 
                              color: '#d32f2f',
                              backgroundColor: summary.max_days_overdue > 30 ? '#ffcdd2' : '#ffebee',
                              fontSize: '11px',
                              padding: '6px 4px',
                              wordWrap: 'break-word',
                              whiteSpace: 'normal'
                            }}
                          >
                            {summary.max_days_overdue} jour(s)
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Section détaillée des versements par étudiant */}
                {studentOverdueSummaries.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 'bold', 
                      color: '#1976d2',
                      mb: 3,
                      textAlign: 'center',
                      borderBottom: '2px solid #e0e0e0',
                      pb: 1
                    }}>
                      DÉTAIL DES VERSEMENTS PAR ÉTUDIANT
                    </Typography>
                    
                    {studentOverdueSummaries.map((summary, studentIndex) => (
                      <Box key={summary.student_id} sx={{ mb: 3, pageBreakInside: 'avoid' }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 'bold', 
                          color: '#333',
                          mb: 2,
                          backgroundColor: '#f5f5f5',
                          p: 1,
                          borderRadius: 1
                        }}>
                          {studentIndex + 1}. {summary.student_name} ({summary.registration_number}) - {summary.class_name}
                          <Typography variant="body2" component="span" sx={{ ml: 2, color: '#666' }}>
                            Total en retard: {formatCurrency(summary.total_remaining_amount)} | 
                            {summary.overdue_installments_count} versement(s) | 
                            Max retard: {summary.max_days_overdue} jour(s)
                          </Typography>
                        </Typography>
                        
                        <TableContainer component={Paper} sx={{ 
                          boxShadow: 'none',
                          border: '1px solid #e0e0e0',
                          mb: 2
                        }}>
                          <Table size="small" sx={{ 
                            '& th': {
                              backgroundColor: '#f0f0f0',
                              color: '#333',
                              fontWeight: 'bold',
                              fontSize: '12px',
                              textAlign: 'center',
                              border: '1px solid #d0d0d0'
                            },
                            '& td': {
                              border: '1px solid #e0e0e0',
                              fontSize: '12px',
                              textAlign: 'center'
                            }
                          }}>
                            <TableHead>
                              <TableRow>
                                <TableCell>Échéance</TableCell>
                                <TableCell>Date limite</TableCell>
                                <TableCell>Montant dû</TableCell>
                                <TableCell>Montant payé</TableCell>
                                <TableCell>Reste à payer</TableCell>
                                <TableCell>Jours de retard</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {summary.overdue_installments.map((installment) => (
                                <TableRow key={installment.installment_number}>
                                  <TableCell sx={{ fontWeight: 'bold' }}>
                                    {installment.installment_number}
                                  </TableCell>
                                  <TableCell>
                                    {new Date(installment.due_date).toLocaleDateString('fr-FR')}
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                    {formatCurrency(installment.amount_due)}
                                  </TableCell>
                                  <TableCell sx={{ color: '#2e7d32' }}>
                                    {formatCurrency(installment.amount_paid)}
                                  </TableCell>
                                  <TableCell sx={{ 
                                    fontWeight: 'bold', 
                                    color: '#d32f2f',
                                    backgroundColor: '#ffebee'
                                  }}>
                                    {formatCurrency(installment.remaining_amount)}
                                  </TableCell>
                                  <TableCell 
                                    className={installment.days_overdue > 30 ? 'overdue-high' : 'overdue-medium'}
                                    sx={{ 
                                      fontWeight: 'bold', 
                                      color: '#d32f2f',
                                      backgroundColor: installment.days_overdue > 30 ? '#ffcdd2' : '#ffebee'
                                    }}
                                  >
                                    {installment.days_overdue} jour(s)
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Pied de page */}
                <Box sx={{ 
                  mt: 4, 
                  pt: 2, 
                  borderTop: '2px solid #e0e0e0',
                  textAlign: 'center'
                }}>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    <strong>Légende :</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '12px' }}>
                    • Retard &gt; 30 jours : Fond rouge clair • Retard ≤ 30 jours : Fond rose clair
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '12px', mt: 1 }}>
                    Ce rapport a été généré automatiquement par le système de gestion scolaire
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

        </Box>
      </Box>
    </Box>
  );
};

export default PaymentModalities;
