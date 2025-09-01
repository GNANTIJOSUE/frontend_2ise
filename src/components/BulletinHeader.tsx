import React from 'react';
import { Box, Typography, Divider, useTheme, useMediaQuery } from '@mui/material';

interface BulletinHeaderProps {
  trimestre: string;
  anneeScolaire: string;
  nomComplet: string;
  matricule: string;
  classe: string;
  sexe: string;
  nationalite: string;
  dateNaissance: string;
  lieuNaissance: string;
  effectif: string | number;
  redoublant: string;
  regime: string;
  interne: string;
  affecte: string;
  photoUrl?: string;
  etabLogoUrl?: string;
  etabNom?: string;
  etabAdresse?: string;
  etabCode?: string;
  etabStatut?: string;
  etabTel?: string;
  etabEmail?: string;
}

const BulletinHeader: React.FC<BulletinHeaderProps> = ({
  trimestre,
  anneeScolaire,
  photoUrl,
  etabLogoUrl,
  etabNom = "Pensionnat Méthodiste de Filles Anyama",
  etabAdresse = "08 BP 840 ABIDJAN 08",
  etabCode = "009919",
  etabStatut = "Privé",
  etabTel = "2723553697",
  etabEmail = "pensionnatfilles@gmail.com",
}) => {

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      {/* Bandeau supérieur */}
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="flex-start" 
        sx={{ 
          width: '100%', 
          pl: 0,
          flexDirection: 'row', // Maintenir la disposition horizontale
          gap: 0,
          minWidth: '100%', // Utiliser toute la largeur disponible
          maxWidth: '100%', // Ne pas dépasser la largeur de l'écran
        }}
      >
        {/* Logo */}
        <Box 
          width={isMobile ? 35 : 70} 
          minWidth={isMobile ? 35 : 70} 
          height={isMobile ? 35 : 70} 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          mr={isMobile ? 0.5 : 1.5}
          sx={{ flexShrink: 0 }} // Empêcher la réduction
        >
          {etabLogoUrl ? (
            <img 
              src={etabLogoUrl} 
              alt="Logo établissement" 
              style={{ 
              maxWidth: isMobile ? 30 : 60, 
              maxHeight: isMobile ? 30 : 60 
              }} 
            />
          ) : (
            <Box 
              width={isMobile ? 30 : 60} 
              height={isMobile ? 30 : 60} 
              border={1.5} 
              borderColor="#888" 
              borderRadius={2} 
            />
          )}
        </Box>
        
        {/* Rectangle 1 : Infos établissement */}
        <Box
          sx={{
            bgcolor: '#fff',
            border: '2px solid #888',
            borderRadius: 3,
            px: isMobile ? 0.5 : 2,
            py: isMobile ? 0.5 : 1,
            height: isMobile ? 70 : 70,
            minWidth: isMobile ? 100 : 280,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'Arial, sans-serif',
            mr: isMobile ? 0.5 : 1.5,
            width: 'auto',
            flexShrink: 0 // Empêcher la réduction
          }}
        >
          <Typography sx={{ 
            fontWeight: 'bold', 
            fontSize: isMobile ? 8 : 12, 
            textAlign: 'center', 
            mb: 0.2, 
            fontFamily: 'Arial, sans-serif' 
          }}>
            REPUBLIQUE DE COTE D'IVOIRE
          </Typography>
          <Typography sx={{ 
            fontSize: isMobile ? 6 : 10, 
            textAlign: 'center', 
            fontFamily: 'Arial, sans-serif' 
          }}>
            MINISTERE DE L'EDUCATION NATIONALE<br />ET DE L'ALPHABETISATION
          </Typography>
          <Typography sx={{ 
            fontWeight: 'bold', 
            fontSize: isMobile ? 7 : 11, 
            textAlign: 'center', 
            mt: 0.5, 
            fontFamily: 'Arial, sans-serif' 
          }}>
            {etabNom}
          </Typography>
        </Box>
        
        {/* Rectangle 2 : Infos administratives */}
        <Box
          sx={{
            bgcolor: '#fff',
            border: '2px solid #888',
            borderRadius: 3,
            px: isMobile ? 0.5 : 2,
            py: isMobile ? 0.5 : 1,
            height: isMobile ? 70 : 70,
            minWidth: isMobile ? 110 : 300,
            display: 'flex',
            flexDirection: 'row', // Maintenir la disposition horizontale
            alignItems: 'center',
            fontFamily: 'Arial, sans-serif',
            justifyContent: 'space-between',
            width: 'auto',
            flexShrink: 0, // Empêcher la réduction
            flexGrow: 1 // Permettre l'expansion
          }}
        >
          {/* Colonne gauche */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            fontSize: isMobile ? 6 : 10, 
            flex: 2 
          }}>
            <span>Adresse : {etabAdresse}</span>
            <span>Téléphone : {etabTel}</span>
            <span>E-mail : {etabEmail}</span>
          </Box>
          {/* Colonne droite */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            fontSize: isMobile ? 6 : 10, 
            flex: 1, 
            ml: isMobile ? 0.5 : 1.5 
          }}>
            <span>Code : {etabCode}</span>
            <span>Statut : {etabStatut}</span>
          </Box>
        </Box>
      </Box>
      
      {/* Barre noire épaisse */}
      <Box sx={{ borderBottom: '4px solid #222', width: '100%', mt: 0.5, mb: 0.5 }} />
      
      {/* Titre bulletin sur une seule ligne */}
      <Typography 
        align="left" 
        sx={{ 
          fontWeight: 'bold', 
          fontSize: isMobile ? 10 : 20, 
          color: '#444', 
          fontFamily: 'Arial, sans-serif', 
          mb: 0.5, 
          pl: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        BULLETIN DE NOTES : <span style={{ fontStyle: 'italic', fontWeight: 600 }}>{trimestre}</span> - Année scolaire : <span style={{ fontWeight: 800 }}>{anneeScolaire}</span>
      </Typography>
      <Box sx={{ borderBottom: '1.5px solid #888', width: '100%', mb: 1 }} />
    </>
  );
};

export default BulletinHeader; 