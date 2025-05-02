// Application configuration
// This file centralizes all configuration variables used throughout the application

/**
 * Environment-specific configuration for the application
 */
const config = {
  // API URL configuration 
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
    apiPath: '/api',
    get fullUrl() {
      return `${this.baseUrl}${this.apiPath}`;
    }
  },
  
  // App URL configuration
  app: {
    baseUrl: import.meta.env.VITE_APP_BASE_URL || 'http://localhost:3000',
    get fullUrl() {
      return this.baseUrl;
    }
  },
  
  // Additional configuration parameters can be added here
  socketOptions: {
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  },
};

// Freeze the config object to prevent accidental modifications
Object.freeze(config);

export default config;