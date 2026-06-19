import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi.me()
        .then(setUser)
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (data) => {
    const res = await authApi.login(data);
    localStorage.setItem('token', res.token);
    setUser(res.user);
    return res;
  };

  const register = async (data) => {
    // повертає { needVerification, email, devCode? } — вхід відбувається після підтвердження коду
    return await authApi.register(data);
  };

  const verifyEmail = async (data) => {
    const res = await authApi.verify(data);
    localStorage.setItem('token', res.token);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    await authApi.logout();
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshUser = async () => {
    const me = await authApi.me();
    setUser(me);
    return me;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
