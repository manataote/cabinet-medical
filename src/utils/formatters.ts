/**
 * Utilitaires de formatage pour les dates et les nombres
 * Ces fonctions respectent les préférences de format définies par l'utilisateur
 */

/**
 * Formate une date selon le format spécifié
 * @param date Date à formater (Date, string ou null/undefined)
 * @param format Format souhaité (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
 * @returns Date formatée sous forme de string
 */
export function formatDate(date: Date | string | null | undefined, format: string = 'DD/MM/YYYY'): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Formate un nombre selon le format spécifié
 * @param value Nombre à formater
 * @param format Format souhaité (Virgule, Point, Espace)
 * @param decimals Nombre de décimales (2 par défaut)
 * @returns Nombre formaté sous forme de string
 */
export function formatNumber(value: number | string | null | undefined, format: string = 'Virgule (1,234.56)', decimals: number = 2): string {
  if (value === null || value === undefined || value === '') return '0';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';

  // Séparer la partie entière et décimale
  const fixedValue = numValue.toFixed(decimals);
  const [integerPart, decimalPart] = fixedValue.split('.');

  let formattedInteger = '';
  let decimalSeparator = '.';
  let thousandSeparator = ',';

  // Déterminer les séparateurs selon le format
  if (format.includes('Point')) {
    // Format Point : 1.234,56
    decimalSeparator = ',';
    thousandSeparator = '.';
  } else if (format.includes('Espace')) {
    // Format Espace : 1 234,56
    decimalSeparator = ',';
    thousandSeparator = ' ';
  }
  // Sinon format Virgule par défaut : 1,234.56

  // Ajouter les séparateurs de milliers
  const reversedInteger = integerPart.split('').reverse().join('');
  for (let i = 0; i < reversedInteger.length; i++) {
    if (i > 0 && i % 3 === 0) {
      formattedInteger = thousandSeparator + formattedInteger;
    }
    formattedInteger = reversedInteger[i] + formattedInteger;
  }

  // Construire le nombre complet
  if (decimals > 0 && decimalPart) {
    return `${formattedInteger}${decimalSeparator}${decimalPart}`;
  }

  return formattedInteger;
}

/**
 * Formate un montant en XPF (Francs Pacifiques)
 * @param amount Montant à formater
 * @param format Format souhaité
 * @returns Montant formaté avec la devise
 */
export function formatCurrency(amount: number | string | null | undefined, format: string = 'Virgule (1,234.56)'): string {
  const formattedAmount = formatNumber(amount, format, 0); // Pas de décimales pour XPF
  return `${formattedAmount} F`;
}

/**
 * Parse une date depuis un string formaté vers un objet Date
 * @param dateString Date sous forme de string
 * @param format Format de la date string
 * @returns Objet Date ou null si invalide
 */
export function parseDate(dateString: string, format: string = 'DD/MM/YYYY'): Date | null {
  if (!dateString) return null;

  let day: number, month: number, year: number;

  switch (format) {
    case 'MM/DD/YYYY': {
      const parts = dateString.split('/');
      if (parts.length !== 3) return null;
      month = parseInt(parts[0], 10);
      day = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
      break;
    }
    case 'YYYY-MM-DD': {
      const parts = dateString.split('-');
      if (parts.length !== 3) return null;
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
      break;
    }
    case 'DD/MM/YYYY':
    default: {
      const parts = dateString.split('/');
      if (parts.length !== 3) return null;
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
      break;
    }
  }

  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Parse un nombre depuis un string formaté
 * @param numberString Nombre sous forme de string
 * @param format Format du nombre string
 * @returns Nombre ou null si invalide
 */
export function parseNumber(numberString: string, format: string = 'Virgule (1,234.56)'): number | null {
  if (!numberString) return null;

  let cleanString = numberString;

  // Retirer les séparateurs de milliers selon le format
  if (format.includes('Point')) {
    // Format Point : 1.234,56 -> retirer les points, remplacer virgule par point
    cleanString = cleanString.replace(/\./g, '').replace(',', '.');
  } else if (format.includes('Espace')) {
    // Format Espace : 1 234,56 -> retirer les espaces, remplacer virgule par point
    cleanString = cleanString.replace(/\s/g, '').replace(',', '.');
  } else {
    // Format Virgule : 1,234.56 -> retirer les virgules
    cleanString = cleanString.replace(/,/g, '');
  }

  const number = parseFloat(cleanString);
  return isNaN(number) ? null : number;
}


