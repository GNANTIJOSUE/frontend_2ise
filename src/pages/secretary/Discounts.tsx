import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Container,
    Typography,
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
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
    Alert,
    Snackbar,
    Grid,
    Card,
    CardContent,
    CardActions,
    Avatar,
    Tabs,
    Tab,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    Divider,
    Badge,
    Checkbox,
    FormControlLabel,
    CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Add as AddIcon,
    CheckCircle as ApproveIcon,
    Cancel as DeactivateIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    LocalOffer as LocalOfferIcon,
    TrendingUp as TrendingUpIcon,
    People as PeopleIcon,
    Schedule as ScheduleIcon,
    CheckCircle as CheckCircleIcon,
    ExpandMore as ExpandMoreIcon,
    Print as PrintIcon,
    Group as GroupIcon,
    Receipt as ReceiptIcon,
    AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import SecretarySidebar from '../../components/SecretarySidebar';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { usePermissions } from '../../hooks/usePermissions';

interface DiscountType {
    id: number;
    name: string;
    description: string;
    percentage: number;
    fixed_amount: number;
    is_percentage: boolean;
    is_active: boolean;
}

interface StudentDiscount {
    id: number;
    student_id: number;
    discount_type_id: number;
    amount: number;
    percentage: number;
    reason: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    approved_by: number | null;
    approved_at: string | null;
    created_at: string;
    student_first_name: string;
    student_last_name: string;
    student_registration_number: string;
    discount_type_name: string;
    type_percentage: number;
    approver_first_name: string;
    approver_last_name: string;
    first_name?: string;
    last_name?: string;
    school_year?: string; // Added for filtering
}

interface Student {
    id: number;
    first_name: string;
    last_name: string;
    registration_number: string;
}

// Nouvelle interface pour le groupement par donateur
interface DonorGroup {
    discountTypeId: number;
    discountTypeName: string;
    discounts: StudentDiscount[];
    totalAmount: number;
    totalCount: number;
    activeCount: number;
    pendingCount: number;
}

// Interface pour les fiches de donateur
interface DonorReceipt {
    donorName: string;
    totalAmount: number;
    discountCount: number;
    discounts: StudentDiscount[];
    generatedDate: string;
    receiptNumber: string;
}



const Discounts: React.FC = () => {
    const theme = useTheme();
    const { hasPermission } = usePermissions();
    const [discountTypes, setDiscountTypes] = useState<DiscountType[]>([]);
    const [studentDiscounts, setStudentDiscounts] = useState<StudentDiscount[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [openDiscountDialog, setOpenDiscountDialog] = useState(false);
    const [openTypeDialog, setOpenTypeDialog] = useState(false);
    const [selectedDiscount, setSelectedDiscount] = useState<StudentDiscount | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });
    const [loading, setLoading] = useState(false);

    // Nouveaux états pour le groupement par donateur
    const [activeTab, setActiveTab] = useState(0);
    const [donorGroups, setDonorGroups] = useState<DonorGroup[]>([]);
    const [selectedDonorGroup, setSelectedDonorGroup] = useState<DonorGroup | null>(null);
    const [showDonorReceipt, setShowDonorReceipt] = useState(false);
    const [donorReceiptData, setDonorReceiptData] = useState<DonorReceipt | null>(null);
    const donorReceiptRef = useRef(null);

    // États pour la sélection multiple des bons
    const [selectedDiscounts, setSelectedDiscounts] = useState<{ [key: number]: boolean }>({});
    const [showSelectionReceipt, setShowSelectionReceipt] = useState(false);
    const [selectionReceiptData, setSelectionReceiptData] = useState<DonorReceipt | null>(null);

    // Form states
    const [discountForm, setDiscountForm] = useState({
        student_id: '',
        discount_type_id: '',
        amount: '',
        percentage: '',
        reason: '',
        start_date: '',
        end_date: ''
    });

    const [selectedStudentInfo, setSelectedStudentInfo] = useState<any>(null);
    const [receiptData, setReceiptData] = useState<any>(null);
    const [showReceipt, setShowReceipt] = useState(false);

    const [typeForm, setTypeForm] = useState({
        name: '',
        description: '',
        percentage: '',
        fixed_amount: '',
        is_percentage: true
    });

    const receiptRef = useRef(null);

    // Fonction pour obtenir l'année scolaire courante
    const getCurrentSchoolYear = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        // L'année scolaire commence en septembre (mois 9)
        // Si on est entre septembre et décembre, c'est l'année scolaire en cours
        // Si on est entre janvier et août, c'est l'année scolaire précédente
        if (month >= 9) {
            return `${year}-${year + 1}`;
        } else {
            return `${year - 1}-${year}`;
        }
    };

    const [schoolYear, setSchoolYear] = useState(getCurrentSchoolYear());
    
    // Fonction utilitaire pour générer les années scolaires
    const getSchoolYears = (count = 5) => {
        const currentSchoolYear = getCurrentSchoolYear();
        const currentYear = parseInt(currentSchoolYear.split('-')[0]);
        return Array.from({ length: count }, (_, i) => {
            const start = currentYear - (count - 1 - i);
            return `${start}-${start + 1}`;
        }).reverse();
    };
    
    const [availableYears, setAvailableYears] = useState<string[]>(getSchoolYears(5));

    // Fonction unifiée pour charger les données
    const loadData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const [discountTypesRes, studentDiscountsRes, studentsRes] = await Promise.all([
                axios.get('https://2ise-groupe.com/api/discounts/types'),
                axios.get(`https://2ise-groupe.com/api/discounts?school_year=${schoolYear}`, { headers }),
                axios.get(`https://2ise-groupe.com/api/students/list?school_year=${schoolYear}`, { headers })
            ]);

            setDiscountTypes(discountTypesRes.data);
            setStudentDiscounts(Array.isArray(studentDiscountsRes.data) ? studentDiscountsRes.data : []);
            setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            setSnackbar({ open: true, message: 'Erreur lors du chargement des données', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Charger les données au montage et quand schoolYear change
    useEffect(() => {
        let isMounted = true;
        
        const loadDataWithCleanup = async () => {
            if (!isMounted) return;
            
            try {
                if (isMounted) {
                    setLoading(true);
                }
                
                const token = localStorage.getItem('token');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const [discountTypesRes, studentDiscountsRes, studentsRes] = await Promise.all([
                    axios.get('https://2ise-groupe.com/api/discounts/types'),
                    axios.get(`https://2ise-groupe.com/api/discounts?school_year=${schoolYear}`, { headers }),
                    axios.get(`https://2ise-groupe.com/api/students/list?school_year=${schoolYear}`, { headers })
                ]);

                if (isMounted) {
                    setDiscountTypes(discountTypesRes.data);
                    setStudentDiscounts(Array.isArray(studentDiscountsRes.data) ? studentDiscountsRes.data : []);
                    setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Erreur lors du chargement des données:', error);
                    setSnackbar({ open: true, message: 'Erreur lors du chargement des données', severity: 'error' });
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        
        loadDataWithCleanup();
        
        return () => {
            isMounted = false;
        };
    }, [schoolYear]);



    const fetchData = async () => {
        await loadData();
    };

    const handleCreateDiscount = async () => {
        if (!hasPermission('canManageDiscounts')) {
            setSnackbar({ open: true, message: 'Vous n\'avez pas la permission de créer des réductions', severity: 'error' });
            return;
        }
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const response = await axios.post('https://2ise-groupe.com/api/discounts/student', {
                ...discountForm,
                school_year: schoolYear // <-- toujours envoyer l'année scolaire sélectionnée
            }, { headers });
            setSnackbar({ open: true, message: 'Bon/prise en charge créé avec succès', severity: 'success' });
            setOpenDiscountDialog(false);
            setReceiptData(response.data.receipt);
            setShowReceipt(true);
            resetDiscountForm();
            fetchData();
        } catch (error) {
            console.error('Erreur lors de la création:', error);
            setSnackbar({ open: true, message: 'Erreur lors de la création', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDiscountType = async () => {
        if (!hasPermission('canManageDiscounts')) {
            setSnackbar({ open: true, message: 'Vous n\'avez pas la permission de créer des types de réduction', severity: 'error' });
            return;
        }
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            await axios.post('https://2ise-groupe.com/api/discounts/types', typeForm, { headers });
            setSnackbar({ open: true, message: 'Type de réduction créé avec succès', severity: 'success' });
            setOpenTypeDialog(false);
            resetTypeForm();
            fetchData();
        } catch (error) {
            console.error('Erreur lors de la création:', error);
            setSnackbar({ open: true, message: 'Erreur lors de la création', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Calculer automatiquement le pourcentage basé sur le montant fixe
    const calculateTypePercentage = (fixedAmount: string) => {
        if (!fixedAmount) return '';
        const amount = parseFloat(fixedAmount);
        const defaultTuitionFee = 50000; // Montant de référence pour le calcul
        const percentage = (amount / defaultTuitionFee) * 100;
        return percentage.toFixed(2);
    };

    // Calculer automatiquement le montant fixe basé sur le pourcentage
    const calculateTypeAmount = (percentage: string) => {
        if (!percentage) return '';
        const discountPercentage = parseFloat(percentage);
        const defaultTuitionFee = 50000; // Montant de référence pour le calcul
        const amount = (defaultTuitionFee * discountPercentage) / 100;
        return amount.toFixed(0);
    };

    const handleApproveDiscount = async (discountId: number) => {
        if (!hasPermission('canManageDiscounts')) {
            setSnackbar({ open: true, message: 'Vous n\'avez pas la permission d\'approuver des réductions', severity: 'error' });
            return;
        }
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            await axios.put(`https://2ise-groupe.com/api/discounts/${discountId}/approve`, {
                approved_by: 1 // ID de l'utilisateur connecté (à adapter)
            }, { headers });
            setSnackbar({ open: true, message: 'Bon/prise en charge approuvé', severity: 'success' });
            fetchData();
        } catch (error) {
            console.error('Erreur lors de l\'approbation:', error);
            setSnackbar({ open: true, message: 'Erreur lors de l\'approbation', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivateDiscount = async (discountId: number) => {
        if (!hasPermission('canManageDiscounts')) {
            setSnackbar({ open: true, message: 'Vous n\'avez pas la permission de désactiver des réductions', severity: 'error' });
            return;
        }
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            await axios.put(`https://2ise-groupe.com/api/discounts/${discountId}/deactivate`, {}, { headers });
            setSnackbar({ open: true, message: 'Bon/prise en charge désactivé', severity: 'success' });
            fetchData();
        } catch (error) {
            console.error('Erreur lors de la désactivation:', error);
            setSnackbar({ open: true, message: 'Erreur lors de la désactivation', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const resetDiscountForm = () => {
        setDiscountForm({
            student_id: '',
            discount_type_id: '',
            amount: '',
            percentage: '',
            reason: '',
            start_date: '',
            end_date: ''
        });
    };

    const resetTypeForm = () => {
        setTypeForm({
            name: '',
            description: '',
            percentage: '',
            fixed_amount: '',
            is_percentage: true
        });
    };

    const handleStudentChange = async (studentId: string) => {
        if (!studentId) {
            setSelectedStudentInfo(null);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            // Récupérer les informations de base de l'étudiant
            const studentResponse = await axios.get(`https://2ise-groupe.com/api/discounts/student/${studentId}/info`, { headers });
            const studentInfo = studentResponse.data;

            // Récupérer les informations financières détaillées
            const financialResponse = await axios.get(`https://2ise-groupe.com/api/students/${studentId}/financial-summary?school_year=${schoolYear}`, { headers });
            const financialInfo = financialResponse.data;

            // Combiner les informations
            setSelectedStudentInfo({
                ...studentInfo,
                ...financialInfo
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des informations de l\'étudiant:', error);
            setSnackbar({ open: true, message: 'Erreur lors de la récupération des informations de l\'étudiant', severity: 'error' });
        }
    };

    // Calculer le pourcentage basé sur le montant
    const calculatePercentage = (amount: string) => {
        if (!selectedStudentInfo || !amount) return '';
        const montantDu = selectedStudentInfo.montant_du || selectedStudentInfo.tuition_fee || 0;
        const discountAmount = parseFloat(amount);
        const percentage = (discountAmount / montantDu) * 100;
        return percentage.toFixed(2);
    };

    // Calculer le montant basé sur le pourcentage
    const calculateAmount = (percentage: string) => {
        if (!percentage || !selectedStudentInfo) return '';
        const discountPercentage = parseFloat(percentage);
        const montantDu = selectedStudentInfo.montant_du || selectedStudentInfo.tuition_fee || 0;
        const amount = (montantDu * discountPercentage) / 100;
        return amount.toFixed(0);
    };

    // Gérer le changement du montant
    const handleAmountChange = (amount: string) => {
        if (!amount || parseFloat(amount) < 0) {
            setDiscountForm({
                ...discountForm,
                amount: amount,
                percentage: ''
            });
            return;
        }

        const montantDu = selectedStudentInfo?.montant_du || selectedStudentInfo?.tuition_fee || 0;
        const discountAmount = parseFloat(amount);
        
        // Vérifier que le montant ne dépasse pas ce que l'étudiant doit
        if (discountAmount > montantDu) {
            setSnackbar({ 
                open: true, 
                message: `Le montant de la réduction ne peut pas dépasser le montant dû (${montantDu.toLocaleString('fr-FR')} FCFA)`, 
                severity: 'error' 
            });
            return;
        }

        const percentage = calculatePercentage(amount);
        setDiscountForm({
            ...discountForm,
            amount: amount,
            percentage: percentage
        });
    };

    // Gérer le changement du pourcentage
    const handlePercentageChange = (percentage: string) => {
        if (!percentage || parseFloat(percentage) < 0 || parseFloat(percentage) > 100) {
            setDiscountForm({
                ...discountForm,
                percentage: percentage,
                amount: ''
            });
            return;
        }

        const amount = calculateAmount(percentage);
        const montantDu = selectedStudentInfo?.montant_du || selectedStudentInfo?.tuition_fee || 0;
        const calculatedAmount = parseFloat(amount);
        
        // Vérifier que le montant calculé ne dépasse pas ce que l'étudiant doit
        if (calculatedAmount > montantDu) {
            setSnackbar({ 
                open: true, 
                message: `Le pourcentage génère un montant (${calculatedAmount.toLocaleString('fr-FR')} FCFA) qui dépasse le montant dû (${montantDu.toLocaleString('fr-FR')} FCFA)`, 
                severity: 'error' 
            });
            return;
        }

        setDiscountForm({
            ...discountForm,
            percentage: percentage,
            amount: amount
        });
    };

    const getStatusColor = (discount: StudentDiscount) => {
        if (!discount.is_active) return 'error';
        if (discount.approved_by) return 'success';
        return 'warning';
    };

    const getStatusText = (discount: StudentDiscount) => {
        if (!discount.is_active) return 'Désactivé';
        if (discount.approved_by) return 'Approuvé';
        return 'En attente';
    };

    // Fonction pour grouper les bons par type de donateur
    const groupDiscountsByDonor = (discounts: StudentDiscount[]) => {
        const groups: { [key: number]: DonorGroup } = {};
        
        discounts.forEach(discount => {
            if (!groups[discount.discount_type_id]) {
                groups[discount.discount_type_id] = {
                    discountTypeId: discount.discount_type_id,
                    discountTypeName: discount.discount_type_name,
                    discounts: [],
                    totalAmount: 0,
                    totalCount: 0,
                    activeCount: 0,
                    pendingCount: 0
                };
            }
            
            const group = groups[discount.discount_type_id];
            group.discounts.push(discount);
            group.totalAmount += Number(discount.amount) || 0;
            group.totalCount++;
            
            if (discount.is_active && discount.approved_by) {
                group.activeCount++;
            } else if (discount.is_active && !discount.approved_by) {
                group.pendingCount++;
            }
        });
        
        return Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
    };

    // Fonction pour générer une fiche de donateur
    const generateDonorReceipt = (donorGroup: DonorGroup) => {
        const receiptNumber = `DR-${Date.now()}-${donorGroup.discountTypeId}`;
        const receipt: DonorReceipt = {
            donorName: donorGroup.discountTypeName,
            totalAmount: donorGroup.totalAmount,
            discountCount: donorGroup.totalCount,
            discounts: donorGroup.discounts,
            generatedDate: new Date().toLocaleDateString('fr-FR'),
            receiptNumber: receiptNumber
        };
        
        setDonorReceiptData(receipt);
        setShowDonorReceipt(true);
    };

    // Fonction pour calculer les statistiques globales des donateurs
    const calculateDonorStats = () => {
        const totalDonors = donorGroups.length;
        const totalAmount = donorGroups.reduce((sum, group) => sum + (Number(group.totalAmount) || 0), 0);
        const totalDiscounts = donorGroups.reduce((sum, group) => sum + group.totalCount, 0);
        const activeDiscounts = donorGroups.reduce((sum, group) => sum + group.activeCount, 0);
        const pendingDiscounts = donorGroups.reduce((sum, group) => sum + group.pendingCount, 0);
        
        return {
            totalDonors,
            totalAmount,
            totalDiscounts,
            activeDiscounts,
            pendingDiscounts
        };
    };

    // Fonction pour gérer la sélection d'un bon
    const handleDiscountSelection = (discountId: number, checked: boolean) => {
        setSelectedDiscounts(prev => ({
            ...prev,
            [discountId]: checked
        }));
    };

    // Fonction pour sélectionner tous les bons d'un groupe
    const handleSelectAllInGroup = (group: DonorGroup, checked: boolean) => {
        const newSelection = { ...selectedDiscounts };
        group.discounts.forEach(discount => {
            newSelection[discount.id] = checked;
        });
        setSelectedDiscounts(newSelection);
    };

    // Fonction pour obtenir les bons sélectionnés d'un groupe
    const getSelectedDiscountsInGroup = (group: DonorGroup) => {
        return group.discounts.filter(discount => selectedDiscounts[discount.id]);
    };

    // Fonction pour calculer le nombre de bons sélectionnés dans un groupe
    const getSelectedCountInGroup = (group: DonorGroup) => {
        return group.discounts.filter(discount => selectedDiscounts[discount.id]).length;
    };

    // Correction de la fonction getSelectedAmountInGroup
    const getSelectedAmountInGroup = (group: DonorGroup) => {
        return group.discounts
            .filter(discount => selectedDiscounts[discount.id])
            .reduce((sum, discount) => sum + (Number(discount.amount) || 0), 0);
    };

    // Fonction pour générer une fiche avec les bons sélectionnés
    const generateSelectionReceipt = (group: DonorGroup) => {
        const selectedDiscounts = getSelectedDiscountsInGroup(group);
        if (selectedDiscounts.length === 0) {
            setSnackbar({ open: true, message: 'Veuillez sélectionner au moins un bon', severity: 'warning' });
            return;
        }

        const receiptNumber = `DR-SEL-${Date.now()}-${group.discountTypeId}`;
        const totalAmount = getSelectedAmountInGroup(group);
        
        const receipt: DonorReceipt = {
            donorName: group.discountTypeName,
            totalAmount: totalAmount,
            discountCount: selectedDiscounts.length,
            discounts: selectedDiscounts,
            generatedDate: new Date().toLocaleDateString('fr-FR'),
            receiptNumber: receiptNumber
        };
        
        setSelectionReceiptData(receipt);
        setShowSelectionReceipt(true);
    };

    // Fonction pour réinitialiser la sélection
    const resetSelection = () => {
        setSelectedDiscounts({});
    };

    // Mettre à jour les groupes de donateurs quand les données changent
    useEffect(() => {
        const groups = groupDiscountsByDonor(studentDiscounts);
        setDonorGroups(groups);
        // Réinitialiser la sélection quand les données changent
        resetSelection();
    }, [studentDiscounts]);

    const filter = createFilterOptions<DiscountType | { inputValue: string; name: string }>();

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', background: theme.palette.background.default }}>
            <SecretarySidebar />
            <Container maxWidth="xl" sx={{ p: 3 }}>
                <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 3 }}>
                    <Box sx={{ mb: 4, borderBottom: `2px solid ${theme.palette.primary.main}`, pb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main', fontSize: '2rem' }}>
                                <LocalOfferIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                                    Gestion des Bons et Prises en Charge
                                </Typography>
                                <Typography variant="subtitle1" color="text.secondary">
                                    Gérez les réductions et prises en charge des étudiants
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Statistiques */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={3}>
                            <Card sx={{ 
                                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                                color: 'white',
                                borderRadius: 3
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <PeopleIcon sx={{ fontSize: 40 }} />
                                        <Box>
                                            <Typography variant="h6" component="div">
                                                Total des réductions
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                {studentDiscounts.length}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card sx={{ 
                                background: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
                                color: 'white',
                                borderRadius: 3
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <CheckCircleIcon sx={{ fontSize: 40 }} />
                                        <Box>
                                            <Typography variant="h6" component="div">
                                                Réductions actives
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                {studentDiscounts.filter(d => d.is_active && d.approved_by).length}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card sx={{ 
                                background: 'linear-gradient(135deg, #f57c00 0%, #ffb74d 100%)',
                                color: 'white',
                                borderRadius: 3
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <ScheduleIcon sx={{ fontSize: 40 }} />
                                        <Box>
                                            <Typography variant="h6" component="div">
                                                En attente
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                {studentDiscounts.filter(d => d.is_active && !d.approved_by).length}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card sx={{ 
                                background: 'linear-gradient(135deg, #7b1fa2 0%, #ba68c8 100%)',
                                color: 'white',
                                borderRadius: 3
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <TrendingUpIcon sx={{ fontSize: 40 }} />
                                        <Box>
                                            <Typography variant="h6" component="div">
                                                Types de réductions
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                {discountTypes.length}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Actions */}
                    {hasPermission('canManageDiscounts') && (
                        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setOpenDiscountDialog(true)}
                                sx={{ 
                                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                                    borderRadius: 2,
                                    px: 3,
                                    py: 1.5
                                }}
                            >
                                Nouveau Bon/Prise en Charge
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => setOpenTypeDialog(true)}
                                sx={{ 
                                    borderRadius: 2,
                                    px: 3,
                                    py: 1.5,
                                    borderColor: theme.palette.primary.main,
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                        borderColor: theme.palette.primary.dark,
                                        backgroundColor: theme.palette.primary.light + '20'
                                    }
                                }}
                            >
                                Nouveau Type de Réduction
                            </Button>
                        </Box>
                    )}
                    {!hasPermission('canManageDiscounts') && hasPermission('canViewDiscounts') && (
                        <Box sx={{ mb: 3, p: 2, background: '#fff3cd', borderRadius: 2, border: '1px solid #ffeaa7' }}>
                            <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 500 }}>
                                ⚠️ Mode consultation uniquement - Vous ne pouvez que consulter les réductions
                            </Typography>
                        </Box>
                    )}

                    {/* Onglets pour basculer entre les vues */}
                    <Box sx={{ mb: 3 }}>
                        <Tabs 
                            value={activeTab} 
                            onChange={(_e, newValue) => setActiveTab(newValue)}
                            sx={{
                                '& .MuiTab-root': {
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    textTransform: 'none',
                                    minHeight: 48
                                }
                            }}
                        >
                            <Tab 
                                icon={<LocalOfferIcon />} 
                                label="Tous les Bons" 
                                iconPosition="start"
                            />
                            <Tab 
                                icon={<GroupIcon />} 
                                label="Groupés par Donateur" 
                                iconPosition="start"
                            />
                        </Tabs>
                    </Box>

                    {/* Contenu des onglets */}
                    {activeTab === 0 && (
                        <>
                            {/* Table des bons/prises en charge */}
                            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
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
                                {loading && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircularProgress size={20} />
                                        <Typography variant="body2" color="text.secondary">
                                            Chargement...
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                            <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Étudiant</TableCell>
                                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type de Réduction</TableCell>
                                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Montant</TableCell>
                                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Pourcentage</TableCell>
                                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Raison</TableCell>
                                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Statut</TableCell>
                                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {studentDiscounts.map((discount) => (
                                            <TableRow key={discount.id} sx={{ '&:hover': { backgroundColor: theme.palette.action.hover } }}>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {[
                                                                discount.student_first_name,
                                                                discount.first_name,
                                                                discount.student_last_name,
                                                                discount.last_name
                                                            ]
                                                                .filter(Boolean)
                                                                .join(' ')
                                                                .replace(/\s+/g, ' ')
                                                                .trim()
                                                            }
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {discount.student_registration_number || ''}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{discount.discount_type_name}</TableCell>
                                                <TableCell>{discount.amount.toLocaleString('fr-FR')} FCFA</TableCell>
                                                <TableCell>{discount.percentage}%</TableCell>
                                                <TableCell>{discount.reason}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={getStatusText(discount)}
                                                        color={getStatusColor(discount)}
                                                        size="small"
                                                        sx={{ fontWeight: 500 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {hasPermission('canManageDiscounts') && (
                                                        <>
                                                            {discount.is_active && !discount.approved_by && (
                                                                <IconButton
                                                                    color="success"
                                                                    onClick={() => handleApproveDiscount(discount.id)}
                                                                    disabled={loading}
                                                                    sx={{ mr: 1 }}
                                                                >
                                                                    <ApproveIcon />
                                                                </IconButton>
                                                            )}
                                                            {discount.is_active && (
                                                                <IconButton
                                                                    color="error"
                                                                    onClick={() => handleDeactivateDiscount(discount.id)}
                                                                    disabled={loading}
                                                                >
                                                                    <DeactivateIcon />
                                                                </IconButton>
                                                            )}
                                                        </>
                                                    )}
                                                    {!hasPermission('canManageDiscounts') && hasPermission('canViewDiscounts') && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Consultation uniquement
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}

                    {activeTab === 1 && (
                        <>
                            {/* Statistiques des donateurs */}
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                <Grid item xs={12} md={2.4}>
                                    <Card sx={{ 
                                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                                        color: 'white',
                                        borderRadius: 3
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <AccountBalanceIcon sx={{ fontSize: 40 }} />
                                                <Box>
                                                    <Typography variant="h6" component="div">
                                                        Total Donateurs
                                                    </Typography>
                                                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                        {calculateDonorStats().totalDonors}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={2.4}>
                                    <Card sx={{ 
                                        background: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
                                        color: 'white',
                                        borderRadius: 3
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <TrendingUpIcon sx={{ fontSize: 40 }} />
                                                <Box>
                                                    <Typography variant="h6" component="div">
                                                        Montant Total
                                                    </Typography>
                                                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                        {(Number(calculateDonorStats().totalAmount) || 0).toLocaleString('fr-FR')} FCFA
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={2.4}>
                                    <Card sx={{ 
                                        background: 'linear-gradient(135deg, #f57c00 0%, #ffb74d 100%)',
                                        color: 'white',
                                        borderRadius: 3
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <ReceiptIcon sx={{ fontSize: 40 }} />
                                                <Box>
                                                    <Typography variant="h6" component="div">
                                                        Total Bons
                                                    </Typography>
                                                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                        {calculateDonorStats().totalDiscounts}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={2.4}>
                                    <Card sx={{ 
                                        background: 'linear-gradient(135deg, #7b1fa2 0%, #ba68c8 100%)',
                                        color: 'white',
                                        borderRadius: 3
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <CheckCircleIcon sx={{ fontSize: 40 }} />
                                                <Box>
                                                    <Typography variant="h6" component="div">
                                                        Bons Actifs
                                                    </Typography>
                                                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                        {calculateDonorStats().activeDiscounts}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={2.4}>
                                    <Card sx={{ 
                                        background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
                                        color: 'white',
                                        borderRadius: 3
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <ScheduleIcon sx={{ fontSize: 40 }} />
                                                <Box>
                                                    <Typography variant="h6" component="div">
                                                        En Attente
                                                    </Typography>
                                                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                        {calculateDonorStats().pendingDiscounts}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Groupes de donateurs */}
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

                            {/* Accordéons pour chaque groupe de donateur */}
                            {donorGroups.map((group) => (
                                <Accordion key={group.discountTypeId} sx={{ mb: 2, borderRadius: 2 }}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                <AccountBalanceIcon />
                                            </Avatar>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                    {group.discountTypeName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {group.totalCount} bon(s) - {group.totalAmount.toLocaleString('fr-FR')} FCFA
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                <Chip 
                                                    label={`${group.activeCount} actifs`} 
                                                    color="success" 
                                                    size="small" 
                                                />
                                                <Chip 
                                                    label={`${group.pendingCount} en attente`} 
                                                    color="warning" 
                                                    size="small" 
                                                />
                                                {getSelectedCountInGroup(group) > 0 && (
                                                    <Chip 
                                                        label={`${getSelectedCountInGroup(group)} sélectionné(s)`} 
                                                        color="info" 
                                                        size="small" 
                                                    />
                                                )}
                                                <Button
                                                    variant="contained"
                                                    startIcon={<PrintIcon />}
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        generateDonorReceipt(group);
                                                    }}
                                                    sx={{ ml: 2 }}
                                                >
                                                    Fiche Complète
                                                </Button>
                                                {getSelectedCountInGroup(group) > 0 && (
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<PrintIcon />}
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            generateSelectionReceipt(group);
                                                        }}
                                                        sx={{ ml: 1 }}
                                                        color="success"
                                                    >
                                                        Fiche Sélection
                                                    </Button>
                                                )}
                                            </Box>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {/* En-tête avec sélection globale */}
                                        <Box sx={{ mb: 2, p: 2, background: '#f5f5f5', borderRadius: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={getSelectedCountInGroup(group) === group.discounts.length}
                                                            indeterminate={getSelectedCountInGroup(group) > 0 && getSelectedCountInGroup(group) < group.discounts.length}
                                                            onChange={(e) => handleSelectAllInGroup(group, e.target.checked)}
                                                        />
                                                    }
                                                    label={`Sélectionner tous les bons (${getSelectedCountInGroup(group)}/${group.discounts.length})`}
                                                />
                                                {getSelectedCountInGroup(group) > 0 && (
                                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Montant sélectionné: {(getSelectedAmountInGroup(group) || 0).toLocaleString('fr-FR')} FCFA
                                                        </Typography>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            onClick={() => generateSelectionReceipt(group)}
                                                            color="success"
                                                        >
                                                            Générer Fiche ({getSelectedCountInGroup(group)} bon(s))
                                                        </Button>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                        
                                        <List>
                                            {group.discounts.map((discount, index) => (
                                                <React.Fragment key={discount.id}>
                                                    <ListItem>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                                                            <Checkbox
                                                                checked={selectedDiscounts[discount.id] || false}
                                                                onChange={(e) => handleDiscountSelection(discount.id, e.target.checked)}
                                                                color="primary"
                                                            />
                                                            <ListItemText
                                                                primary={
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                            {[
                                                                                discount.student_first_name,
                                                                                discount.first_name,
                                                                                discount.student_last_name,
                                                                                discount.last_name
                                                                            ]
                                                                                .filter(Boolean)
                                                                                .join(' ')
                                                                                .replace(/\s+/g, ' ')
                                                                                .trim()
                                                                            }
                                                                        </Typography>
                                                                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                                            {discount.amount.toLocaleString('fr-FR')} FCFA
                                                                        </Typography>
                                                                    </Box>
                                                                }
                                                                secondary={
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            {discount.student_registration_number || ''} - {discount.reason}
                                                                        </Typography>
                                                                        <Chip
                                                                            label={getStatusText(discount)}
                                                                            color={getStatusColor(discount)}
                                                                            size="small"
                                                                        />
                                                                    </Box>
                                                                }
                                                            />
                                                        </Box>
                                                    </ListItem>
                                                    {index < group.discounts.length - 1 && <Divider />}
                                                </React.Fragment>
                                            ))}
                                        </List>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </>
                    )}

                {/* Dialog pour créer un bon/prise en charge */}
                <Dialog open={openDiscountDialog} onClose={() => setOpenDiscountDialog(false)} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ 
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        color: 'white'
                    }}>
                        Nouveau Bon/Prise en Charge
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel shrink>Étudiant</InputLabel>
                                    <Autocomplete
                                        options={students}
                                        getOptionLabel={(option) => `${option.first_name} ${option.last_name} - ${option.registration_number}`}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Étudiant" variant="outlined" />
                                        )}
                                        value={students.find(s => s.id === Number(discountForm.student_id)) || null}
                                        onChange={(_e, value: Student | null) => {
                                            const idStr = value ? String(value.id) : '';
                                            setDiscountForm({ ...discountForm, student_id: idStr });
                                            handleStudentChange(idStr);
                                        }}
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        noOptionsText="Aucun élève trouvé"
                                        // Typage explicite pour TS
                                        disableClearable={false}
                                    />
                                </FormControl>
                            </Grid>
                            {selectedStudentInfo && (
                                <Grid item xs={12}>
                                    <Card sx={{ 
                                        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                                        borderRadius: 2,
                                        p: 2
                                    }}>
                                        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                                            Informations de l'étudiant
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="body2" color="text.secondary">Nom complet</Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {selectedStudentInfo.first_name} {selectedStudentInfo.last_name}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="body2" color="text.secondary">Matricule</Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {selectedStudentInfo.registration_number}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="body2" color="text.secondary">Classe</Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {selectedStudentInfo.class_name || 'Non assigné'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="body2" color="text.secondary">Scolarité</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                    {selectedStudentInfo.tuition_fee ? 
                                                        `${selectedStudentInfo.tuition_fee.toLocaleString('fr-FR')} FCFA` : 
                                                        'Non définie'
                                                    }
                                                </Typography>
                                                {selectedStudentInfo.is_assigned !== undefined && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {selectedStudentInfo.is_assigned ? 'Affecté' : 'Non affecté'}
                                                    </Typography>
                                                )}
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="body2" color="text.secondary">Montant dû</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                                    {selectedStudentInfo.montant_du !== undefined ? 
                                                        `${selectedStudentInfo.montant_du.toLocaleString('fr-FR')} FCFA` : 
                                                        'Calcul en cours...'
                                                    }
                                                </Typography>
                                                {selectedStudentInfo.total_paid !== undefined && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Déjà payé: {selectedStudentInfo.total_paid.toLocaleString('fr-FR')} FCFA
                                                    </Typography>
                                                )}
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="body2" color="text.secondary">Statut</Typography>
                                                <Chip 
                                                    label={selectedStudentInfo.class_name ? 'Inscrit' : 'Non inscrit'} 
                                                    color={selectedStudentInfo.class_name ? 'success' : 'warning'}
                                                    size="small"
                                                />
                                            </Grid>
                                            {selectedStudentInfo.tuition_fee_assigned !== undefined && selectedStudentInfo.tuition_fee_non_assigned !== undefined && (
                                                <Grid item xs={12}>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        Détail des montants selon affectation:
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                                        <Chip 
                                                            label={`Affecté: ${selectedStudentInfo.tuition_fee_assigned?.toLocaleString('fr-FR')} FCFA`}
                                                            color="primary"
                                                            size="small"
                                                        />
                                                        <Chip 
                                                            label={`Non affecté: ${selectedStudentInfo.tuition_fee_non_assigned?.toLocaleString('fr-FR')} FCFA`}
                                                            color="secondary"
                                                            size="small"
                                                        />
                                                    </Box>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Card>
                                </Grid>
                            )}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel shrink>Type de Réduction</InputLabel>
                                    <Autocomplete
                                        freeSolo
                                        selectOnFocus
                                        clearOnBlur
                                        handleHomeEndKeys
                                        value={
                                            discountTypes.find(type => String(type.id) === discountForm.discount_type_id) ||
                                            (discountForm.discount_type_id && typeof discountForm.discount_type_id === 'string' && !isNaN(Number(discountForm.discount_type_id)) ? null :
                                              discountForm.discount_type_id ? { inputValue: discountForm.discount_type_id, name: discountForm.discount_type_id } : null)
                                        }
                                        onChange={async (_event, newValue) => {
                                            if (typeof newValue === 'string') {
                                                const name = newValue.trim();
                                                if (name) {
                                                    setLoading(true);
                                                    try {
                                                        const token = localStorage.getItem('token');
                                                        const headers = token ? { Authorization: `Bearer ${token}` } : {};
                                                        const res = await axios.post('https://2ise-groupe.com/api/discounts/types', { name }, { headers });
                                                        await fetchData();
                                                        const created = res.data.id;
                                                        setDiscountForm({ ...discountForm, discount_type_id: String(created) });
                                                    } catch (e) {
                                                        setSnackbar({ open: true, message: 'Erreur lors de la création du type', severity: 'error' });
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }
                                            } else if (newValue && (newValue as any).inputValue) {
                                                const name = (newValue as any).inputValue.trim();
                                                if (name) {
                                                    setLoading(true);
                                                    try {
                                                        const token = localStorage.getItem('token');
                                                        const headers = token ? { Authorization: `Bearer ${token}` } : {};
                                                        const res = await axios.post('https://2ise-groupe.com/api/discounts/types', { name }, { headers });
                                                        await fetchData();
                                                        const created = res.data.id;
                                                        setDiscountForm({ ...discountForm, discount_type_id: String(created) });
                                                    } catch (e) {
                                                        setSnackbar({ open: true, message: 'Erreur lors de la création du type', severity: 'error' });
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }
                                            } else if (newValue && (newValue as DiscountType).id) {
                                                setDiscountForm({ ...discountForm, discount_type_id: String((newValue as DiscountType).id) });
                                            } else {
                                                setDiscountForm({ ...discountForm, discount_type_id: '' });
                                            }
                                        }}
                                        filterOptions={(options, params) => {
                                            const filtered = filter(options, params);
                                            const { inputValue } = params;
                                            // Suggestion de création
                                            if (
                                                inputValue !== '' &&
                                                !options.some(opt =>
                                                    'name' in opt && opt.name.toLowerCase() === inputValue.toLowerCase()
                                                )
                                            ) {
                                                filtered.push({ inputValue, name: `Créer "${inputValue}"` });
                                            }
                                            return filtered;
                                        }}
                                        options={discountTypes as (DiscountType | { inputValue: string; name: string })[]}
                                        getOptionLabel={(option) => {
                                            // Pour les suggestions de création
                                            if (typeof option === 'string') return option;
                                            if ('inputValue' in option && option.inputValue) return option.inputValue;
                                            return option.name;
                                        }}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Type de Réduction" variant="outlined" />
                                        )}
                                        isOptionEqualToValue={(option, value) => {
                                            if (!option || !value) return false;
                                            if (typeof value === 'string') return option.name === value;
                                            if ('inputValue' in value && value.inputValue) return 'inputValue' in option && option.inputValue === value.inputValue;
                                            return (option as DiscountType).id === (value as DiscountType).id;
                                        }}
                                        noOptionsText="Aucun type trouvé"
                                        disableClearable={false}
                                    />
                                </FormControl>
                            </Grid>
                            {selectedStudentInfo && discountForm.amount && discountForm.percentage && (
                                <Grid item xs={12}>
                                    <Card sx={{ 
                                        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                                        borderRadius: 2,
                                        p: 2,
                                        border: '2px solid #4caf50'
                                    }}>
                                        <Typography variant="h6" sx={{ mb: 2, color: 'success.main', fontWeight: 'bold' }}>
                                            Aperçu du calcul
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={2}>
                                                <Typography variant="body2" color="text.secondary">Scolarité initiale</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                    {selectedStudentInfo.tuition_fee?.toLocaleString('fr-FR')} FCFA
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <Typography variant="body2" color="text.secondary">Déjà payé</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                                                    {selectedStudentInfo.total_paid?.toLocaleString('fr-FR') || '0'} FCFA
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <Typography variant="body2" color="text.secondary">Montant dû</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                                    {selectedStudentInfo.montant_du?.toLocaleString('fr-FR') || '0'} FCFA
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <Typography variant="body2" color="text.secondary">Montant de la réduction</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                                    {parseFloat(discountForm.amount).toLocaleString('fr-FR')} FCFA
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <Typography variant="body2" color="text.secondary">Pourcentage</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                                                    {parseFloat(discountForm.percentage).toFixed(2)}%
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <Typography variant="body2" color="text.secondary">Reste à payer</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                                    {Math.max(0, (selectedStudentInfo.montant_du || 0) - parseFloat(discountForm.amount)).toLocaleString('fr-FR')} FCFA
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Card>
                                </Grid>
                            )}
                                                    <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                                Calcul de la réduction
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Montant de la réduction (FCFA)"
                                type="number"
                                value={discountForm.amount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                helperText={selectedStudentInfo ? 
                                        `Montant dû: ${selectedStudentInfo.montant_du?.toLocaleString('fr-FR') || '0'} FCFA`
                                        : ''}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                    label="Pourcentage de la réduction (%)"
                                type="number"
                                value={discountForm.percentage}
                                onChange={(e) => handlePercentageChange(e.target.value)}
                                helperText={selectedStudentInfo ? 
                                        `Montant dû: ${selectedStudentInfo.montant_du?.toLocaleString('fr-FR') || '0'} FCFA`
                                        : ''}
                            />
                        </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Raison de la réduction"
                                    value={discountForm.reason}
                                    onChange={(e) => setDiscountForm({ ...discountForm, reason: e.target.value })}
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Date de début"
                                    type="date"
                                    value={discountForm.start_date}
                                    onChange={(e) => setDiscountForm({ ...discountForm, start_date: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Date de fin"
                                    type="date"
                                    value={discountForm.end_date}
                                    onChange={(e) => setDiscountForm({ ...discountForm, end_date: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDiscountDialog(false)} color="secondary">Annuler</Button>
                        <Button onClick={handleCreateDiscount} variant="contained" color="primary" disabled={loading}>
                            Créer
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Dialog pour créer un type de réduction */}
                {/* ... (autres dialogs et composants éventuels) ... */}

                {/* Dialog pour la fiche de donateur */}
                <Dialog 
                    open={showDonorReceipt} 
                    onClose={() => setShowDonorReceipt(false)} 
                    maxWidth="md" 
                    fullWidth
                >
                    <DialogTitle sx={{ 
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        color: 'white'
                    }}>
                        Fiche de Donateur
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Box ref={donorReceiptRef}>
                            {donorReceiptData && (
                                <Paper sx={{ p: 3, borderRadius: 2 }}>
                                    {/* En-tête de la fiche */}
                                    <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #1976d2', pb: 2 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                                            FICHE DE DONATEUR
                                        </Typography>
                                        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                                            {donorReceiptData.donorName}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            N° {donorReceiptData.receiptNumber} - {donorReceiptData.generatedDate}
                                        </Typography>
                                    </Box>

                                    {/* Informations du donateur */}
                                    <Grid container spacing={3} sx={{ mb: 4 }}>
                                        <Grid item xs={12} md={6}>
                                            <Card sx={{ 
                                                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                                                borderRadius: 2,
                                                p: 2
                                            }}>
                                                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                                                    Informations du Donateur
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                                    Nom: {donorReceiptData.donorName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Type de prise en charge
                                                </Typography>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Card sx={{ 
                                                background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                                                borderRadius: 2,
                                                p: 2
                                            }}>
                                                <Typography variant="h6" sx={{ mb: 2, color: 'success.main', fontWeight: 'bold' }}>
                                                    Résumé Financier
                                                </Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
                                                    {donorReceiptData.totalAmount.toLocaleString('fr-FR')} FCFA
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Total de {donorReceiptData.discountCount} bon(s)
                                                </Typography>
                                            </Card>
                                        </Grid>
                                    </Grid>

                                    {/* Détail des bons */}
                                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                                        Détail des Bons de Prise en Charge
                                    </Typography>
                                    <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                        <Table>
                                            <TableHead>
                                                <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Étudiant</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Matricule</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Montant</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Raison</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Statut</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {donorReceiptData.discounts.map((discount) => (
                                                    <TableRow key={discount.id}>
                                                        <TableCell>
                                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                {[
                                                                    discount.student_first_name,
                                                                    discount.first_name,
                                                                    discount.student_last_name,
                                                                    discount.last_name
                                                                ]
                                                                    .filter(Boolean)
                                                                    .join(' ')
                                                                    .replace(/\s+/g, ' ')
                                                                    .trim()
                                                                }
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            {discount.student_registration_number || ''}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                                                {discount.amount.toLocaleString('fr-FR')} FCFA
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>{discount.reason}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={getStatusText(discount)}
                                                                color={getStatusColor(discount)}
                                                                size="small"
                                                                sx={{ fontWeight: 500 }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    {/* Résumé final */}
                                    <Box sx={{ mt: 4, p: 3, background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', borderRadius: 2 }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                    Montant Total à Payer
                                                </Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                    {donorReceiptData.totalAmount.toLocaleString('fr-FR')} FCFA
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                                    Nombre de Bons
                                                </Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                                    {donorReceiptData.discountCount}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                                                    Date de Génération
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                                                    {donorReceiptData.generatedDate}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    {/* Note de bas de page */}
                                    <Box sx={{ mt: 4, p: 2, background: '#f5f5f5', borderRadius: 2 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                            Cette fiche doit être présentée au donateur pour le règlement des prises en charge.
                                            <br />
                                            Signature du responsable: _____________________
                                        </Typography>
                                    </Box>
                                </Paper>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowDonorReceipt(false)} color="secondary">
                            Fermer
                        </Button>
                        <Button onClick={() => {}} variant="contained" startIcon={<PrintIcon />}>
                            Imprimer la Fiche
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Dialog pour la fiche de sélection */}
                <Dialog 
                    open={showSelectionReceipt} 
                    onClose={() => setShowSelectionReceipt(false)} 
                    maxWidth="md" 
                    fullWidth
                >
                    <DialogTitle sx={{ 
                        background: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
                        color: 'white'
                    }}>
                        Fiche de Donateur - Sélection Personnalisée
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Box ref={donorReceiptRef}>
                            {selectionReceiptData && (
                                <Paper sx={{ p: 3, borderRadius: 2 }}>
                                    {/* En-tête de la fiche */}
                                    <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #2e7d32', pb: 2 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
                                            FICHE DE DONATEUR - SÉLECTION
                                        </Typography>
                                        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                                            {selectionReceiptData.donorName}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            N° {selectionReceiptData.receiptNumber} - {selectionReceiptData.generatedDate}
                                        </Typography>
                                        <Chip 
                                            label={`${selectionReceiptData.discountCount} bon(s) sélectionné(s)`} 
                                            color="success" 
                                            sx={{ mt: 1 }}
                                        />
                                    </Box>

                                    {/* Informations du donateur */}
                                    <Grid container spacing={3} sx={{ mb: 4 }}>
                                        <Grid item xs={12} md={6}>
                                            <Card sx={{ 
                                                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                                                borderRadius: 2,
                                                p: 2
                                            }}>
                                                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                                                    Informations du Donateur
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                                    Nom: {selectionReceiptData.donorName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Type de prise en charge
                                                </Typography>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Card sx={{ 
                                                background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                                                borderRadius: 2,
                                                p: 2
                                            }}>
                                                <Typography variant="h6" sx={{ mb: 2, color: 'success.main', fontWeight: 'bold' }}>
                                                    Résumé Financier
                                                </Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
                                                    {selectionReceiptData.totalAmount.toLocaleString('fr-FR')} FCFA
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Total de {selectionReceiptData.discountCount} bon(s) sélectionné(s)
                                                </Typography>
                                            </Card>
                                        </Grid>
                                    </Grid>

                                    {/* Détail des bons */}
                                    <Typography variant="h6" sx={{ mb: 2, color: 'success.main', fontWeight: 'bold' }}>
                                        Détail des Bons Sélectionnés
                                    </Typography>
                                    <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                        <Table>
                                            <TableHead>
                                                <TableRow sx={{ backgroundColor: 'success.main' }}>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Étudiant</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Matricule</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Montant</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Raison</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Statut</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {selectionReceiptData.discounts.map((discount) => (
                                                    <TableRow key={discount.id}>
                                                        <TableCell>
                                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                {[
                                                                    discount.student_first_name,
                                                                    discount.first_name,
                                                                    discount.student_last_name,
                                                                    discount.last_name
                                                                ]
                                                                    .filter(Boolean)
                                                                    .join(' ')
                                                                    .replace(/\s+/g, ' ')
                                                                    .trim()
                                                                }
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            {discount.student_registration_number || ''}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                                                {discount.amount.toLocaleString('fr-FR')} FCFA
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>{discount.reason}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={getStatusText(discount)}
                                                                color={getStatusColor(discount)}
                                                                size="small"
                                                                sx={{ fontWeight: 500 }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    {/* Résumé final */}
                                    <Box sx={{ mt: 4, p: 3, background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', borderRadius: 2 }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                                    Montant Total à Payer
                                                </Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                                    {selectionReceiptData.totalAmount.toLocaleString('fr-FR')} FCFA
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                    Nombre de Bons
                                                </Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                    {selectionReceiptData.discountCount}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                                                    Date de Génération
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                                                    {selectionReceiptData.generatedDate}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    {/* Note de bas de page */}
                                    <Box sx={{ mt: 4, p: 2, background: '#f5f5f5', borderRadius: 2 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                            Cette fiche contient uniquement les bons sélectionnés pour le règlement.
                                            <br />
                                            Signature du responsable: _____________________
                                        </Typography>
                                    </Box>
                                </Paper>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowSelectionReceipt(false)} color="secondary">
                            Fermer
                        </Button>
                        <Button onClick={() => {}} variant="contained" startIcon={<PrintIcon />}>
                            Imprimer la Fiche
                        </Button>
                    </DialogActions>
                </Dialog>
            </Paper>
            </Container>
        </Box>
    );
};

export default Discounts; 