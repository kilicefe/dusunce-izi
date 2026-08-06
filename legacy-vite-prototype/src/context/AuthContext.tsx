import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/database';
import { getCurrentUser, loginAs, loginWithEmail, setCurrentUser } from '../lib/db';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isTeacher: boolean;
  isAdmin: boolean;
  loginAsRole: (role: Role) => void;
  loginEmail: (email: string, name?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const active = getCurrentUser();
    setUser(active);
  }, []);

  const handleLoginAsRole = (role: Role) => {
    const loggedIn = loginAs(role);
    setUser(loggedIn);
  };

  const handleLoginEmail = (email: string, name?: string) => {
    const loggedIn = loginWithEmail(email, name);
    setUser(loggedIn);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
  };

  const isTeacher = user?.role === Role.TEACHER || user?.role === Role.ADMIN;
  const isAdmin = user?.role === Role.ADMIN;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isTeacher,
        isAdmin,
        loginAsRole: handleLoginAsRole,
        loginEmail: handleLoginEmail,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
