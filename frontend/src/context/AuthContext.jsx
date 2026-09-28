import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('skila_auth_token') || null);
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('skila_auth_user');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Validate token on mount
  useEffect(() => {
    let isMounted = true;
    async function verifyAuth() {
      const savedToken = localStorage.getItem('skila_auth_token');
      if (!savedToken) {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${savedToken}`
          }
        });
        if (res.ok) {
          const profile = await res.json();
          if (isMounted) {
            setUser(profile);
            localStorage.setItem('skila_auth_user', JSON.stringify(profile));
          }
        } else {
          // Token expired or invalid
          if (isMounted) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('skila_auth_token');
            localStorage.removeItem('skila_auth_user');
          }
        }
      } catch (err) {
        console.warn('Could not verify auth session:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || 'Authentication failed' };
      }

      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('skila_auth_token', data.access_token);
      localStorage.setItem('skila_auth_user', JSON.stringify(data.user));
      setLoginModalOpen(false);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message || 'Network error occurred during login' };
    }
  };

  const register = async (userData) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers,
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || 'Registration failed' };
      }
      return { success: true, user: data };
    } catch (err) {
      return { success: false, error: err.message || 'Network error during registration' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('skila_auth_token');
    localStorage.removeItem('skila_auth_user');
  };

  const value = {
    token,
    user,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    isAgent: user?.role === 'agent',
    isLoading,
    loginModalOpen,
    setLoginModalOpen,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
