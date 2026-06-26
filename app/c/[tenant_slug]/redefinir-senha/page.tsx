"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  Building2,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

/**
 * Página de redefinição de senha.
 * Acessada via link enviado por email pelo Supabase Auth.
 * O Supabase injeta os tokens na URL como hash fragment (#access_token=...).
 */
export default function RedefinirSenhaPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params?.tenant_slug as string;

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [sessaoValida, setSessaoValida] = useState<boolean | null>(null);

  // Verificar se há uma sessão de redefinição válida
  useEffect(() => {
    async function verificarSessao() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      // O Supabase Auth processa automaticamente o hash fragment da URL
      // e cria uma sessão temporária para redefinição de senha
      if (session) {
        setSessaoValida(true);
      } else {
        // Aguarda um momento para o Supabase processar o hash
        setTimeout(async () => {
          const { data: { session: s2 } } = await supabase.auth.getSession();
          setSessaoValida(!!s2);
        }, 1000);
      }
    }

    verificarSessao();
  }, []);

  async function handleRedefinir(e: React.FormEvent) {
    e.preventDefault();

    if (novaSenha.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (error) {
        toast.error(
          error.message.includes("same password")
            ? "A nova senha não pode ser igual à senha atual."
            : "Erro ao redefinir senha. Tente novamente."
        );
        setCarregando(false);
        return;
      }

      setSucesso(true);
      toast.success("Senha redefinida com sucesso!");

      // Redirecionar para o portal após 2 segundos
      setTimeout(() => {
        router.push(`/c/${tenantSlug}/portal`);
        router.refresh();
      }, 2000);
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
      setCarregando(false);
    }
  }

  // Estado: verificando sessão
  if (sessaoValida === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando link de redefinição...</p>
        </div>
      </div>
    );
  }

  // Estado: link inválido ou expirado
  if (sessaoValida === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Link inválido ou expirado
          </h1>
          <p className="text-gray-600 mb-6">
            Este link de redefinição de senha é inválido ou já expirou.
            Solicite um novo link na tela de login.
          </p>
          <button
            onClick={() => router.push(`/c/${tenantSlug}/login`)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  // Estado: senha redefinida com sucesso
  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Senha redefinida!
          </h1>
          <p className="text-gray-600 mb-4">
            Sua senha foi atualizada com sucesso. Redirecionando para o
            portal...
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
        </div>
      </div>
    );
  }

  // Estado: formulário de redefinição
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
            Redefinir Senha
          </h1>
          <p className="text-indigo-100 text-lg">
            Escolha uma senha forte para proteger sua conta no portal de
            colaboradores.
          </p>
        </div>
        <div className="text-indigo-100 text-sm">
          <p>
            © {new Date().getFullYear()} RGA Consultoria. Todos os direitos
            reservados.
          </p>
        </div>
      </div>

      {/* Lado direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Nova senha
            </h2>
            <p className="text-gray-600">
              Digite e confirme sua nova senha abaixo.
            </p>
          </div>

          <form onSubmit={handleRedefinir} className="space-y-4">
            {/* Nova senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Nova senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
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
              {novaSenha.length > 0 && novaSenha.length < 8 && (
                <p className="mt-1 text-xs text-red-600">
                  Mínimo de 8 caracteres.
                </p>
              )}
            </div>

            {/* Confirmar senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Confirmar nova senha
              </label>
              <input
                type={mostrarSenha ? "text" : "password"}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha"
                required
                minLength={8}
                disabled={carregando}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
              />
              {confirmarSenha && novaSenha !== confirmarSenha && (
                <p className="mt-1 text-xs text-red-600">
                  As senhas não coincidem.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={
                carregando ||
                novaSenha.length < 8 ||
                novaSenha !== confirmarSenha
              }
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  Salvar nova senha
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push(`/c/${tenantSlug}/login`)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Voltar ao login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
