import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  School as SchoolIcon,
  Class as ClassIcon,
  Download as DownloadIcon,
  TableChart as TableChartIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import axios from 'axios';
import SecretarySidebar from '../../components/SecretarySidebar';

interface Level {
  id: number;
  name: string;
  description?: string;
}

interface Class {
  id: number;
  name: string;
  level_id: number;
  level_name: string;
}

interface SchoolYear {
  id: number;
  year: string;
  name?: string;
  is_active: boolean;
}

interface Trimester {
  id: number;
  name: string;
  school_year: string;
}

interface StudentData {
  matricule: string;
  first_name: string;
  last_name: string;
  average: number;
  rank: number;
}

const ExcelFiles: React.FC = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [trimesters, setTrimesters] = useState<Trimester[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<SchoolYear | null>(null);
  const [selectedTrimester, setSelectedTrimester] = useState<Trimester | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [loadingSchoolYears, setLoadingSchoolYears] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'levels' | 'classes' | 'students'>('levels');

  // Charger les niveaux au montage du composant
  useEffect(() => {
    fetchLevels();
    fetchSchoolYears();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('https://2ise-groupe.com/api/levels', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLevels(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des niveaux:', error);
      setError('Erreur lors du chargement des niveaux');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async (level: Level) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`https://2ise-groupe.com/api/classes?level_id=${level.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setClasses(response.data);
      setSelectedLevel(level);
      setCurrentView('classes');
      
      // Récupérer aussi les trimestres
      await fetchTrimesters();
    } catch (error) {
      console.error('Erreur lors du chargement des classes:', error);
      setError('Erreur lors du chargement des classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolYears = async () => {
    try {
      setLoadingSchoolYears(true);
      const token = localStorage.getItem('token');
      
      // Récupérer les années scolaires depuis les enrollments
      const response = await axios.get('https://2ise-groupe.com/api/classes/school-years/available', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('School years from enrollments:', response.data);
      setSchoolYears(response.data);
      setError(null);
    } catch (error) {
      console.error('Erreur lors du chargement des années scolaires:', error);
      // Si l'endpoint n'existe pas, utiliser des années par défaut
      const defaultYears = [
        { id: 1, year: '2024-2025', name: '2024-2025', is_active: true },
        { id: 2, year: '2023-2024', name: '2023-2024', is_active: false }
      ];
      setSchoolYears(defaultYears);
      setError('Utilisation des années scolaires par défaut');
    } finally {
      setLoadingSchoolYears(false);
    }
  };

  const fetchTrimesters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://2ise-groupe.com/api/trimesters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrimesters(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des trimestres:', error);
      // Utiliser des trimestres par défaut
      const defaultTrimesters = [
        { id: 1, name: '1er trimestre', school_year: '2024-2025' },
        { id: 3, name: '2 ème trimestre', school_year: '2024-2025' },
        { id: 4, name: '3 ème trimestre', school_year: '2024-2025' }
      ];
      setTrimesters(defaultTrimesters);
    }
  };

  const fetchStudentsData = async (classItem: Class, schoolYear: SchoolYear, trimester: Trimester) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log('=== DEBUG fetchStudentsData ===');
      console.log('classItem:', classItem);
      console.log('schoolYear:', schoolYear);
      console.log('trimester:', trimester);
      
      const response = await axios.get(`https://2ise-groupe.com/api/classes/${classItem.id}/students-grades`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          school_year: schoolYear.name || schoolYear.year, // Utiliser le nom de l'année scolaire
          trimester: trimester.id // Utiliser l'ID du trimestre
        }
      });
      
      console.log('Response data:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Is array:', Array.isArray(response.data));
      
      // S'assurer que nous avons un tableau
      const studentsData = Array.isArray(response.data) ? response.data : [];
      
      // Debug: vérifier la structure des données
      if (studentsData.length > 0) {
        console.log('First student data:', studentsData[0]);
        console.log('Average type:', typeof studentsData[0].average);
        console.log('Average value:', studentsData[0].average);
      }
      
      setStudents(studentsData);
      setSelectedClass(classItem);
      setSelectedSchoolYear(schoolYear);
      setSelectedTrimester(trimester);
      setCurrentView('students');
      
      if (studentsData.length === 0) {
        setError('Aucun élève trouvé pour cette classe et ce trimestre');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données des étudiants:', error);
      setError('Erreur lors du chargement des données des étudiants');
      setStudents([]); // S'assurer que students reste un tableau vide
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    const studentsArray = Array.isArray(students) ? students : [];
    
    if (studentsArray.length === 0) {
      setError('Aucune donnée à télécharger');
      return;
    }

    try {
      // Créer un titre pour le fichier
      const title = `Moyenne et rang des élèves de ${selectedClass?.name} - ${selectedTrimester?.name} (${selectedSchoolYear?.year || selectedSchoolYear?.name})`;
      
      // Créer un nouveau workbook
      const wb = XLSX.utils.book_new();
      
      // Créer une feuille vide
      const ws = XLSX.utils.aoa_to_sheet([]);
      
      // Ajouter le titre en A1
      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' });
      
      // Ajouter une ligne vide
      XLSX.utils.sheet_add_aoa(ws, [['']], { origin: 'A2' });
      
      // Ajouter les en-têtes en A3
      XLSX.utils.sheet_add_aoa(ws, [['N°', 'Matricule', 'Nom', 'Prénom', 'Moyenne', 'Rang']], { origin: 'A3' });
      
      // Préparer les données des étudiants
      const studentData = studentsArray.map((student, index) => [
        index + 1,
        student.matricule,
        student.last_name,
        student.first_name,
        Number(student.average || 0).toFixed(2),
        student.rank
      ]);
      
      // Ajouter les données des étudiants à partir de la ligne 4
      XLSX.utils.sheet_add_aoa(ws, studentData, { origin: 'A4' });

      // Fusionner les cellules pour le titre (A1:F1)
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } } // Fusionner A1:F1 pour le titre
      ];

      // Définir la largeur des colonnes
      ws['!cols'] = [
        { wch: 5 },   // N°
        { wch: 15 },  // Matricule
        { wch: 20 },  // Nom
        { wch: 20 },  // Prénom
        { wch: 12 },  // Moyenne
        { wch: 8 }    // Rang
      ];

      // Style pour le titre (centré et en gras)
      if (ws['A1']) {
        ws['A1'].s = {
          font: { bold: true, size: 14 },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      // Style pour les en-têtes (en gras)
      if (ws['A3']) {
        ws['A3'].s = { font: { bold: true } };
        ws['B3'].s = { font: { bold: true } };
        ws['C3'].s = { font: { bold: true } };
        ws['D3'].s = { font: { bold: true } };
        ws['E3'].s = { font: { bold: true } };
        ws['F3'].s = { font: { bold: true } };
      }

      // Ajouter la feuille au workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Étudiants');

      // Générer le nom du fichier
      const fileName = `Moyenne_et_rang_des_élèves_${selectedClass?.name}_${selectedSchoolYear?.year || selectedSchoolYear?.name}_${selectedTrimester?.name}.xlsx`;

      // Télécharger le fichier
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Erreur lors de la génération du fichier Excel:', error);
      setError('Erreur lors de la génération du fichier Excel');
    }
  };

  const goBack = () => {
    if (currentView === 'students') {
      setCurrentView('classes');
      setStudents([]);
    } else if (currentView === 'classes') {
      setCurrentView('levels');
      setClasses([]);
      setSelectedLevel(null);
    }
  };

  const resetAll = () => {
    setSelectedLevel(null);
    setSelectedClass(null);
    setSelectedSchoolYear(null);
    setSelectedTrimester(null);
    setStudents([]);
    setClasses([]);
    setCurrentView('levels');
    setError(null);
  };

  const renderBreadcrumbs = () => (
    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
      <Link
        component="button"
        variant="body1"
        onClick={() => setCurrentView('levels')}
        sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
      >
        <HomeIcon sx={{ mr: 0.5 }} />
        Niveaux
      </Link>
      {selectedLevel && (
        <Link
          component="button"
          variant="body1"
          onClick={() => setCurrentView('classes')}
          sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <SchoolIcon sx={{ mr: 0.5 }} />
          {selectedLevel.name}
        </Link>
      )}
      {selectedClass && (
        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
          <ClassIcon sx={{ mr: 0.5 }} />
          {selectedClass.name}
        </Typography>
      )}
    </Breadcrumbs>
  );

  const renderLevels = () => (
    <Grid container spacing={3}>
      {levels.map((level) => (
        <Grid item xs={12} sm={6} md={4} key={level.id}>
          <Card 
            sx={{ 
              cursor: 'pointer', 
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}
            onClick={() => fetchClasses(level)}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <SchoolIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" component="h2" gutterBottom>
                {level.name}
              </Typography>
              {level.description && (
                <Typography variant="body2" color="text.secondary">
                  {level.description}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderClasses = () => (
    <Box>
      {/* Filtres */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtres
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Année Scolaire</InputLabel>
              <Select
                value={selectedSchoolYear?.id || ''}
                onChange={(e) => {
                  const schoolYear = schoolYears.find(sy => sy.id === e.target.value);
                  setSelectedSchoolYear(schoolYear || null);
                }}
                label="Année Scolaire"
              >
                {schoolYears.map((year) => (
                  <MenuItem key={year.id} value={year.id}>
                    {year.name || year.year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Trimestre</InputLabel>
              <Select
                value={selectedTrimester?.id || ''}
                onChange={(e) => {
                  const trimester = trimesters.find(t => t.id === e.target.value);
                  setSelectedTrimester(trimester || null);
                }}
                label="Trimestre"
              >
                {trimesters.map((trimester) => (
                  <MenuItem key={trimester.id} value={trimester.id}>
                    {trimester.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Classes */}
      <Grid container spacing={3}>
        {classes.map((classItem) => (
          <Grid item xs={12} sm={6} md={4} key={classItem.id}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                transition: 'all 0.3s ease',
                '&:hover': { 
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => {
                if (selectedSchoolYear && selectedTrimester) {
                  fetchStudentsData(classItem, selectedSchoolYear, selectedTrimester);
                } else {
                  setError('Veuillez sélectionner une année scolaire et un trimestre');
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <ClassIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h6" component="h2" gutterBottom>
                  {classItem.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {classItem.level_name}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderStudents = () => {
    // S'assurer que students est un tableau
    const studentsArray = Array.isArray(students) ? students : [];
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Élèves de {selectedClass?.name} - {selectedTrimester?.name}
          </Typography>
          <Button
            variant="contained"
            onClick={downloadExcel}
            disabled={studentsArray.length === 0}
            startIcon={<DownloadIcon />}
          >
            Télécharger Excel
          </Button>
        </Box>

        {studentsArray.length === 0 ? (
          <Alert severity="info">
            Aucun élève trouvé pour cette classe et ce trimestre.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>N°</TableCell>
                  <TableCell>Matricule</TableCell>
                  <TableCell>Nom</TableCell>
                  <TableCell>Prénom</TableCell>
                  <TableCell align="center">Moyenne</TableCell>
                  <TableCell align="center">Rang</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentsArray.map((student, index) => (
                  <TableRow key={student.matricule}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{student.matricule}</TableCell>
                    <TableCell>{student.last_name}</TableCell>
                    <TableCell>{student.first_name}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={Number(student.average || 0).toFixed(2)} 
                        color={Number(student.average || 0) >= 10 ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={student.rank} 
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <SecretarySidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: '250px' }}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <TableChartIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h4" component="h1">
              Gestion des Fichiers Excel
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {renderBreadcrumbs()}

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            {currentView !== 'levels' && (
              <Button
                variant="outlined"
                onClick={goBack}
                startIcon={<NavigateNextIcon sx={{ transform: 'rotate(180deg)' }} />}
              >
                Retour
              </Button>
            )}
            <Button
              variant="text"
              onClick={resetAll}
              color="secondary"
            >
              Réinitialiser
            </Button>
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && currentView === 'levels' && renderLevels()}
          {!loading && currentView === 'classes' && renderClasses()}
          {!loading && currentView === 'students' && renderStudents()}
        </Paper>
      </Box>
    </Box>
  );
};

export default ExcelFiles;