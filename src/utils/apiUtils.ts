import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Configuration de base pour axios
const apiClient = axios.create({
  baseURL: 'https://2ise-groupe.com/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ajouter des headers pour éviter les problèmes CORS
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    // Log pour debug
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      origin: window.location.origin,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    console.error('[API Response Error]', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });

    // Gestion spécifique des erreurs CORS
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('[CORS Error] Problème de connexion réseau ou CORS');
      return Promise.reject({
        message: 'Erreur de connexion réseau. Vérifiez votre connexion internet et les paramètres CORS.',
        type: 'NETWORK_ERROR'
      });
    }

    // Gestion des erreurs 403 (CORS)
    if (error.response?.status === 403) {
      console.error('[CORS Error] Accès interdit - Problème CORS');
      return Promise.reject({
        message: 'Erreur CORS: Accès interdit depuis cette origine.',
        type: 'CORS_ERROR',
        origin: window.location.origin
      });
    }

    // Gestion des erreurs 500
    if (error.response?.status === 500) {
      console.error('[Server Error] Erreur serveur');
      return Promise.reject({
        message: 'Erreur serveur. Veuillez réessayer plus tard.',
        type: 'SERVER_ERROR'
      });
    }

    return Promise.reject(error);
  }
);

// Fonction utilitaire pour faire des requêtes avec gestion d'erreurs améliorée
export const apiRequest = async <T = any>(
  config: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await apiClient(config);
    return response.data;
  } catch (error: any) {
    // Log détaillé de l'erreur
    console.error('[API Request Failed]', {
      url: config.url,
      method: config.method,
      error: error.message || error,
      type: error.type || 'UNKNOWN'
    });

    // Re-lancer l'erreur avec plus de contexte
    throw {
      ...error,
      context: {
        url: config.url,
        method: config.method,
        origin: window.location.origin
      }
    };
  }
};

// Fonctions spécifiques pour les requêtes courantes
export const apiGet = <T = any>(url: string, params?: any): Promise<T> => {
  return apiRequest<T>({ method: 'GET', url, params });
};

export const apiPost = <T = any>(url: string, data?: any): Promise<T> => {
  return apiRequest<T>({ method: 'POST', url, data });
};

export const apiPut = <T = any>(url: string, data?: any): Promise<T> => {
  return apiRequest<T>({ method: 'PUT', url, data });
};

export const apiDelete = <T = any>(url: string): Promise<T> => {
  return apiRequest<T>({ method: 'DELETE', url });
};

// Fonction pour tester la connectivité API
export const testApiConnection = async (): Promise<boolean> => {
  try {
    await apiGet('/public/health');
    console.log('[API Test] Connexion réussie');
    return true;
  } catch (error) {
    console.error('[API Test] Échec de connexion:', error);
    return false;
  }
};

export default apiClient;
