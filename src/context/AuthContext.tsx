import { createContext, useContext, useState, type ReactNode } from 'react';

export interface User {
  name: string;
  role: 'admin' | 'client';
  email: string;
  avatar: string;
  org?: string;
}

interface AuthContextType {
  user: User | null;
  login: (role: 'admin' | 'client') => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USERS: Record<string, User> = {
  admin: {
    name: 'Dr. Sarah Chen',
    role: 'admin',
    email: 'admin@fedlearn.ai',
    avatar: 'SC',
    org: 'FedLearn Research',
  },
  client: {
    name: 'Alex Rivera',
    role: 'client',
    email: 'alex@hospital-a.org',
    avatar: 'AR',
    org: 'Hospital A — Metro General',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = (role: 'admin' | 'client') => {
    setIsLoading(true);
    // Simulate network delay for realism
    setTimeout(() => {
      setUser(DEMO_USERS[role]);
      setIsLoading(false);
    }, 1200);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
