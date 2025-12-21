import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://mall-d62z.onrender.com',
  // baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',

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
  createProduct: (productData) => {
    console.log('Creating product:', productData);
    return api.post('/api/products', productData);
  },
  updateProduct: (id, productData) => {
    console.log('Updating product ID:', id, 'with data:', productData);
    return api.put(`/api/products/${id}`, productData);
  },
  deleteProduct: (id) => {
    console.log('Deleting product ID:', id);
    return api.delete(`/api/products/${id}`);
  },
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
  getMonthlyReport: () => api.get('/api/transactions/admin/monthly-report/view'),
  getTransactionById: (id) => api.get(`/api/transactions/${id}`),
  getUserTransactions: (userId, params) => api.get(`/api/transactions/user/${userId}`, { params }),
  exportTransactions: (params) => api.get('/api/transactions/export/csv', {
    params,
    responseType: 'blob' // For file download
  }),
  getTransactionStats: () => api.get('/api/transactions/stats'),
};

export const socialMediaAPI = {
  // ✅ Create new social media link
  createLink: (linkData) => api.post('/api/social-links', linkData),

  // ✅ Get all links (for logged-in user or all, depending on backend)
  getAllLinks: (params) => api.get('/api/social-links', { params }),

  // ✅ Get specific link by ID
  getLinkById: (id) => api.get(`/api/social-links/${id}`),

  // ✅ Update a link
  updateLink: (id, linkData) => api.put(`/api/social-links/${id}`, linkData),

  // ✅ Delete a link
  deleteLink: (id) => api.delete(`/api/social-links/${id}`),
};

// pointsAPI service
export const pointsAPI = {
  // Get paginated users with points overview
  getOverview: (params = {}, token) => {
    return api.get('/api/Admin/app-points-stats/overview', { params });
  },

  // Add points to a specific user
  addPoints: (customerId, points, token) => {
    return api.post('/api/admin/add-points', { customerId, points });
  },

  // Optional: get single user's points history
  getUserPoints: (customerId, params = {}) => {
    return api.get(`/api/admin/user-points/${customerId}`, { params });
  },

  // Optional: remove/reduce points (if needed)
  deductPoints: (customerId, points) => {
    return api.post('/api/admin/deduct-points', { customerId, points });
  }
};

// dashboardAPI service
export const dashboardAPI = {
  // Get all jobs for a specific user
  getUserJobs: (customerId) => {
    const token = localStorage.getItem('adminToken');
    return api.get(`/api/dashboard/user-jobs/${customerId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};


export default api;
