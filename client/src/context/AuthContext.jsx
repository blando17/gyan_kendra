import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { auth } from "../api/endpoints";
import { setUnauthorizedHandler, tokenStore } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  // A stored token might be expired, so confirm it with the server once.
  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);

      return undefined;
    }

    let active = true;

    auth
      .me()
      .then((res) => active && setUser(res.data.user))
      .catch(() => {
        tokenStore.clear();

        if (active) setUser(null);
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  // Any 401/403 from a data call drops the session rather than leaving the
  // app in a half-authenticated state.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));

    return () => setUnauthorizedHandler(null);
  }, []);

  const adopt = (data) => {
    tokenStore.set(data.token);

    setUser(data.user);

    return data.user;
  };

  const login = useCallback(async (credentials) => {
    const res = await auth.login(credentials);

    return adopt(res.data);
  }, []);

  const signup = useCallback(async (payload) => {
    const res = await auth.signup(payload);

    return adopt(res.data);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();

    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout }),
    [user, loading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) throw new Error("useAuth must be used inside AuthProvider");

  return context;
}
