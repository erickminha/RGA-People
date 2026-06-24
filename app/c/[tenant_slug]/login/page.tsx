"use client";

import { useState } from "react";
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
} from "lucide-react";

/**
 * Tela de Login do Portal do Colaborador (multi-tenant).
 *
 * Autentica via Supabase Auth (email/senha) e suporta recuperação de senha.
 * Após o login, redireciona para o portal do tenant correspondente.
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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);

    try {
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
        return;
      }

      toast.success("Bem-vindo(a) de volta!");
      const destino = searchParams.get("next") ?? `/c/${slug}/portal`;
      router.push(destino);
      router.refresh();
    } catch {
      toast.error("Erro inesperado. Tente novamente em instantes.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleRecuperacao(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Informe seu e-mail para recuperar a senha.");
      return;
    }
    setCarregando(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/c/${slug}/redefinir-senha`,
        }
      );

      if (error) {
        toast.error("Não foi possível enviar o e-mail de recuperação.");
        return;
      }

      toast.success(
        "Se o e-mail existir, você receberá instruções para redefinir a senha."
      );
      setModoRecuperacao(false);
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Painel lateral institucional (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 backdrop-blur rounded-xl">
              <Building2 className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              RGA People
            </span>
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">
              O seu portal de
              <br />
              gente e gestão.
            </h1>
            <p className="text-lg text-indigo-100 max-w-md">
              Manual do colaborador, avaliações, pesquisa de clima, plano de
              carreira e muito mais — tudo em um só lugar.
            </p>
          </div>
          <p className="text-sm text-indigo-200">
            © {new Date().getFullYear()} RGA Consultoria de RH. Todos os
            direitos reservados.
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">RGA People</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {modoRecuperacao ? "Recuperar acesso" : "Acesse sua conta"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {modoRecuperacao
                  ? "Enviaremos um link de redefinição para o seu e-mail."
                  : "Entre com seu e-mail corporativo para continuar."}
              </p>
            </div>

            <form
              onSubmit={modoRecuperacao ? handleRecuperacao : handleLogin}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  E-mail corporativo
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@empresa.com.br"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {!modoRecuperacao && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => setModoRecuperacao(true)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      required
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

              <button
                type="submit"
                disabled={carregando}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {carregando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {modoRecuperacao ? "Enviar link" : "Entrar"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {modoRecuperacao && (
                <button
                  type="button"
                  onClick={() => setModoRecuperacao(false)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  Voltar para o login
                </button>
              )}
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Problemas para acessar? Fale com o RH da sua empresa.
          </p>
        </div>
      </div>
    </div>
  );
}
