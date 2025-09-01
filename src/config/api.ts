// Configuration de l'API
export const API_BASE_URL = 'https://2ise-groupe.com/api';
export const FRONTEND_BASE_URL = 'https://2ise-groupe.com';

// URLs complètes
export const API_URLS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  ME: `${API_BASE_URL}/auth/me`,
  
  // Students
  STUDENTS: `${API_BASE_URL}/students`,
  STUDENT_ME: `${API_BASE_URL}/students/me`,
  STUDENT_DETAILS: `${API_BASE_URL}/students/me/details`,
  STUDENT_GRADES: `${API_BASE_URL}/students`,
  STUDENT_PAYMENTS: `${API_BASE_URL}/students`,
  STUDENT_ABSENCES: `${API_BASE_URL}/students`,
  STUDENT_SCHEDULE: `${API_BASE_URL}/students`,
  STUDENT_RANK: `${API_BASE_URL}/students`,
  STUDENT_ANNUAL_AVERAGE: `${API_BASE_URL}/students`,
  STUDENT_CLASS_EFFECTIF: `${API_BASE_URL}/students`,
  STUDENT_SUBJECT_RANKS: `${API_BASE_URL}/students`,
  PUBLIC_REGISTER: `${API_BASE_URL}/students/public-register`,
  
  // Classes
  CLASSES: `${API_BASE_URL}/classes`,
  CLASS_STUDENTS: `${API_BASE_URL}/classes`,
  CLASS_GRADES: `${API_BASE_URL}/classes`,
  CLASS_STATISTICS: `${API_BASE_URL}/students/class-statistics`,
  
  // Teachers
  TEACHERS: `${API_BASE_URL}/teachers`,
  TEACHER_ME: `${API_BASE_URL}/teachers/me`,
  TEACHER_SUBJECTS: `${API_BASE_URL}/teachers`,
  TEACHER_GRADES: `${API_BASE_URL}/teachers/grades`,
  TEACHER_SCHEDULE: `${API_BASE_URL}/teachers`,
  TEACHER_PUBLISH_GRADES: `${API_BASE_URL}/teachers/publish-grades`,
  TEACHER_NOTIFY_STUDENTS: `${API_BASE_URL}/classes`,
  TEACHER_SUBMIT_TO_ADMIN: `${API_BASE_URL}/classes`,
  
  // Absences
  ABSENCES: `${API_BASE_URL}/absences`,
  ABSENCES_STUDENT: `${API_BASE_URL}/absences/student`,
  
  // Payments
  PAYMENTS: `${API_BASE_URL}/payments`,
  PAYMENTS_FUSION_INIT: `${API_BASE_URL}/payments/fusion-init`,
  PAYMENTS_FUSION_STATUS: `${API_BASE_URL}/payments/fusion-status`,
  
  // Events & Notifications
  EVENTS_NOTIFICATIONS: `${API_BASE_URL}/events/my-notifications`,
  EVENTS_NOTIFICATION_READ: `${API_BASE_URL}/events/notifications`,
  EVENTS_NOTIFICATION_READ_ALL: `${API_BASE_URL}/events/notifications/read-all`,
  
  // Report Cards
  REPORT_CARDS_PUBLISHED: `${API_BASE_URL}/report-cards/published`,
  REPORT_CARDS_STUDENT_BULLETINS: `${API_BASE_URL}/report-cards/student-bulletins`,
  
  // Parents
  PARENTS_ME: `${API_BASE_URL}/parents/me`,
  
  // Schedules
  SCHEDULES_CLASS: `${API_BASE_URL}/schedules/class`,
  
  // Trimesters
  TRIMESTERS: `${API_BASE_URL}/trimesters`,
  SCHOOL_YEARS_BY_NAME: `${API_BASE_URL}/school-years/by-name`,
  
  // Bulletins
  BULLETINS_STATUS: `${API_BASE_URL}/bulletins/status`,
  
  // Public
  PUBLIC_HEALTH: `${API_BASE_URL}/public/health`,
  
  // Assets
  LOGO: `${FRONTEND_BASE_URL}/2ISE.jpg`,
  UPLOADS: `${API_BASE_URL}/uploads`
};

// Fonction utilitaire pour construire les URLs avec paramètres
export const buildApiUrl = (baseUrl: string, params?: Record<string, string | number>) => {
  if (!params) return baseUrl;
  
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });
  
  return url.toString();
};
