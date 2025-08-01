// ============================================================================
// SISTEMA FINANCEIRO IAB - CONSTANTS
// ============================================================================

// 🕒 CACHE & TIMING
export const CACHE_CONFIG = {
  TTL: {
    CATEGORIES: 60 * 1000,      // 1 minuto
    USERS: 60 * 1000,          // 1 minuto  
    SESSION: 120 * 1000,       // 2 minutos
    MOVEMENTS: 30 * 1000,      // 30 segundos
  },
  DEBOUNCE: {
    SEARCH: 300,               // 300ms
    API_REQUEST: 500,          // 500ms
  }
} as const;

// 🎨 UI CONFIGURATION
export const UI_CONFIG = {
  PAGINATION: {
    DEFAULT_SIZE: 10,
    MAX_SIZE: 50,
    SIZES: [5, 10, 20, 50] as const,
  },
  SIDEBAR: {
    MOBILE_BREAKPOINT: 768,    // px
    ANIMATION_DURATION: 200,   // ms
  },
  TOAST: {
    DURATION: 3000,            // 3 segundos
    MAX_VISIBLE: 3,
  }
} as const;

// 🔐 AUTH & PERMISSIONS  
export const AUTH_CONFIG = {
  SESSION: {
    EXPIRES_HOURS: 24,         // 24 horas
    REFRESH_THRESHOLD: 2,      // 2 horas antes de expirar
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    REQUIRE_SPECIAL: false,
  }
} as const;

// 🗃️ DATABASE CONFIGURATION
export const DB_CONFIG = {
  PRAGMA: {
    FOREIGN_KEYS: 'ON',
    JOURNAL_MODE: 'WAL',       // Write-Ahead Logging
    SYNCHRONOUS: 'NORMAL',
  },
  LIMITS: {
    MAX_QUERY_TIME: 5000,      // 5 segundos
    MAX_CONNECTIONS: 10,
  }
} as const;

// 📝 VALIDATION RULES
export const VALIDATION = {
  USER: {
    USERNAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 50,
      PATTERN: /^[a-zA-Z0-9._-]+$/,
    },
    NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 100,
    },
    EMAIL: {
      MAX_LENGTH: 255,
      PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    }
  },
  CATEGORY: {
    NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
    },
  },
  MOVEMENT: {
    DESCRIPTION: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 200,
    },
    AMOUNT: {
      MIN: 0.01,
      MAX: 999999.99,
    }
  }
} as const;

// 🎯 BUSINESS RULES
export const BUSINESS_RULES = {
  ROLES: {
    HIERARCHY: ['viewer', 'editor', 'admin', 'root'] as const,
    DEFAULT: 'viewer' as const,
  },
  CATEGORIES: {
    SYSTEM_SLUGS: ['cantinas', 'missoes', 'melhorias', 'jovens', 'eventos', 'aquisicao'] as const,
    MAX_CUSTOM: 20,
    DEFAULT_ICON: 'Folder' as const,
  },
  MOVEMENTS: {
    TYPES: ['entrada', 'saida'] as const,
    BATCH_SIZE: 100,
  }
} as const;

// 📊 PERFORMANCE THRESHOLDS
export const PERFORMANCE = {
  RENDER: {
    WARNING_MS: 16,            // 1 frame (60fps)
    ERROR_MS: 100,             // Perceptível
  },
  API: {
    FAST_MS: 200,
    SLOW_MS: 1000,
    TIMEOUT_MS: 5000,
  },
  MEMORY: {
    CACHE_MAX_SIZE: 50,        // objetos em cache
    GC_THRESHOLD: 0.8,         // 80% heap
  }
} as const;

// 🔄 DEFAULT VALUES
export const DEFAULTS = {
  USER: {
    ROLE: BUSINESS_RULES.ROLES.DEFAULT,
    PERMISSIONS: {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canManageUsers: false,
      canViewReports: true,
      canManageCategories: false,
      categories: [] as string[],
    }
  },
  CATEGORY: {
    ICON: BUSINESS_RULES.CATEGORIES.DEFAULT_ICON,
    IS_PUBLIC: false,
    IS_SYSTEM: false,
  },
  MOVEMENT: {
    TYPE: 'entrada' as const,
    AMOUNT: 0,
  }
} as const;

// 📱 RESPONSIVE BREAKPOINTS (Tailwind-compatible)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// 🌈 THEME COLORS (Mapped to Tailwind)
export const THEME_COLORS = {
  PRIMARY: 'blue',
  SECONDARY: 'gray',
  SUCCESS: 'green',
  WARNING: 'yellow', 
  ERROR: 'red',
  INFO: 'blue',
} as const;