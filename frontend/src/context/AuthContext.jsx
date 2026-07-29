import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('revops_user');
    return savedUser ? JSON.parse(savedUser) : {
      id: 1,
      email: 'demo@verticalrevops.ai',
      full_name: 'Alex Morgan',
      role: 'ADMIN',
      company_name: 'Vertical RevOps AI',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
    };
  });

  const [token, setToken] = useState(() => localStorage.getItem('revops_token') || 'demo_token_12345');

  const login = (userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem('revops_user', JSON.stringify(userData));
    localStorage.setItem('revops_token', tokenStr);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('revops_user');
    localStorage.removeItem('revops_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
