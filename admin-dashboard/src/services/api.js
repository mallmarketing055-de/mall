import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear auth data and redirect to login
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      delete api.defaults.headers.common['Authorization'];
      
      // Only show toast if not already on login page
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      toast.error('Access denied. Insufficient permissions.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please try again.');
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// API service methods
export const adminAPI = {
  // Admin Authentication
  login: (credentials) => api.post('/api/Admin/signin', credentials),
  
  // Admin Management
  createAdmin: (adminData) => api.post('/api/Admin/signup', adminData),
  getAllAdmins: () => api.get('/api/Admin/all'),
  updateAdmin: (id, adminData) => api.put(`/api/Admin/${id}`, adminData),
  deleteAdmin: (id) => api.delete(`/api/Admin/${id}`),
};

export const productAPI = {
  // Product Management
  getAllProducts: (params) => api.get('/api/products', { params }),
  getProductById: (id) => api.get(`/api/products/${id}`),
  createProduct: (productData) => api.post('/api/products', productData),
  updateProduct: (id, productData) => api.put(`/api/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/api/products/${id}`),
};

export const userAPI = {
  // User Management
  getAllUsers: (params) => api.get('/api/customers/all', { params }),
  getUserById: (id) => api.get(`/api/customers/${id}`),
  deleteUser: (id) => api.delete(`/api/customers/${id}`),
  getUserStats: () => api.get('/api/customers/stats'),
};

export const transactionAPI = {
  // Transaction Management
  getAllTransactions: (params) => api.get('/api/transactions', { params }),
  getTransactionById: (id) => api.get(`/api/transactions/${id}`),
  getUserTransactions: (userId, params) => api.get(`/api/transactions/user/${userId}`, { params }),
  exportTransactions: (params) => api.get('/api/transactions/export', { 
    params,
    responseType: 'blob' // For file download
  }),
  getTransactionStats: () => api.get('/api/transactions/stats'),
};

export default api;
