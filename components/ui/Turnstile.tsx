"use client";

import { useEffect, useRef, useCallback } from "react";

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          language?: string;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function Turnstile({
  onVerify,
  onExpire,
  onError,
  className,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return;

    if (!SITE_KEY) {
      console.error(
        "[Turnstile]: NEXT_PUBLIC_TURNSTILE_SITE_KEY ausente no ambiente."
      );
      onError?.();
      return;
    }

    // Limpa widget anterior se existir
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        /* silent */
      }
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: onVerify,
      "expired-callback": () => {
        onExpire?.();
      },
      "error-callback": () => {
        onError?.();
      },
      theme: "light",
      language: "pt-BR",
    });
  }, [onVerify, onExpire, onError]);

  useEffect(() => {
    // Se o script já foi carregado
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Aguarda o script carregar
    window.onTurnstileLoad = renderWidget;

    // Verifica se o script já está no DOM
    const existingScript = document.querySelector(
      'script[src*="turnstile"]'
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* silent */
        }
      }
    };
  }, [renderWidget]);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-label="Verificação de segurança Cloudflare"
    />
  );
}
