// Configuration des URLs de l'application
export const API_CONFIG = {
  BASE_URL: 'https://2ise-groupe.com',
  API_URL: 'https://2ise-groupe.com/api',
  UPLOADS_URL: 'https://2ise-groupe.com/uploads',
  ASSETS_URL: 'https://2ise-groupe.com'
};

// URLs des assets
export const ASSETS = {
  LOGO: `${API_CONFIG.ASSETS_URL}/2ISE.jpg`,
  FAVICON: `${API_CONFIG.ASSETS_URL}/favicon.ico`
};

// Configuration de l'application
export const APP_CONFIG = {
  NAME: '2ISE Groupe',
  VERSION: '1.0.0',
  CONTACT_EMAIL: 'info@2ise-groupe.com',
  SUPPORT_PHONE: '+225 00000000'
};

// Configuration des paiements
export const PAYMENT_CONFIG = {
  FUSION_MERCHANT_ID: process.env.REACT_APP_FUSION_MERCHANT_ID || '',
  FUSION_API_KEY: process.env.REACT_APP_FUSION_API_KEY || '',
  FUSION_WEBHOOK_URL: `${API_CONFIG.API_URL}/payments/fusion-webhook`
};

// Configuration des emails
export const EMAIL_CONFIG = {
  FROM_EMAIL: 'noreply@2ise-groupe.com',
  FROM_NAME: '2ISE Groupe',
  SUPPORT_EMAIL: 'support@2ise-groupe.com'
};

// Configuration WhatsApp
export const WHATSAPP_CONFIG = {
  API_URL: process.env.REACT_APP_WHATSAPP_API_URL || '',
  API_KEY: process.env.REACT_APP_WHATSAPP_API_KEY || '',
  PHONE_NUMBER: process.env.REACT_APP_WHATSAPP_PHONE || ''
};
