import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Avatar, Paper, Checkbox, Button, useTheme, useMediaQuery } from '@mui/material';
import axios from 'axios';
import { useTrimesterId } from '../hooks/useTrimesterId';

interface ResultRow {
  subject: string;
  moyenne: number | string;
  coefficient: number | string;
  moyCoeff: number | string;
  rang: string | number;
  professeur: string;
  appreciation: string;
  type?: 'LITTERAIRES' | 'SCIENTIFIQUES' | 'AUTRES';
  isTotal?: boolean;
}


interface BulletinBodyProps {
  student: {
    nomComplet: string;
    matricule: string;
    classe: string;
    effectif: string | number;
    interne: string;
    redoublant: string;
    affecte: string;
    sexe: string;
    nationalite: string;
    dateNaissance: string;
    lieuNaissance: string;
    regime: string;
    photoUrl?: string;
    photo_path?: string; // Chemin de la photo dans la base de données
    id?: number; // ID de l'étudiant pour récupérer les absences
  };
  results: ResultRow[];
  year: string;
  synthese: {
    moyTrim: string;
    rang: string;
    totalCoef: string;
    totalMoyCoef: string;
  };
  trimesterId?: number; // ID du trimestre pour récupérer les absences
  // Nouvelles propriétés pour les sections supplémentaires
  absences?: {
    justifiees: string;
    nonJustifiees: string;
  };
  statistiquesClasse?: {
    plusForteMoyenne: string;
    plusFaibleMoyenne: string;
    moyenneClasse: string;
  };
  distinctions?: {
    tableauHonneur: boolean;
    refuse: boolean;
    tableauHonneurEncouragement: boolean;
    tableauHonneurFelicitations: boolean;
  };
  sanctions?: {
    avertissementTravail: boolean;
    blameTravail: boolean;
    avertissementConduite: boolean;
    blameConduite: boolean;
  };
  appreciationConseil?: string;
  professeurPrincipal?: string;
  dateValidation?: string;
  directeur?: string;
}

const BulletinBody: React.FC<BulletinBodyProps> = ({ 
  student, 
  results, 
  year, 
  synthese,
  trimesterId,
  absences: initialAbsences = { justifiees: '0 Heure(s)', nonJustifiees: '0 Heure(s)' },
  statistiquesClasse,
  distinctions = { tableauHonneur: false, refuse: false, tableauHonneurEncouragement: true, tableauHonneurFelicitations: false },
  sanctions = { avertissementTravail: false, blameTravail: false, avertissementConduite: false, blameConduite: false },
  appreciationConseil = "Assez bon travail, persistez dans l'effort!",
  professeurPrincipal = "M. N'GUESSAN KOUAKOU",
  dateValidation = `ABIDJAN, le ${new Date().toLocaleDateString('fr-FR')}`,
  directeur = "La Directrice"
}) => {

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Responsive cell styles
  const cellStyle = { 
    fontSize: isMobile ? 6 : 13, 
    padding: isMobile ? '1px 1px' : '4px 8px', 
    border: '1px solid #222',
    wordBreak: 'break-word',
    verticalAlign: 'middle'
  };
  const headerStyle = { 
    ...cellStyle,
    fontWeight: 'bold', 
    background: '#fff', 
    textAlign: 'center',
    fontSize: isMobile ? 9 : 13
  };

  const typeLabels = {
    LITTERAIRES: 'Bilan LITTERAIRES',
    SCIENTIFIQUES: 'Bilan SCIENTIFIQUES',
    AUTRES: 'Bilan AUTRES',
  };
  const [absences, setAbsences] = useState(initialAbsences);
  const [classStatistics, setClassStatistics] = useState({
    plusForteMoyenne: 'N/A',
    plusFaibleMoyenne: 'N/A',
    moyenneClasse: 'N/A'
  });
  const [studentRank, setStudentRank] = useState<string>('N/A');
  const [subjectRanks, setSubjectRanks] = useState<{[key: string]: string}>({});
  const [loadingStatistics, setLoadingStatistics] = useState(false);
  const [currentSchoolYear, setCurrentSchoolYear] = useState(year);
  const [classEffectif, setClassEffectif] = useState<string>('N/A');
  const [annualData, setAnnualData] = useState<{
    moyenne_annuelle: number;
    rank: number;
    total: number;
  } | null>(null);
  
  // Forcer la mise à jour de currentSchoolYear quand year change
  useEffect(() => {
    setCurrentSchoolYear(year);
    
    // Réinitialiser les données pour forcer le re-fetch
    setClassEffectif('N/A');
    setStudentRank('N/A');
    setSubjectRanks({});
    setClassStatistics({
      plusForteMoyenne: 'N/A',
      plusFaibleMoyenne: 'N/A',
      moyenneClasse: 'N/A'
    });
  }, [year]);
  
  // Déterminer le nom du trimestre à partir de l'année scolaire
  const getTrimesterName = () => {
    // Si on a un trimesterId, utiliser le trimestre correspondant
    if (trimesterId) {
      // Mapper l'ID du trimestre vers le nom
      switch (trimesterId) {
        case 1:
          return '1er trimestre';
        case 3:
          return '2 ème trimestre';
        case 4:
          return '3 ème trimestre';
        default:
          break;
      }
    }
    
    // Fallback : déterminer le trimestre à partir de la date actuelle
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    
    let trimesterName = '';
    if (currentMonth >= 9 && currentMonth <= 12) {
      trimesterName = '1er trimestre';
    } else if (currentMonth >= 1 && currentMonth <= 3) {
      // Gérer les deux formats possibles dans la base de données
      trimesterName = '2 ème trimestre'; // Format correct
    } else if (currentMonth >= 4 && currentMonth <= 6) {
      trimesterName = '3 ème trimestre';
    } else {
      trimesterName = '1er trimestre'; // Par défaut
    }
    
    return trimesterName;
  };

  // Fonction pour normaliser le nom du trimestre pour l'API
  const normalizeTrimesterName = (trimesterName: string): string => {
    let normalizedName = trimesterName;
    if (trimesterName === '2 ème trimestre') {
      normalizedName = '2 ème trimestre';
    } else if (trimesterName === '3 ème trimestre') {
      normalizedName = '3 ème trimestre';
    }
    return normalizedName;
  };

  // Utiliser le hook pour récupérer l'ID du trimestre
  const { trimesterId: currentTrimesterId, loading: trimesterLoading, error: trimesterError } = useTrimesterId(getTrimesterName());

    // Récupérer l'année scolaire courante depuis le backend
  useEffect(() => {
    const fetchCurrentSchoolYear = async () => {
      // Si on a déjà une année scolaire en props, l'utiliser en priorité
      if (year) {
        setCurrentSchoolYear(year);
        return;
      }
      
      try {
        const yearResponse = await axios.get('https://2ise-groupe.com/api/public/health');
        
        if (yearResponse.data && yearResponse.data.current_school_year) {
          setCurrentSchoolYear(yearResponse.data.current_school_year);
        } else {
          // Si l'API ne retourne pas d'année scolaire, utiliser 2024-2025 par défaut
          setCurrentSchoolYear('2024-2025');
        }
      } catch (error) {
        // En cas d'erreur, utiliser 2024-2025 par défaut
        setCurrentSchoolYear('2024-2025');
      }
    };

    fetchCurrentSchoolYear();
  }, [year]);

  // Récupérer les statistiques de classe depuis l'API
  useEffect(() => {
    
    const fetchClassStatistics = async () => {
      // Vérifier d'abord si on a des statistiques en props
      if (statistiquesClasse && 
          statistiquesClasse.plusForteMoyenne && 
          statistiquesClasse.plusFaibleMoyenne && 
          statistiquesClasse.moyenneClasse &&
          statistiquesClasse.plusForteMoyenne !== 'N/A' &&
          statistiquesClasse.plusFaibleMoyenne !== 'N/A' &&
          statistiquesClasse.moyenneClasse !== 'N/A') {
        
        setClassStatistics({
          plusForteMoyenne: statistiquesClasse.plusForteMoyenne,
          plusFaibleMoyenne: statistiquesClasse.plusFaibleMoyenne,
          moyenneClasse: statistiquesClasse.moyenneClasse
        });
        return;
      }
      
      if (!student.id) {
        setClassStatistics({
          plusForteMoyenne: 'N/A',
          plusFaibleMoyenne: 'N/A',
          moyenneClasse: 'N/A'
        });
        return;
      }

      setLoadingStatistics(true);
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setClassStatistics({
            plusForteMoyenne: 'N/A',
            plusFaibleMoyenne: 'N/A',
            moyenneClasse: 'N/A'
          });
          return;
        }
        
        // Utiliser l'année scolaire passée en prop ou l'année courante
        const schoolYearToUse = year || currentSchoolYear || '2024-2025';
        
        let studentResponse;
        let classId;
        
        try {
          // Essayer d'abord avec l'année scolaire
          studentResponse = await axios.get(`https://2ise-groupe.com/api/students/${student.id}`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { school_year: schoolYearToUse }
          });
          
          const studentData = studentResponse.data;
          classId = studentData.class_id;
          
        } catch (error) {
          // Essayer sans année scolaire
          try {
            studentResponse = await axios.get(`https://2ise-groupe.com/api/students/${student.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            const studentData = studentResponse.data;
            classId = studentData.class_id;
            
          } catch (secondError) {
            setClassStatistics({
              plusForteMoyenne: 'N/A',
              plusFaibleMoyenne: 'N/A',
              moyenneClasse: 'N/A'
            });
            return;
          }
        }
        
        if (!classId) {
          setClassStatistics({
            plusForteMoyenne: 'N/A',
            plusFaibleMoyenne: 'N/A',
            moyenneClasse: 'N/A'
          });
          return;
        }
        
        // Déterminer le trimestre à utiliser
        const currentTrimester = getTrimesterName();
        const normalizedTrimester = normalizeTrimesterName(currentTrimester);
        
        const statisticsResponse = await axios.get(`https://2ise-groupe.com/api/students/class-statistics`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            class_id: classId,
            semester: normalizedTrimester,
            school_year: schoolYearToUse
          }
        });
        
        const statsData = statisticsResponse.data;
        
        // Vérifier que les données sont valides et non nulles
        if (statsData && 
            statsData.plusForteMoyenne && 
            statsData.plusFaibleMoyenne && 
            statsData.moyenneClasse &&
            statsData.plusForteMoyenne !== 'N/A' &&
            statsData.plusFaibleMoyenne !== 'N/A' &&
            statsData.moyenneClasse !== 'N/A') {
          
          setClassStatistics({
            plusForteMoyenne: statsData.plusForteMoyenne,
            plusFaibleMoyenne: statsData.plusFaibleMoyenne,
            moyenneClasse: statsData.moyenneClasse
          });
        } else {
          setClassStatistics({
            plusForteMoyenne: 'N/A',
            plusFaibleMoyenne: 'N/A',
            moyenneClasse: 'N/A'
          });
        }
        
      } catch (error: any) {
        console.error('[BULLETIN] Erreur lors de la récupération des statistiques:', error);
        // En cas d'erreur, afficher des valeurs par défaut
        setClassStatistics({
          plusForteMoyenne: 'N/A',
          plusFaibleMoyenne: 'N/A',
          moyenneClasse: 'N/A'
        });
      } finally {
        setLoadingStatistics(false);
      }
    };

    fetchClassStatistics();
  }, [student.id, currentSchoolYear, year, statistiquesClasse, trimesterId]);

  // Récupérer le rang de l'étudiant dans la classe
  useEffect(() => {
    
    const fetchStudentRank = async () => {
      if (!student.id) {
        setStudentRank('N/A');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setStudentRank('N/A');
          return;
        }
        
        // Utiliser l'année scolaire passée en prop ou l'année courante
        const schoolYearToUse = year || currentSchoolYear || '2024-2025';
        
        let studentResponse;
        let classId;
        
        try {
          // Essayer d'abord avec l'année scolaire
          studentResponse = await axios.get(`https://2ise-groupe.com/api/students/${student.id}`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { school_year: schoolYearToUse }
          });
          
          const studentData = studentResponse.data;
          classId = studentData.class_id;
          
        } catch (error) {
          // Essayer sans année scolaire
          try {
            studentResponse = await axios.get(`https://2ise-groupe.com/api/students/${student.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            const studentData = studentResponse.data;
            classId = studentData.class_id;
            
          } catch (secondError) {
            setStudentRank('N/A');
            return;
          }
        }
        
        if (!classId) {
          setStudentRank('N/A');
          return;
        }
        
        // Déterminer le trimestre à utiliser
        const currentTrimester = getTrimesterName();
        const normalizedTrimester = normalizeTrimesterName(currentTrimester);
        
        // Récupérer le rang de l'étudiant
        const rankResponse = await axios.get(`https://2ise-groupe.com/api/students/${student.id}/trimester-rank`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            semester: normalizedTrimester,
            school_year: schoolYearToUse
          }
        });
        
        const rankData = rankResponse.data;
        
        if (rankData && rankData.rank) {
          setStudentRank(rankData.rank);
        } else {
          setStudentRank('N/A');
        }
        
      } catch (error: any) {
        console.error('[BULLETIN] Erreur lors de la récupération du rang:', error);
        setStudentRank('N/A');
      }
    };

    fetchStudentRank();
  }, [student.id, currentSchoolYear, year, trimesterId]);

  // Récupérer les rangs par matière
  useEffect(() => {
    
    const fetchSubjectRanks = async () => {
      if (!student.id) {
        setSubjectRanks({});
        return;
      }

      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setSubjectRanks({});
          return;
        }
        
        // Utiliser l'année scolaire passée en prop ou l'année courante
        const schoolYearToUse = year || currentSchoolYear || '2024-2025';
        
        let studentResponse;
        let classId;
        
        try {
          // Essayer d'abord avec l'année scolaire
          studentResponse = await axios.get(`https://2ise-groupe.com/api/students/${student.id}`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { school_year: schoolYearToUse }
          });
          
          const studentData = studentResponse.data;
          classId = studentData.class_id;
          
        } catch (error) {
          // Essayer sans année scolaire
          try {
            studentResponse = await axios.get(`https://2ise-groupe.com/api/students/${student.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            const studentData = studentResponse.data;
            classId = studentData.class_id;
            
          } catch (secondError) {
            setSubjectRanks({});
            return;
          }
        }
        
        if (!classId) {
          setSubjectRanks({});
          return;
        }
        
        // Déterminer le trimestre à utiliser
        const currentTrimester = getTrimesterName();
        const normalizedTrimester = normalizeTrimesterName(currentTrimester);
        
        // Récupérer les rangs par matière
        const ranksResponse = await axios.get(`https://2ise-groupe.com/api/students/${student.id}/subject-ranks`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            semester: normalizedTrimester,
            school_year: schoolYearToUse
          }
        });
        
        const ranksData = ranksResponse.data;
        
        if (ranksData && ranksData.ranks) {
          setSubjectRanks(ranksData.ranks);
        } else {
          setSubjectRanks({});
        }
        
      } catch (error: any) {
        console.error('[BULLETIN] Erreur lors de la récupération des rangs par matière:', error);
        setSubjectRanks({});
      }
    };

    fetchSubjectRanks();
  }, [student.id, currentSchoolYear, year, trimesterId]);

  // Récupérer l'effectif de la classe depuis l'API
  useEffect(() => {
    
    const fetchClassEffectif = async () => {
      if (!student.id) {
        setClassEffectif('N/A');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setClassEffectif('N/A');
          return;
        }
        
        // Utiliser l'année scolaire passée en prop ou l'année courante
        const schoolYearToUse = year || currentSchoolYear || '2024-2025';
        
        let studentResponse;
        let classId;
        
        try {
          // Essayer d'abord avec l'année scolaire
          studentResponse = await axios.get(`https://2ise-groupe.com/api/students/${student.id}`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { school_year: schoolYearToUse }
          });
          
          const studentData = studentResponse.data;
          classId = studentData.class_id;
          
        } catch (error) {
          // Essayer sans année scolaire
          try {
            studentResponse = await axios.get(`https://2ise-groupe.com/api/students/${student.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            const studentData = studentResponse.data;
            classId = studentData.class_id;
            
          } catch (secondError) {
            setClassEffectif('N/A');
            return;
          }
        }
        
        if (!classId) {
          setClassEffectif('N/A');
          return;
        }
        
        // Récupérer l'effectif de la classe via la nouvelle route
        
        let effectifData;
        
        try {
          // Première tentative : avec le paramètre school_year
          const url = `https://2ise-groupe.com/api/students/${student.id}/class-effectif`;
          const params = { school_year: schoolYearToUse };
          
          const effectifResponse = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
            params: params
          });
          
          effectifData = effectifResponse.data;
          
          // Vérifier si l'API retourne l'année scolaire demandée
          if (effectifData && effectifData.school_year) {
            // Si l'année ne correspond pas, essayer une approche alternative
            if (effectifData.school_year !== schoolYearToUse) {
              
              try {
                // Récupérer l'effectif via la classe directement
                const classEffectifResponse = await axios.get(`https://2ise-groupe.com/api/classes/${classId}/effectif`, {
                  headers: { Authorization: `Bearer ${token}` },
                  params: {
                    school_year: schoolYearToUse
                  }
                });
                
                                  const classEffectifData = classEffectifResponse.data;
                  
                  if (classEffectifData && classEffectifData.effectif) {
                    effectifData = {
                      ...effectifData,
                      effectif: classEffectifData.effectif,
                      school_year: schoolYearToUse
                    };
                  }
                              } catch (classError) {
                  // Si la route alternative ne fonctionne pas, essayer de calculer l'effectif manuellement
                
                try {
                  // Récupérer tous les étudiants de la classe pour l'année scolaire
                  const manualEffectifResponse = await axios.get(`https://2ise-groupe.com/api/classes/${classId}/students`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                      school_year: schoolYearToUse
                    }
                  });
                  
                  const studentsData = manualEffectifResponse.data;
                  
                  if (studentsData && Array.isArray(studentsData)) {
                    effectifData = {
                      ...effectifData,
                      effectif: studentsData.length,
                      school_year: schoolYearToUse
                    };
                  }
                                  } catch (manualError) {
                    // Dernière tentative : utiliser une requête SQL directe via une route alternative
                  
                  try {
                    const directResponse = await axios.get(`https://2ise-groupe.com/api/students/${student.id}/class-effectif-direct`, {
                      headers: { Authorization: `Bearer ${token}` },
                      params: {
                        school_year: schoolYearToUse
                      }
                    });
                    
                    const directData = directResponse.data;
                    
                    if (directData && directData.effectif) {
                      effectifData = {
                        ...effectifData,
                        effectif: directData.effectif,
                        school_year: schoolYearToUse
                      };
                    }
                  } catch (directError) {
                    // Erreur silencieuse
                  }
                }
              }
            }
          }
          
        } catch (error) {
          console.error('[BULLETIN] Erreur lors de la récupération de l\'effectif:', error);
          effectifData = null;
        }
        
        if (effectifData && effectifData.effectif) {
          setClassEffectif(effectifData.effectif);
        } else {
          setClassEffectif('N/A');
        }
        
      } catch (error: any) {
        console.error('[BULLETIN] Erreur lors de la récupération de l\'effectif de la classe:', error);
        setClassEffectif('N/A');
      }
    };

    fetchClassEffectif();
  }, [student.id, currentSchoolYear, year]);

  // Récupérer les absences depuis l'API
  useEffect(() => {
    const fetchAbsences = async () => {
      
              if (student.id && (trimesterId || currentTrimesterId)) {
          const targetTrimesterId = trimesterId || currentTrimesterId;
          
          try {
            const token = localStorage.getItem('token');
            
            const response = await axios.get(`https://2ise-groupe.com/api/absences/student/${student.id}/trimester/${targetTrimesterId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            const data = response.data;
            const newAbsences = {
              justifiees: `${data.justifiees || 0} Heure(s)`,
              nonJustifiees: `${data.nonJustifiees || 0} Heure(s)`
            };
            
            setAbsences(newAbsences);
          
                  } catch (error: any) {
            console.error('[BULLETIN] Erreur lors de la récupération des absences:', error);
            
            // En cas d'erreur, essayer avec l'ID 1 (premier trimestre) comme fallback
            if (targetTrimesterId !== 1) {
              try {
                const fallbackToken = localStorage.getItem('token');
                const fallbackResponse = await axios.get(`https://2ise-groupe.com/api/absences/student/${student.id}/trimester/1`, {
                  headers: { Authorization: `Bearer ${fallbackToken}` }
                });
                
                const fallbackData = fallbackResponse.data;
                const fallbackAbsences = {
                  justifiees: `${fallbackData.justifiees || 0} Heure(s)`,
                  nonJustifiees: `${fallbackData.nonJustifiees || 0} Heure(s)`
                };
                
                setAbsences(fallbackAbsences);
              } catch (fallbackError) {
                // Garder les valeurs par défaut
              }
            }
          }
        }
    };

    fetchAbsences();
  }, [student.id, trimesterId, currentTrimesterId]);

  // Récupérer la moyenne annuelle (seulement pour le 3e trimestre)
  useEffect(() => {
    const fetchAnnualData = async () => {
      if (!student.id || getTrimesterName() !== '3 ème trimestre') return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.get(`https://2ise-groupe.com/api/students/${student.id}/annual-average`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            school_year: currentSchoolYear
          }
        });
        
        if (response.data) {
          setAnnualData(response.data);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la moyenne annuelle:', error);
      }
    };

    fetchAnnualData();
  }, [student.id, currentSchoolYear, getTrimesterName()]);
  // Regrouper les matières par type
  const types: Array<'LITTERAIRES' | 'SCIENTIFIQUES' | 'AUTRES'> = ['LITTERAIRES', 'SCIENTIFIQUES', 'AUTRES'];
  const rowsByType: Record<string, ResultRow[]> = { LITTERAIRES: [], SCIENTIFIQUES: [], AUTRES: [] };
  

  
  // Traiter toutes les matières et les classer par type
  results.forEach(row => {
    if (row.isTotal) {
      // Ignorer la ligne de total pour le moment
      return;
    }
    
    // Classer par type pour les bilans
    if (row.type === 'LITTERAIRES') {
      rowsByType.LITTERAIRES.push(row);
    } else if (row.type === 'SCIENTIFIQUES') {
      rowsByType.SCIENTIFIQUES.push(row);
    } else if (row.type === 'AUTRES') {
      rowsByType.AUTRES.push(row);
    } else {
      // Si pas de type spécifié, mettre dans AUTRES
      rowsByType.AUTRES.push(row);
    }
  });
  
  // Dédupliquer les matières par nom
  const deduplicateSubjects = (subjects: ResultRow[]): ResultRow[] => {
    const subjectMap = new Map<string, ResultRow>();
    
    subjects.forEach(subject => {
      const key = subject.subject.toLowerCase().trim();
      const currentMoyenne = typeof subject.moyenne === 'string' ? parseFloat(subject.moyenne.replace(',', '.')) : Number(subject.moyenne);
      
      if (!subjectMap.has(key)) {
        // Première occurrence de cette matière
        subjectMap.set(key, subject);
      } else {
        // Matière déjà vue, comparer les moyennes
        const existingSubject = subjectMap.get(key)!;
        const existingMoyenne = typeof existingSubject.moyenne === 'string' ? parseFloat(existingSubject.moyenne.replace(',', '.')) : Number(existingSubject.moyenne);
        
        // Garder la meilleure note (la plus élevée)
        if (!isNaN(currentMoyenne) && (isNaN(existingMoyenne) || currentMoyenne > existingMoyenne)) {
          subjectMap.set(key, subject);
        }
      }
    });
    
    return Array.from(subjectMap.values());
  };
  
  // Appliquer la déduplication à chaque type
  rowsByType.LITTERAIRES = deduplicateSubjects(rowsByType.LITTERAIRES);
  rowsByType.SCIENTIFIQUES = deduplicateSubjects(rowsByType.SCIENTIFIQUES);
  rowsByType.AUTRES = deduplicateSubjects(rowsByType.AUTRES);

  // Fonction pour calculer l'appréciation basée sur la moyenne
  const getAppreciation = (moyenne: number | string): string => {
    const moy = typeof moyenne === 'string' ? parseFloat(moyenne.replace(',', '.')) : Number(moyenne);
    
    if (isNaN(moy)) return '';
    
    if (moy >= 16) return 'Très bien';
    if (moy >= 14) return 'Bien';
    if (moy >= 12) return 'Assez bien';
    if (moy >= 10) return 'Passable';
    if (moy >= 8) return 'Faible';
    return 'Médiocre';
  };

  // Fonction pour calculer l'appréciation du Conseil de classe basée sur la moyenne
    const getConseilAppreciation = (moyenne: number | string): string => {
    const moy = typeof moyenne === 'string' ? parseFloat(moyenne.replace(',', '.')) : Number(moyenne);

    if (isNaN(moy)) return "Assez bon travail, persistez dans l'effort!";

    if (moy >= 16) return "Excellent travail ! Félicitations du Conseil de classe.";
    if (moy >= 14) return "Bon travail. Persistez dans vos efforts.";
    if (moy >= 12) return "Assez bon travail. Efforts supplémentaires nécessaires.";
    if (moy >= 10) return "Travail passable. Efforts importants nécessaires.";
    if (moy >= 8) return "Travail insuffisant. Travail régulier indispensable.";
    return "Travail très insuffisant. Redoublement d'efforts nécessaire.";
  };

  // Fonction pour calculer automatiquement les distinctions basées sur la moyenne
  const calculateDistinctions = (moyenne: number | string) => {
    const moy = typeof moyenne === 'string' ? parseFloat(moyenne.replace(',', '.')) : Number(moyenne);
    
    if (isNaN(moy)) {
      return {
        tableauHonneur: false,
        refuse: false,
        tableauHonneurEncouragement: false,
        tableauHonneurFelicitations: false
      };
    }

    // Logique des distinctions basée sur la moyenne
    if (moy >= 16) {
      return {
        tableauHonneur: false,
        refuse: false,
        tableauHonneurEncouragement: false,
        tableauHonneurFelicitations: true // Félicitations pour moyenne >= 16
      };
    } else if (moy >= 14) {
      return {
        tableauHonneur: false,
        refuse: false,
        tableauHonneurEncouragement: true, // Encouragement pour moyenne >= 14
        tableauHonneurFelicitations: false
      };
    } else if (moy >= 12) {
      return {
        tableauHonneur: true, // Tableau d'honneur pour moyenne >= 12
        refuse: false,
        tableauHonneurEncouragement: false,
        tableauHonneurFelicitations: false
      };
    } else if (moy >= 10) {
      return {
        tableauHonneur: false,
        refuse: false,
        tableauHonneurEncouragement: false,
        tableauHonneurFelicitations: false
      };
    } else {
      return {
        tableauHonneur: false,
        refuse: true, // Refusé pour moyenne < 10
        tableauHonneurEncouragement: false,
        tableauHonneurFelicitations: false
      };
    }
  };

  // Fonction pour calculer les totaux d'un type
  const calculateTypeTotals = (typeRows: ResultRow[], type: 'LITTERAIRES' | 'SCIENTIFIQUES' | 'AUTRES') => {
    if (typeRows.length === 0) return null;
    
    const totalCoef = typeRows.reduce((sum, row) => {
      const coef = typeof row.coefficient === 'string' ? parseFloat(row.coefficient.replace(',', '.')) : Number(row.coefficient || 1);
      return sum + (isNaN(coef) ? 1 : coef);
    }, 0);
    
    const totalMoyCoef = typeRows.reduce((sum, row) => {
      const moy = typeof row.moyenne === 'string' ? parseFloat(row.moyenne.replace(',', '.')) : Number(row.moyenne || 0);
      const coef = typeof row.coefficient === 'string' ? parseFloat(row.coefficient.replace(',', '.')) : Number(row.coefficient || 1);
      return sum + ((isNaN(moy) ? 0 : moy) * (isNaN(coef) ? 1 : coef));
    }, 0);
    
    const moyenne = totalCoef > 0 ? totalMoyCoef / totalCoef : 0;
    
    // Utiliser le rang du bilan depuis les données récupérées
    const bilanRank = subjectRanks[typeLabels[type as keyof typeof typeLabels]] || 'N/A';
    
    return {
      moyenne: moyenne,
      coefficient: totalCoef,
      moyCoeff: totalMoyCoef,
      rang: bilanRank
    };
  };

  // Générer les lignes du tableau avec bilans dynamiques
  const tableRows: JSX.Element[] = [];
  
  // Fonction pour formater les moyennes et rangs
  const formatMoyenne = (moyenne: number | string): string => {
    if (typeof moyenne === 'string') {
      // Si c'est déjà une chaîne, vérifier si elle contient une virgule
      if (moyenne.includes(',')) {
        return moyenne;
      }
      // Sinon, convertir en nombre et formater
      const num = parseFloat(moyenne);
      return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
    }
    // Si c'est un nombre
    return moyenne.toFixed(2).replace('.', ',');
  };

  const formatRang = (rang: string | number | null): string => {
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
  
  // Ajouter les matières par type avec leurs bilans respectifs
  types.forEach(type => {
    if (rowsByType[type].length > 0) {
      // Ajouter les matières du type
      rowsByType[type].forEach((row, idx) => {
        const subjectRank = subjectRanks[row.subject] || row.rang;
        tableRows.push(
          <TableRow key={type + '_' + row.subject + '_' + idx}>
            <TableCell sx={cellStyle}>{row.subject}</TableCell>
            <TableCell sx={{ ...cellStyle, textAlign: 'center', minWidth: '60px', width: '60px' }}>{formatMoyenne(row.moyenne)}</TableCell>
            <TableCell sx={{ ...cellStyle, textAlign: 'center', minWidth: '50px', width: '50px' }}>{row.coefficient}</TableCell>
            <TableCell sx={{ ...cellStyle, textAlign: 'center', minWidth: '70px', width: '70px' }}>{formatMoyenne(row.moyCoeff)}</TableCell>
            <TableCell sx={{ ...cellStyle, textAlign: 'center', minWidth: '60px', width: '60px' }}>{formatRang(subjectRank)}</TableCell>
            <TableCell sx={{ ...cellStyle, minWidth: '150px', width: '150px' }}>{row.professeur}</TableCell>
            <TableCell sx={{ ...cellStyle, minWidth: '150px', width: '150px' }}>{getAppreciation(row.moyenne)}</TableCell>
          </TableRow>
        );
      });
      
      // Calculer et ajouter le bilan du type
      const totals = calculateTypeTotals(rowsByType[type], type);
      if (totals) {
        tableRows.push(
          <TableRow key={type + '_bilan'}>
            <TableCell sx={{ ...cellStyle, fontWeight: 'bold' }}>{typeLabels[type]}</TableCell>
            <TableCell sx={{ ...cellStyle, fontWeight: 'bold', textAlign: 'center', minWidth: '60px', width: '60px' }}>{formatMoyenne(totals.moyenne)}</TableCell>
            <TableCell sx={{ ...cellStyle, fontWeight: 'bold', textAlign: 'center', minWidth: '50px', width: '50px' }}>{totals.coefficient}</TableCell>
            <TableCell sx={{ ...cellStyle, fontWeight: 'bold', textAlign: 'center', minWidth: '70px', width: '70px' }}>{formatMoyenne(totals.moyCoeff)}</TableCell>
            <TableCell sx={{ ...cellStyle, fontWeight: 'bold', textAlign: 'center', minWidth: '60px', width: '60px' }}>{formatRang(totals.rang)}</TableCell>
            <TableCell sx={{ ...cellStyle, minWidth: '150px', width: '150px' }}></TableCell>
            <TableCell sx={{ ...cellStyle, minWidth: '150px', width: '150px' }}></TableCell>
          </TableRow>
        );
      }
    }
  });

  // Ligne TOTAUX (toujours à la fin)
  const totalRow = results.find(r => r.isTotal);
  
  // Calculer les totaux à partir de toutes les matières (sauf les bilans)
  const allSubjects = results.filter(r => !r.isTotal); // Toutes les matières sauf les bilans
  const totalCoef = allSubjects.reduce((sum, row) => {
    const coef = typeof row.coefficient === 'string' ? parseFloat(row.coefficient.replace(',', '.')) : Number(row.coefficient || 1);
    return sum + (isNaN(coef) ? 1 : coef);
  }, 0);
  
  const totalMoyCoef = allSubjects.reduce((sum, row) => {
    const moy = typeof row.moyenne === 'string' ? parseFloat(row.moyenne.replace(',', '.')) : Number(row.moyenne || 0);
    const coef = typeof row.coefficient === 'string' ? parseFloat(row.coefficient.replace(',', '.')) : Number(row.coefficient || 1);
    return sum + ((isNaN(moy) ? 0 : moy) * (isNaN(coef) ? 1 : coef));
  }, 0);
  
  // Utiliser les données de totalRow si elles existent, sinon calculer
  const finalTotalCoef = totalRow ? totalRow.coefficient : totalCoef;
  const finalTotalMoyCoef = totalRow ? totalRow.moyCoeff : totalMoyCoef.toFixed(2).replace('.', ',');
  
  // Toujours afficher la ligne TOTAUX
  tableRows.push(
    <TableRow key="totaux" sx={{ background: '#e0e0e0' }}>
      <TableCell sx={{ ...cellStyle, fontWeight: 'bold', borderRight: 'none' }}>TOTAUX</TableCell>
      <TableCell sx={{ ...cellStyle, borderLeft: 'none', minWidth: '60px', width: '60px' }}></TableCell>
      <TableCell sx={{ ...cellStyle, fontWeight: 'bold', textAlign: 'center', minWidth: '50px', width: '50px' }}>{finalTotalCoef}</TableCell>
      <TableCell sx={{ ...cellStyle, fontWeight: 'bold', textAlign: 'center', minWidth: '70px', width: '70px' }}>{formatMoyenne(finalTotalMoyCoef)}</TableCell>
      <TableCell sx={{ ...cellStyle, borderRight: 'none', minWidth: '60px', width: '60px' }}></TableCell>
      <TableCell sx={{ ...cellStyle, borderLeft: 'none', borderRight: 'none', minWidth: '150px', width: '150px' }}></TableCell>
      <TableCell sx={{ ...cellStyle, fontWeight: 'bold', borderLeft: 'none', minWidth: '150px', width: '150px' }}>
        MOY. TRIM.: {formatMoyenne(synthese.moyTrim)}/20 | RANG: {studentRank !== 'N/A' ? `${formatRang(studentRank)} /${classEffectif}` : 'N/A'}
        {getTrimesterName() === '3 ème trimestre' && annualData && annualData.moyenne_annuelle && (
          <Box sx={{ mt: 0.5, fontSize: isMobile ? 10 : 12 }}>
            MOY. ANNUELLE: {formatMoyenne(annualData.moyenne_annuelle)}/20 | RANG ANNUELLE: {formatRang(annualData.rank)}/{annualData.total}
          </Box>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <Paper elevation={0} sx={{ 
      p: isMobile ? 0.5 : 1, 
      fontFamily: 'Arial, sans-serif', 
      border: '1.5px solid #222', 
      mt: 2, 
      pl: 0,
      overflowX: isMobile ? 'auto' : 'visible', // Scroll seulement sur mobile
      width: '100%', // Utiliser toute la largeur disponible
      maxWidth: '100%' // Ne pas dépasser la largeur de l'écran
    }}>

      

      
      {/* Ligne supérieure : Nom complet et Matricule */}
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ 
        borderBottom: '1.5px solid #222', 
        background: '#f7f7f7', 
        px: isMobile ? 0.5 : 1, 
        py: isMobile ? 0.25 : 0.5,
        flexDirection: 'row', // Maintenir la disposition horizontale
        gap: 0
      }}>
        <Typography sx={{ 
          fontWeight: 'bold', 
          fontSize: isMobile ? 14 : 17, 
          letterSpacing: 0.5,
          textAlign: 'left'
        }}>
          {student.nomComplet}
        </Typography>
        <Typography sx={{ 
          fontWeight: 'bold', 
          fontSize: isMobile ? 13 : 16, 
          letterSpacing: 0.5,
          textAlign: 'right'
        }}>
          Matricule : <span style={{ fontWeight: 700 }}>{student.matricule}</span>
        </Typography>
      </Box>
      
      {/* Tableau d'infos élève */}
      <Box display="flex" alignItems="stretch" sx={{ 
        borderBottom: '1.5px solid #222', 
        background: '#fff',
        flexDirection: 'row' // Maintenir la disposition horizontale
      }}>
        {/* Colonne 1 */}
        <Box flex={2} sx={{ 
          borderRight: '1px solid #bbb', 
          borderBottom: 'none',
          p: isMobile ? 0.5 : 1, 
          minWidth: isMobile ? 160 : 180 
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 11 : 15 }}>Classe : <span style={{ fontWeight: 400 }}>{student.classe}</span></Typography>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 10 : 14 }}>Sexe : <span style={{ fontWeight: 400 }}>{student.sexe}</span></Typography>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 10 : 14 }}>Nationalité : <span style={{ fontWeight: 400 }}>{student.nationalite}</span></Typography>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 10 : 14 }}>Né(e) le : <span style={{ fontWeight: 400 }}>{student.dateNaissance}</span> à <span style={{ fontWeight: 400 }}>{student.lieuNaissance}</span></Typography>
        </Box>
        {/* Colonne 2 */}
        <Box flex={1.2} sx={{ 
          borderRight: '1px solid #bbb', 
          borderBottom: 'none',
          p: isMobile ? 0.5 : 1, 
          minWidth: isMobile ? 110 : 120 
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 10 : 14 }}>
            Effectif : <span style={{ fontWeight: 400 }}>{classEffectif}</span>
          </Typography>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 10 : 14 }}>Redoublant(e) : <span style={{ fontWeight: 400 }}>{student.redoublant}</span></Typography>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 10 : 14 }}>Régime : <span style={{ fontWeight: 400 }}>{student.regime}</span></Typography>
        </Box>
        {/* Colonne 3 */}
        <Box flex={1.2} sx={{ 
          borderRight: '1px solid #bbb', 
          borderBottom: 'none',
          p: isMobile ? 0.5 : 1, 
          minWidth: isMobile ? 140 : 120 
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 10 : 14 }}>Interne : <span style={{ fontWeight: 400 }}>{student.interne}</span></Typography>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 10 : 14 }}>Affecté(e) : <span style={{ fontWeight: 400 }}>{student.affecte}</span></Typography>
        </Box>
        {/* Colonne 4 : Photo */}
        <Box flex={0.8} display="flex" alignItems="center" justifyContent="center" sx={{ 
          p: isMobile ? 0.5 : 1, 
          minWidth: isMobile ? 70 : 90,
          maxWidth: isMobile ? 70 : 90,
          height: isMobile ? 80 : 120,
          maxHeight: isMobile ? 80 : 120,
          position: 'relative'
        }}>
          {/* Photo de l'étudiant - Utilisation de l'API route */}
          {(() => {
            // Utiliser l'API route pour récupérer la photo
            const photoUrl = student.id ? `https://2ise-groupe.com/api/students/${student.id}/photo` : null;
            
            if (photoUrl) {
              return (
                <Avatar 
                  src={photoUrl} 
                  alt="Photo élève" 
                  sx={{ 
                    width: isMobile ? 60 : 80, 
                    height: isMobile ? 70 : 100,
                    maxWidth: isMobile ? 60 : 80,
                    maxHeight: isMobile ? 70 : 100,
                    borderRadius: 0,
                    border: '1.5px solid #222',
                    objectFit: 'cover'
                  }}
                  onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    // Photo chargée avec succès
                  }}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    // En cas d'erreur, afficher les initiales
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const initialsElement = target.parentElement?.querySelector('.student-initials');
                    if (initialsElement) {
                      (initialsElement as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
              );
            } else {
              // Afficher directement les initiales si aucune URL n'est disponible
              return (
                <Avatar sx={{ 
                  width: isMobile ? 60 : 80, 
                  height: isMobile ? 70 : 100,
                  maxWidth: isMobile ? 60 : 80,
                  maxHeight: isMobile ? 70 : 100,
                  borderRadius: 0,
                  bgcolor: 'primary.main',
                  border: '1.5px solid #222',
                  fontSize: isMobile ? 12 : 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {student.nomComplet?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </Avatar>
              );
            }
          })()}
          
          {/* Élément de fallback pour les initiales */}
          <Avatar 
            className="student-initials"
            sx={{ 
              width: isMobile ? 60 : 80, 
              height: isMobile ? 70 : 100,
              maxWidth: isMobile ? 60 : 80,
              maxHeight: isMobile ? 70 : 100,
              borderRadius: 0,
              bgcolor: 'primary.main',
              border: '1.5px solid #222',
              fontSize: isMobile ? 12 : 16,
              display: 'none',
              position: 'absolute',
              top: 5,
              left: 5,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {student.nomComplet?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </Avatar>
        </Box>
      </Box>
      
      {/* Résultats scolaires */}
      <Typography sx={{ 
        fontWeight: 'bold', 
        fontSize: isMobile ? 13 : 15, 
        textAlign: 'center', 
        my: isMobile ? 0.5 : 1, 
        fontStyle: 'italic' 
      }}>
        Résultats scolaires : {year}
      </Typography>
      
      {/* Table with horizontal scroll for mobile */}
      <Box sx={{ overflowX: 'auto', mb: 0, width: '100%' }}>
        <Table size="small" sx={{ 
          border: '1.5px solid #222', 
          mb: 0,
          minWidth: '800px', // Largeur minimale pour éviter la compression
          width: '100%' // Utiliser toute la largeur disponible
        }}>
        <TableHead>
          <TableRow>
            <TableCell sx={headerStyle}>Matière</TableCell>
            <TableCell sx={{ ...headerStyle, minWidth: '60px', width: '60px' }}>Moy</TableCell>
            <TableCell sx={{ ...headerStyle, minWidth: '50px', width: '50px' }}>Coeff</TableCell>
            <TableCell sx={{ ...headerStyle, minWidth: '70px', width: '70px' }}>M. Coeff</TableCell>
            <TableCell sx={{ ...headerStyle, minWidth: '60px', width: '60px' }}>Rang</TableCell>
            <TableCell sx={{ ...headerStyle, minWidth: '150px', width: '150px' }}>Professeurs</TableCell>
            <TableCell sx={{ ...headerStyle, minWidth: '150px', width: '150px' }}>Appréciation / Emargement</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableRows}
        </TableBody>
      </Table>
      </Box>
      
      {/* Section Absences et Appréciations */}
      <Box display="flex" alignItems="stretch" sx={{ 
        borderBottom: '1.5px solid #222', 
        background: '#f7f7f7',
        flexDirection: 'row' // Maintenir la disposition horizontale
      }}>
        <Box flex={1} sx={{ 
          borderRight: '1px solid #bbb', 
          borderBottom: 'none',
          p: isMobile ? 0.5 : 1 
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 12 : 14, color: '#000', mb: 1 }}>ABSENCES</Typography>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 11 : 14, color: '#000' }}>
            Justifiées : {absences.justifiees}
          </Typography>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 11 : 14, color: '#000' }}>
            Non justifiées : {absences.nonJustifiees}
          </Typography>
        </Box>
        <Box flex={1} sx={{ p: isMobile ? 0.5 : 1 }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 12 : 14, color: '#000' }}>Appréciations :</Typography>
        </Box>
      </Box>
      
      {/* Section Statistiques Classe, Distinctions, Sanctions */}
      <Box display="flex" alignItems="stretch" sx={{ 
        borderBottom: '1.5px solid #222', 
        background: '#fff', 
        minHeight: isMobile ? 80 : 120,
        flexDirection: 'row' // Maintenir la disposition horizontale
      }}>
        {/* Statistiques Classe */}
        <Box flex={1} sx={{ 
          borderRight: '1px solid #bbb', 
          borderBottom: 'none',
          p: isMobile ? 0.5 : 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'flex-start' 
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 12 : 14, mb: 1 }}>
            Statistiques de la Classe
          </Typography>
          <Box sx={{ borderBottom: '1px solid #ccc', mb: 1 }}></Box>
          {loadingStatistics ? (
            <Typography sx={{ fontSize: isMobile ? 10 : 13, color: '#666', fontStyle: 'italic' }}>
              Chargement des statistiques...
            </Typography>
          ) : (
            <>
              <Typography sx={{ fontSize: isMobile ? 10 : 13, mb: 0.5 }}>
                Plus forte moyenne : {classStatistics.plusForteMoyenne}
              </Typography>
              <Typography sx={{ fontSize: isMobile ? 10 : 13, mb: 0.5 }}>
                Plus faible moyenne : {classStatistics.plusFaibleMoyenne}
              </Typography>
              <Typography sx={{ fontSize: isMobile ? 10 : 13, mb: 0.5 }}>
                Moyenne de la classe : {classStatistics.moyenneClasse}
              </Typography>
              
              {/* Messages d'erreur ou d'information */}
              {(classStatistics.plusForteMoyenne === 'N/A' || classStatistics.plusForteMoyenne === 'Erreur') && (
                <Typography sx={{ fontSize: isMobile ? 9 : 11, color: '#666', fontStyle: 'italic', mt: 1 }}>
                  {classStatistics.plusForteMoyenne === 'N/A' ? 'Aucune donnée disponible pour ce trimestre' : 'Erreur de connexion'}
                </Typography>
              )}
            </>
          )}
        </Box>
        
        {/* Distinctions */}
        <Box flex={1} sx={{ 
          borderRight: '1px solid #bbb', 
          borderBottom: 'none',
          p: isMobile ? 0.5 : 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'flex-start' 
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 12 : 14, mb: 1 }}>Distinctions</Typography>
          <Box sx={{ borderBottom: '1px solid #ccc', mb: 1 }}></Box>
          {(() => {
            const autoDistinctions = calculateDistinctions(synthese.moyTrim);
            return (
              <>
          <Box display="flex" alignItems="center" sx={{ mb: 0.5 }}>
                  <Checkbox checked={autoDistinctions.tableauHonneur} disabled sx={{ p: 0, mr: 1 }} />
                  <Typography sx={{ fontSize: isMobile ? 10 : 13 }}>Tableau d'honneur</Typography>
          </Box>
          <Box display="flex" alignItems="center" sx={{ mb: 0.5 }}>
                  <Checkbox checked={autoDistinctions.refuse} disabled sx={{ p: 0, mr: 1 }} />
                  <Typography sx={{ fontSize: isMobile ? 10 : 13 }}>Refusé</Typography>
          </Box>
          <Box display="flex" alignItems="center" sx={{ mb: 0.5 }}>
                  <Checkbox checked={autoDistinctions.tableauHonneurEncouragement} disabled sx={{ p: 0, mr: 1 }} />
                  <Typography sx={{ fontSize: isMobile ? 10 : 13 }}>Tableau d'honneur + Encouragement</Typography>
          </Box>
          <Box display="flex" alignItems="center" sx={{ mb: 0.5 }}>
                  <Checkbox checked={autoDistinctions.tableauHonneurFelicitations} disabled sx={{ p: 0, mr: 1 }} />
                  <Typography sx={{ fontSize: isMobile ? 10 : 13 }}>Tableau d'honneur + Félicitations</Typography>
          </Box>
              </>
            );
          })()}
        </Box>
        
        {/* Sanctions */}
        <Box flex={1} sx={{ 
          p: isMobile ? 0.5 : 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'flex-start' 
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 12 : 14, mb: 1 }}>Sanctions</Typography>
          <Box sx={{ borderBottom: '1px solid #ccc', mb: 1 }}></Box>
          <Box display="flex" alignItems="center" sx={{ mb: 0.5 }}>
            <Checkbox checked={sanctions.avertissementTravail} disabled sx={{ p: 0, mr: 1 }} />
            <Typography sx={{ fontSize: isMobile ? 10 : 13 }}>Avertissement pour travail insuffisant</Typography>
          </Box>
          <Box display="flex" alignItems="center" sx={{ mb: 0.5 }}>
            <Checkbox checked={sanctions.blameTravail} disabled sx={{ p: 0, mr: 1 }} />
            <Typography sx={{ fontSize: isMobile ? 10 : 13 }}>Blâme pour Travail insuffisant</Typography>
          </Box>
          <Box display="flex" alignItems="center" sx={{ mb: 0.5 }}>
            <Checkbox checked={sanctions.avertissementConduite} disabled sx={{ p: 0, mr: 1 }} />
            <Typography sx={{ fontSize: isMobile ? 10 : 13 }}>Avertissement pour mauvaise Conduite</Typography>
          </Box>
          <Box display="flex" alignItems="center" sx={{ mb: 0.5 }}>
            <Checkbox checked={sanctions.blameConduite} disabled sx={{ p: 0, mr: 1 }} />
            <Typography sx={{ fontSize: isMobile ? 10 : 13 }}>Blâme pour mauvaise Conduite</Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Section Appréciation du Conseil de classe et Visa du Chef d'établissement */}
      <Box display="flex" alignItems="stretch" sx={{ 
        background: '#fff',
        flexDirection: 'row' // Maintenir la disposition horizontale
      }}>
        {/* Appréciation du Conseil de classe */}
        <Box flex={1} sx={{ 
          borderRight: '1px solid #bbb', 
          borderBottom: 'none',
          p: isMobile ? 0.5 : 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center' 
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 12 : 14, mb: 1 }}>Appréciation du Conseil de classe</Typography>
          <Box sx={{ borderBottom: '1px solid #ccc', mb: 1 }}></Box>
          <Typography sx={{ fontSize: isMobile ? 10 : 13, mb: 2 }}>
            {getConseilAppreciation(synthese.moyTrim)}
          </Typography>
          <Typography sx={{ fontSize: isMobile ? 10 : 13 }}>Le Professeur Principal :</Typography>
          <Box sx={{ mt: 1, mb: 1, height: isMobile ? 30 : 40, borderBottom: '1px solid #000' }}></Box>
          <Typography sx={{ fontSize: isMobile ? 10 : 13, fontWeight: 'bold' }}>{professeurPrincipal}</Typography>
        </Box>
        
        {/* Visa du Chef d'établissement */}
        <Box flex={1} sx={{ 
          p: isMobile ? 0.5 : 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center' 
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? 12 : 14, mb: 1, textAlign: 'center' }}>VISA DU CHEF D'ETABLISSEMENT</Typography>
          <Box sx={{ borderBottom: '1px solid #ccc', mb: 1 }}></Box>
          <Typography sx={{ fontSize: isMobile ? 10 : 13, mb: 1 }}>{dateValidation}</Typography>
          <Typography sx={{ fontSize: isMobile ? 10 : 13, mb: 1 }}>{directeur}</Typography>
          <Box sx={{ mt: 1, mb: 1, height: isMobile ? 45 : 60, borderBottom: '1px solid #000', position: 'relative' }}>
            {/* QR Code placeholder */}
            <Box sx={{ 
              position: 'absolute', 
              bottom: 5, 
              right: 5, 
              width: isMobile ? 30 : 40, 
              height: isMobile ? 30 : 40, 
              border: '1px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? 6 : 8
            }}>
              QR
            </Box>
            {/* Stamp placeholder */}
            <Box sx={{ 
              position: 'absolute', 
              top: 5, 
              right: 5, 
              width: isMobile ? 20 : 30, 
              height: isMobile ? 20 : 30, 
              border: '2px solid #000',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? 4 : 6
            }}>
              STAMP
            </Box>
          </Box>
        </Box>
      </Box>
      </Paper>
  );
};

export default BulletinBody;