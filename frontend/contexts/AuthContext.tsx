'use client'; // This directive is required for components using Client Components features like hooks and event handlers

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import api, { setAccessToken, setRefreshToken, removeTokens, getAccessToken, getRefreshToken, getMyProfileApi } from '@/services/api';

// Define the shape of the user object (adjust based on your User entity from backend)
interface User {
  id: string;
  phone_number: string;
  role: string; // USER, CLUB_OWNER, ADMIN
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_image_url?: string;
  // Add other relevant user fields
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  loading: boolean; // For initial load and during login/logout
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  fetchUserProfile: () => Promise<void>; // To re-fetch user profile if needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setLocalAccessToken] = useState<string | null>(null);
  // Refresh token is typically only stored and not directly exposed via context for security reasons
  // but its presence can be inferred by isAuthenticated or by a dedicated check.
  const [loading, setLoading] = useState<boolean>(true); // True initially to check for existing session
  const router = useRouter();

  const fetchUserProfile = useCallback(async (token?: string) => {
    const currentToken = token || getAccessToken();
    if (!currentToken) {
      setUser(null);
      setLocalAccessToken(null);
      removeTokens();
      setLoading(false);
      return;
    }
    // Ensure the token is set for the api instance before making the call
    // This is usually handled by the interceptor, but explicit set can be good here.
    // api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`; // Or rely on interceptor

    setLoading(true);
    try {
      const response = await getMyProfileApi(); // Assumes getMyProfileApi uses the token from localStorage via interceptor
      setUser(response.data);
      setLocalAccessToken(currentToken); // Keep access token in state
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // If profile fetch fails (e.g. token invalid), logout
      removeTokens();
      setUser(null);
      setLocalAccessToken(null);
      // delete api.defaults.headers.common['Authorization'];
      setLoading(false);
      // Optionally redirect to login if the error indicates an invalid token (e.g., 401)
      // router.push('/login');
    }
  }, []);


  useEffect(() => {
    // Check for existing token on initial load
    const token = getAccessToken();
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false); // No token, not loading
    }
  }, [fetchUserProfile]);


  const login = (newAccessToken: string, newRefreshToken: string, userData: User) => {
    setAccessToken(newAccessToken); // Save to localStorage
    setRefreshToken(newRefreshToken); // Save to localStorage
    setLocalAccessToken(newAccessToken); // Update state
    setUser(userData); // Update state
    // api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`; // Set for subsequent requests
    // No need to redirect here, the component calling login should handle redirection
  };

  const logout = () => {
    removeTokens(); // Clear from localStorage
    setUser(null);
    setLocalAccessToken(null);
    // delete api.defaults.headers.common['Authorization'];
    // Redirect to login page or home page
    router.push('/login'); // Or '/'
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!accessToken && !!user, // More robust check based on token and user object
        user,
        accessToken,
        loading,
        login,
        logout,
        fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
