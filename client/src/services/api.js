import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

api.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err.response?.data || { error: 'Помилка мережі' })
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  verify: (data) => api.post('/auth/verify', data),
  resendCode: (data) => api.post('/auth/resend-code', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getPopular: () => api.get('/products', { params: { popular: true, limit: 8 } }),
};

export const categoriesApi = {
  getAll: () => api.get('/categories'),
};

export const ordersApi = {
  create: (data) => api.post('/orders', data),
  getMy: () => api.get('/orders/my'),
  getById: (id) => api.get(`/orders/${id}`),
};

export const profileApi = {
  update: (data) => api.put('/profile/update', data),
  getBonuses: () => api.get('/profile/bonuses'),
};

export const promoApi = {
  validate: (code, total) => api.post('/promo/validate', { code, total }),
};

export default api;
