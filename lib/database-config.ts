// ===========================================
// DATABASE CONFIGURATION
// ===========================================
// Configuração simplificada para SQLite

export interface DatabaseConfig {
  type: 'sqlite';
  path: string;
}

export const getDatabaseConfig = (): DatabaseConfig => {
  const env = process.env.NODE_ENV || 'development';
  
  // Para produção na Vercel, usar diretório temporário
  if (env === 'production') {
    return {
      type: 'sqlite',
      path: '/tmp/iab_finance.db' // Diretório temporário na Vercel
    };
  }
  
  // Desenvolvimento e teste
  return {
    type: 'sqlite',
    path: process.env.DB_PATH || 'iab_finance.db'
  };
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

export const isTest = (): boolean => {
  return process.env.NODE_ENV === 'test';
}; 