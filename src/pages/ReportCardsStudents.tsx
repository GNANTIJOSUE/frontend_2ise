import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, Typography, Paper, CircularProgress, Alert, Stack, Card, CardContent, Button, FormControl, InputLabel, Select, MenuItem, Alert as MuiAlert, Snackbar, Tabs, Tab, Grid, IconButton, Chip } from '@mui/material';
import SecretarySidebar from '../components/SecretarySidebar';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

import BulletinPDF, { BulletinPDFRef } from './BulletinPDF';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';

// Helpers pour l'année scolaire
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

function getSchoolYears(count = 5) {
  const current = getCurrentSchoolYear();
  const startYear = parseInt(current.split('-')[0], 10);
  return Array.from({ length: count }, (_, i) => {
    const start = startYear - i;
    return `${start}-${start + 1}`;
  });
}

const SCHOOL_YEARS = getSchoolYears(5);

type TrimesterData = {
  label: string;
  color: string;
  icon: string;
  moyenne: number | null;
  matieres: number;
  loading: boolean;
  bulletin: any[];
  rang: string | number | null;
  appreciation: string;
  show: boolean;
  classStatistics?: {
    plusForteMoyenne: string;
    plusFaibleMoyenne: string;
    moyenneClasse: string;
  };
};

const ReportCardsStudents = () => {

  const { classId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Récupère l'année scolaire depuis l'URL ou par défaut l'année courante
  const queryParams = new URLSearchParams(location.search);
  const initialSchoolYear = queryParams.get('school_year') || getCurrentSchoolYear();
  const [schoolYear, setSchoolYear] = useState(initialSchoolYear);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedTrimester, setSelectedTrimester] = useState<string>('1er trimestre');
  const trimesters = ['1er trimestre', '2e trimestre', '3e trimestre'];
  const [bulletin, setBulletin] = useState<any[]>([]);
  const [rangClasse, setRangClasse] = useState<string | number | null>(null);
  const [appreciation, setAppreciation] = useState<string>('');
  const [moyenneClasse, setMoyenneClasse] = useState<number | null>(null);
  const [loadingBulletin, setLoadingBulletin] = useState(false);
  const [trimestersData, setTrimestersData] = useState<TrimesterData[]>([
    { label: '1er trimestre', color: '#1976d2', icon: '🎓', moyenne: null, matieres: 0, loading: false, bulletin: [], rang: null, appreciation: '', show: false },
    { label: '2e trimestre', color: '#388e3c', icon: '📈', moyenne: null, matieres: 0, loading: false, bulletin: [], rang: null, appreciation: '', show: false },
    { label: '3e trimestre', color: '#f57c00', icon: '📊', moyenne: null, matieres: 0, loading: false, bulletin: [], rang: null, appreciation: '', show: false },
  ]);
  const [openTrimester, setOpenTrimester] = useState<string | null>(null);
  const printRef = useRef<BulletinPDFRef>(null);
  const [publishedTrimesters, setPublishedTrimesters] = useState<{ [trimester: string]: boolean }>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({ open: false, message: '', severity: 'success' });
  const [openNotesModal, setOpenNotesModal] = useState(false);
  const [notesStudent, setNotesStudent] = useState<any | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [notesTrimester, setNotesTrimester] = useState('1er trimestre');
  const [notesYear, setNotesYear] = useState(schoolYear);
  const [allNotes, setAllNotes] = useState<{ [trimester: string]: any[] }>({});
  const [selectedTab, setSelectedTab] = useState(0);
  const [editNote, setEditNote] = useState<any | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editCoeff, setEditCoeff] = useState(1);
  const [editLoading, setEditLoading] = useState(false);
  const [selectedSchoolYearStatus, setSelectedSchoolYearStatus] = useState<any | null>(null);
  const [printingAllBulletins, setPrintingAllBulletins] = useState(false);
  const [selectedTrimesterForPrint, setSelectedTrimesterForPrint] = useState<string>('1er trimestre');
  const [allStudentsData, setAllStudentsData] = useState<{ [studentId: number]: { [trimester: string]: any } }>({});
  const [loadingAllData, setLoadingAllData] = useState(false);
  
  // États pour les notes de conduite
  const [openConduiteModal, setOpenConduiteModal] = useState(false);
  const [conduiteTrimester, setConduiteTrimester] = useState('1er trimestre');
  const [conduiteNotes, setConduiteNotes] = useState<{ [studentId: number]: number | undefined }>({});
  const [conduiteSubjectId, setConduiteSubjectId] = useState<number | null>(null);
  const [loadingConduiteSubject, setLoadingConduiteSubject] = useState(false);
  const [savingConduiteNotes, setSavingConduiteNotes] = useState(false);
  
  // Utiliser useRef pour stocker les références de manière stable
  const bulletinPrintRefs = useRef<{ [key: string]: BulletinPDFRef | null }>({});
  const memoizedRefCallbacks = useRef<{ [key: string]: (ref: BulletinPDFRef | null) => void }>({});

  // Fonction pour obtenir un callback de ref memoizé
  const getMemoizedBulletinRefCallback = useCallback((studentId: number, trimester: string) => {
    const key = `${studentId}-${trimester}`;
    console.log(`DEBUG: getMemoizedBulletinRefCallback appelé pour ${key}`);
    if (!memoizedRefCallbacks.current[key]) {
      console.log(`DEBUG: Création d'un nouveau callback pour ${key}`);
      memoizedRefCallbacks.current[key] = (ref: BulletinPDFRef | null) => {
        console.log(`DEBUG: Callback exécuté pour ${key}, ref:`, !!ref);
        bulletinPrintRefs.current[key] = ref;
      };
    } else {
      console.log(`DEBUG: Réutilisation du callback existant pour ${key}`);
    }
    return memoizedRefCallbacks.current[key];
  }, []);

  // Fonction pour récupérer le statut de l'année scolaire sélectionnée
  const fetchSelectedSchoolYearStatus = async (yearName: string) => {
    try {
      console.log('Récupération du statut pour l\'année:', yearName);
      const response = await fetch(`https://2ise-groupe.com/api/school-years/by-name/${encodeURIComponent(yearName)}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Statut récupéré:', data);
        setSelectedSchoolYearStatus(data);
      } else {
        console.log('Année scolaire non trouvée, on considère qu\'elle est active par défaut');
        // Si l'année n'existe pas dans la base, on considère qu'elle est active (année courante)
        setSelectedSchoolYearStatus({ name: yearName, is_active: true, is_current: true });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du statut de l\'année scolaire:', error);
      // En cas d'erreur, on considère qu'elle est active par défaut
      setSelectedSchoolYearStatus({ name: yearName, is_active: true, is_current: true });
    }
  };

  // Vérifie la publication d'un trimestre
  const checkPublication = async (trimester: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`https://2ise-groupe.com/api/classes/${classId}/bulletins-published`, {
        params: {
          semester: trimester,
          school_year: schoolYear
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setPublishedTrimesters(prev => ({ ...prev, [trimester]: res.data.isPublished }));
    } catch (err) {
      console.error('Erreur lors de la vérification de publication:', err);
      setPublishedTrimesters(prev => ({ ...prev, [trimester]: false }));
    }
  };

  useEffect(() => {
    trimesters.forEach(trim => {
      checkPublication(trim);
    });
    // Récupérer le statut de l'année scolaire sélectionnée
    if (schoolYear) {
      fetchSelectedSchoolYearStatus(schoolYear);
    }
    // Synchroniser notesYear avec schoolYear
    setNotesYear(schoolYear);
    // eslint-disable-next-line
  }, [classId, schoolYear]);

  // Récupérer l'ID de la matière Conduite au chargement
  useEffect(() => {
    fetchConduiteSubjectId();
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        if (isMounted) navigate('/secretary-login');
        return;
      }
      try {
        // Récupérer la classe
        const classRes = await axios.get(`https://2ise-groupe.com/api/classes/${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!isMounted) return;
        setClassName(classRes.data.name);
        // Récupérer les étudiants de la classe pour l'année scolaire sélectionnée
        const res = await axios.get(`https://2ise-groupe.com/api/classes/${classId}/students?school_year=${schoolYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (isMounted) setStudents(res.data);
      } catch (err: any) {
        if (isMounted) setError(err.response?.data?.message || 'Erreur lors du chargement des étudiants.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [classId, navigate, schoolYear]);

  // useEffect pour charger les données quand l'étudiant change
  useEffect(() => {
    if (!selectedStudent) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Vérifier si les données sont déjà chargées pour cet étudiant et cette année
    const studentKey = `${selectedStudent.id}-${schoolYear}`;
    const isDataLoaded = trimestersData.some(t => t.bulletin.length > 0);
    
    if (isDataLoaded) {
      console.log('✅ Données déjà chargées pour cet étudiant');
      return;
    }
    
    console.log(`🔄 Chargement initial des données pour l'étudiant ${selectedStudent.id}`);
    
    // Marquer tous les trimestres comme en cours de chargement
    setTrimestersData(prev => prev.map(t => ({ 
      ...t, 
      loading: true, 
      moyenne: null, 
      matieres: 0, 
      bulletin: [], 
      rang: null, 
      appreciation: '', 
      classStatistics: undefined 
    })));
    
    // Charger les données pour tous les trimestres
    const loadTrimesterData = async (trim: string) => {
      try {
        // Normaliser le trimestre pour la correspondance avec la base de données
        let normalizedTrim = trim;
        if (trim === '2e trimestre') {
          normalizedTrim = '2 ème trimestre';
        } else if (trim === '3e trimestre') {
          normalizedTrim = '3 ème trimestre';
        }
        
        // Récupérer les notes de l'étudiant pour le trimestre spécifique
        const gradesRes = await axios.get(`https://2ise-groupe.com/api/students/${selectedStudent.id}/grades?school_year=${schoolYear}&semester=${encodeURIComponent(normalizedTrim)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // L'API retourne déjà les notes filtrées par trimestre
        const notesTrim = gradesRes.data;
        
        // Calculer la moyenne pondérée avec les coefficients
        const totalCoef = notesTrim.reduce((sum: number, n: any) => sum + (n.coefficient || 1), 0);
        const totalMoyCoef = notesTrim.reduce((sum: number, n: any) => {
          // Utiliser 'grade' au lieu de 'moyenne' pour correspondre à la base de données
          const moy = Number(n.grade || n.moyenne);
          const coef = n.coefficient || 1;
          return sum + (isNaN(moy) ? 0 : moy * coef);
        }, 0);
        const moy = totalCoef > 0 ? totalMoyCoef / totalCoef : null;
        
        // Récupérer les statistiques de classe pour ce trimestre
        let classStatistics = {
          plusForteMoyenne: 'N/A',
          plusFaibleMoyenne: 'N/A',
          moyenneClasse: 'N/A'
        };
        
        if (selectedStudent.class_id) {
          try {
            const statsRes = await axios.get('https://2ise-groupe.com/api/students/class-statistics', {
              params: {
                class_id: selectedStudent.class_id,
                semester: trim,
                school_year: schoolYear
              },
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (statsRes.data) {
              classStatistics = {
                plusForteMoyenne: statsRes.data.plusForteMoyenne || 'N/A',
                plusFaibleMoyenne: statsRes.data.plusFaibleMoyenne || 'N/A',
                moyenneClasse: statsRes.data.moyenneClasse || 'N/A'
              };
            }
          } catch (statsError) {
            console.error(`Erreur lors de la récupération des statistiques pour ${trim}:`, statsError);
          }
        }
        
        // Mettre à jour les données du trimestre spécifique
        setTrimestersData(prev => prev.map(t => {
          if (t.label === trim) {
            return {
              ...t,
              loading: false,
              moyenne: moy,
              matieres: notesTrim.length,
              bulletin: notesTrim,
              rang: notesTrim[0]?.rang || null,
              appreciation: notesTrim[0]?.appreciation || '',
              classStatistics: classStatistics
            };
          }
          return t;
        }));
        
      } catch (error) {
        console.error(`Erreur lors de la récupération des données pour ${trim}:`, error);
        
        // Mettre à jour avec des données vides en cas d'erreur
        setTrimestersData(prev => prev.map(t => {
          if (t.label === trim) {
            return {
              ...t,
              loading: false,
              moyenne: null,
              matieres: 0,
              bulletin: [],
              rang: null,
              appreciation: '',
              classStatistics: {
                plusForteMoyenne: 'N/A',
                plusFaibleMoyenne: 'N/A',
                moyenneClasse: 'N/A'
              }
            };
          }
          return t;
        }));
      }
    };
    
    // Charger les données pour tous les trimestres en parallèle
    trimesters.forEach(trim => {
      loadTrimesterData(trim);
    });
    
  }, [selectedStudent?.id, schoolYear]); // ✅ Supprimer trimestersData des dépendances pour éviter la boucle

  // useEffect pour recharger les données quand on change de trimestre
  useEffect(() => {
    if (!selectedStudent || !openTrimester) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Vérifier si les données pour ce trimestre sont déjà disponibles
    const currentTrimesterData = trimestersData.find(t => t.label === openTrimester);
    if (currentTrimesterData && currentTrimesterData.bulletin.length > 0 && !currentTrimesterData.loading) {
      console.log(`✅ Données déjà disponibles pour le trimestre: ${openTrimester}`);
      return; // Ne pas recharger si les données sont déjà disponibles
    }
    
    // Marquer le trimestre comme en cours de chargement
    setTrimestersData(prev => prev.map(t => {
      if (t.label === openTrimester) {
        return { ...t, loading: true };
      }
      return t;
    }));
    
    // Recharger les données pour le trimestre sélectionné
    const loadTrimesterData = async () => {
      try {
        console.log(`🔄 Rechargement des données pour le trimestre: ${openTrimester}`);
        
        // Normaliser le trimestre pour la correspondance avec la base de données
        let normalizedTrim = openTrimester;
        if (openTrimester === '2e trimestre') {
          normalizedTrim = '2 ème trimestre';
        } else if (openTrimester === '3e trimestre') {
          normalizedTrim = '3 ème trimestre';
        }
        
        // Récupérer les notes de l'étudiant pour le trimestre spécifique
        const gradesRes = await axios.get(`https://2ise-groupe.com/api/students/${selectedStudent.id}/grades?school_year=${schoolYear}&semester=${encodeURIComponent(normalizedTrim)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // L'API retourne déjà les notes filtrées par trimestre
        const trimesterGrades = gradesRes.data;
        
        if (trimesterGrades.length === 0) {
          console.log(`⚠️ Aucune note trouvée pour le trimestre ${openTrimester}`);
          // Mettre à jour avec des données vides
          setTrimestersData(prev => prev.map(t => {
            if (t.label === openTrimester) {
              return {
                ...t,
                loading: false,
                moyenne: null,
                matieres: 0,
                bulletin: [],
                rang: null,
                appreciation: '',
                classStatistics: {
                  plusForteMoyenne: 'N/A',
                  plusFaibleMoyenne: 'N/A',
                  moyenneClasse: 'N/A'
                }
              };
            }
            return t;
          }));
          return;
        }
        
        // Grouper les notes par matière
        const subjectsMap = new Map();
        trimesterGrades.forEach((grade: any) => {
          const key = grade.sub_subject_name ? 
            `${grade.subject_name} - ${grade.sub_subject_name}` : 
            grade.subject_name;
          
          if (!subjectsMap.has(key)) {
            subjectsMap.set(key, {
              subject_name: grade.subject_name,
              sub_subject_name: grade.sub_subject_name,
              subject_type: grade.subject_type,
              coefficient: grade.coefficient || 1,
              notes: []
            });
          }
          subjectsMap.get(key).notes.push(grade);
        });
        
        // Utiliser les moyennes déjà calculées par l'API
        const bulletin = Array.from(subjectsMap.values()).map(subject => {
          // Utiliser la moyenne de l'API si disponible, sinon calculer
          const moyenne = subject.moyenne !== null && subject.moyenne !== undefined ? 
            Number(subject.moyenne) : 
            (() => {
              const total = subject.notes.reduce((sum: number, note: any) => sum + (note.grade * note.coefficient), 0);
              const totalCoeff = subject.notes.reduce((sum: number, note: any) => sum + note.coefficient, 0);
              return totalCoeff > 0 ? total / totalCoeff : 0;
            })();
          
          return {
            ...subject,
            moyenne: moyenne,
            moyCoeff: moyenne * subject.coefficient
          };
        });
        
        // Calculer la moyenne générale
        const totalMoyCoeff = bulletin.reduce((sum, subject) => sum + subject.moyCoeff, 0);
        const totalCoeff = bulletin.reduce((sum, subject) => sum + subject.coefficient, 0);
        const moyenneGenerale = totalCoeff > 0 ? totalMoyCoeff / totalCoeff : 0;
        
        // Récupérer le rang de l'étudiant
        const rankRes = await axios.get(`https://2ise-groupe.com/api/students/${selectedStudent.id}/trimester-rank?semester=${normalizedTrim}&school_year=${schoolYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Récupérer les statistiques de classe
        const classStatsRes = await axios.get(`https://2ise-groupe.com/api/students/class-statistics?class_id=${selectedStudent.class_id}&semester=${normalizedTrim}&school_year=${schoolYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Mettre à jour les données du trimestre
        setTrimestersData(prev => prev.map(t => {
          if (t.label === openTrimester) {
            return {
              ...t,
              loading: false,
              moyenne: moyenneGenerale,
              matieres: bulletin.length,
              bulletin: bulletin,
              rang: rankRes.data?.rank || null,
              appreciation: moyenneGenerale >= 16 ? 'Excellent' : 
                           moyenneGenerale >= 14 ? 'Bien' : 
                           moyenneGenerale >= 12 ? 'Assez bien' : 
                           moyenneGenerale >= 10 ? 'Passable' : 'Insuffisant',
              classStatistics: classStatsRes.data
            };
          }
          return t;
        }));
        
        console.log(`✅ Données rechargées pour le trimestre ${openTrimester}:`, {
          moyenne: moyenneGenerale,
          matieres: bulletin.length,
          rang: rankRes.data?.rank
        });
        
      } catch (error) {
        console.error(`❌ Erreur lors du rechargement des données pour ${openTrimester}:`, error);
        
        // Mettre à jour avec des données vides en cas d'erreur
        setTrimestersData(prev => prev.map(t => {
          if (t.label === openTrimester) {
            return {
              ...t,
              loading: false,
              moyenne: null,
              matieres: 0,
              bulletin: [],
              rang: null,
              appreciation: '',
              classStatistics: {
                plusForteMoyenne: 'N/A',
                plusFaibleMoyenne: 'N/A',
                moyenneClasse: 'N/A'
              }
            };
          }
          return t;
        }));
      }
    };
    
    loadTrimesterData();
  }, [openTrimester, selectedStudent?.id, schoolYear]); // ✅ Supprimer trimestersData des dépendances

  // Fonction pour réinitialiser les données des trimestres (déclarée avant utilisation)
  const resetTrimestersData = useCallback(() => {
    setTrimestersData([
      { label: '1er trimestre', color: '#1976d2', icon: '🎓', moyenne: null, matieres: 0, loading: false, bulletin: [], rang: null, appreciation: '', show: false },
      { label: '2e trimestre', color: '#388e3c', icon: '📈', moyenne: null, matieres: 0, loading: false, bulletin: [], rang: null, appreciation: '', show: false },
      { label: '3e trimestre', color: '#f57c00', icon: '📊', moyenne: null, matieres: 0, loading: false, bulletin: [], rang: null, appreciation: '', show: false },
    ]);
  }, []);

  // useEffect pour réinitialiser les données quand on ferme la sélection d'étudiant
  useEffect(() => {
    if (!selectedStudent) {
      resetTrimestersData();
      setOpenTrimester(null);
    }
  }, [selectedStudent, resetTrimestersData]);

  // Quand on change d'année scolaire, on met à jour l'URL (query string)
  const handleSchoolYearChange = (e: any) => {
    setSchoolYear(e.target.value);
    navigate(`/secretary/report-cards/${classId}?school_year=${e.target.value}`);
    // Réinitialiser les données des trimestres quand on change d'année
    resetTrimestersData();
  };

  // Fonction utilitaire pour dédupliquer les notes
  const deduplicateNotes = (notes: any[]) => {
    return notes.map(subject => ({
      ...subject,
      notes: subject.notes.filter((note: any, index: number, arr: any[]) => {
        // Garder seulement la première occurrence de chaque note unique
        return arr.findIndex(n => 
          n.id === note.id || 
          (n.sub_subject_name === note.sub_subject_name && 
           n.grade === note.grade && 
           n.coefficient === note.coefficient &&
           n.date === note.date)
        ) === index;
      })
    }));
  };

  const handleOpenNotesModal = (student: any) => {
    setNotesStudent(student);
    setOpenNotesModal(true);
    setSelectedTab(0);
    fetchStudentNotes(student.id, notesYear);
  };


  const fetchStudentNotes = async (studentId: number, year: string) => {
    const token = localStorage.getItem('token');
    try {
      // Récupérer toutes les notes individuelles (publiées et non publiées) directement depuis la table grades
      const res = await axios.get(
        `https://2ise-groupe.com/api/students/${studentId}/all-grades?school_year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Notes individuelles récupérées:', res.data);
      console.log('Nombre total de notes récupérées:', res.data.length);
      
      // Organiser les notes par trimestre
      const notesByTrimester: { [trimester: string]: any[] } = {};
      trimesters.forEach(trim => {
        // Normaliser le trimestre pour la correspondance avec la base de données
        let normalizedTrim = trim;
        if (trim === '2e trimestre') {
          normalizedTrim = '2 ème trimestre';
        } else if (trim === '3e trimestre') {
          normalizedTrim = '3 ème trimestre';
        }
        
        // Filtrer les notes pour ce trimestre
        const trimNotes = res.data.filter((n: any) => {
          const match = n.semester === trim || n.semester === normalizedTrim;
          return match;
        });
        
        console.log(`Notes filtrées pour ${trim}:`, trimNotes);
        console.log(`Nombre de notes pour ${trim}:`, trimNotes.length);
        
        // Debug: Afficher les semestres disponibles
        const availableSemesters = [...new Set(res.data.map((n: any) => n.semester))];
        console.log('Semestres disponibles dans les données:', availableSemesters);
        
        // Grouper les notes par matière
        const notesBySubject: { [subjectId: number]: any } = {};
        trimNotes.forEach((note: any) => {
          const subjectId = note.subject_id;
          if (!notesBySubject[subjectId]) {
            notesBySubject[subjectId] = {
              id: note.id,
              subject_id: note.subject_id,
              subject_name: note.subject_name,
              subject_type: note.subject_type,
              teacher_name: note.teacher_name,
              coefficient: note.coefficient || 1,
              semester: note.semester,
              academic_year: note.academic_year,
              moyenne: note.moyenne || note.grade,
              grade: note.grade,
              rang: note.rang,
              appreciation: note.appreciation,
              is_published: note.is_published,
              notes: []
            };
          }
          
          // Vérifier si cette note n'existe pas déjà pour éviter les doublons
          const existingNote = notesBySubject[subjectId].notes.find((existingNote: any) => 
            existingNote.id === note.id || 
            (existingNote.sub_subject_name === note.sub_subject_name && 
             existingNote.grade === note.grade && 
             existingNote.coefficient === note.coefficient)
          );
          
          if (!existingNote) {
            // Ajouter la note individuelle avec toutes les informations
            notesBySubject[subjectId].notes.push({
              id: note.id,
              grade: note.grade,
              coefficient: note.coefficient || 1,
              date: note.created_at,
              sub_subject_name: note.sub_subject_name,
              class_id: note.class_id,
              student_id: note.student_id,
              is_published: note.is_published,
              subject_id: note.subject_id,
              semester: note.semester,
              academic_year: note.academic_year
            });
          }
        });
        
        // Recalculer la moyenne pour chaque matière à partir des notes individuelles
        Object.values(notesBySubject).forEach((subject: any) => {
          if (subject.notes && subject.notes.length > 0) {
            // Calculer la moyenne pondérée
            const totalPoints = subject.notes.reduce((sum: number, note: any) => {
              const grade = parseFloat(note.grade) || 0;
              const coeff = parseFloat(note.coefficient) || 1;
              return sum + (grade * coeff);
            }, 0);
            
            const totalCoefficients = subject.notes.reduce((sum: number, note: any) => {
              return sum + (parseFloat(note.coefficient) || 1);
            }, 0);
            
            const calculatedMoyenne = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
            subject.moyenne = calculatedMoyenne;
            
            console.log(`📊 Moyenne recalculée pour ${subject.subject_name}:`, {
              notes: subject.notes.map((n: any) => ({ grade: n.grade, coeff: n.coefficient, sub: n.sub_subject_name })),
              totalPoints,
              totalCoefficients,
              calculatedMoyenne: calculatedMoyenne.toFixed(2)
            });
          }
        });
        
        // Pour la matière Français, calculer la moyenne des sous-matières
        Object.values(notesBySubject).forEach((subject: any) => {
          if (subject.subject_name === 'Français') {
            // Vérifier si le français a des sous-matières
            const hasSubSubjects = subject.notes && subject.notes.some((note: any) => note.sub_subject_name);
            
            if (hasSubSubjects && subject.notes && subject.notes.length > 0) {
              // Pour le français avec sous-matières : moyenne = somme des moyennes des sous-matières / nombre de sous-matières
              const subSubjectAverages: { [key: string]: number } = {};
              
              // Grouper les notes par sous-matière et calculer la moyenne de chaque sous-matière
              const subSubjectGroups: { [key: string]: any[] } = {};
              subject.notes.forEach((note: any) => {
                if (note.sub_subject_name && note.grade !== null && note.grade !== undefined) {
                  if (!subSubjectGroups[note.sub_subject_name]) {
                    subSubjectGroups[note.sub_subject_name] = [];
                  }
                  subSubjectGroups[note.sub_subject_name].push(note);
                }
              });
              
              // Calculer la moyenne de chaque sous-matière
              Object.keys(subSubjectGroups).forEach(subSubjectName => {
                const subSubjectNotes = subSubjectGroups[subSubjectName];
                
                if (subSubjectNotes.length > 0) {
                  const totalPoints = subSubjectNotes.reduce((sum: number, note: any) => {
                    const grade = parseFloat(note.grade) || 0;
                    const coeff = parseFloat(note.coefficient) || 1;
                    return sum + (grade * coeff);
                  }, 0);
                  
                  const totalCoefficients = subSubjectNotes.reduce((sum: number, note: any) => {
                    return sum + (parseFloat(note.coefficient) || 1);
                  }, 0);
                  
                  subSubjectAverages[subSubjectName] = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
                } else {
                  subSubjectAverages[subSubjectName] = 0;
                }
              });
              
              // Calculer la moyenne française = moyenne des moyennes des sous-matières
              const validSubSubjects = Object.values(subSubjectAverages).filter(avg => avg > 0);
              const frenchAverage = validSubSubjects.length > 0 ? 
                validSubSubjects.reduce((sum, avg) => sum + avg, 0) / validSubSubjects.length : 0;
              subject.moyenne = frenchAverage;
              
              console.log(`📊 Moyenne française calculée (sous-matières):`, {
                subSubjectAverages,
                frenchAverage: frenchAverage.toFixed(2),
                className: notesStudent?.classe_name,
                notes: subject.notes.map((n: any) => ({ 
                  sub: n.sub_subject_name, 
                  grade: n.grade, 
                  coeff: n.coefficient 
                })),
                calculation: {
                  subSubjectCount: validSubSubjects.length,
                  subSubjectAverages,
                  sum: validSubSubjects.reduce((sum, avg) => sum + avg, 0),
                  average: frenchAverage
                }
              });
            } else {
              // Pour le français sans sous-matières, calcul normal
              const notesWithGrades = subject.notes.filter((note: any) => note.grade !== null && note.grade !== undefined);
              
              if (notesWithGrades.length > 0) {
                const totalPoints = notesWithGrades.reduce((sum: number, note: any) => {
                  const grade = parseFloat(note.grade) || 0;
                  const coeff = parseFloat(note.coefficient) || 1;
                  return sum + (grade * coeff);
                }, 0);
                
                const totalCoefficients = notesWithGrades.reduce((sum: number, note: any) => {
                  return sum + (parseFloat(note.coefficient) || 1);
                }, 0);
                
                const calculatedMoyenne = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
                subject.moyenne = calculatedMoyenne;
                
                console.log(`📊 Moyenne française normale calculée:`, {
                  notesWithGrades: notesWithGrades.map((n: any) => ({ grade: n.grade, coeff: n.coefficient, sub: n.sub_subject_name })),
                  totalPoints,
                  totalCoefficients,
                  calculatedMoyenne: calculatedMoyenne.toFixed(2)
                });
              }
            }
          }
        });
        
        // Convertir en tableau
        notesByTrimester[trim] = Object.values(notesBySubject);
        console.log(`Notes organisées pour ${trim}:`, notesByTrimester[trim]);
      });
      
      // Dédupliquer les notes avant de les stocker
      const deduplicatedNotesByTrimester: { [trimester: string]: any[] } = {};
      Object.keys(notesByTrimester).forEach(trim => {
        deduplicatedNotesByTrimester[trim] = deduplicateNotes(notesByTrimester[trim]);
      });
      
      setAllNotes(deduplicatedNotesByTrimester);
      setNotes(deduplicatedNotesByTrimester[notesTrimester] || []);
      console.log('Notes actuelles affichées (dédupliquées):', deduplicatedNotesByTrimester[notesTrimester] || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des notes:', error);
      // Fallback: essayer avec l'API existante
      try {
        const fallbackRes = await axios.get(
          `https://2ise-groupe.com/api/students/${studentId}/grades?school_year=${year}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('Fallback - Notes récupérées:', fallbackRes.data);
        
        // Traiter les données de fallback de la même manière
        const notesByTrimester: { [trimester: string]: any[] } = {};
        trimesters.forEach(trim => {
          let normalizedTrim = trim;
          if (trim === '2e trimestre') {
            normalizedTrim = '2 ème trimestre';
          } else if (trim === '3e trimestre') {
            normalizedTrim = '3 ème trimestre';
          }
          
          const trimNotes = fallbackRes.data.filter((n: any) => {
            const match = n.semester === trim || n.semester === normalizedTrim;
            return match;
          });
          
          const notesBySubject: { [subjectId: number]: any } = {};
          trimNotes.forEach((note: any) => {
            const subjectId = note.subject_id;
            if (!notesBySubject[subjectId]) {
              notesBySubject[subjectId] = {
                id: note.id,
                subject_id: note.subject_id,
                subject_name: note.subject_name,
                subject_type: note.subject_type,
                teacher_name: note.teacher_name,
                coefficient: note.coefficient || 1,
                semester: note.semester,
                academic_year: note.academic_year,
                moyenne: note.moyenne || note.grade,
                grade: note.grade,
                rang: note.rang,
                appreciation: note.appreciation,
                is_published: note.is_published,
                notes: []
              };
            }
            
            // Vérifier si cette note n'existe pas déjà pour éviter les doublons
            const existingNote = notesBySubject[subjectId].notes.find((existingNote: any) => 
              existingNote.id === note.id || 
              (existingNote.sub_subject_name === note.sub_subject_name && 
               existingNote.grade === note.grade && 
               existingNote.coefficient === note.coefficient)
            );
            
            if (!existingNote) {
              notesBySubject[subjectId].notes.push({
                id: note.id,
                grade: note.grade,
                coefficient: note.coefficient || 1,
                date: note.created_at,
                sub_subject_name: note.sub_subject_name,
                class_id: note.class_id,
                student_id: note.student_id,
                is_published: note.is_published,
                subject_id: note.subject_id,
                semester: note.semester,
                academic_year: note.academic_year
              });
            }
          });
          
          // Recalculer la moyenne pour chaque matière à partir des notes individuelles (fallback)
          Object.values(notesBySubject).forEach((subject: any) => {
            if (subject.notes && subject.notes.length > 0) {
              if (subject.subject_name === 'Français') {
                // Vérifier si le français a des sous-matières
                const hasSubSubjects = subject.notes && subject.notes.some((note: any) => note.sub_subject_name);
                
                if (hasSubSubjects) {
                  // Pour le français avec sous-matières : moyenne = somme des moyennes des sous-matières / nombre de sous-matières
                  const subSubjectAverages: { [key: string]: number } = {};
                  
                  // Grouper les notes par sous-matière et calculer la moyenne de chaque sous-matière
                  const subSubjectGroups: { [key: string]: any[] } = {};
                  subject.notes.forEach((note: any) => {
                    if (note.sub_subject_name && note.grade !== null && note.grade !== undefined) {
                      if (!subSubjectGroups[note.sub_subject_name]) {
                        subSubjectGroups[note.sub_subject_name] = [];
                      }
                      subSubjectGroups[note.sub_subject_name].push(note);
                    }
                  });
                  
                  // Calculer la moyenne de chaque sous-matière
                  Object.keys(subSubjectGroups).forEach(subSubjectName => {
                    const subSubjectNotes = subSubjectGroups[subSubjectName];
                    
                    if (subSubjectNotes.length > 0) {
                      const totalPoints = subSubjectNotes.reduce((sum: number, note: any) => {
                        const grade = parseFloat(note.grade) || 0;
                        const coeff = parseFloat(note.coefficient) || 1;
                        return sum + (grade * coeff);
                      }, 0);
                      
                      const totalCoefficients = subSubjectNotes.reduce((sum: number, note: any) => {
                        return sum + (parseFloat(note.coefficient) || 1);
                      }, 0);
                      
                      subSubjectAverages[subSubjectName] = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
                    } else {
                      subSubjectAverages[subSubjectName] = 0;
                    }
                  });
                  
                  // Calculer la moyenne française = moyenne des moyennes des sous-matières
                  const validSubSubjects = Object.values(subSubjectAverages).filter(avg => avg > 0);
                  const frenchAverage = validSubSubjects.length > 0 ? 
                    validSubSubjects.reduce((sum, avg) => sum + avg, 0) / validSubSubjects.length : 0;
                  subject.moyenne = frenchAverage;
                  
                  console.log(`📊 Moyenne française calculée (sous-matières) (fallback):`, {
                    subSubjectAverages,
                    frenchAverage: frenchAverage.toFixed(2),
                    className: notesStudent?.classe_name,
                    calculation: {
                      subSubjectCount: validSubSubjects.length,
                      subSubjectAverages,
                      sum: validSubSubjects.reduce((sum, avg) => sum + avg, 0),
                      average: frenchAverage
                    }
                  });
                } else {
                  // Pour le français sans sous-matières, calcul normal
                  const totalPoints = subject.notes.reduce((sum: number, note: any) => {
                    const grade = parseFloat(note.grade) || 0;
                    const coeff = parseFloat(note.coefficient) || 1;
                    return sum + (grade * coeff);
                  }, 0);
                  
                  const totalCoefficients = subject.notes.reduce((sum: number, note: any) => {
                    return sum + (parseFloat(note.coefficient) || 1);
                  }, 0);
                  
                  const calculatedMoyenne = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
                  subject.moyenne = calculatedMoyenne;
                }
              } else {
                // Pour les autres matières, calcul normal
                const totalPoints = subject.notes.reduce((sum: number, note: any) => {
                  const grade = parseFloat(note.grade) || 0;
                  const coeff = parseFloat(note.coefficient) || 1;
                  return sum + (grade * coeff);
                }, 0);
                
                const totalCoefficients = subject.notes.reduce((sum: number, note: any) => {
                  return sum + (parseFloat(note.coefficient) || 1);
                }, 0);
                
                const calculatedMoyenne = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
                subject.moyenne = calculatedMoyenne;
              }
            }
          });
          
          notesByTrimester[trim] = Object.values(notesBySubject);
        });
        
        // Dédupliquer les notes avant de les stocker
        const deduplicatedNotesByTrimester: { [trimester: string]: any[] } = {};
        Object.keys(notesByTrimester).forEach(trim => {
          deduplicatedNotesByTrimester[trim] = deduplicateNotes(notesByTrimester[trim]);
        });
        
        setAllNotes(deduplicatedNotesByTrimester);
        setNotes(deduplicatedNotesByTrimester[notesTrimester] || []);
      } catch (fallbackError) {
        console.error('Erreur lors du fallback:', fallbackError);
        setSnackbar({ 
          open: true, 
          message: 'Erreur lors de la récupération des notes', 
          severity: 'error' 
        });
      }
    }
  };

  const handleEditNote = (note: any) => {
    setEditNote(note);
    setEditValue(note.grade || '');
    setEditCoeff(note.coefficient || 1);
  };

  const handleSaveEditNote = async () => {
    if (!editNote) return;
    
    // Vérifier si l'année scolaire est fermée
    if (selectedSchoolYearStatus && !selectedSchoolYearStatus.is_active) {
      setSnackbar({ 
        open: true, 
        message: `Impossible de modifier les notes : l'année scolaire ${schoolYear} est fermée.`, 
        severity: 'error' 
      });
      setEditNote(null);
      return;
    }
    
    // Vérifier si le bulletin est publié pour ce trimestre
    if (publishedTrimesters[editNote.semester]) {
      setSnackbar({ 
        open: true, 
        message: `Impossible de modifier les notes : le bulletin du ${editNote.semester} est déjà publié.`, 
        severity: 'error' 
      });
      setEditNote(null);
      return;
    }
    
    // Validation des données
    const newGrade = parseFloat(editValue);
    if (isNaN(newGrade) || newGrade < 0 || newGrade > 20) {
      setSnackbar({ 
        open: true, 
        message: 'La note doit être un nombre entre 0 et 20', 
        severity: 'error' 
      });
      return;
    }
    
    if (editCoeff <= 0) {
      setSnackbar({ 
        open: true, 
        message: 'Le coefficient doit être supérieur à 0', 
        severity: 'error' 
      });
      return;
    }
    
    setEditLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (editNote.id) {
        // Mettre à jour une note existante
        await axios.put(`https://2ise-groupe.com/api/teachers/grades/${editNote.id}`, {
          grade: newGrade,
          coefficient: editCoeff,
          subject_id: editNote.subject_id,
          class_id: editNote.class_id,
          semester: editNote.semester,
          academic_year: notesYear
        }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        // Ne pas permettre la création de nouvelles notes
        setSnackbar({ 
          open: true, 
          message: 'Seules les notes existantes peuvent être modifiées', 
          severity: 'error' 
        });
        setEditNote(null);
        return;
      }
      
      setSnackbar({ open: true, message: 'Note modifiée avec succès', severity: 'success' });
      
      // Rafraîchir les données
      if (notesStudent) {
        await fetchStudentNotes(notesStudent.id, notesYear);
        // Rafraîchir les données de l'étudiant pour mettre à jour le bulletin
        await refreshStudentData(notesStudent.id);
      }
      
      setEditNote(null);
    } catch (err: any) {
      console.error('Erreur lors de la modification de la note:', err);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || 'Erreur lors de la modification', 
        severity: 'error' 
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteNote = async (note: any) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la note de ${note.subject_name} (${note.moyenne || note.grade}/20) ?`)) return;
    
    // Vérifier si l'année scolaire est fermée
    if (selectedSchoolYearStatus && !selectedSchoolYearStatus.is_active) {
      setSnackbar({ 
        open: true, 
        message: `Impossible de supprimer les notes : l'année scolaire ${schoolYear} est fermée.`, 
        severity: 'error' 
      });
      return;
    }
    
    // Vérifier si le bulletin est publié pour ce trimestre
    if (publishedTrimesters[note.semester]) {
      setSnackbar({ 
        open: true, 
        message: `Impossible de supprimer les notes : le bulletin du ${note.semester} est déjà publié.`, 
        severity: 'error' 
      });
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // Supprimer la note de la base de données
      await axios.delete(`https://2ise-groupe.com/api/teachers/grades/${note.id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setSnackbar({ open: true, message: 'Note supprimée avec succès', severity: 'success' });
      
      // Rafraîchir les données
      if (notesStudent) {
        await fetchStudentNotes(notesStudent.id, notesYear);
        // Rafraîchir les données de l'étudiant pour mettre à jour le bulletin
        await refreshStudentData(notesStudent.id);
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression de la note:', err);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || 'Erreur lors de la suppression', 
        severity: 'error' 
      });
    }
  };

  // Fonction pour charger les données de tous les étudiants
  const loadAllStudentsData = async () => {
    
    
    if (!students.length) return;
    
    setLoadingAllData(true);
    const token = localStorage.getItem('token');
    
    try {
      const allData: { [studentId: number]: { [trimester: string]: any } } = {};
      
      // Charger les données pour chaque étudiant
      for (const student of students) {
        allData[student.id] = {};
        
        // Charger les données pour chaque trimestre
        for (const trimester of trimesters) {
          try {
            // Normaliser le trimestre pour la correspondance avec la base de données
            let normalizedTrim = trimester;
            if (trimester === '2e trimestre') {
              normalizedTrim = '2 ème trimestre';
            } else if (trimester === '3e trimestre') {
              normalizedTrim = '3 ème trimestre';
            }
            
            // Récupérer les notes de l'étudiant pour le trimestre spécifique
            const gradesRes = await axios.get(`https://2ise-groupe.com/api/students/${student.id}/grades?school_year=${schoolYear}&semester=${encodeURIComponent(normalizedTrim)}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            // L'API retourne déjà les notes filtrées par trimestre
            const notesTrim = gradesRes.data;
            
            // Calculer la moyenne pondérée avec les coefficients
            const totalCoef = notesTrim.reduce((sum: number, n: any) => sum + (n.coefficient || 1), 0);
            const totalMoyCoef = notesTrim.reduce((sum: number, n: any) => {
              // Utiliser 'moyenne' de l'API (qui est déjà calculée)
              const moy = Number(n.moyenne);
              const coef = n.coefficient || 1;
              return sum + (isNaN(moy) ? 0 : moy * coef);
            }, 0);
            const moy = totalCoef > 0 ? totalMoyCoef / totalCoef : null;
            
            // Récupérer les statistiques de classe pour ce trimestre
            let classStatistics = {
              plusForteMoyenne: 'N/A',
              plusFaibleMoyenne: 'N/A',
              moyenneClasse: 'N/A'
            };
            
            if (student.class_id) {
              try {
                const statsRes = await axios.get('https://2ise-groupe.com/api/students/class-statistics', {
                  params: {
                    class_id: student.class_id,
                    semester: trimester,
                    school_year: schoolYear
                  },
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                if (statsRes.data) {
                  classStatistics = {
                    plusForteMoyenne: statsRes.data.plusForteMoyenne || 'N/A',
                    plusFaibleMoyenne: statsRes.data.plusFaibleMoyenne || 'N/A',
                    moyenneClasse: statsRes.data.moyenneClasse || 'N/A'
                  };
                }
              } catch (statsError) {
                console.error(`Erreur lors de la récupération des statistiques pour ${trimester}:`, statsError);
              }
            }
            
            allData[student.id][trimester] = {
              bulletin: notesTrim,
              moyenne: moy,
              rang: notesTrim[0]?.rang || null,
              appreciation: notesTrim[0]?.appreciation || '',
              classStatistics: classStatistics
            };
            
          } catch (error) {
            console.error(`Erreur lors de la récupération des données pour ${student.last_name} ${student.first_name} - ${trimester}:`, error);
            allData[student.id][trimester] = {
              bulletin: [],
              moyenne: null,
              rang: null,
              appreciation: '',
              classStatistics: {
                plusForteMoyenne: 'N/A',
                plusFaibleMoyenne: 'N/A',
                moyenneClasse: 'N/A'
              }
            };
          }
        }
      }
      
      setAllStudentsData(allData);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erreur lors du chargement des données pour l\'impression', 
        severity: 'error' 
      });
    } finally {
      setLoadingAllData(false);
    }
  };



  // Fonction pour imprimer tous les bulletins d'une classe
  const handlePrintAllBulletins = async () => {

    
    if (!students.length) {
      setSnackbar({ 
        open: true, 
        message: 'Aucun étudiant dans cette classe pour imprimer les bulletins.', 
        severity: 'warning' 
      });
      return;
    }

    // Charger les données si elles ne sont pas encore chargées
    if (Object.keys(allStudentsData).length === 0) {
      await loadAllStudentsData();
    }

    setPrintingAllBulletins(true);
    
    try {
      // Trier les étudiants par ordre alphabétique (nom de famille)
      const sortedStudents = [...students].sort((a, b) => {
        const lastNameA = (a.last_name || '').toLowerCase();
        const lastNameB = (b.last_name || '').toLowerCase();
        return lastNameA.localeCompare(lastNameB);
      });
      
      // Générer le HTML pour tous les bulletins
      let allBulletinsHTML = '';
      let validBulletinsCount = 0;
      
      for (let i = 0; i < sortedStudents.length; i++) {
        const student = sortedStudents[i];
        const studentData = allStudentsData[student.id]?.[selectedTrimesterForPrint];
        
        // Récupérer les données de l'étudiant avec la classe
        const studentWithClass = {
          ...student,
          classe_name: className,
          principal_teacher_name: student.principal_teacher_name || 'Non assigné'
        };
        
        // Utiliser les données disponibles ou créer un bulletin vide
        const bulletinData = studentData?.bulletin || [];
        const rangData = studentData?.rang || null;
        const appreciationData = studentData?.appreciation || 'Aucune note disponible pour ce trimestre.';
        const moyenneData = studentData?.moyenne || null;
        const classStatsData = studentData?.classStatistics || {
          plusForteMoyenne: 'N/A',
          plusFaibleMoyenne: 'N/A',
          moyenneClasse: 'N/A'
        };
        
        // Générer le HTML pour ce bulletin (même sans notes)
        const bulletinHTML = generateSingleBulletinHTML(
          studentWithClass, 
          bulletinData, 
          selectedTrimesterForPrint, 
          rangData, 
          appreciationData, 
          moyenneData,
          classStatsData,
          studentWithClass.principal_teacher_name
        );
        
        // Ajouter le bulletin avec un séparateur
        allBulletinsHTML += `
          <div style="page-break-after: always; margin-bottom: 20px;">
            ${bulletinHTML}
          </div>
        `;
        
        validBulletinsCount++;
      }
      
      if (validBulletinsCount === 0) {
        setSnackbar({ 
          open: true, 
          message: 'Aucun étudiant trouvé dans cette classe.', 
          severity: 'warning' 
        });
        return;
      }
      
      // Créer la fenêtre d'impression avec tous les bulletins
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Bulletins de la classe ${className} - ${selectedTrimesterForPrint}</title>
              <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { 
                  font-family: Arial, sans-serif; 
                  font-size: 10px; 
                  color: black; 
                  background: white; 
                  padding: 8px;
                  line-height: 1.2;
                }
                table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  font-size: 8px; 
                  border: 1px solid black;
                  margin-bottom: 8px;
                }
                th, td { 
                  border: 1px solid black; 
                  padding: 2px 3px; 
                  text-align: left;
                }
                th { 
                  background-color: #f0f0f0; 
                  font-weight: bold; 
                  text-align: center;
                }
                .flex { display: flex; }
                .flex-1 { flex: 1; }
                .border { border: 1px solid black; }
                .border-l-none { border-left: none; }
                .padding { padding: 4px; }
                .margin-bottom { margin-bottom: 8px; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .font-italic { font-style: italic; }
                .text-small { font-size: 8px; }
                
                /* Styles spécifiques pour la moyenne trimestrielle */
                .moyenne-trimestrielle {
                  font-size: 16px !important;
                  font-weight: 900 !important;
                  color: #000000 !important;
                  text-shadow: 1px 1px 2px rgba(0,0,0,0.3) !important;
                  letter-spacing: 0.5px !important;
                }
                
                /* Styles pour l'impression */
                @media print {
                  body { 
                    margin: 0; 
                    padding: 5px;
                    font-size: 8px;
                    line-height: 1.1;
                  }
                  
                  * { 
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  
                  table {
                    font-size: 7px;
                    page-break-inside: avoid;
                    margin-bottom: 4px;
                  }
                  
                  th, td {
                    padding: 1px 2px;
                    border: 1px solid black !important;
                  }
                  
                  /* S'assurer que tout le texte est visible */
                  * {
                    color: black !important;
                  }
                  
                  /* Éviter les sauts de page dans les sections importantes */
                  div {
                    page-break-inside: avoid;
                  }
                  
                  /* Styles pour les bordures et cadres */
                  div[style*="border"] {
                    border: 1px solid black !important;
                  }
                  
                  /* Styles pour les en-têtes */
                  h1, h2, h3 {
                    page-break-after: avoid;
                    margin-bottom: 4px;
                  }
                  
                  /* Réduire les marges et espacements */
                  div[style*="margin"] {
                    margin: 2px !important;
                  }
                  
                  div[style*="padding"] {
                    padding: 2px !important;
                  }
                  
                  /* Forcer une seule page par bulletin */
                  @page {
                    size: A4;
                    margin: 5mm;
                  }
                  
                  /* Saut de page après chaque bulletin */
                  div[style*="page-break-after: always"] {
                    page-break-after: always !important;
                  }
                  
                  /* Styles spécifiques pour la moyenne trimestrielle et le rang lors de l'impression */
                  .moyenne-trimestrielle,
                  span[style*="font-size: 16px"] {
                    font-size: 14px !important;
                    font-weight: 900 !important;
                    color: #000000 !important;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.3) !important;
                    letter-spacing: 0.3px !important;
                  }
                  
                  /* Forcer les styles de la moyenne trimestrielle */
                  td[style*="font-size: 16px"] {
                    font-size: 14px !important;
                    font-weight: 900 !important;
                    color: #000000 !important;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.3) !important;
                  }
                }
              </style>
            </head>
            <body>
              ${allBulletinsHTML}
            </body>
          </html>
        `;
        
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Attendre que le contenu soit chargé
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();
        };
        
        // Fallback si onload ne fonctionne pas
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.print();
            printWindow.close();
          }
        }, 1000);
      } else {
        setSnackbar({ 
          open: true, 
          message: 'Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez que les popups sont autorisés.', 
          severity: 'error' 
        });
      }
      
      setSnackbar({ 
        open: true, 
        message: `${validBulletinsCount} bulletin(s) de la classe ${className} imprimé(s) avec succès pour le ${selectedTrimesterForPrint} (tous les élèves inclus)`, 
        severity: 'success' 
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'impression des bulletins:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erreur lors de l\'impression des bulletins', 
        severity: 'error' 
      });
    } finally {
      setPrintingAllBulletins(false);
    }
  };

  // Fonction pour générer le HTML d'un seul bulletin (copiée de BulletinPDF.tsx)
  const generateSingleBulletinHTML = (
    student: any,
    bulletin: any[],
    trimester: string,
    rangClasse: string | number | null,
    appreciation: string,
    moyenneClasse: number | null,
    classStatistics: any,
    principalTeacher: string
  ) => {
    console.log('🔍 DEBUG generateSingleBulletinHTML - Données reçues:', {
      studentName: `${student.first_name} ${student.last_name}`,
      className: student.classe_name,
      bulletinSubjects: bulletin.map(s => ({ name: s.subject_name, type: s.subject_type })),
      hasFrenchSubject: bulletin.some(s => s.subject_name === 'Français'),
      bulletinLength: bulletin.length,
      bulletinData: bulletin
    });
    
    // Log plus visible pour le débogage
    console.warn('🚨 FONCTION generateSingleBulletinHTML APPELÉE - Vérifiez la console !');
    const formatMoyenne = (moyenne: number | string | null | undefined) => {
      // Gérer les cas null/undefined
      if (moyenne === null || moyenne === undefined) {
        return '-';
      }
      
      if (typeof moyenne === 'string') {
        // Si c'est déjà une chaîne, vérifier si elle contient une virgule
        if (moyenne.includes(',')) {
          return moyenne;
        }
        // Sinon, convertir en nombre et formater
        const num = parseFloat(moyenne);
        return isNaN(num) ? '-' : num.toFixed(2).replace('.', ',');
      }
      // Si c'est un nombre
      return moyenne.toFixed(2).replace('.', ',');
    };
    
    const getAppreciation = (moyenne: number | string) => {
      const moy = typeof moyenne === 'string' ? parseFloat(moyenne.replace(',', '.')) : Number(moyenne);
      if (isNaN(moy)) return '';
      if (moy >= 16) return 'Très bien';
      if (moy >= 14) return 'Bien';
      if (moy >= 12) return 'Assez bien';
      if (moy >= 10) return 'Passable';
      if (moy >= 8) return 'Faible';
      return 'Médiocre';
    };

    const formatRang = (rang: string | number | null) => {
      if (rang === null || rang === undefined || rang === '') {
        return '-';
      }
      if (typeof rang === 'number') {
        if (rang === 1) return '1er';
        if (rang === 2) return '2ème';
        if (rang === 3) return '3ème';
        return `${rang}ème`;
      }
      if (typeof rang === 'string') {
        // Si c'est déjà formaté, le retourner tel quel
        if (rang.includes('er') || rang.includes('ème')) {
          return rang;
        }
        // Sinon, essayer de le convertir en nombre
        const num = parseInt(rang);
        if (isNaN(num)) return rang;
        if (num === 1) return '1er';
        if (num === 2) return '2ème';
        if (num === 3) return '3ème';
        return `${num}ème`;
      }
      return '-';
    };
    
    const getCurrentSchoolYear = () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      if (currentMonth >= 9) {
        return `${currentYear}-${currentYear + 1}`;
      } else {
        return `${currentYear - 1}-${currentYear}`;
      }
    };
    
    // Grouper les matières par type et générer les bilans
    const subjectsByType = {
      LITTERAIRES: [] as any[],
      SCIENTIFIQUES: [] as any[],
      AUTRES: [] as any[]
    };
    
    const individualSubjects = [] as any[];
    
    // Classer les matières par type et gérer les sous-matières de français
    bulletin.forEach((subject) => {
      const subjectType = subject.subject_type || 'AUTRES';
      
      // Vérifier si c'est une sous-matière de français
      if (subject.is_sub_subject && subject.parent_subject === 'Français') {
        // Ne pas traiter les sous-matières individuellement, elles seront groupées
        return;
      }
      
      // Vérifier si c'est la matière principale "Français"
      if (subject.subject_name === 'Français') {
        // Vérifier si c'est une classe du premier cycle
        const className = student.classe_name?.toLowerCase() || '';
        const isFirstCycle = className.includes('6ème') || className.includes('5ème') || 
                            className.includes('4ème') || className.includes('3ème') ||
                            className.includes('6eme') || className.includes('5eme') || 
                            className.includes('4eme') || className.includes('3eme') ||
                            className.includes('6e') || className.includes('5e') || 
                            className.includes('4e') || className.includes('3e') ||
                            className.includes('sixième') || className.includes('cinquième') ||
                            className.includes('quatrième') || className.includes('troisième') ||
                            className.includes('sixieme') || className.includes('cinquieme') ||
                            className.includes('quatrieme') || className.includes('troisieme') ||
                            className.includes('6 éme') || className.includes('5 éme') ||
                            className.includes('4 éme') || className.includes('3 éme') ||
                            className.includes('6 eme') || className.includes('5 eme') ||
                            className.includes('4 eme') || className.includes('3 eme');
        
        console.log('🔍 DEBUG Français - Classe détectée:', {
          className: student.classe_name,
          classNameLower: className,
          isFirstCycle,
          subjectName: subject.subject_name
        });
        
        // Log plus visible pour le débogage
        console.warn('🚨 MATIÈRE FRANÇAIS DÉTECTÉE - Vérifiez la console !', {
          className: student.classe_name,
          isFirstCycle
        });
        
        if (isFirstCycle) {
          // Définir les sous-matières de français disponibles
          const availableSubSubjects = [
            { name: 'Grammaire', coefficient: 1 },
            { name: 'Orthographe', coefficient: 1 },
            { name: 'Expression écrite', coefficient: 1 }
          ];
          
          // Récupérer les notes existantes pour les sous-matières
          const existingSubSubjects = subject.notes && Array.isArray(subject.notes) 
            ? subject.notes.filter((note: any) => note.sub_subject_name)
            : [];
          
          // Créer une entrée spéciale pour le français avec toutes les sous-matières
          const frenchEntry = {
            ...subject,
            subject_name: 'Français',
            moyenne: subject.moyenne, // Moyenne calculée des sous-matières
            coefficient: subject.coefficient,
            sub_subjects: availableSubSubjects.map((subSubject) => {
              // Chercher si cette sous-matière a des notes
              const existingNote = existingSubSubjects.find((note: any) => 
                note.sub_subject_name === subSubject.name
              );
              
              return {
                name: subSubject.name,
                moyenne: existingNote ? existingNote.moyenne : null,
                coefficient: subSubject.coefficient
              };
            })
          };
          
          console.log('✅ DEBUG Français - Sous-matières créées:', {
            subSubjects: frenchEntry.sub_subjects,
            frenchEntry: frenchEntry
          });
          
          if (subjectType === 'LITTERAIRES' || subjectType === 'SCIENTIFIQUES' || subjectType === 'AUTRES') {
            subjectsByType[subjectType as keyof typeof subjectsByType].push(frenchEntry);
          } else {
            individualSubjects.push(frenchEntry);
          }
          return;
        } else {
          // Pour les classes du second cycle, afficher le français normalement sans sous-matières
          console.log('ℹ️ DEBUG Français - Classe du second cycle, affichage normal');
          if (subjectType === 'LITTERAIRES' || subjectType === 'SCIENTIFIQUES' || subjectType === 'AUTRES') {
            subjectsByType[subjectType as keyof typeof subjectsByType].push(subject);
          } else {
            individualSubjects.push(subject);
          }
          return;
        }
      }
      
      if (subjectType === 'LITTERAIRES' || subjectType === 'SCIENTIFIQUES' || subjectType === 'AUTRES') {
        subjectsByType[subjectType as keyof typeof subjectsByType].push(subject);
      } else {
        individualSubjects.push(subject);
      }
    });
    
    // Fonction pour calculer les totaux d'un type
    const calculateTypeTotals = (typeSubjects: any[], type: string) => {
      if (typeSubjects.length === 0) return null;
      
      const totalCoef = typeSubjects.reduce((sum, subject) => {
        const coef = typeof subject.coefficient === 'string' ? parseFloat(subject.coefficient.replace(',', '.')) : Number(subject.coefficient || 1);
        return sum + (isNaN(coef) ? 1 : coef);
      }, 0);
      
      const totalMoyCoef = typeSubjects.reduce((sum, subject) => {
        const moy = typeof subject.moyenne === 'string' ? parseFloat(subject.moyenne.replace(',', '.')) : Number(subject.moyenne || 0);
        const coef = typeof subject.coefficient === 'string' ? parseFloat(subject.coefficient.replace(',', '.')) : Number(subject.coefficient || 1);
        return sum + ((isNaN(moy) ? 0 : moy) * (isNaN(coef) ? 1 : coef));
      }, 0);
      
      const moyenne = totalCoef > 0 ? totalMoyCoef / totalCoef : 0;
      
      return {
        moyenne: moyenne.toFixed(2).replace('.', ','),
        coefficient: totalCoef,
        moyCoeff: totalMoyCoef.toFixed(2).replace('.', ','),
        rang: '-'
      };
    };
    
    let tableRows = '';
    
    // Ajouter d'abord les matières individuelles
    individualSubjects.forEach((subject) => {
      // Vérifier si c'est le français avec des sous-matières
      if (subject.subject_name === 'Français' && subject.sub_subjects && subject.sub_subjects.length > 0) {
        // Afficher d'abord la ligne principale du français
        tableRows += `
          <tr>
            <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px; font-weight: bold;">${subject.subject_name}</td>
            <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; font-weight: bold; min-width: 60px; width: 60px; vertical-align: middle;">${formatMoyenne(subject.moyenne)}</td>
            <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; font-weight: bold; min-width: 50px; width: 50px; vertical-align: middle;">${subject.coefficient || 1}</td>
            <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; font-weight: bold; min-width: 70px; width: 70px; vertical-align: middle;">${formatMoyenne((subject.moyenne || 0) * (subject.coefficient || 1))}</td>
            <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; font-weight: bold; min-width: 60px; width: 60px; vertical-align: middle;">${formatRang(subject.rang)}</td>
            <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px; font-weight: bold;">${subject.teacher_name || '-'}</td>
            <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px; font-weight: bold;">${getAppreciation(subject.moyenne)}</td>
          </tr>
        `;
        
        // Afficher les sous-matières
        subject.sub_subjects.forEach((subSubject: any) => {
          tableRows += `
            <tr style="background-color: #f9f9f9;">
              <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 7px; padding-left: 15px;">• ${subSubject.name}</td>
              <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 7px; min-width: 60px; width: 60px; vertical-align: middle;">${formatMoyenne(subSubject.moyenne)}</td>
              <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 7px; min-width: 50px; width: 50px; vertical-align: middle;">${subSubject.coefficient || 1}</td>
              <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 7px; min-width: 70px; width: 70px; vertical-align: middle;">${formatMoyenne((subSubject.moyenne || 0) * (subSubject.coefficient || 1))}</td>
              <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 7px; min-width: 60px; width: 60px; vertical-align: middle;">-</td>
              <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 7px;">-</td>
              <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 7px;">${getAppreciation(subSubject.moyenne)}</td>
            </tr>
          `;
        });
      } else {
        // Matière normale
        tableRows += `
          <tr>
            <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px;">${subject.subject_name}</td>
            <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; min-width: 60px; width: 60px; vertical-align: middle;">${formatMoyenne(subject.moyenne)}</td>
            <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; min-width: 50px; width: 50px; vertical-align: middle;">${subject.coefficient || 1}</td>
            <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; min-width: 70px; width: 70px; vertical-align: middle;">${formatMoyenne((subject.moyenne || 0) * (subject.coefficient || 1))}</td>
            <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; min-width: 60px; width: 60px; vertical-align: middle;">${formatRang(subject.rang)}</td>
            <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px;">${subject.teacher_name || '-'}</td>
            <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px;">${getAppreciation(subject.moyenne)}</td>
          </tr>
        `;
      }
    });
    
    // Ajouter les matières par type avec leurs bilans
    const typeLabels = {
      LITTERAIRES: 'Bilan LITTERAIRES',
      SCIENTIFIQUES: 'Bilan SCIENTIFIQUES',
      AUTRES: 'Bilan AUTRES',
    };
    
    Object.entries(subjectsByType).forEach(([type, subjects]) => {
      if (subjects.length > 0) {
        // Ajouter les matières du type
        subjects.forEach((subject) => {
          // Vérifier si c'est le français avec des sous-matières
          if (subject.subject_name === 'Français' && subject.sub_subjects && subject.sub_subjects.length > 0) {
            // Afficher d'abord la ligne principale du français
            tableRows += `
              <tr>
                <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px; font-weight: bold;">${subject.subject_name}</td>
                <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; font-weight: bold;">${formatMoyenne(subject.moyenne)}</td>
                <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; font-weight: bold;">${subject.coefficient || 1}</td>
                <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; font-weight: bold;">${formatMoyenne((subject.moyenne || 0) * (subject.coefficient || 1))}</td>
                <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; font-weight: bold;">${formatRang(subject.rang)}</td>
                <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px; font-weight: bold;">${subject.teacher_name || '-'}</td>
                <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px; font-weight: bold;">${getAppreciation(subject.moyenne)}</td>
              </tr>
            `;
            
            // Afficher les sous-matières
            subject.sub_subjects.forEach((subSubject: any) => {
              tableRows += `
                <tr style="background-color: #f9f9f9;">
                  <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 7px; padding-left: 15px;">• ${subSubject.name}</td>
                  <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 7px;">${formatMoyenne(subSubject.moyenne)}</td>
                  <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 7px;">${subSubject.coefficient || 1}</td>
                  <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 7px;">${formatMoyenne((subSubject.moyenne || 0) * (subSubject.coefficient || 1))}</td>
                  <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 7px;">-</td>
                  <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 7px;">-</td>
                  <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 7px;">${getAppreciation(subSubject.moyenne)}</td>
                </tr>
              `;
            });
          } else {
            // Matière normale
            tableRows += `
              <tr>
                <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px;">${subject.subject_name}</td>
                <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px;">${formatMoyenne(subject.moyenne)}</td>
                <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px;">${subject.coefficient || 1}</td>
                <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px;">${formatMoyenne((subject.moyenne || 0) * (subject.coefficient || 1))}</td>
                <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px;">${formatRang(subject.rang)}</td>
                <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px;">${subject.teacher_name || '-'}</td>
                <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px;">${getAppreciation(subject.moyenne)}</td>
              </tr>
            `;
          }
        });
        
        // Calculer et ajouter le bilan du type
        const totals = calculateTypeTotals(subjects, type);
        if (totals) {
          tableRows += `
            <tr style="background-color: #f8f8f8; font-weight: bold;">
              <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px;">${typeLabels[type as keyof typeof typeLabels]}</td>
              <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; min-width: 60px; width: 60px; vertical-align: middle;">${totals.moyenne}</td>
              <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; min-width: 50px; width: 50px; vertical-align: middle;">${totals.coefficient}</td>
              <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; min-width: 70px; width: 70px; vertical-align: middle;">${totals.moyCoeff}</td>
              <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; min-width: 60px; width: 60px; vertical-align: middle;">${formatRang(totals.rang)}</td>
              <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px;"></td>
              <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px;"></td>
            </tr>
          `;
        }
      }
    });
    
    // Ajouter la ligne TOTAUX
    const allSubjects = [...individualSubjects, ...Object.values(subjectsByType).flat()];
    const totalCoef = allSubjects.reduce((acc, g) => acc + (g.coefficient || 1), 0);
    const totalMoyCoef = allSubjects.reduce((acc, g) => acc + (g.moyenne * (g.coefficient || 1)), 0);
    const moyenneTrimestrielle = totalCoef ? (totalMoyCoef / totalCoef) : 0;
    
    // Si pas de notes, afficher un message dans le tableau
    if (allSubjects.length === 0) {
      tableRows += `
        <tr>
          <td colspan="7" style="border: 1px solid black; padding: 8px; text-align: center; font-size: 9px; font-style: italic; color: #666;">
            Aucune note disponible pour ce trimestre
          </td>
        </tr>
      `;
    }
    
    tableRows += `
      <tr style="background-color: #e0e0e0; font-weight: bold;">
        <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px;">TOTAUX</td>
        <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; min-width: 60px; width: 60px; vertical-align: middle;"></td>
        <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; min-width: 50px; width: 50px; vertical-align: middle;">${totalCoef}</td>
        <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; min-width: 70px; width: 70px; vertical-align: middle;">${formatMoyenne(totalMoyCoef)}</td>
        <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; min-width: 60px; width: 60px; vertical-align: middle;"></td>
        <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px;"></td>
        <td style="border: 1px solid black !important; padding: 6px 8px !important; text-align: left !important; font-size: 11px !important; font-weight: 900 !important; color: #000 !important; background-color: #f8f8f8 !important;">
          <span style="font-size: 16px !important; font-weight: 900 !important; color: #000000 !important; text-shadow: 1px 1px 2px rgba(0,0,0,0.3) !important; letter-spacing: 0.5px !important;">MOY. TRIM.: ${allSubjects.length > 0 ? formatMoyenne(moyenneTrimestrielle) : 'N/A'}/20</span> | <span style="font-size: 16px !important; font-weight: 900 !important; color: #000000 !important; text-shadow: 1px 1px 2px rgba(0,0,0,0.3) !important; letter-spacing: 0.5px !important;">RANG: ${formatRang(rangClasse)}</span>
        </td>
      </tr>
    `;
    
    return `
      <div style="font-family: Arial, sans-serif; font-size: 10px; color: black; background: white; padding: 8px; max-width: 100%; margin: 0; border: 1px solid #222; page-break-inside: avoid;">
        
        <!-- En-tête officiel avec logo à gauche -->
        <div style="margin-bottom: 8px; border-bottom: 1px solid black; padding-bottom: 5px;">
          <!-- Logo et informations en ligne -->
          <div style="display: flex; align-items: center; margin-bottom: 5px;">
            <!-- Logo de l'école à gauche -->
            <div style="margin-right: 10px;">
              <img src="/2ISE.jpg" alt="Logo établissement" style="width: 50px; height: 50px; object-fit: contain;" />
            </div>
            <!-- Informations à droite -->
            <div style="flex: 1; text-align: center;">
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 2px;">REPUBLIQUE DE COTE D'IVOIRE</div>
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 2px;">MINISTERE DE L'EDUCATION NATIONALE ET DE L'ALPHABETISATION</div>
              <div style="font-size: 11px; font-weight: bold; margin-bottom: 2px;">Pensionnat Méthodiste de Filles Anyama</div>
              <div style="font-size: 8px; margin-bottom: 2px;">Adresse : 08 BP 840 ABIDJAN 08</div>
              <div style="font-size: 8px; margin-bottom: 2px;">Téléphone : 2723553697 | E-mail : pensionnatfilles@gmail.com</div>
            </div>
          </div>
        </div>
        
        <!-- Titre principal -->
        <div style="text-align: center; margin-bottom: 8px;">
          <h1 style="font-size: 12px; font-weight: bold; margin: 0;">BULLETIN DE NOTES: ${trimester} - Année scolaire: ${getCurrentSchoolYear()}</h1>
        </div>
        
        <!-- Ligne supérieure : Nom complet et Matricule -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #222; background: #f7f7f7; padding: 4px;">
          <div style="font-weight: bold; font-size: 11px; letter-spacing: 0.5px;">
            ${student.last_name} ${student.first_name}
          </div>
          <div style="font-weight: bold; font-size: 10px; letter-spacing: 0.5px;">
            Matricule : <span style="font-weight: 700;">${student.registration_number || '-'}</span>
          </div>
        </div>
        
        <!-- Tableau d'infos élève -->
        <div style="display: flex; border-bottom: 1px solid #222; background: #fff;">
          <!-- Colonne 1 -->
          <div style="flex: 2; border-right: 1px solid #bbb; padding: 4px; min-width: 120px;">
            <div style="font-weight: bold; font-size: 9px;">Classe : <span style="font-weight: 400;">${student.classe_name || '-'}</span></div>
            <div style="font-weight: bold; font-size: 9px;">Sexe : <span style="font-weight: 400;">${student.gender || '-'}</span></div>
            <div style="font-weight: bold; font-size: 9px;">Nationalité : <span style="font-weight: 400;">${student.nationality || '-'}</span></div>
            <div style="font-weight: bold; font-size: 9px;">Né(e) le : <span style="font-weight: 400;">${student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('fr-FR') : '-'}</span> à <span style="font-weight: 400;">${student.birth_place || '-'}</span></div>
          </div>
          <!-- Colonne 2 -->
          <div style="flex: 1.2; border-right: 1px solid #bbb; padding: 4px; min-width: 80px;">
            <div style="font-weight: bold; font-size: 9px;">Effectif : <span style="font-weight: 400;">${student.class_size || '-'}</span></div>
            <div style="font-weight: bold; font-size: 9px;">Redoublant(e) : <span style="font-weight: 400;">${student.is_repeater ? 'Oui' : 'Non'}</span></div>
            <div style="font-weight: bold; font-size: 9px;">Régime : <span style="font-weight: 400;">${student.regime || '-'}</span></div>
          </div>
          <!-- Colonne 3 -->
          <div style="flex: 1.2; border-right: 1px solid #bbb; padding: 4px; min-width: 80px;">
            <div style="font-weight: bold; font-size: 9px;">Interne : <span style="font-weight: 400;">${student.is_boarder ? 'Oui' : 'Non'}</span></div>
            <div style="font-weight: bold; font-size: 9px;">Affecté(e) : <span style="font-weight: 400;">${student.is_assigned ? 'Oui' : 'Non'}</span></div>
          </div>
          <!-- Colonne 4 : Photo -->
          <div style="flex: 0.8; display: flex; align-items: center; justify-content: center; padding: 4px; min-width: 60px; height: 80px;">
            ${(() => {
              // Déterminer l'URL de la photo
              let photoUrl = null;
              
              // Priorité 1: photoUrl directe
              if (student.photoUrl) {
                photoUrl = student.photoUrl;
              }
              // Priorité 2: API route si on a l'ID de l'étudiant (plus fiable)
              else if (student.id) {
                photoUrl = `https://2ise-groupe.com/api/students/${student.id}/photo`;
              }
              // Priorité 3: photo_path avec construction de l'URL (fallback)
              else if (student.photo_path) {
                photoUrl = `https://2ise-groupe.com/${student.photo_path}`;
              }
              
              if (photoUrl) {
                return `<img src="${photoUrl}" alt="Photo élève" style="width: 100%; height: 100%; object-fit: cover; border: 1px solid #222;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />`;
              } else {
                return '';
              }
            })()}
            <div style="width: 100%; height: 100%; border: 1px solid #222; background-color: #1976d2; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; display: none;">
              ${(student.last_name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
          </div>
        </div>
        
        <!-- Résultats scolaires -->
        <div style="text-align: center; font-weight: bold; font-size: 10px; margin: 4px 0; font-style: italic;">
          Résultats scolaires : ${getCurrentSchoolYear()}
        </div>
        
        <!-- Tableau des résultats scolaires -->
        <div style="margin-bottom: 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 8px; border: 1px solid #222;">
            <thead>
              <tr>
                <th style="border: 1px solid #222; padding: 2px 4px; text-align: center; font-weight: bold; background: #fff; font-size: 9px;">Matière</th>
                <th style="border: 1px solid #222; padding: 2px 4px; text-align: center; font-weight: bold; background: #fff; font-size: 9px; min-width: 60px; width: 60px;">Moy</th>
                <th style="border: 1px solid #222; padding: 2px 4px; text-align: center; font-weight: bold; background: #fff; font-size: 9px; min-width: 50px; width: 50px;">Coeff</th>
                <th style="border: 1px solid #222; padding: 2px 4px; text-align: center; font-weight: bold; background: #fff; font-size: 9px; min-width: 70px; width: 70px;">M. Coeff</th>
                <th style="border: 1px solid #222; padding: 2px 4px; text-align: center; font-weight: bold; background: #fff; font-size: 9px; min-width: 60px; width: 60px;">Rang</th>
                <th style="border: 1px solid #222; padding: 2px 4px; text-align: center; font-weight: bold; background: #fff; font-size: 9px;">Professeurs</th>
                <th style="border: 1px solid #222; padding: 2px 4px; text-align: center; font-weight: bold; background: #fff; font-size: 9px;">Appréciation / Emargement</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
        
        <!-- Section Absences et Appréciations -->
        <div style="display: flex; border-bottom: 1px solid black; background-color: #f7f7f7;">
          <div style="flex: 1; border-right: 1px solid #bbb; padding: 4px;">
            <div style="font-weight: bold; font-size: 9px; color: #000; margin-bottom: 4px;">ABSENCES</div>
            <div style="font-weight: bold; font-size: 8px; color: #000;">
              Justifiées : 0.00 Heure(s)
            </div>
            <div style="font-weight: bold; font-size: 8px; color: #000;">
              Non justifiées : 4.00 Heure(s)
            </div>
          </div>
          <div style="flex: 1; padding: 4px;">
            <div style="font-weight: bold; font-size: 9px; color: #000;">Appréciations :</div>
          </div>
        </div>
        
        <!-- Section Statistiques Classe, Distinctions, Sanctions -->
        <div style="display: flex; border-bottom: 1px solid black; background-color: #fff; min-height: 60px;">
          <!-- Statistiques Classe -->
          <div style="flex: 1; border-right: 1px solid #bbb; padding: 4px; display: flex; flex-direction: column; justify-content: flex-start;">
            <div style="font-weight: bold; font-size: 9px; margin-bottom: 4px;">
              Statistiques de la Classe
            </div>
            <div style="border-bottom: 1px solid #ccc; margin-bottom: 4px;"></div>
            <div style="font-size: 8px; margin-bottom: 2px;">
              Plus forte moyenne : ${classStatistics.plusForteMoyenne}
            </div>
            <div style="font-size: 8px; margin-bottom: 2px;">
              Plus faible moyenne : ${classStatistics.plusFaibleMoyenne}
            </div>
            <div style="font-size: 8px; margin-bottom: 2px;">
              Moyenne de la classe : ${classStatistics.moyenneClasse}
            </div>
          </div>
          
          <!-- Distinctions -->
          <div style="flex: 1; border-right: 1px solid #bbb; padding: 4px; display: flex; flex-direction: column; justify-content: flex-start;">
            <div style="font-weight: bold; font-size: 9px; margin-bottom: 4px;">Distinctions</div>
            <div style="border-bottom: 1px solid #ccc; margin-bottom: 4px;"></div>
            <div style="display: flex; align-items: center; margin-bottom: 2px;">
              <span style="margin-right: 5px;">☐</span>
              <span style="font-size: 8px;">Tableau d'honneur</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 2px;">
              <span style="margin-right: 5px;">☐</span>
              <span style="font-size: 8px;">Refusé</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 2px;">
              <span style="margin-right: 5px;">☑</span>
              <span style="font-size: 8px;">Tableau d'honneur + Encouragement</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 2px;">
              <span style="margin-right: 5px;">☐</span>
              <span style="font-size: 8px;">Tableau d'honneur + Félicitations</span>
            </div>
          </div>
          
          <!-- Sanctions -->
          <div style="flex: 1; padding: 4px; display: flex; flex-direction: column; justify-content: flex-start;">
            <div style="font-weight: bold; font-size: 9px; margin-bottom: 4px;">Sanctions</div>
            <div style="border-bottom: 1px solid #ccc; margin-bottom: 4px;"></div>
            <div style="display: flex; align-items: center; margin-bottom: 2px;">
              <span style="margin-right: 5px;">☐</span>
              <span style="font-size: 8px;">Avertissement pour travail insuffisant</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 2px;">
              <span style="margin-right: 5px;">☐</span>
              <span style="font-size: 8px;">Blâme pour Travail insuffisant</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 2px;">
              <span style="margin-right: 5px;">☐</span>
              <span style="font-size: 8px;">Avertissement pour mauvaise Conduite</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 2px;">
              <span style="margin-right: 5px;">☐</span>
              <span style="font-size: 8px;">Blâme pour mauvaise Conduite</span>
            </div>
          </div>
        </div>
        
        <!-- Section Appréciation du Conseil de classe et Visa du Chef d'établissement -->
        <div style="display: flex; background-color: #fff;">
          <!-- Appréciation du Conseil de classe -->
          <div style="flex: 1; border-right: 1px solid #bbb; padding: 4px; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-weight: bold; font-size: 9px; margin-bottom: 4px;">Appréciation du Conseil de classe</div>
            <div style="border-bottom: 1px solid #ccc; margin-bottom: 4px;"></div>
            <div style="font-size: 8px; margin-bottom: 10px;">
              ${appreciation || 'Bon travail. Persistez dans vos efforts.'}
            </div>
            <div style="font-size: 8px;">Le Professeur Principal :</div>
            <div style="margin-top: 5px; margin-bottom: 5px; height: 20px; border-bottom: 1px solid #000;"></div>
            <div style="font-size: 8px; font-weight: bold;">${principalTeacher}</div>
          </div>
          
          <!-- Visa du Chef d'établissement -->
          <div style="flex: 1; padding: 4px; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-weight: bold; font-size: 9px; margin-bottom: 4px; text-align: center;">VISA DU CHEF D'ETABLISSEMENT</div>
            <div style="border-bottom: 1px solid #ccc; margin-bottom: 4px;"></div>
            <div style="font-size: 8px; margin-bottom: 4px;">ABIDJAN, le 12/08/2025</div>
            <div style="font-size: 8px; margin-bottom: 4px;">La Directrice</div>
            <div style="margin-top: 5px; margin-bottom: 5px; height: 30px; border-bottom: 1px solid #000; position: relative;">
              <!-- QR Code placeholder -->
              <div style="position: absolute; bottom: 2px; right: 2px; width: 20px; height: 20px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 6px;">
                QR
              </div>
              <!-- Stamp placeholder -->
              <div style="position: absolute; top: 2px; right: 2px; width: 15px; height: 15px; border: 1px solid #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 4px;">
                STAMP
              </div>
            </div>
          </div>
        </div>
        
      </div>
    `;
  };

  // Fonction pour rafraîchir les données d'un étudiant après modification
  const refreshStudentData = useCallback(async (studentId: number) => {
    if (!selectedStudent || selectedStudent.id !== studentId) return;
    
    try {
      // Rafraîchir les données de l'étudiant sélectionné
      const token = localStorage.getItem('token');
      const studentDetailsRes = await axios.get(`https://2ise-groupe.com/api/students/${studentId}?school_year=${schoolYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const studentWithDetails = {
        ...studentDetailsRes.data,
        classe_name: className,
        principal_teacher_name: selectedStudent.principal_teacher_name
      };
      
      setSelectedStudent(studentWithDetails);
      
      // Rafraîchir aussi les données de tous les étudiants pour l'impression en masse
      if (Object.keys(allStudentsData).length > 0) {
        await loadAllStudentsData();
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données:', error);
    }
  }, [selectedStudent, schoolYear, className, allStudentsData]);

  // Fonction pour créer une référence pour un étudiant (maintenant remplacée par getMemoizedBulletinRefCallback)
  const createBulletinRef = useCallback((studentId: number, trimester: string) => {
    return getMemoizedBulletinRefCallback(studentId, trimester);
  }, [getMemoizedBulletinRefCallback]);

  // Mémoriser les données des trimestres pour éviter les re-renders inutiles
  const memoizedTrimestersData = useMemo(() => trimestersData, [trimestersData]);

  console.log('DEBUG publishedTrimesters:', publishedTrimesters);

  // Fonction pour récupérer l'ID de la matière Conduite
  const fetchConduiteSubjectId = async () => {
    setLoadingConduiteSubject(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://2ise-groupe.com/api/subjects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const conduiteSubject = response.data.find((subject: any) => 
        subject.name.toLowerCase() === 'conduite'
      );
      
      if (conduiteSubject) {
        setConduiteSubjectId(conduiteSubject.id);
        console.log('Matière Conduite trouvée avec ID:', conduiteSubject.id);
      } else {
        console.error('Matière Conduite non trouvée');
        setSnackbar({ 
          open: true, 
          message: 'Matière Conduite non trouvée dans la base de données', 
          severity: 'error' 
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la matière Conduite:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erreur lors de la récupération de la matière Conduite', 
        severity: 'error' 
      });
    } finally {
      setLoadingConduiteSubject(false);
    }
  };

  // Fonction pour ouvrir le modal des notes de conduite
  const handleOpenConduiteModal = async () => {
    if (!conduiteSubjectId) {
      await fetchConduiteSubjectId();
    }
    setOpenConduiteModal(true);
  };

  // Fonction pour sauvegarder les notes de conduite
  const handleSaveConduiteNotes = async () => {
    if (!conduiteSubjectId) {
      setSnackbar({ 
        open: true, 
        message: 'Matière Conduite non trouvée', 
        severity: 'error' 
      });
      return;
    }

    setSavingConduiteNotes(true);
    const token = localStorage.getItem('token');
    
    try {
      // Récupérer l'ID du trimestre
      const trimestersResponse = await axios.get('https://2ise-groupe.com/api/trimesters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const trimester = trimestersResponse.data.find((t: any) => t.name === conduiteTrimester);
      if (!trimester) {
        throw new Error('Trimestre non trouvé');
      }

      // Sauvegarder chaque note de conduite
      const promises = Object.entries(conduiteNotes).map(([studentId, note]) => {
        if (note !== undefined && note > 0) {
          const payload = {
            student_id: parseInt(studentId),
            class_id: parseInt(classId!),
            subject_id: conduiteSubjectId,
            grade: note,
            semester: conduiteTrimester,
            academic_year: schoolYear,
            coefficient: 1,
            trimester_id: trimester.id
          };
          
          return axios.post('https://2ise-groupe.com/api/teachers/conduct-grades', payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      
      setSnackbar({ 
        open: true, 
        message: 'Notes de conduite sauvegardées avec succès !', 
        severity: 'success' 
      });
      
      setOpenConduiteModal(false);
      setConduiteNotes({});
      
      // Rafraîchir les données des bulletins
      await loadAllStudentsData();
      
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde des notes de conduite:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Erreur lors de la sauvegarde des notes de conduite', 
        severity: 'error' 
      });
    } finally {
      setSavingConduiteNotes(false);
    }
  };

  const handlePublishBulletins = async (trimester: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`https://2ise-groupe.com/api/classes/${classId}/publish-bulletins`, {
        semester: trimester,
        school_year: schoolYear
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setPublishedTrimesters(prev => ({ ...prev, [trimester]: true }));
      setSnackbar({ 
        open: true, 
        message: `${res.data.publishedCount} bulletin(s) du ${trimester} publié(s) avec succès !`, 
        severity: 'success' 
      });
    } catch (err: any) {
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || "Erreur lors de la publication des bulletins.", 
        severity: 'error' 
      });
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #e3f0ff 0%, #f8e1ff 100%)', overflowX: 'auto' }}>
      <SecretarySidebar />
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 }, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 } }}>
          <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 5, boxShadow: '0 8px 32px rgba(80, 36, 204, 0.10)', background: 'rgba(255,255,255,0.95)' }}>
            <Typography variant="h4" fontWeight={800} sx={{ color: 'primary.main', mb: 3, letterSpacing: 1 }} gutterBottom>
              Gestion des bulletins - <span style={{ color: '#8e24aa' }}>{className}</span> <span style={{ color: '#888', fontSize: 18 }}>({schoolYear})</span>
            </Typography>
            <Box sx={{ mb: 2 }}>
              <FormControl sx={{ minWidth: 160 }} size="small">
                <InputLabel id="school-year-label">Année scolaire</InputLabel>
                <Select
                  labelId="school-year-label"
                  value={schoolYear}
                  label="Année scolaire"
                  onChange={handleSchoolYearChange}
                >
                  {SCHOOL_YEARS.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} sx={{ mb: 3 }} onClick={() => navigate('/secretary/report-cards')}>
              Retour aux classes
            </Button>
            
            {/* Section d'impression en masse */}
            <Box sx={{ 
              mb: 3, 
              p: 3, 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #e8f5e8 0%, #f3e5f5 100%)',
              border: '2px solid #4caf50',
              boxShadow: '0 4px 20px rgba(76, 175, 80, 0.15)'
            }}>
              <Typography variant="h6" fontWeight={700} color="primary.main" gutterBottom>
                🖨️ Impression en masse des bulletins
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Imprimer tous les bulletins d'une classe pour un trimestre spécifique
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 200 }} size="small">
                  <InputLabel>Trimestre</InputLabel>
                  <Select
                    value={selectedTrimesterForPrint}
                    label="Trimestre"
                    onChange={(e) => setSelectedTrimesterForPrint(e.target.value)}
                  >
                    {trimesters.map(trim => (
                      <MenuItem key={trim} value={trim}>{trim}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  variant="outlined"
                  color="primary"
                  size="medium"
                  disabled={loadingAllData || students.length === 0}
                  onClick={loadAllStudentsData}
                  sx={{
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    px: 3,
                    py: 1,
                    borderColor: '#1976d2',
                    color: '#1976d2',
                    '&:hover': {
                      borderColor: '#1565c0',
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    },
                    '&:disabled': {
                      borderColor: '#ccc',
                      color: '#ccc',
                    }
                  }}
                >
                  {loadingAllData ? (
                    <>
                      <CircularProgress size={16} sx={{ color: '#1976d2', mr: 1 }} />
                      Chargement...
                    </>
                  ) : (
                    'Précharger les données'
                  )}
                </Button>
                
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  disabled={printingAllBulletins || students.length === 0 || Object.keys(allStudentsData).length === 0}
                  onClick={handlePrintAllBulletins}
                  sx={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    px: 4,
                    py: 1.5,
                    background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                    boxShadow: '0 3px 15px rgba(76, 175, 80, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
                      boxShadow: '0 5px 20px rgba(76, 175, 80, 0.4)',
                    },
                    '&:disabled': {
                      background: '#ccc',
                      boxShadow: 'none',
                    }
                  }}
                >
                  {printingAllBulletins ? (
                    <>
                      <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
                      Impression en cours...
                    </>
                  ) : (
                    `Imprimer ${students.length} bulletin(s) du ${selectedTrimesterForPrint}`
                  )}
                </Button>
                
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                {Object.keys(allStudentsData).length > 0 ? (
                  <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    ✅ Données chargées pour {students.length} étudiant(s)
                  </Typography>
                ) : (
                  <Typography variant="caption" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    ⚠️ Cliquez sur "Précharger les données" avant d'imprimer
                  </Typography>
                )}
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                ⚠️ Les bulletins s'ouvriront dans des onglets séparés. Assurez-vous que votre navigateur autorise les popups.
              </Typography>
            </Box>
            
            {/* Section des notes de conduite */}
            <Box sx={{ 
              mb: 3, 
              p: 3, 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #fff3e0 0%, #fce4ec 100%)',
              border: '2px solid #ff9800',
              boxShadow: '0 4px 20px rgba(255, 152, 0, 0.15)'
            }}>
              <Typography variant="h6" fontWeight={700} color="primary.main" gutterBottom>
                🎯 Notes de conduite
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Attribuer des notes de conduite aux élèves de la classe
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 200 }} size="small">
                  <InputLabel>Trimestre</InputLabel>
                  <Select
                    value={conduiteTrimester}
                    label="Trimestre"
                    onChange={(e) => setConduiteTrimester(e.target.value)}
                  >
                    {trimesters.map(trim => (
                      <MenuItem key={trim} value={trim}>{trim}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  startIcon={<AddIcon />}
                  disabled={loadingConduiteSubject || students.length === 0}
                  onClick={handleOpenConduiteModal}
                  sx={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    px: 4,
                    py: 1.5,
                    background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
                    boxShadow: '0 3px 15px rgba(255, 152, 0, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #f57c00 30%, #ff9800 90%)',
                      boxShadow: '0 5px 20px rgba(255, 152, 0, 0.4)',
                    },
                    '&:disabled': {
                      background: '#ccc',
                      boxShadow: 'none',
                    }
                  }}
                >
                  {loadingConduiteSubject ? (
                    <>
                      <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
                      Chargement...
                    </>
                  ) : (
                    `Ajouter des notes de conduite (${students.length} élève(s))`
                  )}
                </Button>
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                💡 Les notes de conduite seront considérées comme des notes pour la matière "Conduite" et serviront de moyenne pour le trimestre.
              </Typography>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
                <CircularProgress size={40} thickness={5} sx={{ color: 'primary.main' }} />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <Stack spacing={3} direction="column" sx={{ mt: 2 }}>
                {students.map((student) => (
                  <Card
                    key={student.id}
                    elevation={2}
                    sx={{
                      borderRadius: 4,
                      background: 'linear-gradient(90deg, #e3f0ff 60%, #f8e1ff 100%)',
                      boxShadow: '0 4px 16px rgba(80,36,204,0.07)',
                      transition: 'transform 0.18s, box-shadow 0.18s',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px) scale(1.03)',
                        boxShadow: '0 8px 32px rgba(142,36,170,0.13)',
                        background: 'linear-gradient(90deg, #d1c4e9 60%, #b39ddb 100%)',
                      },
                    }}
                    onClick={async () => {
                      // Réinitialiser les données des trimestres avant de sélectionner un nouvel étudiant
                      resetTrimestersData();
                      
                      // Récupérer les détails complets de l'étudiant
                      const token = localStorage.getItem('token');
                      try {
                        const studentDetailsRes = await axios.get(`https://2ise-groupe.com/api/students/${student.id}?school_year=${schoolYear}`, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        
                        const studentWithDetails = {
                          ...studentDetailsRes.data,
                          classe_name: className,
                          principal_teacher_name: student.principal_teacher_name
                        };
                        
                        setSelectedStudent(studentWithDetails);
                      } catch (error) {
                        console.error('[REPORT CARDS] Erreur lors de la récupération des détails:', error);
                        // Fallback avec les données de base
                        setSelectedStudent({ ...student, classe_name: className, principal_teacher_name: student.principal_teacher_name });
                      }
                    }}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <PersonIcon color="primary" sx={{ fontSize: 36 }} />
                        <Box>
                          <Typography variant="h6" fontWeight={700} color="primary.main">
                            {student.last_name} {student.first_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Matricule : {student.registration_number}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={e => { e.stopPropagation(); handleOpenNotesModal(student); }}
                      >
                        Voir les notes
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
            
            {/* Bulletins cachés pour l'impression en masse */}
            {students.length > 0 && (() => {
              return (
                <div style={{ display: 'none' }}>
                  {students.map((student) => (
                    <div key={`bulletin-${student.id}`}>
                      {trimesters.map((trimester) => {
                        const studentData = allStudentsData[student.id]?.[trimester];
                        const refKey = `${student.id}-${trimester}`;
                        // Toujours rendre le composant, même sans données
                        return (
                          <BulletinPDF
                            key={`${student.id}-${trimester}`}
                            ref={getMemoizedBulletinRefCallback(student.id, trimester)}
                            student={{ 
                              ...student, 
                              classe_name: className, 
                              principal_teacher_name: student.principal_teacher_name 
                            }}
                            bulletin={studentData?.bulletin || []}
                            trimester={trimester}
                            rangClasse={studentData?.rang || null}
                            appreciation={studentData?.appreciation || ''}
                            moyenneClasse={studentData?.moyenne || null}
                            schoolYear={schoolYear} // ✅ Ajouter la prop schoolYear manquante
                            trimesterId={(() => {
                              switch (trimester) {
                                case '1er trimestre':
                                  return 1;
                                case '2e trimestre':
                                  return 3;
                                case '3e trimestre':
                                  return 4;
                                default:
                                  return 1;
                              }
                            })()}
                            showDownloadButton={false}
                            principalTeacher={student.principal_teacher_name || 'Non assigné'}
                            classStatistics={studentData?.classStatistics}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })()}
            {/* Section d'affichage des trimestres et du bulletin */}
            {selectedStudent && (
              <Box sx={{ mt: 4, mb: 2 }}>
                <Typography variant="h5" fontWeight={700} color="primary.main" gutterBottom>
                  Bulletins de {selectedStudent.last_name} {selectedStudent.first_name}
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 1, sm: 2, md: 3 }, 
                  flexWrap: { xs: 'wrap', sm: 'nowrap' }, 
                  justifyContent: 'center', 
                  mb: 2 
                }}>
                  {memoizedTrimestersData.map((trim, idx) => (
                    <Paper key={trim.label} sx={{ 
                      flex: { xs: '1 1 100%', sm: 1 }, 
                      minWidth: { xs: '100%', sm: 260 }, 
                      p: { xs: 2, sm: 3 }, 
                      borderRadius: 4, 
                      boxShadow: 2, 
                      borderTop: `6px solid ${trim.color}` 
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" fontWeight={700} color={trim.color}>{trim.label}</Typography>
                        <span style={{ fontSize: 24 }}>{trim.icon}</span>
                      </Box>
                      <Button
                        variant={publishedTrimesters[trim.label] ? "outlined" : "contained"}
                        color={publishedTrimesters[trim.label] ? "success" : "primary"}
                        disabled={publishedTrimesters[trim.label]}
                        onClick={() => handlePublishBulletins(trim.label)}
                        sx={{ width: '100%', mt: 1 }}
                      >
                        {publishedTrimesters[trim.label] ? "Déjà publié" : "Publier le bulletin"}
                      </Button>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => setOpenTrimester(trim.label)}
                        sx={{ width: '100%', mt: 1 }}
                      >
                        CONSULTER LE BULLETIN
                      </Button>
                    </Paper>
                  ))}
                </Box>
                {openTrimester && (
                  <Box sx={{ mt: { xs: 2, sm: 3 }, overflowX: 'auto', width: '100%' }}>
                    <BulletinPDF
                      student={selectedStudent}
                      bulletin={memoizedTrimestersData.find(t => t.label === openTrimester)?.bulletin || []}
                      trimester={openTrimester}
                      rangClasse={memoizedTrimestersData.find(t => t.label === openTrimester)?.rang || null}
                      appreciation={memoizedTrimestersData.find(t => t.label === openTrimester)?.appreciation || ''}
                      moyenneClasse={memoizedTrimestersData.find(t => t.label === openTrimester)?.moyenne || null}
                      schoolYear={schoolYear} // ✅ Ajouter la prop schoolYear manquante
                      trimesterId={(() => {
                        // Déterminer l'ID du trimestre à partir du nom
                        switch (openTrimester) {
                          case '1er trimestre':
                            return 1;
                          case '2e trimestre':
                            return 3; // ID correct dans la base de données
                          case '3e trimestre':
                            return 4; // ID correct dans la base de données
                          default:
                            return 1; // Par défaut
                        }
                      })()}
                      showDownloadButton={true}
                      onDownload={() => {
                        // Utiliser la fonction d'impression du composant BulletinPDF
                        if (printRef.current) {
                          printRef.current.handlePrintBulletin();
                        }
                      }}
                      principalTeacher={selectedStudent?.principal_teacher_name || 'Non assigné'}
                      compact={true}
                      classStatistics={memoizedTrimestersData.find(t => t.label === openTrimester)?.classStatistics}
                    />
                    <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setOpenTrimester(null)}>
                      Fermer le bulletin
                    </Button>
                  </Box>
                )}
                {/* Bulletin caché pour impression ciblée */}
                <div style={{ display: 'none' }}>
                  {openTrimester && (() => {
                    const trimesterData = memoizedTrimestersData.find(t => t.label === openTrimester);
                    
                    return (
                      <BulletinPDF
                        ref={printRef}
                        student={selectedStudent}
                        bulletin={trimesterData?.bulletin || []}
                        trimester={openTrimester}
                        rangClasse={trimesterData?.rang || null}
                        appreciation={trimesterData?.appreciation || ''}
                        moyenneClasse={trimesterData?.moyenne || null}
                        schoolYear={schoolYear} // ✅ Ajouter la prop schoolYear manquante
                        trimesterId={(() => {
                          // Déterminer l'ID du trimestre à partir du nom
                          switch (openTrimester) {
                            case '1er trimestre':
                              return 1;
                            case '2e trimestre':
                              return 3; // ID correct dans la base de données
                            case '3e trimestre':
                              return 4; // ID correct dans la base de données
                            default:
                              return 1; // Par défaut
                          }
                        })()}
                        showDownloadButton={false}
                        principalTeacher={selectedStudent?.principal_teacher_name || 'Non assigné'}
                        classStatistics={trimesterData?.classStatistics}
                      />
                    );
                  })()}
                </div>
                <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setSelectedStudent(null)}>
                  Fermer les bulletins
                </Button>
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <MuiAlert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</MuiAlert>
      </Snackbar>
      {/* Modale de gestion des notes */}
      <Dialog open={openNotesModal} onClose={() => setOpenNotesModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Notes de {notesStudent?.last_name} {notesStudent?.first_name}
        </DialogTitle>
        <DialogContent>
          <FormControl sx={{ minWidth: 160, mr: 2, mt: 1 }}>
            <InputLabel>Année scolaire</InputLabel>
            <Select
              value={notesYear}
              label="Année scolaire"
              onChange={e => {
                setNotesYear(e.target.value);
                if (notesStudent) {
                  fetchStudentNotes(notesStudent.id, e.target.value);
                }
              }}
            >
              {SCHOOL_YEARS.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <Tabs 
              value={selectedTab} 
              onChange={(e, newValue) => {
                setSelectedTab(newValue);
                setNotesTrimester(trimesters[newValue]);
                const notesForTrimester = allNotes[trimesters[newValue]] || [];
                setNotes(deduplicateNotes(notesForTrimester));
              }}
              sx={{ mb: 2 }}
            >
              {trimesters.map((trim, index) => (
                <Tab key={trim} label={trim} />
              ))}
            </Tabs>
          </Box>
          <Box sx={{ mt: 2 }}>
            {notes.length === 0 ? (
              <Typography color="text.secondary">Aucune note pour ce trimestre.</Typography>
            ) : (
              notes.map((matiere, idx) => {
                console.log('Données de la matière:', matiere);
                const isEditing = editNote?.id === matiere.id;
                const isDisabled = publishedTrimesters[notesTrimester] || (selectedSchoolYearStatus && !selectedSchoolYearStatus.is_active);
                
                return (
                  <Paper key={idx} sx={{ mb: 3, p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    {/* En-tête de la matière */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={700} color="primary.main">
                          {matiere.subject_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Professeur: {matiere.teacher_name || 'Non assigné'} | 
                          Type: {matiere.subject_type || 'Non défini'}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" fontWeight={700} color="success.main">
                          Moyenne: {(() => {
                            // Pour le français avec sous-matières, recalculer la moyenne correctement
                            if (matiere.subject_name === 'Français' && matiere.notes && matiere.notes.length > 0) {
                              // Vérifier si le français a des sous-matières
                              const hasSubSubjects = matiere.notes && matiere.notes.some((note: any) => note.sub_subject_name);
                              
                              if (hasSubSubjects) {
                                // Calculer la moyenne de chaque sous-matière
                                const subSubjectAverages: { [key: string]: number } = {} as { [key: string]: number };
                                
                                // Grouper les notes par sous-matière
                                const subSubjectGroups: { [key: string]: any[] } = {};
                                matiere.notes.forEach((note: any) => {
                                  if (note.sub_subject_name && note.grade !== null && note.grade !== undefined) {
                                    if (!subSubjectGroups[note.sub_subject_name]) {
                                      subSubjectGroups[note.sub_subject_name] = [];
                                    }
                                    subSubjectGroups[note.sub_subject_name].push(note);
                                  }
                                });
                                
                                // Calculer la moyenne de chaque sous-matière
                                Object.keys(subSubjectGroups).forEach(subSubjectName => {
                                  const subSubjectNotes = subSubjectGroups[subSubjectName];
                                  
                                  if (subSubjectNotes.length > 0) {
                                    const totalPoints = subSubjectNotes.reduce((sum: number, note: any) => {
                                      const grade = parseFloat(note.grade) || 0;
                                      const coeff = parseFloat(note.coefficient) || 1;
                                      return sum + (grade * coeff);
                                    }, 0);
                                    
                                    const totalCoefficients = subSubjectNotes.reduce((sum: number, note: any) => {
                                      return sum + (parseFloat(note.coefficient) || 1);
                                    }, 0);
                                    
                                    subSubjectAverages[subSubjectName] = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
                                  } else {
                                    subSubjectAverages[subSubjectName] = 0;
                                  }
                                });
                                
                                // Calculer la moyenne française = moyenne des moyennes des sous-matières
                                const validSubSubjects = Object.values(subSubjectAverages).filter(avg => avg > 0);
                                const frenchAverage = validSubSubjects.length > 0 ? 
                                  validSubSubjects.reduce((sum, avg) => sum + avg, 0) / validSubSubjects.length : 0;
                                
                                // Debug: Afficher le calcul
                                console.log('🔍 DEBUG Moyenne française calculée dans l\'interface:', {
                                  subSubjectAverages,
                                  frenchAverage: frenchAverage.toFixed(2),
                                  className: notesStudent?.classe_name,
                                  notes: matiere.notes.map((n: any) => ({ 
                                    sub: n.sub_subject_name, 
                                    grade: n.grade, 
                                    coeff: n.coefficient 
                                  })),
                                  calculation: {
                                    subSubjectCount: validSubSubjects.length,
                                    subSubjectAverages,
                                    sum: validSubSubjects.reduce((sum, avg) => sum + avg, 0),
                                    average: frenchAverage
                                  }
                                });
                                
                                return frenchAverage.toFixed(2);
                              }
                            }
                            return matiere.moyenne ? parseFloat(matiere.moyenne).toFixed(2) : 'N/A';
                          })()}/20
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Coefficient: {matiere.coefficient || 1}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Alerte si publié ou année fermée */}
                    {(publishedTrimesters[notesTrimester] || (selectedSchoolYearStatus && !selectedSchoolYearStatus.is_active)) && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          {publishedTrimesters[notesTrimester] 
                            ? `⚠️ Le bulletin du ${notesTrimester} est publié. Aucune modification n'est autorisée.`
                            : `⚠️ L'année scolaire ${schoolYear} est fermée. Aucune modification n'est autorisée.`
                          }
                        </Typography>
                      </Alert>
                    )}

                    {/* Tableau des notes individuelles */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                        {matiere.subject_name === 'Français' ? 'Sous-matières de français:' : 'Notes individuelles:'}
                      </Typography>
                      
                      {matiere.notes && matiere.notes.length > 0 ? (
                        <Paper sx={{ overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f5f5f5' }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontSize: '14px', fontWeight: 600 }}>
                                  {matiere.subject_name === 'Français' ? 'Sous-matière' : 'Date'}
                                </th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #e0e0e0', fontSize: '14px', fontWeight: 600 }}>
                                  Note
                                </th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #e0e0e0', fontSize: '14px', fontWeight: 600 }}>
                                  Coefficient
                                </th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #e0e0e0', fontSize: '14px', fontWeight: 600 }}>
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {matiere.notes.map((note: any, noteIdx: number) => {
                                const isEditingNote = editNote?.id === note.id;
                                const isDisabled = publishedTrimesters[notesTrimester] || (selectedSchoolYearStatus && !selectedSchoolYearStatus.is_active);
                                
                                // Debug: Log des données de la note
                                console.log(`[DEBUG] Note ${noteIdx}:`, {
                                  id: note.id,
                                  grade: note.grade,
                                  sub_subject_name: note.sub_subject_name,
                                  coefficient: note.coefficient,
                                  is_published: note.is_published
                                });
                                
                                return (
                                  <tr key={noteIdx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '12px', fontSize: '14px' }}>
                                      {note.sub_subject_name || (note.date ? new Date(note.date).toLocaleDateString('fr-FR') : 'Note générale')}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                      {isEditingNote ? (
                                        <TextField
                                          type="number"
                                          value={editValue}
                                          onChange={e => setEditValue(e.target.value)}
                                          disabled={isDisabled}
                                          size="small"
                                          sx={{ width: 80 }}
                                          inputProps={{ min: 0, max: 20, step: 0.1 }}
                                        />
                                      ) : (
                                        <Typography variant="body1" fontWeight={600} color={note.grade && note.grade > 0 ? "primary.main" : "text.secondary"}>
                                          {note.grade && note.grade > 0 ? `${note.grade}/20` : 'Pas de note'}
                                        </Typography>
                                      )}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                      {isEditingNote ? (
                                        <TextField
                                          type="number"
                                          value={editCoeff}
                                          onChange={e => setEditCoeff(Number(e.target.value))}
                                          disabled={isDisabled}
                                          size="small"
                                          sx={{ width: 80 }}
                                          inputProps={{ min: 0.1, max: 10, step: 0.1 }}
                                        />
                                      ) : (
                                        <Typography variant="body2">
                                          {note.coefficient}
                                        </Typography>
                                      )}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                      {isEditingNote ? (
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                          <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            onClick={handleSaveEditNote}
                                            disabled={editLoading}
                                            startIcon={editLoading ? <CircularProgress size={14} /> : null}
                                          >
                                            {editLoading ? '...' : 'Sauver'}
                                          </Button>
                                          <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => setEditNote(null)}
                                            disabled={editLoading}
                                          >
                                            Annuler
                                          </Button>
                                        </Box>
                                      ) : (
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                          {note.id ? (
                                            <>
                                              <Button
                                                variant="outlined"
                                                color="primary"
                                                size="small"
                                                onClick={() => handleEditNote(note)}
                                                disabled={isDisabled}
                                              >
                                                Modifier
                                              </Button>
                                              <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                onClick={() => handleDeleteNote(note)}
                                                disabled={isDisabled}
                                              >
                                                Supprimer
                                              </Button>
                                            </>
                                          ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                              Note non créée
                                            </Typography>
                                          )}
                                        </Box>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </Paper>
                      ) : (
                        <Box sx={{ 
                          p: 2, 
                          backgroundColor: '#f9f9f9', 
                          borderRadius: 1,
                          border: '1px solid #e0e0e0',
                          textAlign: 'center'
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            Aucune note individuelle disponible pour cette matière
                          </Typography>
                        </Box>
                      )}
                    </Box>

                  </Paper>
                );
              })
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNotesModal(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Modal pour les notes de conduite */}
      <Dialog 
        open={openConduiteModal} 
        onClose={() => setOpenConduiteModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          🎯 Notes de conduite - {conduiteTrimester}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Attribuez des notes de conduite aux élèves de la classe {className} pour le {conduiteTrimester}.
            Ces notes seront considérées comme des notes pour la matière "Conduite".
          </Typography>
          
          <Grid container spacing={2}>
            {students.map((student) => (
              <Grid item xs={12} sm={6} md={4} key={student.id}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      borderColor: '#ff9800',
                      boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)'
                    }
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                    {student.last_name} {student.first_name}
                  </Typography>
                  <TextField
                    type="number"
                    label="Note de conduite"
                    value={conduiteNotes[student.id] || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setConduiteNotes(prev => ({
                        ...prev,
                        [student.id]: isNaN(value) ? undefined : value
                      }));
                    }}
                    inputProps={{ 
                      min: 0, 
                      max: 20, 
                      step: 0.5 
                    }}
                    size="small"
                    fullWidth
                    helperText="Note sur 20"
                    sx={{ mt: 1 }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
          
          {students.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                Aucun élève trouvé dans cette classe.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => {
              setOpenConduiteModal(false);
              setConduiteNotes({});
            }}
            variant="outlined"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSaveConduiteNotes}
            variant="contained"
            color="warning"
            disabled={savingConduiteNotes || Object.keys(conduiteNotes).length === 0}
            startIcon={savingConduiteNotes ? <CircularProgress size={16} /> : null}
            sx={{
              background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #f57c00 30%, #ff9800 90%)',
              }
            }}
          >
            {savingConduiteNotes ? 'Sauvegarde...' : 'Sauvegarder les notes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportCardsStudents; 