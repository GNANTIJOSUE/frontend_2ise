import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Button, Divider, Stack, Grid, Alert } from '@mui/material';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';

const ParentBulletinView = () => {
  const { childId, semester } = useParams();
  const navigate = useNavigate();
  const [bulletinData, setBulletinData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const bulletinRef = useRef<HTMLDivElement>(null);

  // Helper pour l'année scolaire
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

  useEffect(() => {
    let isMounted = true;
    
    const fetchBulletinData = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        if (isMounted) navigate('/login');
        return;
      }
      
      try {
        const schoolYear = getCurrentSchoolYear();
        const decodedSemester = decodeURIComponent(semester || '');
        
        const { data } = await axios.get(`https://2ise-groupe.com/api/report-cards/bulletin-details`, {
          params: {
            student_id: childId,
            semester: decodedSemester,
            school_year: schoolYear
          },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (isMounted) {
          setBulletinData(data);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Erreur lors du chargement du bulletin:', err);
          setError(err.response?.data?.message || 'Erreur lors du chargement du bulletin.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBulletinData();
    
    return () => {
      isMounted = false;
    };
  }, [navigate, childId, semester]);

  const handleDownload = async () => {
    if (!bulletinRef.current) return;
    
    setDownloading(true);
    try {
      const input = bulletinRef.current;
      
      // Créer une copie du bulletin pour le téléchargement avec une taille réduite
      const bulletinCopy = input.cloneNode(true) as HTMLElement;
      bulletinCopy.style.width = '800px'; // Taille fixe pour le PDF
      bulletinCopy.style.fontSize = '12px'; // Taille de police réduite
      bulletinCopy.style.padding = '20px';
      bulletinCopy.style.backgroundColor = 'white';
      bulletinCopy.style.position = 'absolute';
      bulletinCopy.style.left = '-9999px';
      bulletinCopy.style.top = '0';
      document.body.appendChild(bulletinCopy);

      const canvas = await html2canvas(bulletinCopy, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      document.body.removeChild(bulletinCopy);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Si le contenu dépasse une page, créer plusieurs pages
      if (pdfHeight > pdf.internal.pageSize.getHeight()) {
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageCount = Math.ceil(pdfHeight / pageHeight);
        
        for (let i = 0; i < pageCount; i++) {
          if (i > 0) pdf.addPage();
          const sourceY = i * pageHeight * canvas.width / pdfWidth;
          const sourceHeight = Math.min(pageHeight * canvas.width / pdfWidth, canvas.height - sourceY);
          
          pdf.addImage(
            imgData, 
            'PNG', 
            0, 
            0, 
            pdfWidth, 
            pageHeight
          );
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      const fileName = `Bulletin_${bulletinData?.student?.last_name || ''}_${bulletinData?.student?.first_name || ''}_${semester || ''}_${getCurrentSchoolYear()}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><Alert severity="error">{error}</Alert></Box>;
  if (!bulletinData) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><Alert severity="info">Aucune donnée disponible</Alert></Box>;

  const { student, grades, absences, moyenneTrimestrielle, rank } = bulletinData;

  return (
    <Box sx={{ p: 4, minHeight: '100vh', background: 'linear-gradient(135deg, #e3f0ff 0%, #f8e1ff 100%)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button variant="outlined" onClick={() => navigate('/parent/dashboard')}>
          ← Retour au tableau de bord
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<DownloadIcon />}
          disabled={downloading}
          onClick={handleDownload}
          sx={{
            fontWeight: 700,
            borderRadius: 2,
            boxShadow: 3,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {downloading ? 'TÉLÉCHARGEMENT...' : 'TÉLÉCHARGER'}
        </Button>
      </Box>
      
      <Paper ref={bulletinRef} sx={{ p: 4, borderRadius: 5, maxWidth: 900, mx: 'auto', boxShadow: '0 8px 32px rgba(80, 36, 204, 0.10)', background: 'white' }}>
        {/* En-tête avec logo et nom de l'école */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, pb: 2, borderBottom: '2px solid #e0e0e0' }}>
          <img 
            src="/logo192.png" 
            alt="Logo établissement" 
            style={{ 
              height: 80, 
              marginRight: 20,
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }} 
          />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ mb: 1, letterSpacing: 1 }}>
              ÉCOLE MON ÉTABLISSEMENT
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
              Excellence • Discipline • Réussite
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              BP 123 • Téléphone: +123 456 789 • Email: contact@monetablissement.com
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="h5" fontWeight={700} align="center" sx={{ mb: 2 }}>
          BULLETIN DE NOTES - {semester?.toUpperCase()}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
          <Box>
            <Typography><b>Nom :</b> {student?.last_name} {student?.first_name}</Typography>
            <Typography><b>Civilité :</b> {student?.gender_label === 'Féminin' ? 'Madame' : student?.gender_label === 'Masculin' ? 'Monsieur' : ''}</Typography>
            <Typography><b>Matricule :</b> {student?.registration_number}</Typography>
            <Typography><b>Classe :</b> {student?.class_name}</Typography>
            <Typography>
              <b>Date de naissance :</b> {student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('fr-FR') : ''}
            </Typography>
          </Box>
          <Box>
            <Typography><b>Sexe :</b> {student?.gender_label}</Typography>
            <Typography><b>Nationalité :</b> {student?.nationality || '-'}</Typography>
            <Typography><b>Lieu de naissance :</b> {student?.birth_place || '-'}</Typography>
          </Box>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow sx={{ background: '#f3e5f5' }}>
              <TableCell>Discipline</TableCell>
              <TableCell align="center">Moy/20</TableCell>
              <TableCell align="center">Coef. (pondération)</TableCell>
              <TableCell align="center">Moy x Coef</TableCell>
              <TableCell align="center">Rang</TableCell>
              <TableCell align="center">Appréciation</TableCell>
              <TableCell align="center">Professeur</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {grades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">
                    Aucune note publiée pour le {semester}.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              grades.map((g: any) => (
                <TableRow key={g.subject_id}>
                  <TableCell>{g.subject_name}</TableCell>
                  <TableCell align="center">{g.grade?.toFixed(2)}</TableCell>
                  <TableCell align="center"><b>{g.coefficient || 1}</b></TableCell>
                  <TableCell align="center">{((g.grade || 0) * (g.coefficient || 1)).toFixed(2)}</TableCell>
                  <TableCell align="center">{g.rang || '-'}</TableCell>
                  <TableCell align="center">{g.appreciation || ''}</TableCell>
                  <TableCell align="center">{g.teacher_first_name ? `${g.teacher_first_name} ${g.teacher_last_name}` : ''}</TableCell>
                </TableRow>
              ))
            )}
            {grades.length > 0 && (
              <TableRow sx={{ background: '#ede7f6' }}>
                <TableCell><b>TOTAUX</b></TableCell>
                <TableCell></TableCell>
                <TableCell align="center"><b>{grades.reduce((acc: number, g: any) => acc + (g.coefficient || 1), 0)}</b></TableCell>
                <TableCell align="center"><b>{grades.reduce((acc: number, g: any) => acc + ((g.grade || 0) * (g.coefficient || 1)), 0).toFixed(2)}</b></TableCell>
                <TableCell colSpan={3}></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {grades.length > 0 && (
          <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mb: 2 }}>
            La moyenne trimestrielle est calculée en fonction des coefficients de chaque matière de la classe.
          </Typography>
        )}
        
        <Stack direction="row" spacing={4} sx={{ mt: 2, mb: 0 }}>
          <Box>
            <Typography><b>Moyenne trimestrielle :</b> {moyenneTrimestrielle.toFixed(2)} / 20</Typography>
          </Box>
          <Box>
            <Typography><b>Appréciation du conseil :</b> Passable</Typography>
          </Box>
          {rank && rank.total_students > 0 && (
            <Box>
              <Typography><b>Rang dans la classe :</b> {rank.rank} / {rank.total_students}</Typography>
            </Box>
          )}
        </Stack>
        
        {/* Section des absences */}
        <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, background: '#f9f9f9' }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
            Absences - {semester}
          </Typography>
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography><b>Justifiées :</b> <span style={{ color: '#1976d2', fontWeight: 600 }}>{absences.justified_count}</span></Typography>
            </Box>
            <Box>
              <Typography><b>Non justifiées :</b> <span style={{ color: '#d32f2f', fontWeight: 600 }}>{absences.unjustified_count}</span></Typography>
            </Box>
            <Box>
              <Typography><b>Total :</b> <span style={{ fontWeight: 600 }}>{absences.justified_count + absences.unjustified_count}</span></Typography>
            </Box>
          </Stack>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
          L'effort fait des forts
        </Typography>
        
        {/* Pied de page avec signatures */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 2, minHeight: 120 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Signature du Professeur Principal
                </Typography>
                <Box sx={{ height: 60, borderBottom: '1px solid #ccc', mb: 1 }}></Box>
                <Typography variant="caption" color="text.secondary">
                  Cachet et signature
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 2, minHeight: 120 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Signature du Directeur
                </Typography>
                <Box sx={{ height: 60, borderBottom: '1px solid #ccc', mb: 1 }}></Box>
                <Typography variant="caption" color="text.secondary">
                  Cachet et signature
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 2, minHeight: 120 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Signature des Parents
                </Typography>
                <Box sx={{ height: 60, borderBottom: '1px solid #ccc', mb: 1 }}></Box>
                <Typography variant="caption" color="text.secondary">
                  Vu et approuvé
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {/* Informations de l'établissement */}
          <Box sx={{ mt: 3, textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              École Mon Établissement • BP 123 • Téléphone: +123 456 789 • Email: contact@monetablissement.com
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Bulletin généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ParentBulletinView; 