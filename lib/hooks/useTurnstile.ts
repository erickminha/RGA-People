"use client";

import { useState, useCallback } from "react";

interface UseTurnstileReturn {
  token: string | null;
  isVerified: boolean;
  isExpired: boolean;
  hasError: boolean;
  resetKey: number;
  handleVerify: (token: string) => void;
  handleExpire: () => void;
  handleError: () => void;
  reset: () => void;
}

export function useTurnstile(): UseTurnstileReturn {
  const [token, setToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [resetKey, setResetKey] = useState(0);

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
    setResetKey((key) => key + 1);
  }, []);

  return {
    token,
    isVerified,
    isExpired,
    hasError,
    handleVerify,
    handleExpire,
    handleError,
    resetKey,
    reset,
  };
}
