import axios from 'axios';
import config from '../config';

const apiClient = axios.create({
  baseURL: config.api.fullUrl,
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