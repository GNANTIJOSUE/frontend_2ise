// Fonction pour valider et nettoyer les caractères spéciaux
export const validateAndCleanText = (value: string, allowSpaces: boolean = true): string => {
  // Caractères autorisés : lettres, chiffres, espaces (si autorisés), tirets, apostrophes
  const allowedChars = allowSpaces 
    ? /^[a-zA-ZÀ-ÿ0-9\s\-'\.]+$/ 
    : /^[a-zA-ZÀ-ÿ0-9\-'\.]+$/;
  
  // Supprimer tous les caractères non autorisés
  return value.replace(/[^a-zA-ZÀ-ÿ0-9\s\-'\.]/g, '');
};

// Fonction pour valider les noms (prénom, nom)
export const validateName = (value: string): string => {
  let cleaned = validateAndCleanText(value, true);
  
  // Limiter la longueur à 50 caractères
  if (cleaned.length > 50) {
    cleaned = cleaned.substring(0, 50);
  }
  
  return cleaned;
};

// Fonction pour valider les adresses
export const validateAddress = (value: string): string => {
  // Caractères autorisés : lettres, chiffres, espaces, tirets, apostrophes, virgules, points
  // Supprimer les caractères dangereux pour la sécurité
  let cleaned = value.replace(/[<>{}[\]\\|`~!@#$%^&*+=]/g, '');
  
  // Limiter la longueur à 200 caractères
  if (cleaned.length > 200) {
    cleaned = cleaned.substring(0, 200);
  }
  
  return cleaned;
};

// Fonction pour valider les villes
export const validateCity = (value: string): string => {
  let cleaned = validateAndCleanText(value, true);
  
  // Limiter la longueur à 50 caractères
  if (cleaned.length > 50) {
    cleaned = cleaned.substring(0, 50);
  }
  
  return cleaned;
};

// Fonction pour valider les téléphones (seulement chiffres, espaces, tirets, parenthèses)
export const validatePhone = (value: string): string => {
  // Caractères autorisés : chiffres, espaces, tirets, parenthèses, +
  // Supprimer tous les caractères non autorisés
  let cleaned = value.replace(/[^0-9\s\-\(\)\+]/g, '');
  
  // Limiter la longueur à 20 caractères
  if (cleaned.length > 20) {
    cleaned = cleaned.substring(0, 20);
  }
  
  return cleaned;
};

// Fonction pour valider les matricules (lettres, chiffres, tirets)
export const validateMatricule = (value: string): string => {
  let cleaned = value.replace(/[^a-zA-Z0-9\-]/g, '');
  
  // Limiter la longueur à 20 caractères
  if (cleaned.length > 20) {
    cleaned = cleaned.substring(0, 20);
  }
  
  return cleaned;
};

// Fonction pour valider les écoles précédentes
export const validateSchool = (value: string): string => {
  let cleaned = validateAndCleanText(value, true);
  
  // Limiter la longueur à 100 caractères
  if (cleaned.length > 100) {
    cleaned = cleaned.substring(0, 100);
  }
  
  return cleaned;
};

// Fonction pour valider les classes précédentes
export const validateClass = (value: string): string => {
  let cleaned = validateAndCleanText(value, true);
  
  // Limiter la longueur à 50 caractères
  if (cleaned.length > 50) {
    cleaned = cleaned.substring(0, 50);
  }
  
  return cleaned;
};

// Fonction pour valider les nationalités
export const validateNationality = (value: string): string => {
  let cleaned = validateAndCleanText(value, true);
  
  // Limiter la longueur à 30 caractères
  if (cleaned.length > 30) {
    cleaned = cleaned.substring(0, 30);
  }
  
  return cleaned;
};

// Fonction pour valider les lieux de naissance
export const validateBirthPlace = (value: string): string => {
  let cleaned = validateAndCleanText(value, true);
  
  // Limiter la longueur à 50 caractères
  if (cleaned.length > 50) {
    cleaned = cleaned.substring(0, 50);
  }
  
  return cleaned;
};
