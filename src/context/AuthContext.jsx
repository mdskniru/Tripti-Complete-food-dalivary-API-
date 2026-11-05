import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '../utils/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { user } = await api.me();
        if (active) setCurrentUser(user);
      } catch {
        setToken(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setCurrentUser(null);
      return null;
    }
    const { user } = await api.me();
    setCurrentUser(user);
    return user;
  }, []);

  const signup = async (payload) => {
    const { token, user } = await api.signup(payload);
    setToken(token);
    setCurrentUser(user);
    return user;
  };

  const login = async (email, password, role) => {
    const { token, user } = await api.login({ email, password, role });
    setToken(token);
    setCurrentUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Token may already be invalid; clearing locally is enough.
    }
    setToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, signup, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
