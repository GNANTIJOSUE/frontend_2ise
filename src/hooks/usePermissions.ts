import { useState, useEffect } from 'react';

export interface User {
  id: number;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
}

export interface Permission {
  canViewDashboard: boolean;
  canManageStudents: boolean;
  canViewStudents: boolean;
  canManageTeachers: boolean;
  canManageClasses: boolean;
  canViewClasses: boolean;
  canDeleteClasses: boolean;
  canManageSubjects: boolean;
  canManageTimetables: boolean;
  canViewTimetables: boolean;
  canManageReportCards: boolean;
  canManageEvents: boolean;
  canManagePayments: boolean;
  canManageDiscounts: boolean;
  canViewDiscounts: boolean;
  canManageChecks: boolean;
  canManageTrimesters: boolean;
  canManageInscriptions: boolean;
  canManageSettings: boolean;
  canManageRoles: boolean;
  canDeleteStudents: boolean;
  canDeleteTeachers: boolean;
  canViewHistory: boolean;
  canManageExcelFiles: boolean;
}

export const usePermissions = () => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission>({
    canViewDashboard: false,
    canManageStudents: false,
    canViewStudents: false,
    canManageTeachers: false,
    canManageClasses: false,
    canViewClasses: false,
    canDeleteClasses: false,
    canManageSubjects: false,
    canManageTimetables: false,
    canViewTimetables: false,
    canManageReportCards: false,
    canManageEvents: false,
    canManagePayments: false,
    canManageDiscounts: false,
    canViewDiscounts: false,
    canManageChecks: false,
    canManageTrimesters: false,
    canManageInscriptions: false,
    canManageSettings: false,
    canManageRoles: false,
    canDeleteStudents: false,
    canDeleteTeachers: false,
    canViewHistory: false,
    canManageExcelFiles: false,
  });

  useEffect(() => {
    // Récupérer les informations de l'utilisateur depuis le localStorage
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('user');
    
    if (token && userInfo) {
      try {
        const userData = JSON.parse(userInfo);
        setUser(userData);
        
        // Définir les permissions selon le rôle
        const role = userData.role;
        const newPermissions: Permission = {
          canViewDashboard: true, // Tous les admins peuvent voir le dashboard
          canManageStudents: ['secretary', 'admin', 'directeur_general', 'directeur_etudes'].includes(role),
          canViewStudents: ['secretary', 'admin', 'directeur_general', 'directeur_etudes', 'éducateur'].includes(role),
          canManageTeachers: ['directeur_etudes', 'admin', 'directeur_general'].includes(role),
          canManageClasses: ['éducateur', 'admin', 'directeur_general'].includes(role),
          canViewClasses: ['secretary', 'éducateur', 'admin', 'directeur_general', 'directeur_etudes'].includes(role),
          canDeleteClasses: ['admin', 'directeur_general'].includes(role),
          canManageSubjects: ['éducateur', 'admin', 'directeur_general'].includes(role),
          canManageTimetables: ['éducateur', 'admin', 'directeur_general'].includes(role),
          canViewTimetables: ['secretary', 'éducateur', 'admin', 'directeur_general', 'directeur_etudes'].includes(role),
          canManageReportCards: ['admin', 'éducateur', 'directeur_general'].includes(role),
          canManageEvents: ['éducateur', 'admin', 'directeur_general'].includes(role),
          canManagePayments: ['comptable', 'admin', 'directeur_general'].includes(role),
          canManageDiscounts: ['admin', 'directeur_general'].includes(role),
          canViewDiscounts: ['comptable', 'admin', 'directeur_general'].includes(role),
          canManageChecks: ['admin', 'directeur_general', 'comptable'].includes(role),
          canManageTrimesters: ['admin', 'directeur_general'].includes(role),
          canManageInscriptions: ['admin', 'directeur_general'].includes(role),
          canManageSettings: ['admin', 'directeur_general'].includes(role),
          canManageRoles: ['admin', 'directeur_general'].includes(role),
          canDeleteStudents: ['admin', 'directeur_general'].includes(role),
          canDeleteTeachers: ['directeur_etudes', 'admin', 'directeur_general'].includes(role),
          canViewHistory: ['comptable', 'directeur_general', 'admin'].includes(role), // Seul le directeur général peut voir l'historique
          canManageExcelFiles: ['admin', 'directeur_general'].includes(role), // Seuls l'admin et le directeur général peuvent gérer les fichiers Excel
        };
        
        setPermissions(newPermissions);
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error);
      }
    }
  }, []);

  const hasPermission = (permission: keyof Permission): boolean => {
    return permissions[permission];
  };

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

  return {
    user,
    permissions,
    hasPermission,
    getRoleLabel,
  };
}; 