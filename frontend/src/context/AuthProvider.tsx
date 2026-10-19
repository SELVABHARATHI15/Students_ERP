import axios from "axios";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import * as authApi from "../api/auth";
import { getApiErrorMessage } from "../api/errors";
import { AuthContext } from "./AuthContext";
import type { User } from "../types/user";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.fetchMe();
      setUser(me);
      setSessionError(null);
    } catch (error: unknown) {
      setUser(null);
      if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
        setSessionError(null);
      } else {
        setSessionError(getApiErrorMessage(error));
      }
    }
  }, []);

  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const me = await authApi.login(username, password);
    setUser(me);
    setSessionError(null);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setSessionError(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, sessionError, login, logout, refresh }),
    [user, loading, sessionError, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
