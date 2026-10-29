import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { api } from '../api/client.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  unreadCount: number;
  login: (email: string, password?: string) => Promise<User | null>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_ACCOUNTS: Record<UserRole, { email: string; label: string; name: string }> = {
  STUDENT: {
    email: 'student.ecell@resourceloop.edu',
    label: 'Student (E-Cell Rep)',
    name: 'Aarav Patel',
  },
  FACULTY: {
    email: 'faculty.ecell@resourceloop.edu',
    label: 'Faculty Coordinator',
    name: 'Prof. Elena Vance',
  },
  HOD: {
    email: 'hod.cse@resourceloop.edu',
    label: 'HOD (Computer Science)',
    name: 'Prof. Arvind Sharma',
  },
  RESOURCE_MANAGER: {
    email: 'manager.av@resourceloop.edu',
    label: 'Resource Manager (AV/Labs)',
    name: 'Robert Hayes',
  },
  ADMIN: {
    email: 'admin@resourceloop.edu',
    label: 'Institution Administrator',
    name: 'Dr. Sarah Jenkins',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('resourceloop_token'));
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (!localStorage.getItem('resourceloop_token')) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const res = await api.getMe();
      if (res.success) {
        setUser(res.user);
        setUnreadCount(res.unreadNotificationsCount || 0);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      localStorage.removeItem('resourceloop_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string = 'Password@123'): Promise<User | null> => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.success) {
        localStorage.setItem('resourceloop_token', res.token);
        setToken(res.token);
        setUser(res.user);
        await refreshUser();
        return res.user;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoRole = async (role: UserRole) => {
    const demo = DEMO_ACCOUNTS[role];
    if (demo) {
      await login(demo.email, 'Password@123');
    }
  };

  const logout = () => {
    localStorage.removeItem('resourceloop_token');
    setToken(null);
    setUser(null);
    setUnreadCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        unreadCount,
        login,
        logout,
        switchDemoRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
