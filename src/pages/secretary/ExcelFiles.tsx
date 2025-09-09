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
  NavigateNext as NavigateNextIcon,
  BarChart as BarChartIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
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

interface SubjectGrade {
  subject_name: string;
  average: number;
  coefficient: number;
  weighted_average: number;
  rank: number;
  category: 'LITTÉRAIRES' | 'SCIENTIFIQUES' | 'AUTRES';
}

interface StudentData {
  matricule: string;
  first_name: string;
  last_name: string;
  average: number;
  rank: number;
  subjects?: SubjectGrade[];
  total_coefficient?: number;
  total_weighted_average?: number;
}

const ExcelFiles: React.FC = () => {
  const [searchParams] = useSearchParams();
  const exportType = searchParams.get('type') as 'moyennes' | 'recap' | null;
  
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
      console.log('exportType:', exportType);
      
      // Préparer les paramètres de filtrage selon l'endpoint
      const params: any = {
        school_year: schoolYear.name || schoolYear.year
      };
      
      // Pour l'endpoint des moyennes détaillées, utiliser trimester_id
      // Pour l'endpoint simple, utiliser trimester
      if (exportType === 'moyennes') {
        params.trimester_id = trimester.id;
        params.trimester_name = trimester.name;
      } else {
        params.trimester = trimester.id;
      }
      
      console.log('API Parameters:', params);
      console.log('Export Type:', exportType);
      
      // Choisir l'endpoint selon le type d'exportation
      const endpoint = exportType === 'moyennes' 
        ? `https://2ise-groupe.com/api/classes/${classItem.id}/students-detailed-grades`
        : `https://2ise-groupe.com/api/classes/${classItem.id}/students-grades`;
      
      console.log('API Endpoint:', endpoint);
      console.log('Parameters for endpoint:', {
        school_year: params.school_year,
        trimester: exportType === 'moyennes' ? params.trimester_id : params.trimester,
        trimester_id: params.trimester_id,
        trimester_name: params.trimester_name
      });
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params: params
      });
      
      console.log('Response data:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Is array:', Array.isArray(response.data));
      
      // S'assurer que nous avons un tableau
      let studentsData = Array.isArray(response.data) ? response.data : [];
      
      // Filtrer les données par année scolaire et trimestre si nécessaire
      if (studentsData.length > 0) {
        // Vérifier si les données contiennent des informations de filtrage
        studentsData = studentsData.filter(student => {
          // Si l'étudiant a des informations de période, les vérifier
          if (student.school_year && student.trimester_id) {
            return student.school_year === (schoolYear.name || schoolYear.year) && 
                   student.trimester_id === trimester.id;
          }
          // Sinon, considérer que les données sont déjà filtrées par l'API
          return true;
        });
      }
      
      // Les données sont maintenant récupérées dynamiquement depuis l'API
      // Plus besoin de données mockées
      
      // Debug: vérifier la structure des données
      if (studentsData.length > 0) {
        console.log('Filtered students count:', studentsData.length);
        console.log('First student data:', studentsData[0]);
        console.log('Has subjects:', !!studentsData[0].subjects);
        if (studentsData[0].subjects) {
          console.log('First subject:', studentsData[0].subjects[0]);
        }
      }
      
      setStudents(studentsData);
      setSelectedClass(classItem);
      setSelectedSchoolYear(schoolYear);
      setSelectedTrimester(trimester);
      setCurrentView('students');
      
      if (studentsData.length === 0) {
        setError(`Aucun élève trouvé pour la classe ${classItem.name}, l'année scolaire ${schoolYear.name || schoolYear.year} et le ${trimester.name}`);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des données des étudiants:', error);
      console.error('Error details:', error.response?.data);
      setError(`Erreur lors du chargement des données pour ${classItem.name} - ${schoolYear.name || schoolYear.year} - ${trimester.name}`);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour calculer les totaux par catégorie
  const calculateCategoryTotals = (subjects: SubjectGrade[]) => {
    const categories = {
      'LITTÉRAIRES': { total_coefficient: 0, total_weighted: 0, count: 0 },
      'SCIENTIFIQUES': { total_coefficient: 0, total_weighted: 0, count: 0 },
      'AUTRES': { total_coefficient: 0, total_weighted: 0, count: 0 }
    };

    subjects.forEach(subject => {
      const cat = subject.category;
      categories[cat].total_coefficient += Number(subject.coefficient || 0);
      categories[cat].total_weighted += Number(subject.weighted_average || 0);
      categories[cat].count += 1;
    });

    return categories;
  };

  // Fonction pour calculer les rangs des catégories
  const calculateCategoryRanks = (students: StudentData[]) => {
    const categoryRanks = {
      'LITTÉRAIRES': new Map<string, number>(),
      'SCIENTIFIQUES': new Map<string, number>(),
      'AUTRES': new Map<string, number>()
    };

    // Calculer les moyennes par catégorie pour chaque étudiant
    const studentCategoryAverages = students.map(student => {
      const categories = calculateCategoryTotals(student.subjects || []);
      return {
        studentId: student.matricule,
        averages: {
          'LITTÉRAIRES': categories.LITTÉRAIRES.total_coefficient > 0 
            ? categories.LITTÉRAIRES.total_weighted / categories.LITTÉRAIRES.total_coefficient 
            : 0,
          'SCIENTIFIQUES': categories.SCIENTIFIQUES.total_coefficient > 0 
            ? categories.SCIENTIFIQUES.total_weighted / categories.SCIENTIFIQUES.total_coefficient 
            : 0,
          'AUTRES': categories.AUTRES.total_coefficient > 0 
            ? categories.AUTRES.total_weighted / categories.AUTRES.total_coefficient 
            : 0
        }
      };
    });

    // Calculer les rangs pour chaque catégorie
    (['LITTÉRAIRES', 'SCIENTIFIQUES', 'AUTRES'] as const).forEach(category => {
      // Trier les étudiants par moyenne décroissante pour cette catégorie
      const sortedStudents = studentCategoryAverages
        .filter(s => s.averages[category] > 0) // Seulement ceux qui ont des notes dans cette catégorie
        .sort((a, b) => b.averages[category] - a.averages[category]);

      // Assigner les rangs
      sortedStudents.forEach((student, index) => {
        categoryRanks[category].set(student.studentId, index + 1);
      });
    });

    return categoryRanks;
  };

  const downloadExcel = () => {
    const studentsArray = Array.isArray(students) ? students : [];
    
    if (studentsArray.length === 0) {
      setError('Aucune donnée à télécharger');
      return;
    }
  
    try {
      // Créer un nouveau workbook
      const wb = XLSX.utils.book_new();
      
      if (exportType === 'moyennes') {
        // Pour l'export des moyennes détaillées, créer une feuille par étudiant
        console.log('Nombre d\'étudiants à traiter:', studentsArray.length);
        console.log('Étudiants:', studentsArray.map(s => `${s.last_name} ${s.first_name}`));
        
        studentsArray
          .sort((a, b) => {
            const lastNameA = (a.last_name || '').trim().toLowerCase();
            const lastNameB = (b.last_name || '').trim().toLowerCase();
            const firstNameA = (a.first_name || '').trim().toLowerCase();
            const firstNameB = (b.first_name || '').trim().toLowerCase();
            
            if (lastNameA < lastNameB) return -1;
            if (lastNameA > lastNameB) return 1;
            if (firstNameA < firstNameB) return -1;
            if (firstNameA > firstNameB) return 1;
            return 0;
          })
          .forEach((student, studentIndex) => {
            console.log(`Traitement de l'étudiant ${studentIndex + 1}/${studentsArray.length}: ${student.last_name} ${student.first_name}`);
            
            // Créer une feuille pour chaque étudiant
            const ws = XLSX.utils.aoa_to_sheet([]);
            
            // Calculer les rangs des catégories pour TOUS les étudiants
            const categoryRanks = calculateCategoryRanks(studentsArray);
            
            // En-tête du bulletin (lignes 1-3)
            XLSX.utils.sheet_add_aoa(ws, [
              [`${student.last_name} ${student.first_name}`],
              [`Matricule: ${student.matricule}`],
              ['']
            ], { origin: 'A1' });
            
            // Informations générales (ligne 4)
            XLSX.utils.sheet_add_aoa(ws, [
              ['Moyenne Générale', '', '', '', Number(student.average || 0).toFixed(2)],
              ['Rang', '', '', '', student.rank]
            ], { origin: 'A4' });
            
            // Ligne vide
            XLSX.utils.sheet_add_aoa(ws, [['']], { origin: 'A6' });
            
            // En-têtes du tableau (ligne 7)
            const headers = ['Matière', 'Moy', 'Coeff', 'M. Coeff', 'Rang'];
            XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A7' });
            
            let currentRow = 8;
            
            if (student.subjects && student.subjects.length > 0) {
              // Grouper les matières par catégorie
              const categories = {
                'LITTÉRAIRES': student.subjects.filter(s => s.category === 'LITTÉRAIRES'),
                'SCIENTIFIQUES': student.subjects.filter(s => s.category === 'SCIENTIFIQUES'),
                'AUTRES': student.subjects.filter(s => s.category === 'AUTRES')
              };
              
              // Matières littéraires
              if (categories.LITTÉRAIRES.length > 0) {
                categories.LITTÉRAIRES.forEach(subject => {
                  XLSX.utils.sheet_add_aoa(ws, [[
                    subject.subject_name,
                    Number(subject.average || 0).toFixed(2),
                    subject.coefficient,
                    Number(subject.weighted_average || 0).toFixed(2),
                    subject.rank
                  ]], { origin: `A${currentRow}` });
                  currentRow++;
                });
                
                // Bilan littéraires
                const literaryTotals = calculateCategoryTotals(categories.LITTÉRAIRES);
                const literaryAverage = literaryTotals.LITTÉRAIRES.total_coefficient > 0 
                  ? (literaryTotals.LITTÉRAIRES.total_weighted / literaryTotals.LITTÉRAIRES.total_coefficient).toFixed(2)
                  : '0.00';
                const literaryRank = categoryRanks.LITTÉRAIRES.get(student.matricule) || '-';
                
                XLSX.utils.sheet_add_aoa(ws, [[
                  'Bilan LITTÉRAIRES',
                  literaryAverage,
                  literaryTotals.LITTÉRAIRES.total_coefficient,
                  literaryTotals.LITTÉRAIRES.total_weighted.toFixed(2),
                  literaryRank !== '-' ? literaryRank : '-'
                ]], { origin: `A${currentRow}` });
                currentRow++;
              }
              
              // Matières scientifiques
              if (categories.SCIENTIFIQUES.length > 0) {
                categories.SCIENTIFIQUES.forEach(subject => {
                  XLSX.utils.sheet_add_aoa(ws, [[
                    subject.subject_name,
                    Number(subject.average || 0).toFixed(2),
                    subject.coefficient,
                    Number(subject.weighted_average || 0).toFixed(2),
                    subject.rank
                  ]], { origin: `A${currentRow}` });
                  currentRow++;
                });
                
                // Bilan scientifiques
                const scientificTotals = calculateCategoryTotals(categories.SCIENTIFIQUES);
                const scientificAverage = scientificTotals.SCIENTIFIQUES.total_coefficient > 0 
                  ? (scientificTotals.SCIENTIFIQUES.total_weighted / scientificTotals.SCIENTIFIQUES.total_coefficient).toFixed(2)
                  : '0.00';
                const scientificRank = categoryRanks.SCIENTIFIQUES.get(student.matricule) || '-';
                
                XLSX.utils.sheet_add_aoa(ws, [[
                  'Bilan SCIENTIFIQUES',
                  scientificAverage,
                  scientificTotals.SCIENTIFIQUES.total_coefficient,
                  scientificTotals.SCIENTIFIQUES.total_weighted.toFixed(2),
                  scientificRank !== '-' ? scientificRank : '-'
                ]], { origin: `A${currentRow}` });
                currentRow++;
              }
              
              // Autres matières
              if (categories.AUTRES.length > 0) {
                categories.AUTRES.forEach(subject => {
                  XLSX.utils.sheet_add_aoa(ws, [[
                    subject.subject_name,
                    Number(subject.average || 0).toFixed(2),
                    subject.coefficient,
                    Number(subject.weighted_average || 0).toFixed(2),
                    subject.rank
                  ]], { origin: `A${currentRow}` });
                  currentRow++;
                });
                
                // Bilan autres
                const otherTotals = calculateCategoryTotals(categories.AUTRES);
                const otherAverage = otherTotals.AUTRES.total_coefficient > 0 
                  ? (otherTotals.AUTRES.total_weighted / otherTotals.AUTRES.total_coefficient).toFixed(2)
                  : '0.00';
                const otherRank = categoryRanks.AUTRES.get(student.matricule) || '-';
                
                XLSX.utils.sheet_add_aoa(ws, [[
                  'Bilan AUTRES',
                  otherAverage,
                  otherTotals.AUTRES.total_coefficient,
                  otherTotals.AUTRES.total_weighted.toFixed(2),
                  otherRank !== '-' ? otherRank : '-'
                ]], { origin: `A${currentRow}` });
                currentRow++;
              }
            }
            
            // Définir la largeur des colonnes
            ws['!cols'] = [
              { wch: 25 },  // Matière
              { wch: 10 },  // Moy
              { wch: 8 },   // Coeff
              { wch: 12 },  // M. Coeff
              { wch: 8 }    // Rang
            ];
            
          // === STYLES ET COULEURS ===
          
          // Style pour le nom de l'étudiant (en gras, taille 14)
          if (ws['A1']) {
            ws['A1'].s = {
              font: { bold: true, size: 14, color: { rgb: "1976D2" } }
            };
          }
          
          // Style pour le matricule
          if (ws['A2']) {
            ws['A2'].s = {
              font: { bold: true, size: 12, color: { rgb: "1976D2" } }
            };
          }
          
          // Style pour les informations générales (Moyenne Générale et Rang)
          if (ws['A4']) {
            ws['A4'].s = { 
              font: { bold: true, color: { rgb: "7B1FA2" } }
            };
          }
          if (ws['E4']) {
            ws['E4'].s = { 
              font: { bold: true, size: 12, color: { rgb: "7B1FA2" } }
            };
          }
          if (ws['A5']) {
            ws['A5'].s = { 
              font: { bold: true, color: { rgb: "7B1FA2" } }
            };
          }
          if (ws['E5']) {
            ws['E5'].s = { 
              font: { bold: true, size: 12, color: { rgb: "7B1FA2" } }
            };
          }
          
          // Style pour les en-têtes du tableau (ligne 7) - Gris foncé
          for (let i = 0; i < headers.length; i++) {
            const cellRef = XLSX.utils.encode_cell({ r: 6, c: i });
            if (ws[cellRef]) {
              ws[cellRef].s = { 
                font: { bold: true, color: { rgb: "FFFFFF" } },
                alignment: { horizontal: 'center' }
              };
            }
          }
          
          // Style pour les lignes de données (alternance de couleurs)
          for (let i = 8; i < currentRow; i++) {
            const isEvenRow = (i - 8) % 2 === 0;
            const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 });
            
            // Vérifier si c'est une ligne de bilan
            if (ws[cellRef] && ws[cellRef].v && ws[cellRef].v.includes('Bilan')) {
              // Style pour les lignes de bilan (en gras avec couleurs spécifiques)
              let textColor = "2E7D32"; // Vert foncé par défaut
              
              if (ws[cellRef].v.includes('LITTÉRAIRES')) {
                textColor = "1976D2"; // Bleu foncé
              } else if (ws[cellRef].v.includes('SCIENTIFIQUES')) {
                textColor = "2E7D32"; // Vert foncé
              } else if (ws[cellRef].v.includes('AUTRES')) {
                textColor = "F57C00"; // Orange foncé
              }
              
              for (let j = 0; j < 5; j++) {
                const cellRefBilan = XLSX.utils.encode_cell({ r: i, c: j });
                if (ws[cellRefBilan]) {
                  ws[cellRefBilan].s = { 
                    font: { bold: true, color: { rgb: textColor } },
                    alignment: j > 0 ? { horizontal: 'center' } : { horizontal: 'left' }
                  };
                }
              }
            } else {
              // Style pour les lignes de matières normales
              for (let j = 0; j < 5; j++) {
                const cellRefData = XLSX.utils.encode_cell({ r: i, c: j });
                if (ws[cellRefData]) {
                  ws[cellRefData].s = { 
                    alignment: j > 0 ? { horizontal: 'center' } : { horizontal: 'left' }
                  };
                }
              }
            }
          }
            
            // Ajouter la feuille au workbook
            const sheetName = `${student.last_name}_${student.first_name}`.substring(0, 31);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
          });
        
        // Créer aussi une feuille de récapitulatif général
        const summaryWs = XLSX.utils.aoa_to_sheet([]);
        
        // Titre du récapitulatif
        XLSX.utils.sheet_add_aoa(summaryWs, [[`Récapitulatif - ${selectedClass?.name} - ${selectedTrimester?.name} (${selectedSchoolYear?.year || selectedSchoolYear?.name})`]], { origin: 'A1' });
        XLSX.utils.sheet_add_aoa(summaryWs, [['']], { origin: 'A2' });
        
        // En-têtes du récapitulatif
        const summaryHeaders = ['N°', 'Matricule', 'Nom', 'Prénom', 'Moyenne Générale', 'Rang Général'];
        XLSX.utils.sheet_add_aoa(summaryWs, [summaryHeaders], { origin: 'A3' });
        
        // Données du récapitulatif
        const summaryData = studentsArray.map((student, index) => [
          index + 1,
          student.matricule,
          student.last_name,
          student.first_name,
          Number(student.average || 0).toFixed(2),
          student.rank
        ]);
        
        XLSX.utils.sheet_add_aoa(summaryWs, summaryData, { origin: 'A4' });
        
        // Style pour le récapitulatif
        summaryWs['!cols'] = [
          { wch: 5 },   // N°
          { wch: 15 },  // Matricule
          { wch: 20 },  // Nom
          { wch: 20 },  // Prénom
          { wch: 15 },  // Moyenne Générale
          { wch: 12 }   // Rang Général
        ];
        
      // Style pour le titre du récapitulatif
      if (summaryWs['A1']) {
        summaryWs['A1'].s = {
          font: { bold: true, size: 14, color: { rgb: "1976D2" } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
      
      // Style pour les en-têtes du récapitulatif
      for (let i = 0; i < summaryHeaders.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: 2, c: i });
        if (summaryWs[cellRef]) {
          summaryWs[cellRef].s = { 
            font: { bold: true, color: { rgb: "FFFFFF" } },
            alignment: { horizontal: 'center' }
          };
        }
      }
      
      // Style pour les données du récapitulatif
      for (let i = 4; i < 4 + summaryData.length; i++) {
        for (let j = 0; j < summaryHeaders.length; j++) {
          const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
          if (summaryWs[cellRef]) {
            summaryWs[cellRef].s = { 
              alignment: j > 0 ? { horizontal: 'center' } : { horizontal: 'left' }
            };
          }
        }
      }
        
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Récapitulatif');
        
      } else {
        // Pour l'export simple (récap)
        const ws = XLSX.utils.aoa_to_sheet([]);
        
        // Ajouter le titre en A1
        XLSX.utils.sheet_add_aoa(ws, [[`Récap des élèves - ${selectedClass?.name} - ${selectedTrimester?.name} (${selectedSchoolYear?.year || selectedSchoolYear?.name})`]], { origin: 'A1' });
        
        // Ajouter les informations de filtrage en A2
        XLSX.utils.sheet_add_aoa(ws, [[`Année scolaire: ${selectedSchoolYear?.year || selectedSchoolYear?.name} | Trimestre: ${selectedTrimester?.name} | Classe: ${selectedClass?.name}`]], { origin: 'A2' });
        
        // Ajouter une ligne vide
        XLSX.utils.sheet_add_aoa(ws, [['']], { origin: 'A3' });
        
        // Définir les en-têtes
        const headers = ['N°', 'Matricule', 'Nom', 'Prénom', 'Moyenne', 'Rang'];
        
        // Ajouter les en-têtes
        XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A4' });
        
        // Trier les étudiants par ordre alphabétique
        const sortedStudents = studentsArray.sort((a, b) => {
          const lastNameA = (a.last_name || '').trim().toLowerCase();
          const lastNameB = (b.last_name || '').trim().toLowerCase();
          const firstNameA = (a.first_name || '').trim().toLowerCase();
          const firstNameB = (b.first_name || '').trim().toLowerCase();
          
          if (lastNameA < lastNameB) return -1;
          if (lastNameA > lastNameB) return 1;
          if (firstNameA < firstNameB) return -1;
          if (firstNameA > firstNameB) return 1;
          return 0;
        });
  
        // Préparer les données des étudiants triés
        const studentData = sortedStudents.map((student, index) => [
          index + 1,
          student.matricule,
          student.last_name,
          student.first_name,
          Number(student.average || 0).toFixed(2),
          student.rank
        ]);
        
        // Ajouter les données des étudiants à partir de la ligne 5
        XLSX.utils.sheet_add_aoa(ws, studentData, { origin: 'A5' });
  
        // Fusionner les cellules pour le titre
        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Fusionner le titre
          { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }  // Fusionner les infos de filtrage
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
          font: { bold: true, size: 14, color: { rgb: "1976D2" } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      // Style pour les informations de filtrage
      if (ws['A2']) {
        ws['A2'].s = {
          font: { bold: true, size: 12, color: { rgb: "7B1FA2" } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      // Style pour les en-têtes (en gras)
      const headerRow = 4; // Ligne 5 (index 4)
      for (let i = 0; i < headers.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: i });
        if (ws[cellRef]) {
          ws[cellRef].s = { 
            font: { bold: true, color: { rgb: "FFFFFF" } },
            alignment: { horizontal: 'center' }
          };
        }
      }

      // Style pour les données
      for (let i = 5; i < 5 + studentData.length; i++) {
        for (let j = 0; j < headers.length; j++) {
          const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
          if (ws[cellRef]) {
            ws[cellRef].s = { 
              alignment: j > 0 ? { horizontal: 'center' } : { horizontal: 'left' }
            };
          }
        }
      }
  
        // Ajouter la feuille au workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Récap Élèves');
      }
  
      // Générer le nom du fichier avec les informations de filtrage
      const fileName = `${exportType === 'moyennes' ? 'Bulletins_detaille' : 'Recap_eleves'}_${selectedClass?.name}_${selectedSchoolYear?.year || selectedSchoolYear?.name}_${selectedTrimester?.name}.xlsx`;
  
      // Télécharger le fichier
      XLSX.writeFile(wb, fileName);
      
      // Message de confirmation
      console.log(`Fichier Excel généré avec succès pour ${studentsArray.length} étudiant(s)`);
      setError(null);
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
    <Box sx={{ 
      mb: 4,
      p: 2,
      borderRadius: 2,
      backgroundColor: 'white',
      border: '1px solid #e0e0e0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <Breadcrumbs 
        separator={
          <NavigateNextIcon 
            fontSize="small" 
            sx={{ 
              color: 'primary.main'
            }} 
          />
        } 
        sx={{ 
          '& .MuiBreadcrumbs-separator': {
            mx: 1
          }
        }}
      >
        <Link
          component="button"
          variant="body1"
          onClick={() => setCurrentView('levels')}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            textDecoration: 'none',
            color: 'primary.main',
            fontWeight: 600,
            p: 1,
            borderRadius: 2,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: 'primary.light',
              color: 'white'
            }
          }}
        >
          <HomeIcon sx={{ mr: 0.5, fontSize: 20 }} />
          Niveaux
        </Link>
        {selectedLevel && (
          <Link
            component="button"
            variant="body1"
            onClick={() => setCurrentView('classes')}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none',
              color: 'primary.main',
              fontWeight: 600,
              p: 1,
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'white'
              }
            }}
          >
            <SchoolIcon sx={{ mr: 0.5, fontSize: 20 }} />
            {selectedLevel.name}
          </Link>
        )}
        {selectedClass && (
          <Typography 
            variant="body1" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              fontWeight: 700,
              p: 1,
              borderRadius: 2,
              backgroundColor: 'primary.light',
              color: 'white'
            }}
          >
            <ClassIcon sx={{ mr: 0.5, fontSize: 20, color: 'white' }} />
            {selectedClass.name}
          </Typography>
        )}
      </Breadcrumbs>
    </Box>
  );

  const renderLevels = () => (
    <Grid container spacing={4}>
      {levels.map((level, index) => {
        const colors = [
          '#1976d2', // Bleu
          '#f57c00', // Orange
          '#2e7d32', // Vert
          '#7b1fa2', // Violet
          '#d32f2f', // Rouge
          '#0288d1', // Bleu clair
          '#388e3c'  // Vert foncé
        ];
        const color = colors[index % colors.length];
        
        return (
          <Grid item xs={12} sm={6} md={4} key={level.id}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                transition: 'all 0.3s ease',
                borderRadius: 2,
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': { 
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  borderColor: color
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: color,
                  zIndex: 1
                }
              }}
              onClick={() => fetchClasses(level)}
            >
              <CardContent sx={{ 
                textAlign: 'center', 
                p: 3,
                position: 'relative',
                zIndex: 2
              }}>
                <Box sx={{
                  display: 'inline-block',
                  mb: 2
                }}>
                  <SchoolIcon 
                    sx={{ 
                      fontSize: 48, 
                      color: color
                    }} 
                  />
                </Box>
                <Typography variant="h5" component="h2" gutterBottom sx={{
                  fontWeight: 700,
                  color: color,
                  mb: 2
                }}>
                  {level.name}
                </Typography>
                {level.description && (
                  <Typography variant="body2" color="text.secondary" sx={{
                    fontWeight: 500,
                    opacity: 0.8
                  }}>
                    {level.description}
                  </Typography>
                )}
                <Box sx={{
                  mt: 2,
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: 'grey.100',
                  border: '1px solid #e0e0e0'
                }}>
                  <Typography variant="caption" sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Cliquer pour voir les classes
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  const renderClasses = () => (
    <Box>
      {/* Filtres */}
      <Paper sx={{ 
        p: 4, 
        mb: 4,
        borderRadius: 4,
        background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
          zIndex: 1
        }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            mr: 2
          }} />
          <Typography variant="h5" gutterBottom sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0
          }}>
            Filtres de sélection
          </Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel sx={{ 
                fontWeight: 600,
                color: 'text.primary'
              }}>
                Année Scolaire
              </InputLabel>
              <Select
                value={selectedSchoolYear?.id || ''}
                onChange={(e) => {
                  const schoolYear = schoolYears.find(sy => sy.id === e.target.value);
                  setSelectedSchoolYear(schoolYear || null);
                }}
                label="Année Scolaire"
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(102, 126, 234, 0.3)',
                    borderWidth: 2
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#667eea',
                  }
                }}
              >
                {schoolYears.map((year) => (
                  <MenuItem key={year.id} value={year.id} sx={{
                    fontWeight: 500,
                    '&:hover': {
                      background: 'rgba(102, 126, 234, 0.1)'
                    }
                  }}>
                    {year.name || year.year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel sx={{ 
                fontWeight: 600,
                color: 'text.primary'
              }}>
                Trimestre
              </InputLabel>
              <Select
                value={selectedTrimester?.id || ''}
                onChange={(e) => {
                  const trimester = trimesters.find(t => t.id === e.target.value);
                  setSelectedTrimester(trimester || null);
                }}
                label="Trimestre"
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(102, 126, 234, 0.3)',
                    borderWidth: 2
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#667eea',
                  }
                }}
              >
                {trimesters.map((trimester) => (
                  <MenuItem key={trimester.id} value={trimester.id} sx={{
                    fontWeight: 500,
                    '&:hover': {
                      background: 'rgba(102, 126, 234, 0.1)'
                    }
                  }}>
                    {trimester.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {(!selectedSchoolYear || !selectedTrimester) && (
          <Alert 
            severity="warning" 
            sx={{ 
              mt: 3,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
              border: '1px solid #ffc107',
              '& .MuiAlert-icon': {
                color: '#856404'
              }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#856404' }}>
              Veuillez sélectionner une année scolaire et un trimestre pour continuer
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Classes */}
      <Grid container spacing={4}>
        {classes.map((classItem, index) => {
          const classColors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
          ];
          const classColor = classColors[index % classColors.length];
          const isDisabled = !selectedSchoolYear || !selectedTrimester;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={classItem.id}>
              <Card 
                sx={{ 
                  cursor: isDisabled ? 'not-allowed' : 'pointer', 
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderRadius: 4,
                  background: isDisabled 
                    ? 'linear-gradient(145deg, #f5f5f5 0%, #e0e0e0 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: isDisabled 
                    ? '0 4px 16px rgba(0,0,0,0.05)'
                    : '0 8px 32px rgba(0,0,0,0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: isDisabled ? 0.6 : 1,
                  '&:hover': !isDisabled ? { 
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    '& .class-icon': {
                      transform: 'scale(1.1) rotate(-5deg)',
                    },
                    '& .class-overlay': {
                      opacity: 1,
                    }
                  } : {},
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: isDisabled ? '#bdbdbd' : classColor,
                    zIndex: 1
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
                <CardContent sx={{ 
                  textAlign: 'center', 
                  p: 4,
                  position: 'relative',
                  zIndex: 2
                }}>
                  <Box sx={{
                    position: 'relative',
                    display: 'inline-block',
                    mb: 3
                  }}>
                    <ClassIcon 
                      className="class-icon"
                      sx={{ 
                        fontSize: 56, 
                        color: isDisabled ? '#bdbdbd' : 'secondary.main',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
                        transition: 'all 0.3s ease'
                      }} 
                    />
                    {!isDisabled && (
                      <Box 
                        className="class-overlay"
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          background: classColor,
                          opacity: 0,
                          transition: 'all 0.3s ease',
                          zIndex: -1,
                          filter: 'blur(20px)'
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="h5" component="h2" gutterBottom sx={{
                    fontWeight: 700,
                    color: isDisabled ? '#9e9e9e' : 'text.primary',
                    mb: 2
                  }}>
                    {classItem.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{
                    fontWeight: 500,
                    opacity: isDisabled ? 0.5 : 0.8,
                    mb: 2
                  }}>
                    {classItem.level_name}
                  </Typography>
                  
                  {isDisabled ? (
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'rgba(189, 189, 189, 0.1)',
                      border: '1px solid rgba(189, 189, 189, 0.2)'
                    }}>
                      <Typography variant="caption" sx={{
                        color: '#9e9e9e',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Sélectionnez les filtres
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'rgba(102, 126, 234, 0.1)',
                      border: '1px solid rgba(102, 126, 234, 0.2)'
                    }}>
                      <Typography variant="caption" sx={{
                        color: 'primary.main',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Voir les élèves
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  const renderStudents = () => {
    // S'assurer que students est un tableau
    const studentsArray = Array.isArray(students) ? students : [];
    
    // Calculer les rangs des catégories
    const categoryRanks = calculateCategoryRanks(studentsArray);
    
    return (
      <Box>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          p: 3,
          borderRadius: 2,
          backgroundColor: 'primary.main',
          color: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 700
            }}>
              {exportType === 'moyennes' ? 'Détails des Moyennes et Rangs' : 'Élèves de'} {selectedClass?.name}
            </Typography>
            <Typography variant="subtitle1" sx={{ 
              opacity: 0.9,
              fontWeight: 400,
              mt: 0.5
            }}>
              {selectedTrimester?.name} - {selectedSchoolYear?.year || selectedSchoolYear?.name}
            </Typography>
            <Typography variant="body2" sx={{ 
              opacity: 0.8,
              fontWeight: 500,
              mt: 1,
              p: 1,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 1,
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              📊 Données filtrées par année scolaire et trimestre
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={downloadExcel}
            disabled={studentsArray.length === 0}
            startIcon={<DownloadIcon />}
            sx={{
              backgroundColor: studentsArray.length === 0 
                ? 'rgba(255,255,255,0.3)' 
                : '#4caf50',
              color: 'white',
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
              py: 1.5,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '&:hover': {
                backgroundColor: studentsArray.length === 0 
                  ? 'rgba(255,255,255,0.3)' 
                  : '#388e3c',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              },
              '&:disabled': {
                backgroundColor: 'rgba(255,255,255,0.3)',
                color: 'rgba(255,255,255,0.7)'
              }
            }}
          >
            Télécharger Excel
          </Button>
        </Box>

        {/* Informations sur les filtres appliqués */}
        <Paper sx={{ 
          p: 2, 
          mb: 3,
          borderRadius: 2,
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              label={`Année: ${selectedSchoolYear?.year || selectedSchoolYear?.name}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Chip 
              label={`Trimestre: ${selectedTrimester?.name}`}
              color="secondary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Chip 
              label={`Classe: ${selectedClass?.name}`}
              color="success"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Chip 
              label={`${studentsArray.length} élève(s) trouvé(s)`}
              color="info"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Paper>

        {studentsArray.length === 0 ? (
          <Alert 
            severity="info" 
            sx={{ 
              borderRadius: 2,
              backgroundColor: '#e3f2fd',
              border: '1px solid #2196f3'
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1976d2' }}>
              Aucun élève trouvé pour la classe {selectedClass?.name}, l'année scolaire {selectedSchoolYear?.year || selectedSchoolYear?.name} et le {selectedTrimester?.name}.
            </Typography>
          </Alert>
        ) : exportType === 'moyennes' ? (
          // Vue détaillée pour l'export des moyennes
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {studentsArray
              .sort((a, b) => {
                const lastNameA = (a.last_name || '').trim().toLowerCase();
                const lastNameB = (b.last_name || '').trim().toLowerCase();
                const firstNameA = (a.first_name || '').trim().toLowerCase();
                const firstNameB = (b.first_name || '').trim().toLowerCase();
                
                if (lastNameA < lastNameB) return -1;
                if (lastNameA > lastNameB) return 1;
                if (firstNameA < firstNameB) return -1;
                if (firstNameA > firstNameB) return 1;
                return 0;
              })
              .map((student, index) => (
                <Paper key={student.matricule} sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0'
                }}>
                  {/* En-tête de l'élève */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 3,
                    p: 2,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    borderRadius: 2
                  }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {student.last_name} {student.first_name}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Matricule: {student.matricule}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Moyenne Générale: {Number(student.average || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Rang: {student.rank}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Tableau des résultats */}
                  {student.subjects && (
                    <TableContainer sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 700, border: '1px solid #e0e0e0' }}>Matière</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, border: '1px solid #e0e0e0' }}>Moy</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, border: '1px solid #e0e0e0' }}>Coeff</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, border: '1px solid #e0e0e0' }}>M. Coeff</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, border: '1px solid #e0e0e0' }}>Rang</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {/* Matières littéraires */}
                          {student.subjects.filter(s => s.category === 'LITTÉRAIRES').map((subject, idx) => (
                            <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
                              <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 500 }}>{subject.subject_name}</TableCell>
                              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', fontWeight: 600 }}>{Number(subject.average || 0).toFixed(2)}</TableCell>
                              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', fontWeight: 600 }}>{subject.coefficient}</TableCell>
                              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', fontWeight: 600 }}>{Number(subject.weighted_average || 0).toFixed(2)}</TableCell>
                              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', fontWeight: 600 }}>{subject.rank}ème</TableCell>
                            </TableRow>
                          ))}
                          
                          {/* Bilan littéraires */}
                          {(() => {
                            const literarySubjects = student.subjects.filter(s => s.category === 'LITTÉRAIRES');
                            const literaryTotals = calculateCategoryTotals(literarySubjects);
                            const literaryAverage = literaryTotals.LITTÉRAIRES.total_coefficient > 0 
                              ? (literaryTotals.LITTÉRAIRES.total_weighted / literaryTotals.LITTÉRAIRES.total_coefficient).toFixed(2)
                              : '0.00';
                            const literaryRank = categoryRanks.LITTÉRAIRES.get(student.matricule) || '-';
                            
                            return literarySubjects.length > 0 && (
                              <TableRow sx={{ backgroundColor: '#e3f2fd', '& td': { border: '1px solid #e0e0e0', fontWeight: 700 } }}>
                                <TableCell>Bilan LITTÉRAIRES</TableCell>
                                <TableCell align="center">{literaryAverage}</TableCell>
                                <TableCell align="center">{literaryTotals.LITTÉRAIRES.total_coefficient}</TableCell>
                                <TableCell align="center">{literaryTotals.LITTÉRAIRES.total_weighted.toFixed(2)}</TableCell>
                                <TableCell align="center">{literaryRank !== '-' ? `${literaryRank}ème` : '-'}</TableCell>
                              </TableRow>
                            );
                          })()}

                          {/* Matières scientifiques */}
                          {student.subjects.filter(s => s.category === 'SCIENTIFIQUES').map((subject, idx) => (
                            <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
                              <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 500 }}>{subject.subject_name}</TableCell>
                              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', fontWeight: 600 }}>{Number(subject.average || 0).toFixed(2)}</TableCell>
                              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', fontWeight: 600 }}>{subject.coefficient}</TableCell>
                              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', fontWeight: 600 }}>{Number(subject.weighted_average || 0).toFixed(2)}</TableCell>
                              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', fontWeight: 600 }}>{subject.rank}ème</TableCell>
                            </TableRow>
                          ))}
                          
                          {/* Bilan scientifiques */}
                          {(() => {
                            const scientificSubjects = student.subjects.filter(s => s.category === 'SCIENTIFIQUES');
                            const scientificTotals = calculateCategoryTotals(scientificSubjects);
                            const scientificAverage = scientificTotals.SCIENTIFIQUES.total_coefficient > 0 
                              ? (scientificTotals.SCIENTIFIQUES.total_weighted / scientificTotals.SCIENTIFIQUES.total_coefficient).toFixed(2)
                              : '0.00';
                            const scientificRank = categoryRanks.SCIENTIFIQUES.get(student.matricule) || '-';
                            
                            return scientificSubjects.length > 0 && (
                              <TableRow sx={{ backgroundColor: '#e8f5e8', '& td': { border: '1px solid #e0e0e0', fontWeight: 700 } }}>
                                <TableCell>Bilan SCIENTIFIQUES</TableCell>
                                <TableCell align="center">{scientificAverage}</TableCell>
                                <TableCell align="center">{scientificTotals.SCIENTIFIQUES.total_coefficient}</TableCell>
                                <TableCell align="center">{scientificTotals.SCIENTIFIQUES.total_weighted.toFixed(2)}</TableCell>
                                <TableCell align="center">{scientificRank !== '-' ? `${scientificRank}ème` : '-'}</TableCell>
                              </TableRow>
                            );
                          })()}

                          {/* Autres matières */}
                          {student.subjects.filter(s => s.category === 'AUTRES').map((subject, idx) => (
                            <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
                              <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 500 }}>{subject.subject_name}</TableCell>
                              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', fontWeight: 600 }}>{Number(subject.average || 0).toFixed(2)}</TableCell>
                              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', fontWeight: 600 }}>{subject.coefficient}</TableCell>
                              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', fontWeight: 600 }}>{Number(subject.weighted_average || 0).toFixed(2)}</TableCell>
                              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', fontWeight: 600 }}>{subject.rank}ème</TableCell>
                            </TableRow>
                          ))}
                          
                          {/* Bilan autres */}
                          {(() => {
                            const otherSubjects = student.subjects.filter(s => s.category === 'AUTRES');
                            const otherTotals = calculateCategoryTotals(otherSubjects);
                            const otherAverage = otherTotals.AUTRES.total_coefficient > 0 
                              ? (otherTotals.AUTRES.total_weighted / otherTotals.AUTRES.total_coefficient).toFixed(2)
                              : '0.00';
                            const otherRank = categoryRanks.AUTRES.get(student.matricule) || '-';
                            
                            return otherSubjects.length > 0 && (
                              <TableRow sx={{ backgroundColor: '#fff3e0', '& td': { border: '1px solid #e0e0e0', fontWeight: 700 } }}>
                                <TableCell>Bilan AUTRES</TableCell>
                                <TableCell align="center">{otherAverage}</TableCell>
                                <TableCell align="center">{otherTotals.AUTRES.total_coefficient}</TableCell>
                                <TableCell align="center">{otherTotals.AUTRES.total_weighted.toFixed(2)}</TableCell>
                                <TableCell align="center">{otherRank !== '-' ? `${otherRank}ème` : '-'}</TableCell>
                              </TableRow>
                            );
                          })()}

                          {/* Totaux */}
                          {(() => {
                            const allTotals = calculateCategoryTotals(student.subjects);
                            const totalCoefficient = allTotals.LITTÉRAIRES.total_coefficient + 
                                                   allTotals.SCIENTIFIQUES.total_coefficient + 
                                                   allTotals.AUTRES.total_coefficient;
                            const totalWeighted = allTotals.LITTÉRAIRES.total_weighted + 
                                                allTotals.SCIENTIFIQUES.total_weighted + 
                                                allTotals.AUTRES.total_weighted;
                            
                            return (
                              <TableRow sx={{ backgroundColor: '#f3e5f5', '& td': { border: '1px solid #e0e0e0', fontWeight: 700, fontSize: '1.1rem' } }}>
                                <TableCell>TOTAUX</TableCell>
                                <TableCell align="center"></TableCell>
                                <TableCell align="center">{totalCoefficient}</TableCell>
                                <TableCell align="center">{totalWeighted.toFixed(2)}</TableCell>
                                <TableCell align="center"></TableCell>
                              </TableRow>
                            );
                          })()}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>
              ))}
          </Box>
        ) : (
          // Vue simple pour l'export du récap
          <TableContainer 
            component={Paper} 
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0',
              overflow: 'hidden'
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: 'primary.main',
                  '& .MuiTableCell-head': {
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 16
                  }
                }}>
                  <TableCell>N°</TableCell>
                  <TableCell>Matricule</TableCell>
                  <TableCell>Nom</TableCell>
                  <TableCell>Prénom</TableCell>
                  <TableCell align="center">Moyenne</TableCell>
                  <TableCell align="center">Rang</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentsArray
                  .sort((a, b) => {
                    const lastNameA = (a.last_name || '').trim().toLowerCase();
                    const lastNameB = (b.last_name || '').trim().toLowerCase();
                    const firstNameA = (a.first_name || '').trim().toLowerCase();
                    const firstNameB = (b.first_name || '').trim().toLowerCase();
                    
                    if (lastNameA < lastNameB) return -1;
                    if (lastNameA > lastNameB) return 1;
                    if (firstNameA < firstNameB) return -1;
                    if (firstNameA > firstNameB) return 1;
                    return 0;
                  })
                  .map((student, index) => (
                  <TableRow 
                    key={student.matricule}
                    sx={{
                      '&:nth-of-type(odd)': {
                        backgroundColor: '#f5f5f5',
                      },
                      '&:hover': {
                        backgroundColor: '#e3f2fd',
                        transition: 'all 0.2s ease'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {student.matricule}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {student.last_name}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {student.first_name}
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={Number(student.average || 0).toFixed(2)} 
                        color={Number(student.average || 0) >= 10 ? 'success' : 'error'}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          '&.MuiChip-colorSuccess': {
                            backgroundColor: '#4caf50',
                            color: 'white'
                          },
                          '&.MuiChip-colorError': {
                            backgroundColor: '#f44336',
                            color: 'white'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={student.rank} 
                        color="primary"
                        size="small"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: '#2196f3',
                          color: 'white'
                        }}
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
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SecretarySidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Paper sx={{ 
          p: 4, 
          borderRadius: 2,
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 4,
            p: 3,
            borderRadius: 2,
            backgroundColor: 'primary.main',
            color: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            {exportType === 'moyennes' ? (
              <BarChartIcon sx={{ 
                mr: 2, 
                fontSize: 40
              }} />
            ) : exportType === 'recap' ? (
              <DescriptionIcon sx={{ 
                mr: 2, 
                fontSize: 40
              }} />
            ) : (
            <TableChartIcon sx={{ 
              mr: 2, 
              fontSize: 40
            }} />
            )}
            <Box>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 700
              }}>
                {exportType === 'moyennes' 
                  ? 'Export des Moyennes et Rangs' 
                  : exportType === 'recap' 
                    ? 'Export du Récap des Élèves'
                    : 'Gestion des Fichiers Excel'
                }
              </Typography>
              <Typography variant="subtitle1" sx={{ 
                opacity: 0.9,
                fontWeight: 400,
                mt: 0.5
              }}>
                {exportType === 'moyennes' 
                  ? 'Exportez les détails des moyennes et rangs des élèves par classe'
                  : exportType === 'recap' 
                    ? 'Exportez le récapitulatif complet des élèves'
                    : 'Exportez les moyennes et rangs des élèves'
                }
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {renderBreadcrumbs()}

          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            {currentView !== 'levels' && (
              <Button
                variant="contained"
                onClick={goBack}
                startIcon={<NavigateNextIcon sx={{ transform: 'rotate(180deg)' }} />}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }
                }}
              >
                Retour
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={resetAll}
              sx={{
                border: '2px solid #f44336',
                color: '#f44336',
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                py: 1.5,
                '&:hover': {
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: '2px solid #f44336',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
                }
              }}
            >
              Réinitialiser
            </Button>
          </Box>

          {loading && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center',
              p: 6,
              borderRadius: 4,
              background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CircularProgress 
                size={60}
                thickness={4}
                sx={{
                  color: 'primary.main',
                  mb: 3,
                  filter: 'drop-shadow(0 4px 8px rgba(102, 126, 234, 0.3))'
                }}
              />
              <Typography variant="h6" sx={{
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center'
              }}>
                Chargement en cours...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Veuillez patienter pendant que nous récupérons les données
              </Typography>
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