import { useEffect, useState } from "react";
import { validateTeamInviteLink } from "../services/api";

/**
 * Validates a team invite token in the background without blocking the UI.
 * Returns { status: "pending" | "valid" | "invalid", department, message }.
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

    validateTeamInviteLink(token)
      .then((res) => {
        if (cancelled) return;
        if (res.valid && res.department) {
          setValidation({
            status: "valid",
            department: res.department,
            message: "",
          });
        } else {
          setValidation({
            status: "invalid",
            department: "",
            message: res.message || "Invalid or expired link",
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setValidation({
            status: "invalid",
            department: "",
            message: "Invalid or expired link",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return validation;
}
