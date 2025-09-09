import React, { forwardRef, useState, useEffect, useImperativeHandle } from 'react';
import { Box, Typography, useTheme, useMediaQuery, Button, Divider } from '@mui/material';
import axios from 'axios';
import PrintIcon from '@mui/icons-material/Print';
import BulletinHeader from '../components/BulletinHeader';
import BulletinBody from '../components/BulletinBody';

interface BulletinPDFProps {
  student: any;
  bulletin: any[];
  trimester: string;
  rangClasse: string | number | null;
  appreciation: string;
  moyenneClasse: number | null;
  trimesterId?: number; // ID du trimestre pour récupérer les absences
  showDownloadButton?: boolean;
  onDownload?: () => void;
  principalTeacher?: string; // Professeur principal de la classe
  compact?: boolean; // Option pour réduire la taille du bulletin
  schoolYear?: string; // Année scolaire sélectionnée par l'utilisateur
  classStatistics?: {
    plusForteMoyenne: string;
    plusFaibleMoyenne: string;
    moyenneClasse: string;
  }; // Statistiques de classe
}

// Type pour la ref qui expose notre fonction
export interface BulletinPDFRef {
  handlePrintBulletin: () => Promise<void>;
}

const BulletinPDF = forwardRef<BulletinPDFRef, BulletinPDFProps>(
  (props, ref) => {
    const { student, bulletin, trimester, rangClasse, appreciation, moyenneClasse, trimesterId, showDownloadButton = true, onDownload, principalTeacher, compact = false, schoolYear, classStatistics } = props;
    
    // Debug: Log de la prop schoolYear reçue
    console.log('BulletinPDF - schoolYear reçue:', schoolYear);
    
    // État pour les statistiques de classe
    const [classStatisticsState, setClassStatisticsState] = useState({
      plusForteMoyenne: 'N/A',
      plusFaibleMoyenne: 'N/A',
      moyenneClasse: 'N/A'
    });
    const [loadingStatistics, setLoadingStatistics] = useState(false);
    
    // Utiliser les statistiques passées en props ou celles de l'état
    const finalClassStatistics = classStatistics || classStatisticsState;
    const [downloading, setDownloading] = useState(false);
    
    // Utiliser le professeur principal passé en prop ou une valeur par défaut
    const principalTeacherName = principalTeacher || 'Non assigné';
    
    // Forcer la mise à jour quand schoolYear change
    useEffect(() => {
      console.log('BulletinPDF - schoolYear a changé:', schoolYear);
    }, [schoolYear]);
    

    

    
    const totalCoef = bulletin.reduce((acc: number, m: any) => acc + (m.coefficient || 1), 0);
    const totalMoyCoef = bulletin.reduce((acc: number, m: any) => acc + ((m.moyenne || 0) * (m.coefficient || 1)), 0);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Fonction pour calculer le trimesterId à partir du nom du trimestre
    const calculateTrimesterId = (trimesterName: string): number => {
      switch (trimesterName) {
        case '1er trimestre':
          return 1;
        case '2 ème trimestre':
          return 3; // ID correct dans la base de données
        case '3 ème trimestre':
          return 4; // ID correct dans la base de données
        default:
          return 1; // Par défaut
      }
    };

    // Fonction pour déterminer le nom du trimestre
    const getTrimesterName = () => {
      // Si on a un trimesterId, utiliser le trimestre correspondant
      if (trimesterId) {
        // Mapper l'ID du trimestre vers le nom
        switch (trimesterId) {
          case 1:
            return '1er trimestre';
          case 2:
            return '2 ème trimestre';
          case 3:
            return '3 ème trimestre';
          default:
            break;
        }
      }
      
      // Si on a un trimestre passé en prop, l'utiliser
      if (trimester) {
        return trimester;
      }
      
      // Fallback : déterminer le trimestre à partir de la date actuelle
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // 1-12
      
      let trimesterName = '';
      if (currentMonth >= 9 && currentMonth <= 12) {
        trimesterName = '1er trimestre';
      } else if (currentMonth >= 1 && currentMonth <= 3) {
        trimesterName = '2 ème trimestre';
      } else if (currentMonth >= 4 && currentMonth <= 6) {
        trimesterName = '3 ème trimestre';
      } else {
        trimesterName = '1er trimestre'; // Par défaut
      }
      
      return trimesterName;
    };

    // Calculer le trimesterId à partir du trimestre passé en prop
    const calculatedTrimesterId = trimester ? calculateTrimesterId(trimester) : trimesterId;

    // Fonction pour récupérer automatiquement l'année scolaire
    const getCurrentSchoolYear = () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // 1-12
      
      // Si on est entre septembre et décembre, c'est l'année scolaire en cours
      // Si on est entre janvier et août, c'est l'année scolaire précédente
      if (currentMonth >= 9) {
        return `${currentYear}-${currentYear + 1}`;
      } else {
        return `${currentYear - 1}-${currentYear}`;
      }
    };

    // Fonction pour générer le HTML du bulletin à partir des données
    const generateBulletinHTML = () => {
      console.warn('🚨 FONCTION generateBulletinHTML APPELÉE DANS BulletinPDF - Vérifiez la console !');
      console.log('🔍 DEBUG BulletinPDF - Données reçues:', {
        studentName: `${student.last_name} ${student.first_name}`,
        className: student.classe_name,
        bulletinSubjects: bulletin.map(s => ({ name: s.subject_name, type: s.subject_type })),
        hasFrenchSubject: bulletin.some(s => s.subject_name === 'Français'),
        bulletinLength: bulletin.length
      });
      
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
          
          console.log('🔍 DEBUG BulletinPDF - Français détecté:', {
            className: student.classe_name,
            classNameLower: className,
            isFirstCycle,
            subjectName: subject.subject_name
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
            
            console.log('✅ DEBUG BulletinPDF - Sous-matières créées:', {
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
            console.log('ℹ️ DEBUG BulletinPDF - Classe du second cycle, affichage normal');
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
              <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; font-weight: bold;">${formatMoyenne(subject.moyenne)}</td>
              <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; font-weight: bold;">${subject.coefficient || 1}</td>
              <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; font-weight: bold;">${formatMoyenne((subject.moyenne || 0) * (subject.coefficient || 1))}</td>
              <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; font-weight: bold;">${subject.rang || '-'}</td>
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
              <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px;">${subject.rang || '-'}</td>
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
                  <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px; font-weight: bold;">${subject.rang || '-'}</td>
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
                  <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px;">${subject.rang || '-'}</td>
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
                <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px;">${totals.moyenne}</td>
                <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px;">${totals.coefficient}</td>
                <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px;">${totals.moyCoeff}</td>
                <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px;">${totals.rang}</td>
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
      
      tableRows += `
        <tr style="background-color: #e0e0e0; font-weight: bold;">
          <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px;">TOTAUX</td>
          <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px;"></td>
          <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px;">${totalCoef}</td>
          <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px;">${formatMoyenne(totalMoyCoef)}</td>
          <td style="border: 1px solid black; padding: 2px 3px; text-align: center; font-size: 8px;"></td>
          <td style="border: 1px solid black; padding: 2px 3px; text-align: left; font-size: 8px;"></td>
          <td style="border: 1px solid black !important; padding: 6px 8px !important; text-align: left !important; font-size: 11px !important; font-weight: 900 !important; color: #000 !important; background-color: #f8f8f8 !important;">
            <span style="font-size: 16px !important; font-weight: 900 !important; color: #000000 !important; text-shadow: 1px 1px 2px rgba(0,0,0,0.3) !important; letter-spacing: 0.5px !important;">MOY. TRIM.: ${formatMoyenne(moyenneTrimestrielle)}/20</span> | <span style="font-size: 16px !important; font-weight: 900 !important; color: #000000 !important; text-shadow: 1px 1px 2px rgba(0,0,0,0.3) !important; letter-spacing: 0.5px !important;">RANG: ${rangClasse || 'N/A'}</span>
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
            <h1 style="font-size: 12px; font-weight: bold; margin: 0;">BULLETIN DE NOTES: ${trimester} - Année scolaire: ${schoolYear || getCurrentSchoolYear()}</h1>
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
              ${student.id ? 
                `<img src="https://2ise-groupe.com/api/students/${student.id}/photo" alt="Photo élève" style="width: 100%; height: 100%; object-fit: cover; border: 1px solid #222;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />` :
                `<div style="width: 100%; height: 100%; border: 1px solid #222; background-color: #1976d2; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">${(student.last_name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div>`
              }
              <!-- Élément de fallback pour les initiales -->
              <div style="width: 100%; height: 100%; border: 1px solid #222; background-color: #1976d2; color: white; display: none; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">
                ${(student.last_name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
            </div>
          </div>
          
          <!-- Résultats scolaires -->
          <div style="text-align: center; font-weight: bold; font-size: 10px; margin: 4px 0; font-style: italic;">
            Résultats scolaires : ${schoolYear || getCurrentSchoolYear()}
          </div>
          
          <!-- Tableau des résultats scolaires -->
          <div style="margin-bottom: 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 8px; border: 1px solid #222;">
              <thead>
                <tr>
                  <th style="border: 1px solid #222; padding: 2px 4px; text-align: center; font-weight: bold; background: #fff; font-size: 9px;">Matière</th>
                  <th style="border: 1px solid #222; padding: 2px 4px; text-align: center; font-weight: bold; background: #fff; font-size: 9px;">Moy</th>
                  <th style="border: 1px solid #222; padding: 2px 4px; text-align: center; font-weight: bold; background: #fff; font-size: 9px;">Coeff</th>
                  <th style="border: 1px solid #222; padding: 2px 4px; text-align: center; font-weight: bold; background: #fff; font-size: 9px;">M. Coeff</th>
                  <th style="border: 1px solid #222; padding: 2px 4px; text-align: center; font-weight: bold; background: #fff; font-size: 9px;">Rang</th>
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
                Plus forte moyenne : ${finalClassStatistics.plusForteMoyenne}
              </div>
              <div style="font-size: 8px; margin-bottom: 2px;">
                Plus faible moyenne : ${finalClassStatistics.plusFaibleMoyenne}
              </div>
              <div style="font-size: 8px; margin-bottom: 2px;">
                Moyenne de la classe : ${finalClassStatistics.moyenneClasse}
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
              <div style="font-size: 8px; font-weight: bold;">${principalTeacherName}</div>
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

    // Fonction d'impression du bulletin
    const handlePrintBulletin = async () => {
      
      setDownloading(true);
      try {
        // Utiliser la fonction de génération HTML directe
        const bulletinHTML = generateBulletinHTML();
        
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
          const htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <title>Bulletin - ${student.last_name} ${student.first_name}</title>
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
                    
                    /* Masquer les éléments non nécessaires */
                    [data-print-button] {
                      display: none !important;
                    }
                    
                    /* S'assurer que tout le texte est visible */
                    * {
                      color: black !important;
                    }
                    
                    /* Styles spécifiques pour les tableaux de notes */
                    .MuiTable-root {
                      border: 1px solid black !important;
                    }
                    
                    .MuiTableCell-root {
                      border: 1px solid black !important;
                      color: black !important;
                      background-color: white !important;
                    }
                    
                    .MuiTableHead-root .MuiTableCell-root {
                      background-color: #f0f0f0 !important;
                      font-weight: bold !important;
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
                    
                    /* Forcer une seule page */
                    @page {
                      size: A4;
                      margin: 5mm;
                    }
                    
                    /* Styles spécifiques pour la moyenne trimestrielle et le rang lors de l'impression */
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
                ${bulletinHTML}
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
          window.print();
        }
      } catch (error) {
        console.error('Erreur lors de l\'impression:', error);
        // Fallback vers l'impression directe si la génération échoue
        window.print();
      } finally {
        setDownloading(false);
      }
    };

    // Exposer la fonction handlePrintBulletin via useImperativeHandle
    useImperativeHandle(ref, () => ({
      handlePrintBulletin
    }));

    // Récupérer les statistiques de classe
    useEffect(() => {
      const fetchClassStatistics = async () => {
        // Si les statistiques sont déjà passées en props, ne pas les récupérer
        if (classStatistics) {
          return;
        }
        
        if (!student.id) {
          return;
        }

        setLoadingStatistics(true);
        try {
          const token = localStorage.getItem('token');
          
          if (!token) {
            return;
          }
          
          // Récupérer la classe de l'étudiant
          const schoolYearToUse = schoolYear || getCurrentSchoolYear(); // Utiliser l'année scolaire sélectionnée
          console.log('BulletinPDF - fetchClassStatistics - schoolYear reçue:', schoolYear);
          console.log('BulletinPDF - fetchClassStatistics - schoolYearToUse utilisée:', schoolYearToUse);
          
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
              return;
            }
          }
          
          if (!classId) {
            return;
          }
          
          const currentTrimester = getTrimesterName();
          
          // Récupérer les statistiques de classe
          const statisticsResponse = await axios.get(`https://2ise-groupe.com/api/students/class-statistics`, {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              class_id: classId,
              semester: currentTrimester,
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
            
            setClassStatisticsState({
              plusForteMoyenne: statsData.plusForteMoyenne,
              plusFaibleMoyenne: statsData.plusFaibleMoyenne,
              moyenneClasse: statsData.moyenneClasse
            });
          }
          
          // Le professeur principal est maintenant passé en prop, pas besoin de le récupérer ici
          
        } catch (error: any) {
          // En cas d'erreur, les statistiques restent à leur valeur par défaut
          console.error('Erreur lors de la récupération des statistiques:', error);
        } finally {
          setLoadingStatistics(false);
        }
      };

      fetchClassStatistics();
    }, [student.id, trimesterId, classStatistics, schoolYear]);

    return (
      <Box 
        data-bulletin-content
        sx={{
          p: compact ? { xs: 1, sm: 2 } : { xs: 1, sm: 4 },
          fontSize: compact ? { xs: 14, sm: 16 } : { xs: 16, sm: 18 }, // Augmentation de la taille des polices
          width: '100%',
          maxWidth: '100%',
          margin: compact ? '0 auto' : '0',
          overflowX: 'auto',
          boxSizing: 'border-box',
          minWidth: { xs: '800px', sm: '100%' },
          backgroundColor: '#ffffff',
          color: '#000000',
          border: { xs: '2px solid #1976d2', sm: 'none' }, // Bordure sur mobile
          borderRadius: { xs: 2, sm: 0 }, // Coins arrondis sur mobile
          boxShadow: { xs: '0 4px 12px rgba(0,0,0,0.15)', sm: 'none' }, // Ombre sur mobile
          '& *': {
            color: '#000000 !important',
          },
          '& .MuiTypography-root': {
            color: '#000000 !important',
            fontWeight: '500 !important',
            fontSize: { xs: 'inherit', sm: 'inherit' }, // Hériter de la taille parent
          },
          '& .MuiTableCell-root': {
            color: '#000000 !important',
            borderColor: '#000000 !important',
            fontWeight: '500 !important',
            whiteSpace: 'nowrap',
            minWidth: { xs: '120px', sm: 'auto' },
            fontSize: { xs: 14, sm: 'inherit' }, // Taille de police pour les cellules
            padding: { xs: '8px 4px', sm: '4px 8px' }, // Plus de padding sur mobile
          },
          '& .MuiTableHead-root .MuiTableCell-root': {
            backgroundColor: '#f0f0f0 !important',
            fontWeight: '700 !important',
            color: '#000000 !important',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            fontSize: { xs: 15, sm: 'inherit' }, // Taille de police pour les en-têtes
          },
          '& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even)': {
            backgroundColor: '#f8f8f8 !important',
          },
          '& .MuiTableBody-root .MuiTableRow-root:nth-of-type(odd)': {
            backgroundColor: '#ffffff !important',
          },
          '& .MuiDivider-root': {
            borderColor: '#000000 !important',
          },
          '& .MuiPaper-root': {
            backgroundColor: '#ffffff !important',
            color: '#000000 !important',
          },
          '& .MuiBox-root': {
            color: '#000000 !important',
          },
          '& .MuiCheckbox-root': {
            color: '#000000 !important',
          },
          '& .MuiChip-root': {
            backgroundColor: '#e0e0e0 !important',
            color: '#000000 !important',
          },
          '& .MuiButton-root': {
            backgroundColor: '#1976d2 !important',
            color: '#ffffff !important',
            fontWeight: '700 !important',
          },
          // Styles pour le défilement horizontal sur mobile
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: 4,
            '&:hover': {
              background: '#555',
            },
          },
        }}
      >
        {/* Nouveau Header officiel */}
        <BulletinHeader
          trimestre={trimester}
          anneeScolaire={schoolYear || getCurrentSchoolYear()}
          // Debug: Log de la valeur passée au header
          key={`header-${schoolYear}`} // Forcer le re-render du header
          nomComplet={`${student.last_name || ''} ${student.first_name || ''}`}
          matricule={student.registration_number || '-'}
          classe={student.classe_name || '-'}
          sexe={student.gender || '-'}
          nationalite={student.nationality || '-'}
          dateNaissance={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('fr-FR') : '-'}
          lieuNaissance={student.birth_place || '-'}
          effectif={student.class_size || '-'}
          redoublant={student.is_repeater ? 'Oui' : 'Non'}
          regime={student.regime || '-'}
          interne={student.is_boarder ? 'Oui' : 'Non'}
          affecte={student.is_assigned ? 'Oui' : 'Non'}
          photoUrl={student.photo_url || undefined}
          etabLogoUrl="https://2ise-groupe.com/2ISE.jpg"
        />
        {/* Corps du bulletin officiel */}
        <BulletinBody
          student={{
            nomComplet: `${student.last_name || ''} ${student.first_name || ''}`,
            matricule: student.registration_number || '-',
            classe: student.classe_name || '-',
            effectif: '-', // L'effectif sera récupéré dynamiquement par BulletinBody
            interne: student.is_boarder ? 'Oui' : 'Non',
            redoublant: student.is_repeater ? 'Oui' : 'Non',
            affecte: student.is_assigned ? 'Oui' : 'Non',
            sexe: student.gender || '-',
            nationalite: student.nationality || '-',
            dateNaissance: student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('fr-FR') : '-',
            lieuNaissance: student.birth_place || '-',
            regime: student.regime || '-',
            photoUrl: student.photo_url || undefined,
            photo_path: student.photo_path || undefined, // Ajouter le chemin de la photo depuis la base de données
            id: student.id, // Ajouter l'ID de l'étudiant
          }}
          results={bulletin.map((m: any) => {
            // Vérifier si la moyenne est valide (pas null, undefined, ou NaN)
            const moyenneValue = m.moyenne !== null && m.moyenne !== undefined && !isNaN(Number(m.moyenne)) ? Number(m.moyenne) : null;
            const coefficientValue = m.coefficient || 1;
            
            return {
              subject: m.subject_name,
              moyenne: moyenneValue !== null ? moyenneValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
              coefficient: coefficientValue,
              moyCoeff: moyenneValue !== null ? (moyenneValue * coefficientValue).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
              rang: m.rang || '-',
              professeur: m.teacher_name || '-',
              appreciation: m.appreciation || '',
              type: m.subject_type || 'AUTRES', // Ajouter le type de matière
            };
          })}
          year={schoolYear || getCurrentSchoolYear()} // Utiliser l'année scolaire sélectionnée ou automatique
          trimesterId={calculatedTrimesterId} // Passer l'ID du trimestre calculé
          statistiquesClasse={finalClassStatistics} // Passer les statistiques de classe
          professeurPrincipal={principalTeacherName} // Passer le professeur principal
          synthese={{
            moyTrim: moyenneClasse !== null && moyenneClasse !== undefined ? Number(moyenneClasse).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
            rang: rangClasse !== null && rangClasse !== undefined && rangClasse !== '' ? String(rangClasse) : '-',
            totalCoef: totalCoef.toString(),
            totalMoyCoef: totalMoyCoef.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          }}
        />
        <Divider sx={{ my: compact ? 1 : 2, borderColor: '#000000', borderWidth: 2 }} />
        <Typography align="center" sx={{ 
          fontStyle: 'italic', 
          mb: compact ? 1 : 2, 
          fontSize: compact ? 12 : 14,
          fontWeight: '600',
          color: '#000000'
        }}>
          L'effort fait des forts
        </Typography>
        
        {showDownloadButton && (
          <Button
            variant="contained"
            color="primary"
            fullWidth={isMobile}
            startIcon={<PrintIcon />}
            disabled={downloading}
            data-print-button
            sx={{
              fontSize: compact ? { xs: 13, sm: 16 } : { xs: 15, sm: 18 },
              py: compact ? { xs: 0.5, sm: 1 } : { xs: 1, sm: 2 },
              mt: compact ? 1 : 2,
              fontWeight: 700,
              borderRadius: 2,
              boxShadow: 3,
              textTransform: 'uppercase',
              letterSpacing: 1,
              backgroundColor: '#1976d2',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#1565c0',
              },
            }}
            onClick={handlePrintBulletin}
          >
            {downloading ? 'IMPRESSION...' : 'IMPRIMER'}
          </Button>
        )}
        <Divider sx={{ my: compact ? 1 : 2, borderColor: '#000000', borderWidth: 1 }} />
        <Typography align="center" fontSize={compact ? 10 : 12} color="#000000" sx={{ 
          wordBreak: 'break-word',
          fontWeight: '500'
        }}>
          École Mon Établissement • BP 123 • Téléphone : +123 456 789 • Email : contact@monetablissement.com<br />
          Bulletin généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
        </Typography>
      </Box>
    );
  }
);

export default BulletinPDF; 