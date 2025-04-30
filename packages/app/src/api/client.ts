import axios from 'axios';
// import Constants from 'expo-constants'; // Remove Expo import

// Function to get the API base URL
const getApiBaseUrl = (): string => {
    const localhost = `http://localhost:8080/api`; // Default for local dev server

    // Check if running in development mode using Vite's env variable
    if (import.meta.env.DEV) {
        // Use localhost directly (works for web)
        return localhost;
    }

    // In production/other environments, you might use an env var or a fixed URL
    // Example using Vite env var (needs VITE_ prefix): `import.meta.env.VITE_API_URL`
    // Or just return a deployed URL
    // return 'https://your-deployed-api.com/api';

    // Fallback to localhost for now if not in DEV (adjust for deployment)
    return localhost;
};

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add interceptors for logging, error handling, or adding auth tokens
// apiClient.interceptors.request.use(config => {
//   console.log('Starting Request', config);
//   return config;
// });

// apiClient.interceptors.response.use(response => {
//   console.log('Response:', response);
//   return response;
// }, error => {
//   console.error('API Error:', error.response || error.message);
//   return Promise.reject(error);
// });

export default apiClient; 