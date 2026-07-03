import { api } from './api';

/**
 * Extract error message from API response
 */
const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An error occurred';
};

export const authService = {
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      return response.data.data.user;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async refreshToken(refreshToken) {
    try {
      const response = await api.post('/auth/refresh-token', { refreshToken });
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};