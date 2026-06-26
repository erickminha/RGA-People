"use client";

import { useState, useCallback } from "react";

interface UseTurnstileReturn {
  token: string | null;
  isVerified: boolean;
  isExpired: boolean;
  hasError: boolean;
  handleVerify: (token: string) => void;
  handleExpire: () => void;
  handleError: () => void;
  verifyOnServer: () => Promise<boolean>;
  reset: () => void;
}

export function useTurnstile(): UseTurnstileReturn {
  const [token, setToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleVerify = useCallback((t: string) => {
    setToken(t);
    setIsVerified(true);
    setIsExpired(false);
    setHasError(false);
  }, []);

  const handleExpire = useCallback(() => {
    setToken(null);
    setIsVerified(false);
    setIsExpired(true);
  }, []);

  const handleError = useCallback(() => {
    setToken(null);
    setIsVerified(false);
    setHasError(true);
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    setIsVerified(false);
    setIsExpired(false);
    setHasError(false);
  }, []);

  /**
   * Verifica o token no servidor via API route.
   * Retorna true se válido.
   */
  const verifyOnServer = useCallback(async (): Promise<boolean> => {
    if (!token) return false;

    try {
      const res = await fetch("/api/turnstile/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      return data.success === true;
    } catch {
      return false;
    }
  }, [token]);

  return {
    token,
    isVerified,
    isExpired,
    hasError,
    handleVerify,
    handleExpire,
    handleError,
    verifyOnServer,
    reset,
  };
}
