import { createContext, useContext, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMe, login as apiLogin, logout as apiLogout, setAuthToken, sendPresenceHeartbeat } from "../services/api";
import { setUser as setUserInStore } from "../redux/slices/authSlice.jsx";
import { connectPresenceSocket, disconnectPresenceSocket } from "../services/presenceSocket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      try {
        // If we already have a user in Redux (from localStorage), we can stop the initial spinner early.
        if (user && !cancelled) {
          setLoading(false);
        }
        const res = await getMe();
        if (cancelled) return;
        if (res?.token) setAuthToken(res.token);
        const freshUser = res.user || res;
        dispatch(setUserInStore(freshUser));
      } catch {
        if (!cancelled) {
          dispatch(setUserInStore(null));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!user) {
      disconnectPresenceSocket();
      return;
    }

    connectPresenceSocket();

    return () => {
      disconnectPresenceSocket();
    };
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return undefined;

    const ping = () => {
      sendPresenceHeartbeat();
    };

    ping();
    const intervalId = setInterval(ping, 90_000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user?._id]);

  const login = async (email, password) => {
    const res = await apiLogin({ email, password });
    const nextUser = res.user || res;
    dispatch(setUserInStore(nextUser));
    return res;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (_) {}
    dispatch(setUserInStore(null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        setUser: (value) => dispatch(setUserInStore(value)),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
