import { useState, useEffect } from 'react';
import axios from 'axios';

export const useTrimesterId = (trimesterName: string | null) => {
  const [trimesterId, setTrimesterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrimesterId = async () => {
      if (!trimesterName) {
        console.log('[HOOK] Aucun nom de trimestre fourni');
        setTrimesterId(null);
        return;
      }

      console.log(`[HOOK] Récupération de l'ID du trimestre pour: "${trimesterName}"`);
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        console.log(`[HOOK] Appel API: /api/trimesters/by-name/${encodeURIComponent(trimesterName)}`);
        
        const response = await axios.get(`https://2ise-groupe.com/api/trimesters/by-name/${encodeURIComponent(trimesterName)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`[HOOK] Réponse API trimestre:`, response.data);
        setTrimesterId(response.data.id);
        
        console.log(`[HOOK] ID du trimestre récupéré: ${response.data.id} pour "${trimesterName}"`);
      } catch (err: any) {
        console.error('[HOOK] Erreur lors de la récupération de l\'ID du trimestre:', err);
        console.error('[HOOK] Détails de l\'erreur:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError(err.response?.data?.message || 'Erreur lors de la récupération de l\'ID du trimestre');
        setTrimesterId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTrimesterId();
  }, [trimesterName]);

  return { trimesterId, loading, error };
}; 