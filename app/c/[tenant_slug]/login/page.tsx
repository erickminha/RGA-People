"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import Turnstile from "@/components/ui/Turnstile";
import { useTurnstile } from "@/lib/hooks/useTurnstile";

/**
 * Tela de Login do Portal do Colaborador (multi-tenant).
 *
 * Autentica via Supabase Auth (email/senha) e suporta recuperação de senha.
 * Protegida por Cloudflare Turnstile para evitar ataques de força bruta.
 * Após o login, redireciona para o portal da empresa correta do usuário.
 */
export default function LoginPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = (params?.tenant_slug as string) ?? "";

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [modoRecuperacao, setModoRecuperacao] = useState(false);

  const turnstile = useTurnstile();

  const handleModoChange = useCallback(
    (modo: boolean) => {
      setModoRecuperacao(modo);
      turnstile.reset();
    },
    [turnstile]
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    // Verificar Turnstile antes de prosseguir
    if (!turnstile.isVerified) {
      toast.error("Complete a verificação de segurança antes de continuar.");
      return;
    }

    setCarregando(true);
    try {
      // Verificar token no servidor
      const turnstileOk = await turnstile.verifyOnServer();
      if (!turnstileOk) {
        toast.error("Verificação de segurança falhou. Tente novamente.");
        turnstile.reset();
        setCarregando(false);
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        toast.error(
          error.message === "Invalid login credentials"
            ? "E-mail ou senha incorretos."
            : "Não foi possível entrar. Tente novamente."
        );
        turnstile.reset();
        setCarregando(false);
        return;
      }

      // Buscar a empresa do usuário
      const { data: perfil } = await supabase
        .from("perfis")
        .select("*, empresa:empresas(slug)")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!perfil || !perfil.empresa) {
        toast.error("Perfil de usuário não encontrado.");
        setCarregando(false);
        return;
      }

      toast.success("Bem-vindo(a) de volta!");

      // Redirecionar para a empresa correta do usuário
      const empresaSlug = perfil.empresa.slug;
      const destino = searchParams.get("next") ?? `/c/${empresaSlug}/portal`;
      router.push(destino);
      router.refresh();
    } catch {
      toast.error("Erro inesperado. Tente novamente em instantes.");
      turnstile.reset();
      setCarregando(false);
    }
  }

  async function handleRecuperacao(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Informe seu e-mail para recuperar a senha.");
      return;
    }

    // Verificar Turnstile
    if (!turnstile.isVerified) {
      toast.error("Complete a verificação de segurança antes de continuar.");
      return;
    }

    setCarregando(true);
    try {
      const turnstileOk = await turnstile.verifyOnServer();
      if (!turnstileOk) {
        toast.error("Verificação de segurança falhou. Tente novamente.");
        turnstile.reset();
        setCarregando(false);
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/c/${slug}/redefinir-senha`,
        }
      );

      if (error) {
        toast.error("Não foi possível enviar o e-mail de recuperação.");
        setCarregando(false);
        return;
      }

      toast.success(
        "Se o e-mail existir, você receberá instruções para redefinir a senha."
      );
      handleModoChange(false);
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-indigo-900 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-2xl font-bold text-white">RGA People</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-6">
            Sistema de Gestão de Pessoas
          </h1>
          <p className="text-indigo-100 text-lg">
            Gerencie colaboradores, férias, benefícios e pesquisas de clima em
            um único lugar.
          </p>
        </div>
        <div className="text-indigo-100 text-sm">
          <p>© {new Date().getFullYear()} RGA Consultoria. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Lado direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {modoRecuperacao ? "Recuperar Senha" : "Bem-vindo(a)"}
            </h2>
            <p className="text-gray-600">
              {modoRecuperacao
                ? "Informe seu e-mail para receber instruções"
                : "Faça login para acessar o portal"}
            </p>
          </div>

          <form
            onSubmit={modoRecuperacao ? handleRecuperacao : handleLogin}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={carregando}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
              />
            </div>

            {!modoRecuperacao && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={carregando}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {mostrarSenha ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Cloudflare Turnstile */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Verificação de segurança
                </span>
              </div>
              <Turnstile
                onVerify={turnstile.handleVerify}
                onExpire={turnstile.handleExpire}
                onError={turnstile.handleError}
              />
              {turnstile.isExpired && (
                <p className="mt-1 text-xs text-amber-600">
                  A verificação expirou. Aguarde o widget recarregar.
                </p>
              )}
              {turnstile.hasError && (
                <p className="mt-1 text-xs text-red-600">
                  Erro na verificação. Recarregue a página e tente novamente.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={carregando || !turnstile.isVerified}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {modoRecuperacao ? "Enviando..." : "Entrando..."}
                </>
              ) : (
                <>
                  {modoRecuperacao ? "Enviar E-mail" : "Entrar"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {!modoRecuperacao && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => handleModoChange(true)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Esqueceu sua senha?
              </button>
            </div>
          )}

          {modoRecuperacao && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => handleModoChange(false)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Voltar ao login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
