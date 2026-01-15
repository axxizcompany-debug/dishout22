import React, { createContext, useContext, useEffect, useState } from 'react';

// Define a local User interface since we removed the firebase dependency
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for persisted user in localStorage
    const storedUser = localStorage.getItem('dishout_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user data
    const mockUser: User = {
      uid: 'user_' + Math.random().toString(36).substr(2, 9),
      email: email,
      displayName: email.split('@')[0],
      photoURL: null
    };
    
    setCurrentUser(mockUser);
    localStorage.setItem('dishout_user', JSON.stringify(mockUser));
  };

  const signup = async (email: string, password: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user data
    const mockUser: User = {
      uid: 'user_' + Math.random().toString(36).substr(2, 9),
      email: email,
      displayName: email.split('@')[0],
      photoURL: null
    };
    
    setCurrentUser(mockUser);
    localStorage.setItem('dishout_user', JSON.stringify(mockUser));
  };

  const logout = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setCurrentUser(null);
    localStorage.removeItem('dishout_user');
  };

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};