/**
 * Security Configuration
 * Environment-specific security settings
 */

export interface SecurityConfig {
  rateLimit: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
    blockDuration: number;
  };
  authentication: {
    requireAuth: boolean;
    sessionTimeout: number;
    allowAnonymous: boolean;
  };
  validation: {
    strictMode: boolean;
    logSuspiciousActivity: boolean;
    blockMaliciousRequests: boolean;
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    retentionDays: number;
  };
  cors: {
    enabled: boolean;
    allowedOrigins: string[];
    allowCredentials: boolean;
  };
}

/**
 * Development environment security configuration
 */
const developmentConfig: SecurityConfig = {
  rateLimit: {
    enabled: true,
    maxRequests: 1000, // Higher limit for development
    windowMs: 60000, // 1 minute
    blockDuration: 300000, // 5 minutes
  },
  authentication: {
    requireAuth: false, // Allow development without auth
    sessionTimeout: 86400000, // 24 hours
    allowAnonymous: true,
  },
  validation: {
    strictMode: false,
    logSuspiciousActivity: true,
    blockMaliciousRequests: false, // Log but don't block in dev
  },
  monitoring: {
    enabled: true,
    logLevel: 'debug',
    retentionDays: 7,
  },
  cors: {
    enabled: true,
    allowedOrigins: ['http://localhost:3000', 'http://localhost:8001'],
    allowCredentials: true,
  },
};

/**
 * Staging environment security configuration
 */
const stagingConfig: SecurityConfig = {
  rateLimit: {
    enabled: true,
    maxRequests: 200,
    windowMs: 60000, // 1 minute
    blockDuration: 600000, // 10 minutes
  },
  authentication: {
    requireAuth: true,
    sessionTimeout: 28800000, // 8 hours
    allowAnonymous: false,
  },
  validation: {
    strictMode: true,
    logSuspiciousActivity: true,
    blockMaliciousRequests: true,
  },
  monitoring: {
    enabled: true,
    logLevel: 'info',
    retentionDays: 30,
  },
  cors: {
    enabled: true,
    allowedOrigins: [
      'https://staging.mukuru.com',
      'https://partner-staging.mukuru.com',
    ],
    allowCredentials: true,
  },
};

/**
 * Production environment security configuration
 */
const productionConfig: SecurityConfig = {
  rateLimit: {
    enabled: true,
    maxRequests: 100, // Strict limit for production
    windowMs: 60000, // 1 minute
    blockDuration: 3600000, // 1 hour
  },
  authentication: {
    requireAuth: true,
    sessionTimeout: 14400000, // 4 hours
    allowAnonymous: false,
  },
  validation: {
    strictMode: true,
    logSuspiciousActivity: true,
    blockMaliciousRequests: true,
  },
  monitoring: {
    enabled: true,
    logLevel: 'warn',
    retentionDays: 90,
  },
  cors: {
    enabled: true,
    allowedOrigins: [
      'https://mukuru.com',
      'https://partner.mukuru.com',
      'https://www.mukuru.com',
    ],
    allowCredentials: true,
  },
};

/**
 * Get security configuration based on environment
 */
export function getSecurityConfig(): SecurityConfig {
  const env = process.env.NODE_ENV || 'development';
  const customEnv = process.env.NEXT_PUBLIC_ENV;

  if (env === 'production' || customEnv === 'production') {
    return productionConfig;
  }

  if (customEnv === 'staging') {
    return stagingConfig;
  }

  return developmentConfig;
}

/**
 * Check if rate limiting is enabled in current environment
 */
export function isRateLimitEnabled(): boolean {
  const config = getSecurityConfig();
  return config.rateLimit.enabled;
}

/**
 * Check if CORS is enabled in current environment
 */
export function isCorsEnabled(): boolean {
  const config = getSecurityConfig();
  return config.cors.enabled;
}

/**
 * Check if monitoring is enabled in current environment
 */
export function isMonitoringEnabled(): boolean {
  const config = getSecurityConfig();
  return config.monitoring.enabled;
}

/**
 * Get rate limit configuration for current environment
 */
export function getRateLimitConfig() {
  return getSecurityConfig().rateLimit;
}

/**
 * Get authentication configuration for current environment
 */
export function getAuthConfig() {
  return getSecurityConfig().authentication;
}

/**
 * Check if request origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const config = getSecurityConfig();
  if (!config.cors.enabled) return false;

  return config.cors.allowedOrigins.some((allowed) => {
    // Exact match
    if (origin === allowed) return true;

    // Wildcard subdomain match (e.g., *.mukuru.com)
    if (allowed.startsWith('*.')) {
      const domain = allowed.substring(2);
      return origin.endsWith(domain);
    }

    return false;
  });
}

/**
 * Get monitoring configuration
 */
export function getMonitoringConfig() {
  return getSecurityConfig().monitoring;
}

/**
 * Check if request should be logged based on log level
 */
export function shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
  const config = getMonitoringConfig();
  const levels = ['debug', 'info', 'warn', 'error'];
  const configLevelIndex = levels.indexOf(config.logLevel);
  const requestLevelIndex = levels.indexOf(level);

  return requestLevelIndex >= configLevelIndex;
}
