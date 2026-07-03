/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ---- Theme state (NEW FEATURE) ----
  const [theme, setTheme] = useState({
    mode: 'dark',
    wallpaper: null,
    wallpaperType: 'solid',
    accentColor: '#25D366',
    bubbleColor: '#005C4B'
  });

  // ---- Initialize auth and theme on mount ----
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          
          // Load theme from user data (NEW)
          if (userData?.settings?.theme) {
            setTheme(prev => ({
              ...prev,
              mode: userData.settings.theme || 'dark',
              ...userData.settings.theme
            }));
          } else if (userData?.theme) {
            setTheme(prev => ({
              ...prev,
              ...userData.theme
            }));
          }
          
          // Load saved theme from localStorage if user theme not available (NEW)
          const savedTheme = localStorage.getItem('userTheme');
          if (savedTheme && !userData?.settings?.theme) {
            try {
              const parsedTheme = JSON.parse(savedTheme);
              setTheme(parsedTheme);
            } catch (e) {
              console.error('Error parsing saved theme:', e);
            }
          }
        } catch (err) {
          console.error('Failed to load user:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // ---- Login (UPDATED with theme handling) ----
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.login(email, password);
      const { user, token, refreshToken } = response;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);
      
      // Set theme from user data (NEW)
      if (user?.settings?.theme) {
        setTheme(prev => ({
          ...prev,
          mode: user.settings.theme || 'dark',
          ...user.settings.theme
        }));
      } else if (user?.theme) {
        setTheme(prev => ({
          ...prev,
          ...user.theme
        }));
      }
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // ---- Register (KEPT from OLD) ----
  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.register(userData);
      const { user, token, refreshToken } = response;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // ---- Logout (UPDATED with theme cleanup) ----
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userTheme'); // NEW: Clean up theme storage
      setUser(null);
      // Reset theme to defaults (NEW)
      setTheme({
        mode: 'dark',
        wallpaper: null,
        wallpaperType: 'solid',
        accentColor: '#25D366',
        bubbleColor: '#005C4B'
      });
    }
  };

  // ---- Update user (UPDATED with theme support) ----
  const updateUser = (updatedData) => {
    setUser(prev => {
      const updated = { ...prev, ...updatedData };
      // Update theme if included in updated data (NEW)
      if (updatedData?.settings?.theme) {
        setTheme(prevTheme => ({
          ...prevTheme,
          ...updatedData.settings.theme
        }));
      } else if (updatedData?.theme) {
        setTheme(prevTheme => ({
          ...prevTheme,
          ...updatedData.theme
        }));
      }
      return updated;
    });
  };

  // ---- Update theme (NEW FEATURE) ----
  const updateTheme = (newTheme) => {
    setTheme(prev => {
      const updated = { ...prev, ...newTheme };
      // Save to localStorage (NEW)
      localStorage.setItem('userTheme', JSON.stringify(updated));
      
      // Update user settings if user is logged in
      if (user) {
        setUser(prevUser => ({
          ...prevUser,
          settings: {
            ...prevUser.settings,
            theme: updated
          }
        }));
      }
      
      return updated;
    });
  };

  // ---- Upload wallpaper (NEW FEATURE) ----
  const uploadWallpaper = async (wallpaperData) => {
    try {
      // If it's a file, upload to server
      if (wallpaperData instanceof File) {
        const formData = new FormData();
        formData.append('wallpaper', wallpaperData);
        const response = await api.post('/users/wallpaper', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const wallpaperUrl = response.data.url;
        updateTheme({ wallpaper: wallpaperUrl, wallpaperType: 'image' });
        return { success: true, url: wallpaperUrl };
      } else {
        // It's a URL or null
        updateTheme({ 
          wallpaper: wallpaperData, 
          wallpaperType: wallpaperData ? 'image' : 'solid' 
        });
        return { success: true };
      }
    } catch (err) {
      console.error('Upload wallpaper error:', err);
      setError(err.message || 'Failed to upload wallpaper');
      return { success: false, error: err.message };
    }
  };

  // ---- Reset theme (NEW FEATURE) ----
  const resetTheme = () => {
    const defaultTheme = {
      mode: 'dark',
      wallpaper: null,
      wallpaperType: 'solid',
      accentColor: '#25D366',
      bubbleColor: '#005C4B'
    };
    updateTheme(defaultTheme);
  };

  // ---- Update user profile (NEW FEATURE) ----
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await authService.updateProfile(profileData);
      updateUser(response.user);
      return { success: true, user: response.user };
    } catch (err) {
      const errorMessage = err.message || 'Profile update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // ---- Change password (NEW FEATURE) ----
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      await authService.changePassword({ currentPassword, newPassword });
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Password change failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // ---- Verify email (NEW FEATURE) ----
  const verifyEmail = async (token) => {
    try {
      setError(null);
      const response = await authService.verifyEmail(token);
      updateUser({ isVerified: true });
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Email verification failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    // State
    user,
    loading,
    error,
    theme, // NEW
    
    // Auth methods (KEPT from OLD)
    login,
    register,
    logout,
    updateUser,
    
    // Theme methods (NEW)
    updateTheme,
    uploadWallpaper,
    resetTheme,
    
    // Profile methods (NEW)
    updateProfile,
    changePassword,
    verifyEmail,
    
    // Helpers (KEPT from OLD)
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};