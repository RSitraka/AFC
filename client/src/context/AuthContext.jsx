import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken, getToken } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.get('/auth/me');
      setUser(me);
      setTeam(me.team || null);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const { token, player } = await api.post('/auth/login', { email, password });
    setToken(token);
    setUser(player);
    await refresh();
    return player;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setTeam(null);
  };

  const isStaff = user?.role === 'STAFF';

  return (
    <AuthContext.Provider value={{ user, setUser, team, setTeam, loading, login, logout, refresh, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
