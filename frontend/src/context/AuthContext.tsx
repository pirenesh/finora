import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  profilePic: string;
  currency: string;
  role: 'free' | 'pro';
  createdAt?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  login: (emailOrUsername: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: (reason?: string) => void;
  updateProfile: (profileData: Partial<UserProfile> & { password?: string }) => Promise<boolean>;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set default auth token header if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(storedUser));
      
      // Fetch latest profile in background to validate session role
      axios.get('/api/auth/me')
        .then(res => {
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data));
          }
        })
        .catch(err => {
          console.error('Session validation failed, logging out:', err);
          logout();
        });
    }
    setLoading(false);
  }, []);

  // Set axios response interceptor to handle token expiry (401)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Auto-logout after 15 minutes of inactivity
  useEffect(() => {
    if (!user) return;

    let inactivityTimer: ReturnType<typeof setTimeout>;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        logout('Session expired due to 15 minutes of inactivity.');
      }, 15 * 60 * 1000); // 15 minutes
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    resetTimer(); // Initialize timer

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

  // Register User
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post('/api/auth/register', { username, email, password });
      
      if (res.data.success) {
        const { token, ...userData } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login User
  const login = async (emailOrUsername: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post('/api/auth/login', { emailOrUsername, password, rememberMe });
      
      if (res.data.success) {
        const { token, ...userData } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout User
  const logout = (reason?: string) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    if (reason) {
      setError(reason);
    }
  };

  // Update Profile
  const updateProfile = async (profileData: Partial<UserProfile> & { password?: string }): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.put('/api/auth/profile', profileData);
      
      if (res.data.success) {
        const { token, ...userData } = res.data;
        if (token) {
          localStorage.setItem('token', token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Profile update failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        setError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export default AuthContext;
