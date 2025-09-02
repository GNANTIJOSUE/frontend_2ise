import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Select, MenuItem, InputLabel, FormControl,
  Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  CircularProgress, Stack, Avatar, Chip, Card, CardContent
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Male, Female } from '@mui/icons-material';
import PrintIcon from '@mui/icons-material/Print';
import SecretarySidebar from '../components/SecretarySidebar';
import { usePermissions } from '../hooks/usePermissions';

// Interfaces
interface Student {
  id: number;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  city: string; // for 'quartier'
  classe: string; // class name
  class_id: number;
  level_name?: string; // nom du niveau
  moyenne?: number;
  registration_number?: string;
  is_assigned?: number; // 0 ou 1
}

interface Classe {
    id: number;
    name: string;
    level?: string;
}

interface Level {
    id: number;
    name: string;
    display_name: string;
}

const GestionEleves = () => {
    const { hasPermission } = usePermissions();
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Classe[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        class_id: '',
        level: '',
        gender: '',
        age: '',
        quartier: ''
    });
    const [dynamicTitle, setDynamicTitle] = useState('Liste de tous les élèves');
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

    const fetchStudents = async (currentFilters = filters) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const params = {
                class_id: currentFilters.class_id || undefined,
                level: currentFilters.level || undefined,
                gender: currentFilters.gender || undefined,
                age_range: currentFilters.age || undefined,
                quartier: currentFilters.quartier || undefined,
                school_year: schoolYear
            };
            const response = await axios.get('https://2ise-groupe.com/api/students/list', { headers, params });
            console.log('Données brutes des étudiants reçues:', response.data);
            setStudents(response.data);
        } catch (error) {
            console.error("Erreur lors du filtrage des étudiants:", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        let isMounted = true;
        
        const fetchInitialData = async () => {
            if (!isMounted) return;
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };
                
                const classesPromise = axios.get('https://2ise-groupe.com/api/classes/list', { headers });
                const levelsPromise = axios.get('https://2ise-groupe.com/api/levels', { headers });
                const studentsPromise = axios.get('https://2ise-groupe.com/api/students/list', { headers, params: { school_year: schoolYear } });
                
                const [classesRes, levelsRes, studentsRes] = await Promise.all([classesPromise, levelsPromise, studentsPromise]);

                if (isMounted) {
                    setClasses(classesRes.data);
                    setLevels(levelsRes.data);
                    setStudents(studentsRes.data);
                }

            } catch (error) {
                console.error("Erreur lors de la récupération des données:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchInitialData();
        
        return () => {
            isMounted = false;
        };
    }, [schoolYear]);

    useEffect(() => {
        let isMounted = true;
        
        let title = 'Liste des élèves';
        const activeFilters: string[] = [];
    
        if (filters.class_id) {
            const className = classes.find(c => c.id === Number(filters.class_id))?.name;
            if (className) activeFilters.push(`de la classe ${className}`);
        }
        if (filters.level) {
            const levelName = levels.find(l => l.id === Number(filters.level))?.display_name;
            if (levelName) activeFilters.push(`du niveau ${levelName}`);
        }
        if (filters.gender) {
            activeFilters.push(filters.gender === 'Masculin' ? 'hommes' : 'femmes');
        }
        if (filters.age) {
            activeFilters.push(filters.age === 'majeur' ? 'majeurs' : 'mineurs');
        }
        if (filters.quartier) {
            activeFilters.push(`du quartier "${filters.quartier}"`);
        }
    
        const hasActiveFilters = filters.class_id || filters.level || filters.gender || filters.age || filters.quartier;

        if (activeFilters.length > 0) {
            title = `Résultats pour les élèves ${activeFilters.join(' et ')}`;
        }
    
        if (students.length === 0 && hasActiveFilters) {
            title = `Aucun élève ne correspond à votre recherche`;
        } else if (!hasActiveFilters) {
            title = 'Liste de tous les élèves';
        }
    
        if (isMounted) setDynamicTitle(title);
        
        return () => {
            isMounted = false;
        };
    }, [filters, students, classes]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name!]: value as string }));
    };

    const handleSearch = () => {
        fetchStudents(filters);
    };

    const resetFilters = () => {
      const initialFilters = { class_id: '', level: '', gender: '', age: '', quartier: '' };
      setFilters(initialFilters);
      fetchStudents(initialFilters);
    }

    const calculateAge = (dob: string): number | null => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        if (isNaN(birthDate.getTime()) || birthDate > today) {
            return null;
        }
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const summaryStats = useMemo(() => {
        const boys = students.filter(s => {
            if (!s.gender) return false;
            const gender = s.gender.toLowerCase().trim();
            return ['masculin', 'm', 'homme'].includes(gender);
        }).length;
        const girls = students.filter(s => {
            if (!s.gender) return false;
            const gender = s.gender.toLowerCase().trim();
            return ['féminin', 'f', 'femme'].includes(gender);
        }).length;

        // Ajout : calcul des affectés
        const assignedBoys = students.filter(s => {
            if (!s.gender || s.is_assigned !== 1) return false;
            const gender = s.gender.toLowerCase().trim();
            return ['masculin', 'm', 'homme'].includes(gender);
        }).length;
        const assignedGirls = students.filter(s => {
            if (!s.gender || s.is_assigned !== 1) return false;
            const gender = s.gender.toLowerCase().trim();
            return ['féminin', 'f', 'femme'].includes(gender);
        }).length;

        return {
            total: students.length,
            boys,
            girls,
            assignedBoys,
            assignedGirls,
        };
    }, [students]);

    const getGenderDisplay = (genderStr?: string) => {
        if (!genderStr) return null;
        const gender = genderStr.toLowerCase().trim();

        if (['masculin', 'm', 'homme'].includes(gender)) {
            return { label: 'H', icon: <Male fontSize="small" />, color: 'info' as 'info' };
        }
        if (['féminin', 'f', 'femme'].includes(gender)) {
            return { label: 'F', icon: <Female fontSize="small" />, color: 'secondary' as 'secondary' };
        }
        return null;
    };

    const handlePrint = () => {
        window.print();
    };

    // Vérification des permissions après tous les hooks
    if (!hasPermission('canViewStudents')) {
        return (
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <SecretarySidebar />
                <Box sx={{ p: 3, flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="h5" color="error">
                        Accès refusé - Vous n'avez pas la permission de consulter les élèves
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <div className="no-print-sidebar">
            <SecretarySidebar />
            </div>
            <Box sx={{ p: 3, flexGrow: 1, bgcolor: '#f4f6f8' }} className="print-content">
                <style>
                    {`
                        @media print {
                            * {
                                -webkit-print-color-adjust: exact !important;
                                color-adjust: exact !important;
                            }
                            
                            body {
                                margin: 0 !important;
                                padding: 0 !important;
                                width: 100% !important;
                            }
                            
                            /* Masquer les éléments non imprimables */
                            .no-print, 
                            .no-print-table {
                                display: none !important;
                            }
                            
                            /* Masquer la sidebar */
                            .no-print-sidebar {
                                display: none !important;
                            }
                            
                            /* Afficher la table d'impression */
                            .print-table {
                                display: table !important;
                                width: 100% !important;
                                font-size: 12px !important;
                                border-collapse: collapse !important;
                                margin-top: 20px !important;
                            }
                            
                            .print-table th,
                            .print-table td {
                                padding: 8px 4px !important;
                                border: 1px solid black !important;
                                background: white !important;
                                color: black !important;
                                text-align: left !important;
                                vertical-align: middle !important;
                            }
                            
                            .print-table th {
                                background: #f0f0f0 !important;
                                font-weight: bold !important;
                                text-align: center !important;
                            }
                            
                            /* Titre d'impression */
                            .print-header {
                                margin-bottom: 20px !important;
                                text-align: center !important;
                                font-size: 18px !important;
                                font-weight: bold !important;
                                color: black !important;
                                display: block !important;
                            }
                            
                            /* Statistiques d'impression */
                            .print-stats {
                                margin-top: 20px !important;
                                text-align: center !important;
                                font-weight: bold !important;
                                font-size: 14px !important;
                                color: black !important;
                                display: block !important;
                            }
                            
                            /* Forcer l'affichage du contenu principal */
                            .print-content {
                                width: 100% !important;
                                margin: 0 !important;
                                padding: 20px !important;
                                background: white !important;
                                display: block !important;
                            }
                            
                            [class*="MuiBox-root"]:last-child {
                                width: 100% !important;
                                margin: 0 !important;
                                padding: 20px !important;
                                background: white !important;
                                display: block !important;
                            }
                        }
                    `}
                </style>
                
                {/* Interface utilisateur - masquée à l'impression */}
                <div className="no-print">
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Gestion des Élèves
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Button 
                            variant="contained" 
                            startIcon={<PrintIcon />}
                            onClick={handlePrint}
                        >
                            Imprimer la liste
                        </Button>
                        <Button 
                            variant="outlined" 
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate('/secretary/dashboard')}
                        >
                            Retour
                        </Button>
                    </Stack>
                </Stack>

                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6">Année scolaire :</Typography>
                    <FormControl size="small">
                        <Select value={schoolYear} onChange={e => setSchoolYear(e.target.value)}>
                            {(() => {
                                // Générer les 5 dernières années scolaires en utilisant la même logique
                                const currentYear = parseInt(schoolYear.split('-')[0]);
                                return Array.from({ length: 5 }, (_, i) => {
                                    const startYear = currentYear - i;
                                    const label = `${startYear}-${startYear + 1}`;
                                    return <MenuItem key={label} value={label}>{label}</MenuItem>;
                                });
                            })()}
                        </Select>
                    </FormControl>
                </Box>

                    <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6} md={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Niveau</InputLabel>
                                    <Select name="level" value={filters.level} label="Niveau" onChange={handleFilterChange as any}>
                                        <MenuItem value=""><em>Tous</em></MenuItem>
                                        {levels.map(l => <MenuItem key={l.id} value={l.id}>{l.display_name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Classe</InputLabel>
                                    <Select name="class_id" value={filters.class_id} label="Classe" onChange={handleFilterChange as any}>
                                        <MenuItem value=""><em>Toutes</em></MenuItem>
                                        {classes
                                            .filter(c => !filters.level || c.level === levels.find(l => l.id === Number(filters.level))?.name)
                                            .map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Genre</InputLabel>
                                    <Select name="gender" value={filters.gender} label="Genre" onChange={handleFilterChange as any}>
                                        <MenuItem value=""><em>Tous</em></MenuItem>
                                        <MenuItem value="Masculin">Hommes</MenuItem>
                                        <MenuItem value="Féminin">Femmes</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6} md={1.5}>
                                <FormControl fullWidth>
                                    <InputLabel>Âge</InputLabel>
                                    <Select name="age" value={filters.age} label="Âge" onChange={handleFilterChange as any}>
                                        <MenuItem value=""><em>Tous</em></MenuItem>
                                        <MenuItem value="majeur">Majeur (18+)</MenuItem>
                                        <MenuItem value="mineur">Mineur (&lt;18)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} md={3}>
                                <Stack direction="row" spacing={1}>
                                    <Button variant="contained" onClick={handleSearch}>Rechercher</Button>
                                    <Button variant="outlined" onClick={resetFilters}>Réinitialiser</Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
                </div>
                
                {/* Titre pour l'impression */}
                <Typography variant="h6" sx={{ mb: 2, fontWeight: '500' }} className="print-header">
                    {dynamicTitle}
                </Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
                                 ) : (
                     <Paper sx={{ overflow: 'hidden', borderRadius: 2, boxShadow: 1 }} className="printable-area">
                         {/* Table pour l'écran */}
                         <TableContainer sx={{ maxHeight: '60vh' }} className="no-print-table">
                            <Table stickyHeader>
                                 <TableHead>
                                    <TableRow sx={{ '& .MuiTableCell-root': { bgcolor: 'primary.dark', color: 'white', fontWeight: '600' } }}>
                                         <TableCell>Matricule</TableCell>
                                         <TableCell>Élève</TableCell>
                                         <TableCell>Niveau</TableCell>
                                         <TableCell>Classe</TableCell>
                                         <TableCell>Genre</TableCell>
                                         <TableCell>Âge</TableCell>
                                         <TableCell>Ville</TableCell>
                                     </TableRow>
                                 </TableHead>
                                 <TableBody>
                                     {students.map(student => {
                                         const studentAge = calculateAge(student.date_of_birth);
                                         const genderDisplay = getGenderDisplay(student.gender);

                                         return (
                                             <TableRow 
                                                 key={student.id} 
                                                 hover 
                                                 sx={{
                                                     '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' },
                                                     '&:last-child td, &:last-child th': { border: 0 },
                                                     cursor: 'pointer'
                                                 }}
                                                 onClick={() => navigate(`/secretary/student-details/${student.id}`)}
                                             >
                                                 <TableCell>{student.registration_number || 'N/A'}</TableCell>
                                                 <TableCell>
                                                     <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>{student.first_name?.[0]}{student.last_name?.[0]}</Avatar>
                                                        {student.first_name} {student.last_name}
                                                     </Box>
                                                 </TableCell>
                                                 <TableCell>{student.level_name || 'N/A'}</TableCell>
                                                 <TableCell>{student.classe || 'N/A'}</TableCell>
                                                 <TableCell>
                                                         {genderDisplay ? (
                                                             <Chip
                                                                 icon={genderDisplay.icon}
                                                                 label={genderDisplay.label}
                                                                 color={genderDisplay.color}
                                                                 size="small"
                                                                 variant="outlined"
                                                             />
                                                         ) : 'N/A'}
                                                 </TableCell>
                                                 <TableCell>{studentAge !== null ? studentAge : 'N/A'}</TableCell>
                                                 <TableCell>{student.city}</TableCell>
                                             </TableRow>
                                         );
                                     })}
                                 </TableBody>
                             </Table>
                         </TableContainer>
                         
                                                 {/* Table pour l'impression - visible uniquement à l'impression */}
                         <Table className="print-table" sx={{ display: 'none', width: '100%', border: '1px solid black' }}>
                             <TableHead>
                                 <TableRow>
                                     <TableCell>Matricule</TableCell>
                                     <TableCell>Nom</TableCell>
                                     <TableCell>Prénom</TableCell>
                                     <TableCell>Lieu de naissance</TableCell>
                                     <TableCell>Statut</TableCell>
                                 </TableRow>
                             </TableHead>
                             <TableBody>
                                 {students.map(student => {
                                     return (
                                         <TableRow key={`print-${student.id}`}>
                                             <TableCell>{student.registration_number || 'N/A'}</TableCell>
                                             <TableCell>{student.last_name || 'N/A'}</TableCell>
                                             <TableCell>{student.first_name || 'N/A'}</TableCell>
                                             <TableCell>{student.city || 'N/A'}</TableCell>
                                             <TableCell>{student.is_assigned === 1 ? 'Affecté' : 'Non affecté'}</TableCell>
                                         </TableRow>
                                     );
                                 })}
                             </TableBody>
                         </Table>
                        
                        {/* Statistiques */}
                         <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#f5f5f5' }} className="print-stats">
                            <Typography variant="body1">Total: <strong>{summaryStats.total}</strong></Typography>
                            {filters.gender !== 'Masculin' && <Typography variant="body1">Garçons: <strong>{summaryStats.boys}</strong></Typography>}
                            {filters.gender !== 'Féminin' && <Typography variant="body1">Filles: <strong>{summaryStats.girls}</strong></Typography>}
                            <Typography variant="body1">Affectés - Garçons: <strong>{summaryStats.assignedBoys}</strong></Typography>
                            <Typography variant="body1">Affectées - Filles: <strong>{summaryStats.assignedGirls}</strong></Typography>
                        </Box>
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

export default GestionEleves; 