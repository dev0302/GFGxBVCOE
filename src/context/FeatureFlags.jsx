import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSettings, setLeaderboardEnabled as apiSetLeaderboardEnabled } from "../services/api";

const FeatureFlagsContext = createContext({ leaderboardEnabled: false, setLeaderboardEnabled: () => {} });

export function FeatureFlagsProvider({ children }) {
  const [leaderboardEnabled, setLeaderboardEnabledState] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getSettings();
        if (!cancelled) setLeaderboardEnabledState(!!s.leaderboardEnabled);
      } catch {
        if (!cancelled) setLeaderboardEnabledState(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setLeaderboardEnabled = async (enabled) => {
    setLeaderboardEnabledState(enabled);
    try {
      const s = await apiSetLeaderboardEnabled(enabled);
      setLeaderboardEnabledState(!!s.leaderboardEnabled);
    } catch {
      // revert on failure
      setLeaderboardEnabledState((prev) => !enabled ? prev && false : prev && true);
    }
  };

  const value = useMemo(() => ({ leaderboardEnabled, setLeaderboardEnabled, loading }), [leaderboardEnabled, loading]);
  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}


