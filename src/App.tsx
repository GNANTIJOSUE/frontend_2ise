import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import StudentNavbar from './components/StudentNavbar';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import StudentDashboard from './pages/StudentDashboard';
import StudentPaymentPage from './pages/StudentPaymentPage';
import Registration from './pages/Registration';
import Login from './pages/Login';
import SecretaryLogin from './pages/SecretaryLogin';
import SecretaryDashboard from './pages/SecretaryDashboard';
import Students from './pages/secretary/Students';
import Classes from './pages/secretary/Classes';
import Levels from './pages/secretary/Levels';
import Teachers from './pages/secretary/Teachers';
import Payments from './pages/secretary/Payments';
import Settings from './pages/secretary/Settings';
import StudentDetails from './pages/secretary/StudentDetails';
import Subjects from './pages/secretary/Subjects';
import TeacherDashboard from './pages/TeacherDashboard';
import GestionEleves from './pages/GestionEleves';
import EventsPage from './pages/secretary/EventsPage';
import PublicEventPage from './pages/secretary/PublicEventPage';
import ClassEventSelectionPage from './pages/secretary/ClassEventSelectionPage';
import ClassEventCreationPage from './pages/secretary/ClassEventCreationPage';
import PrivateEventPage from './pages/secretary/PrivateEventPage';
import TimetableSelectionPage from './pages/secretary/TimetableSelectionPage';
import ClassTimetablePage from './pages/secretary/ClassTimetablePage';
import { Box, Container, Paper, CircularProgress } from '@mui/material';
import { purple, blue } from '@mui/material/colors';
import StudentTimetablePage from './pages/StudentTimetablePage';
import StudentSchedule from './pages/StudentSchedule';
import StudentPaymentReturn from './pages/StudentPaymentReturn';
import ReportCardsClasses from './pages/ReportCardsClasses';
import ReportCardsStudents from './pages/ReportCardsStudents';
import StudentReportCard from './pages/StudentReportCard';
import MyReportCard from './pages/MyReportCard';
import ChooseTrimester from './pages/ChooseTrimester';
import ParentDashboard from './pages/ParentDashboard';
import ParentChildProfile from './pages/ParentChildProfile';
import ParentBulletinView from './pages/ParentBulletinView';
import RolesManagement from './pages/secretary/RolesManagement';
import Discounts from './pages/secretary/Discounts';
import CheckManagement from './pages/secretary/CheckManagement';
import InscrptionPre from './pages/InscrptionPre';
import TrimestersManagement from './pages/secretary/TrimestersManagement';
import InscriptionControl from './pages/secretary/InscriptionControl';
import SchoolYears from './pages/secretary/SchoolYears';
import SchoolYearsManagement from './pages/secretary/SchoolYearsManagement';
import History from './pages/secretary/History';
import PaymentModalities from './pages/secretary/PaymentModalities';
import ExcelFiles from './pages/secretary/ExcelFiles';
import RoomsPage from './pages/secretary/RoomsPage';
import AnnexFees from './pages/secretary/AnnexFees';
import DOMErrorTest from './components/DOMErrorTest';
import TestInscriptionStatus from './pages/TestInscriptionStatus';
import { initDOMErrorPrevention } from './utils/domUtils';
import { useInscriptionStatus } from './hooks/useInscriptionStatus';
import InscriptionClosedMessage from './components/InscriptionClosedMessage';
import SmartInstallPrompt from './components/SmartInstallPrompt';
import IOSInstallPrompt from './components/IOSInstallPrompt';


function useDarkModeTheme() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    const handler = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChanged', handler);
    return () => window.removeEventListener('darkModeChanged', handler);
  }, []);
  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
    },
  }), [darkMode]);
  return theme;
}

const RegistrationWrapper = () => {
  const navigate = useNavigate();
  const { isOpen: inscriptionsOpen, loading: statusLoading } = useInscriptionStatus();

  if (statusLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!inscriptionsOpen) {
    return (
      <InscriptionClosedMessage
        title="Inscriptions Temporairement Fermées"
        message="Les inscriptions en ligne sont actuellement fermées. Veuillez revenir plus tard ou contacter l'administration pour plus d'informations."
        showHomeButton={true}
      />
    );
  }

  return <Registration onClose={() => navigate('/login')} />;
};

function AppContent() {
  const location = useLocation();
  const hideNavbarOn = ['/teacher/dashboard', '/student/dashboard', '/student/payment', '/student/report-card', '/student/report-card/:trimester', '/student/choose-trimester', '/parent/dashboard', '/parent/bulletin/:childId/:semester', '/student/bulletin/:semester'];

  // Masquer la navbar aussi sur la page emploi du temps étudiant et parent
  const hideNavbar =
    hideNavbarOn.includes(location.pathname) ||
    location.pathname.startsWith('/secretary/') ||
    location.pathname.startsWith('/student/schedule/') ||
    location.pathname.startsWith('/student/report-card/') ||
    location.pathname.startsWith('/student/bulletin/') ||
    location.pathname.startsWith('/parent/child/') ||
    location.pathname.startsWith('/parent/bulletin/');

  return (
    <div className="App">
      {!hideNavbar && <Navbar />}
      <SmartInstallPrompt 
        delay={5000} 
        autoShow={true} 
        position="top-right" 
      />
      <IOSInstallPrompt 
        delay={8000} 
        position="bottom" 
      />
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registration" element={<RegistrationWrapper />} />
        <Route path="/secretary-login" element={<SecretaryLogin />} />

        {/* Routes Étudiant */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/payment" element={<StudentPaymentPage />} />
        <Route path="/student/payment-return" element={<StudentPaymentReturn />} />
        <Route path="/student/timetable" element={<StudentTimetablePage />} />
        <Route path="/student/schedule/:studentId" element={<StudentSchedule />} />
        <Route path="/student/choose-trimester" element={<ChooseTrimester />} />
        <Route path="/student/report-card/:trimester" element={<MyReportCard />} />
        <Route path="/student/report-card/:studentId/:classId" element={<StudentReportCard />} />

        {/* Routes Secrétaire */}
        <Route path="/secretary/dashboard" element={<SecretaryDashboard />} />
        <Route path="/secretary/students" element={<Students />} />
        <Route path="/secretary/students/:id" element={<StudentDetails />} />
        <Route path="/secretary/classes" element={<Classes />} />
        <Route path="/secretary/levels" element={<Levels />} />
        <Route path="/secretary/teachers" element={<Teachers />} />
        <Route path="/secretary/payments" element={<Payments />} />
        <Route path="/secretary/settings" element={<Settings />} />
        <Route path="/secretary/subjects" element={<Subjects />} />
        <Route path="/secretary/gestion-eleves" element={<GestionEleves />} />
        <Route path="/secretary/events" element={<EventsPage />} />
        <Route path="/secretary/events/public" element={<PublicEventPage />} />
        <Route path="/secretary/events/class" element={<ClassEventSelectionPage />} />
        <Route path="/secretary/events/class/:classId" element={<ClassEventCreationPage />} />
        <Route path="/secretary/events/private" element={<PrivateEventPage />} />
        <Route path="/secretary/timetables" element={<TimetableSelectionPage />} />
        <Route path="/secretary/timetables/:classId" element={<ClassTimetablePage />} />
        <Route path="/secretary/report-cards" element={<ReportCardsClasses />} />
        <Route path="/secretary/report-cards/:classId" element={<ReportCardsStudents />} />
        <Route path="/secretary/report-cards/:classId/:studentId" element={<StudentReportCard />} />
        <Route path="/secretary/discounts" element={<Discounts />} />
        <Route path="/secretary/checks" element={<CheckManagement />} />
        <Route path="/secretary/payments" element={<p>payments</p>} />
        <Route path="/secretary/settings" element={<p>settings</p>} />
        <Route path="/secretary/roles" element={<RolesManagement />} />
        <Route path="/secretary/inscription-pre" element={<InscrptionPre onClose={() => window.history.length > 1 ? window.history.back() : window.location.replace('/secretary/dashboard')} />} />
        <Route path="/secretary/trimesters" element={<TrimestersManagement />} />
        <Route path="/secretary/school-years" element={<SchoolYears />} />
        <Route path="/secretary/school-years-management" element={<SchoolYearsManagement />} />
        <Route path="/secretary/inscription-control" element={<InscriptionControl />} />
        <Route path="/secretary/history" element={<History />} />
        <Route path="/secretary/payment-modalities" element={<PaymentModalities />} />
        <Route path="/secretary/excel-files" element={<ExcelFiles />} />
        <Route path="/secretary/rooms" element={<RoomsPage />} />
        <Route path="/secretary/annex-fees" element={<AnnexFees />} />
        <Route path="/test-dom-errors" element={<DOMErrorTest />} />
        <Route path="/test-inscription-status" element={<TestInscriptionStatus />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/parent/dashboard" element={<ParentDashboard />} />
        <Route path="/parent/child/:childId" element={<ParentChildProfile />} />
        <Route path="/parent/bulletin/:childId/:semester" element={<ParentBulletinView />} />
        <Route path="/student/bulletin/:semester" element={<MyReportCard />} />
      </Routes>
    </div>
  );
}

const App = () => {
  // Initialiser la prévention d'erreurs DOM
  React.useEffect(() => {
    initDOMErrorPrevention();
  }, []);

  const theme = useDarkModeTheme();
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
