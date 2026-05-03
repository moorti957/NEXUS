import axios from 'axios';
import socketService from '../socket';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
  timeout: 30000, // 30 seconds timeout
});

// Store pending requests for retry after token refresh
let pendingRequests = [];
let isRefreshing = false;

// ===========================================
// REQUEST INTERCEPTOR
// ===========================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===========================================
// RESPONSE INTERCEPTOR
// ===========================================
api.interceptors.response.use(
  (response) => {
    // Log API call duration in development
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      const duration = new Date() - response.config.metadata.startTime;
      console.log(`📡 API Call: ${response.config.method.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error in development
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ API Error:', {
        url: originalRequest?.url,
        method: originalRequest?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }

    // Handle network errors
    if (!error.response) {
      console.error('🌐 Network Error - Server may be down');
      
      // Emit socket event for connection issues
      if (socketService.isConnected()) {
        socketService.emit('app:network-error', { 
          message: 'Network connection lost',
          timestamp: new Date()
        });
      }
      
      return Promise.reject({
        success: false,
        message: 'Network error. Please check your connection.',
        isNetworkError: true
      });
    }

    // Handle token expiration (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Don't retry login/refresh endpoints to avoid infinite loops
      if (originalRequest.url.includes('/auth/login') || 
          originalRequest.url.includes('/auth/refresh-token')) {
        // Clear tokens and redirect to login
        clearAuthData();
        window.location.href = '/auth';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Wait for token refresh and retry
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh token
        console.log('🔄 Attempting to refresh token...');
        const response = await api.post('/auth/refresh-token');
        const { token, refreshToken } = response.data.data;

        // Update stored tokens
        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        // Update default headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Emit socket event for token refresh
        if (socketService.isConnected()) {
          socketService.emit('auth:token-refreshed', { 
            timestamp: new Date() 
          });
        }

        console.log('✅ Token refreshed successfully');

        // Retry all pending requests
        pendingRequests.forEach(({ resolve, reject, config }) => {
          config.headers['Authorization'] = `Bearer ${token}`;
          api(config).then(resolve).catch(reject);
        });
        pendingRequests = [];

        // Retry original request
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return api(originalRequest);

      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Clear all auth data
        clearAuthData();

        // Reject all pending requests
        pendingRequests.forEach(({ reject }) => {
          reject(refreshError);
        });
        pendingRequests = [];

        // Emit socket event for auth failure
        if (socketService.isConnected()) {
          socketService.emit('auth:session-expired', { 
            message: 'Session expired. Please login again.',
            timestamp: new Date()
          });
        }

        // Redirect to login
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle forbidden (403)
    if (error.response?.status === 403) {
      console.warn('🚫 Access forbidden:', error.response.data.message);
      
      // Emit socket event for permission error
      if (socketService.isConnected()) {
        socketService.emit('app:permission-denied', {
          message: error.response.data.message,
          timestamp: new Date()
        });
      }
    }

    // Handle server errors (500)
    if (error.response?.status >= 500) {
      console.error('🔥 Server error:', error.response.data);
      
      // Emit socket event for server error
      if (socketService.isConnected()) {
        socketService.emit('app:server-error', {
          status: error.response.status,
          message: error.response.data.message || 'Internal server error',
          timestamp: new Date()
        });
      }
    }

    return Promise.reject(error);
  }
);

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Clear all authentication data
 */
const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  delete api.defaults.headers.common['Authorization'];
};

/**
 * Set authentication token
 * @param {string} token - JWT token
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    clearAuthData();
  }
};

/**
 * Get current authentication token
 * @returns {string|null} JWT token
 */
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// ===========================================
// API REQUEST METHODS WITH ERROR HANDLING
// ===========================================

/**
 * GET request wrapper
 * @param {string} url - API endpoint
 * @param {Object} params - Query parameters
 * @param {Object} config - Additional axios config
 */
export const get = async (url, params = {}, config = {}) => {
  try {
    const response = await api.get(url, { params, ...config });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * POST request wrapper
 * @param {string} url - API endpoint
 * @param {Object} data - Request body
 * @param {Object} config - Additional axios config
 */
export const post = async (url, data = {}, config = {}) => {
  try {
    const response = await api.post(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * PUT request wrapper
 * @param {string} url - API endpoint
 * @param {Object} data - Request body
 * @param {Object} config - Additional axios config
 */
export const put = async (url, data = {}, config = {}) => {
  try {
    const response = await api.put(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * PATCH request wrapper
 * @param {string} url - API endpoint
 * @param {Object} data - Request body
 * @param {Object} config - Additional axios config
 */
export const patch = async (url, data = {}, config = {}) => {
  try {
    const response = await api.patch(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * DELETE request wrapper
 * @param {string} url - API endpoint
 * @param {Object} config - Additional axios config
 */
export const del = async (url, config = {}) => {
  try {
    const response = await api.delete(url, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Upload file with progress tracking
 * @param {string} url - API endpoint
 * @param {FormData} formData - Form data with file
 * @param {Function} onProgress - Progress callback
 */
export const upload = async (url, formData, onProgress) => {
  try {
    const response = await api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Download file
 * @param {string} url - API endpoint
 * @param {Object} params - Query parameters
 */
export const download = async (url, params = {}) => {
  try {
    const response = await api.get(url, {
      params,
      responseType: 'blob',
    });
    
    // Create download link
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // Extract filename from content-disposition header or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'download';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
    
    return { success: true };
  } catch (error) {
    throw handleApiError(error);
  }
};

// ===========================================
// ERROR HANDLER
// ===========================================

/**
 * Handle API errors consistently
 * @param {Error} error - Axios error object
 * @returns {Object} Formatted error object
 */
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return {
      success: false,
      status: error.response.status,
      message: error.response.data?.message || 'An error occurred',
      errors: error.response.data?.errors || [],
      data: error.response.data,
    };
  } else if (error.request) {
    // Request made but no response
    return {
      success: false,
      message: 'No response from server. Please check your connection.',
      isNetworkError: true,
    };
  } else {
    // Something else happened
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
};

// ===========================================
// SOCKET.IO INTEGRATION
// ===========================================

// Emit API calls through socket for real-time updates
if (socketService) {
  // Listen for token refresh events
  socketService.on('auth:token-refreshed', () => {
    console.log('🔄 Token refreshed via socket');
  });

  // Listen for session expiry
  socketService.on('auth:session-expired', (data) => {
    console.warn('⚠️ Session expired:', data.message);
    clearAuthData();
  });

  // Listen for server maintenance
  socketService.on('app:maintenance', (data) => {
    console.warn('🔧 Server maintenance:', data.message);
    // Show maintenance banner
  });
}

// ===========================================
// EXPORT API INSTANCE AND METHODS
// ===========================================
export default api;