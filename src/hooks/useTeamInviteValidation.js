import { useEffect, useState } from "react";
import { validateTeamInviteLink, wakeBackend } from "../services/api";

const RETRY_DELAYS_MS = [2000, 4000, 8000];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validates a team invite token in the background without blocking the UI.
 * Wakes the backend on open and retries on transient cold-start failures.
 * Returns { status: "pending" | "valid" | "invalid" | "error", department, message }.
 */
export function useTeamInviteValidation(token) {
  const [validation, setValidation] = useState({
    status: token ? "pending" : "invalid",
    department: "",
    message: token ? "" : "Invalid or expired link",
  });

  useEffect(() => {
    if (!token) {
      setValidation({
        status: "invalid",
        department: "",
        message: "Invalid or expired link",
      });
      return;
    }

    let cancelled = false;
    setValidation({ status: "pending", department: "", message: "" });

    (async () => {
      wakeBackend();

      for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        if (cancelled) return;

        try {
          const res = await validateTeamInviteLink(token);
          if (cancelled) return;

          if (res.valid && res.department) {
            setValidation({
              status: "valid",
              department: res.department,
              message: "",
            });
            return;
          }

          // Definitive server response — link invalid or expired
          if (res.httpStatus === 404 || res.httpStatus === 400 || res.valid === false) {
            setValidation({
              status: "invalid",
              department: "",
              message: res.message || "Invalid or expired link",
            });
            return;
          }
        } catch {
          // Network / cold-start — retry after delay
        }

        if (attempt < RETRY_DELAYS_MS.length) {
          wakeBackend();
          await sleep(RETRY_DELAYS_MS[attempt]);
        }
      }

      if (!cancelled) {
        setValidation({
          status: "error",
          department: "",
          message: "Could not reach the server. Please refresh the page and try again.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return validation;
}
