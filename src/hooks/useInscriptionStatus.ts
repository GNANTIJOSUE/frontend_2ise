import { useState, useEffect } from 'react';

interface InscriptionStatus {
  isOpen: boolean;
  loading: boolean;
  error: string | null;
}

export const useInscriptionStatus = (): InscriptionStatus => {
  const [status, setStatus] = useState<InscriptionStatus>({
    isOpen: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    const checkInscriptionStatus = async () => {
      try {
        // Appel API pour vérifier le statut des inscriptions
        const response = await fetch('https://2ise-groupe.com/api/public/settings/inscriptions/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStatus({
            isOpen: data.inscriptionsOpen || false,
            loading: false,
            error: null
          });
        } else {
          // En cas d'erreur, on considère que les inscriptions sont fermées par défaut
          setStatus({
            isOpen: false,
            loading: false,
            error: 'Impossible de vérifier le statut des inscriptions'
          });
        }
      } catch (error) {
        // En cas d'erreur réseau, on considère que les inscriptions sont fermées
        setStatus({
          isOpen: false,
          loading: false,
          error: 'Erreur de connexion'
        });
      }
    };

    checkInscriptionStatus();
  }, []);

  return status;
}; 