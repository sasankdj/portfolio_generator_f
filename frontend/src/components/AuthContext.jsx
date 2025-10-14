import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  // Initialize state from sessionStorage to persist across reloads, but not browser sessions.
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('isLoggedIn') === 'true');
  const [user, setUser] = useState(() => {
    const userData = sessionStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  const login = (userData) => {
    setIsLoggedIn(true);
    sessionStorage.setItem('isLoggedIn', 'true');
    if (userData) {
      setUser(userData);
      sessionStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    // Clear session storage first
    sessionStorage.clear();
    // Then update state
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      isLoggedIn,
      user,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
