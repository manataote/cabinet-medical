// Utilitaire pour gérer les logs et désactiver les logs de Supabase

// Désactiver les logs de console de Supabase/GoTrueClient
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Fonction pour filtrer les logs de Supabase
const shouldLog = (args: any[]): boolean => {
  const messageStr = String(args[0] || '');
  
  // Filtrer les logs de GoTrueClient et Supabase Auth
  const supabaseLogPatterns = [
    'GoTrueClient',
    'supabase',
    'auth',
    'session',
    'token',
    'refresh',
    'onAuthStateChange',
    'getSession',
    'signIn',
    'signOut',
    'signUp'
  ];
  
  return !supabaseLogPatterns.some(pattern => 
    messageStr.toLowerCase().includes(pattern.toLowerCase())
  );
};

// Override console.log pour filtrer les logs de Supabase
console.log = (...args: any[]) => {
  if (shouldLog(args)) {
    originalConsoleLog(...args);
  }
};

// Override console.info pour filtrer les logs de Supabase
console.info = (...args: any[]) => {
  if (shouldLog(args)) {
    originalConsoleInfo(...args);
  }
};

// Override console.warn pour filtrer les logs de Supabase
console.warn = (...args: any[]) => {
  if (shouldLog(args)) {
    originalConsoleWarn(...args);
  }
};

// Override console.error pour filtrer les logs de Supabase
console.error = (...args: any[]) => {
  if (shouldLog(args)) {
    originalConsoleError(...args);
  }
};

// Fonction pour logger nos propres messages (qui ne seront pas filtrés)
export const log = {
  info: (...args: any[]) => {
    originalConsoleLog('ℹ️', ...args);
  },
  success: (...args: any[]) => {
    originalConsoleLog('✅', ...args);
  },
  warning: (...args: any[]) => {
    originalConsoleWarn('⚠️', ...args);
  },
  error: (...args: any[]) => {
    originalConsoleError('❌', ...args);
  },
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      originalConsoleLog('🐛', ...args);
    }
  },
  todo: (...args: any[]) => {
    originalConsoleLog('📋', ...args);
  },
  user: (...args: any[]) => {
    originalConsoleLog('👤', ...args);
  },
  database: (...args: any[]) => {
    originalConsoleLog('🗄️', ...args);
  }
};

// Fonction pour réactiver temporairement tous les logs (pour le debug)
export const enableAllLogs = () => {
  console.log = originalConsoleLog;
  console.info = originalConsoleInfo;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
};

// Fonction pour désactiver complètement tous les logs
export const disableAllLogs = () => {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
};
