import React, { useState, useEffect } from 'react';
import { 
    Button, 
    Snackbar, 
    Alert, 
    Box, 
    Typography, 
    IconButton,
    Fade,
    Slide
} from '@mui/material';
import {
    GetApp as InstallIcon,
    Close as CloseIcon,
    CheckCircle as SuccessIcon,
    Smartphone as MobileIcon
} from '@mui/icons-material';

interface SmartInstallPromptProps {
    delay?: number; // Délai avant affichage (en ms)
    autoShow?: boolean; // Afficher automatiquement
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
}

const SmartInstallPrompt: React.FC<SmartInstallPromptProps> = ({
    delay = 3000,
    autoShow = true,
    position = 'top-right'
}) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Détecter si c'est un appareil mobile
        const checkMobile = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
            setIsMobile(isMobileDevice);
        };

        checkMobile();

        // Vérifier si l'app est déjà installée
        const checkIfInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            const isIOSStandalone = (window.navigator as any).standalone === true;
            setIsInstalled(isStandalone || isIOSStandalone);
        };

        checkIfInstalled();

        // Écouter l'événement beforeinstallprompt
        const handleBeforeInstallPrompt = (e: Event) => {
            console.log('beforeinstallprompt event triggered');
            e.preventDefault();
            setDeferredPrompt(e);
            
            if (autoShow && !isInstalled) {
                setTimeout(() => {
                    setShowPrompt(true);
                }, delay);
            }
        };

        // Écouter l'événement appinstalled
        const handleAppInstalled = () => {
            console.log('Application installée avec succès');
            setIsInstalled(true);
            setShowPrompt(false);
            setShowSuccess(true);
            
            setTimeout(() => {
                setShowSuccess(false);
            }, 5000);
        };

        // Écouter les changements de mode d'affichage
        const handleDisplayModeChange = () => {
            checkIfInstalled();
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        window.matchMedia('(display-mode: standalone)').addEventListener('change', handleDisplayModeChange);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.matchMedia('(display-mode: standalone)').removeEventListener('change', handleDisplayModeChange);
        };
    }, [delay, autoShow, isInstalled]);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('Utilisateur a accepté l\'installation');
                setShowPrompt(false);
            } else {
                console.log('Utilisateur a refusé l\'installation');
                // Réessayer plus tard
                setTimeout(() => {
                    setShowPrompt(true);
                }, 60000);
            }
            
            setDeferredPrompt(null);
        }
    };

    const handleClose = () => {
        setShowPrompt(false);
        // Réessayer plus tard
        setTimeout(() => {
            setShowPrompt(true);
        }, 300000); // 5 minutes plus tard
    };

    const getPositionStyles = () => {
        switch (position) {
            case 'top-left':
                return { top: 20, left: 20 };
            case 'bottom-right':
                return { bottom: 20, right: 20 };
            case 'bottom-left':
                return { bottom: 20, left: 20 };
            case 'center':
                return { 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)' 
                };
            default: // top-right
                return { top: 20, right: 20 };
        }
    };

    // Ne pas afficher si l'app est déjà installée ou si ce n'est pas mobile
    if (isInstalled || !isMobile) {
        return null;
    }

    return (
        <>
            {/* Prompt d'installation */}
            <Fade in={showPrompt} timeout={500}>
                <Box
                    sx={{
                        position: 'fixed',
                        ...getPositionStyles(),
                        zIndex: 9999,
                        maxWidth: 320,
                        backgroundColor: 'white',
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                        border: '1px solid rgba(25, 118, 210, 0.1)',
                        p: 2,
                        animation: 'slideIn 0.5s ease'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <MobileIcon sx={{ color: '#1976d2', mr: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                            2ISE-GROUPE
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={handleClose}
                            sx={{ ml: 'auto', color: '#666' }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    
                    <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                        Installez l'application pour un accès plus rapide et une meilleure expérience !
                    </Typography>
                    
                    <Button
                        variant="contained"
                        startIcon={<InstallIcon />}
                        onClick={handleInstall}
                        fullWidth
                        sx={{
                            background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                            borderRadius: 2,
                            py: 1,
                            fontWeight: 'bold',
                            textTransform: 'none',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                            }
                        }}
                    >
                        Installer l'application
                    </Button>
                </Box>
            </Fade>

            {/* Notification de succès */}
            <Snackbar
                open={showSuccess}
                autoHideDuration={5000}
                onClose={() => setShowSuccess(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setShowSuccess(false)}
                    severity="success"
                    icon={<SuccessIcon />}
                    sx={{ width: '100%' }}
                >
                    Application installée avec succès ! 🎉
                </Alert>
            </Snackbar>
        </>
    );
};

export default SmartInstallPrompt;
