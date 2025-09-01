import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    IconButton,
    Fade,
    Paper,
    Divider
} from '@mui/material';
import {
    Close as CloseIcon,
    Share as ShareIcon,
    AddToHomeScreen as HomeIcon,
    ArrowUpward as ArrowIcon
} from '@mui/icons-material';

interface IOSInstallPromptProps {
    delay?: number;
    position?: 'top' | 'bottom';
}

const IOSInstallPrompt: React.FC<IOSInstallPromptProps> = ({
    delay = 3000,
    position = 'bottom'
}) => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Détecter iOS
        const checkIOS = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
            setIsIOS(isIOSDevice);
        };

        // Vérifier si l'app est déjà installée
        const checkStandalone = () => {
            const standalone = (window.navigator as any).standalone === true;
            setIsStandalone(standalone);
        };

        checkIOS();
        checkStandalone();

        // Afficher le prompt après un délai si c'est iOS et pas installé
        if (isIOS && !isStandalone) {
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, delay);

            return () => clearTimeout(timer);
        }
    }, [delay, isIOS, isStandalone]);

    const handleClose = () => {
        setShowPrompt(false);
        // Réessayer plus tard
        setTimeout(() => {
            setShowPrompt(true);
        }, 300000); // 5 minutes plus tard
    };

    if (!isIOS || isStandalone || !showPrompt) {
        return null;
    }

    return (
        <Fade in={showPrompt} timeout={500}>
            <Box
                sx={{
                    position: 'fixed',
                    [position]: 20,
                    left: 20,
                    right: 20,
                    zIndex: 9999,
                    maxWidth: 400,
                    mx: 'auto'
                }}
            >
                <Paper
                    elevation={8}
                    sx={{
                        p: 3,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                        color: 'white',
                        position: 'relative'
                    }}
                >
                    <IconButton
                        onClick={handleClose}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: 'white'
                        }}
                    >
                        <CloseIcon />
                    </IconButton>

                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <HomeIcon sx={{ fontSize: 48, mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Installer 2ISE-GROUPE
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Ajoutez l'application à votre écran d'accueil pour un accès rapide
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.3)' }} />

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Instructions :
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%', 
                                bgcolor: 'white', 
                                color: '#1976d2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 'bold',
                                mr: 2
                            }}>
                                1
                            </Box>
                            <Typography variant="body2">
                                Appuyez sur l'icône <ShareIcon sx={{ fontSize: 16, mx: 0.5 }} />
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%', 
                                bgcolor: 'white', 
                                color: '#1976d2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 'bold',
                                mr: 2
                            }}>
                                2
                            </Box>
                            <Typography variant="body2">
                                Sélectionnez "Sur l'écran d'accueil"
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%', 
                                bgcolor: 'white', 
                                color: '#1976d2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 'bold',
                                mr: 2
                            }}>
                                3
                            </Box>
                            <Typography variant="body2">
                                Appuyez sur "Ajouter"
                            </Typography>
                        </Box>
                    </Box>

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleClose}
                        sx={{
                            bgcolor: 'white',
                            color: '#1976d2',
                            fontWeight: 'bold',
                            py: 1.5,
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.9)'
                            }
                        }}
                    >
                        J'ai compris
                    </Button>
                </Paper>
            </Box>
        </Fade>
    );
};

export default IOSInstallPrompt;
