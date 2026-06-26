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
  XCircle,
  ArrowRight,
} from "lucide-react";

/**
 * Página de aceitar convite e criar conta.
 * Acessada via link enviado por email: /c/[tenant_slug]/convite/[token]
 *
 * A trigger handle_new_user no Supabase cria automaticamente o perfil
 * quando empresa_id, cargo_id e nome_completo são passados nos metadados.
 */
export default function AceitarConvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const tenantSlug = params?.tenant_slug as string;

  const [status, setStatus] = useState<"carregando" | "valido" | "invalido" | "sucesso">(
    "carregando"
  );
  const [convite, setConvite] = useState<{
    email: string;
    empresa_id: string;
    cargo_id: string;
    empresa: { nome: string; slug: string };
  } | null>(null);

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Validar o token ao carregar a página
  useEffect(() => {
    async function validarToken() {
      if (!token) {
        setStatus("invalido");
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("convites")
          .select(`
            id,
            email,
            empresa_id,
            cargo_id,
            usado,
            expira_em,
            empresa:empresas!convites_empresa_id_fkey (nome, slug)
          `)
          .eq("token", token)
          .single();

        if (error || !data) {
          setStatus("invalido");
          return;
        }

        if (data.usado) {
          setStatus("invalido");
          return;
        }

        if (new Date(data.expira_em) < new Date()) {
          setStatus("invalido");
          return;
        }

        setConvite({
          email: data.email,
          empresa_id: data.empresa_id,
          cargo_id: data.cargo_id,
          empresa: data.empresa as any,
        });
        setStatus("valido");
      } catch {
        setStatus("invalido");
      }
    }

    validarToken();
  }, [token]);

  async function handleCriarConta(e: React.FormEvent) {
    e.preventDefault();

    if (senha.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (!convite) return;

    setCarregando(true);
    try {
      const supabase = createClient();

      // Criar conta via Supabase Auth
      // A trigger handle_new_user usa empresa_id, cargo_id e nome_completo
      // para criar automaticamente o perfil na tabela perfis.
      const { data: authData, error: signUpError } =
        await supabase.auth.signUp({
          email: convite.email,
          password: senha,
          options: {
            data: {
              empresa_id: convite.empresa_id,
              cargo_id: convite.cargo_id,
              nome_completo: convite.email.split("@")[0], // fallback; será atualizado pelo colaborador
            },
          },
        });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          toast.error(
            "Este e-mail já possui uma conta. Faça login normalmente."
          );
        } else {
          toast.error("Erro ao criar conta: " + signUpError.message);
        }
        setCarregando(false);
        return;
      }

      if (!authData.user) {
        toast.error("Erro ao criar conta. Tente novamente.");
        setCarregando(false);
        return;
      }

      // Marcar convite como usado (a trigger também faz isso, mas garantimos aqui)
      await supabase
        .from("convites")
        .update({ usado: true })
        .eq("token", token);

      setStatus("sucesso");
      toast.success("Conta criada com sucesso! Bem-vindo(a)!");

      // Redirecionar para o portal após 2 segundos
      setTimeout(() => {
        router.push(`/c/${convite.empresa.slug}/portal`);
        router.refresh();
      }, 2000);
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
      setCarregando(false);
    }
  }

  // Estado: carregando
  if (status === "carregando") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Validando convite...</p>
        </div>
      </div>
    );
  }

  // Estado: token inválido ou expirado
  if (status === "invalido") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Convite inválido
          </h1>
          <p className="text-gray-600 mb-6">
            Este link de convite é inválido, já foi utilizado ou expirou. Entre
            em contato com o RH para solicitar um novo convite.
          </p>
          <button
            onClick={() => router.push(`/c/${tenantSlug}/login`)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Ir para o Login
          </button>
        </div>
      </div>
    );
  }

  // Estado: conta criada com sucesso
  if (status === "sucesso") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Conta criada!
          </h1>
          <p className="text-gray-600 mb-4">
            Bem-vindo(a) ao RGA People! Você será redirecionado(a) para o portal
            em instantes...
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
        </div>
      </div>
    );
  }

  // Estado: formulário de criação de conta
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
            Você foi convidado(a)!
          </h1>
          <p className="text-indigo-100 text-lg">
            Crie sua conta para acessar o portal de colaboradores da{" "}
            <strong className="text-white">{convite?.empresa.nome}</strong>.
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium mb-4">
              <CheckCircle2 className="w-4 h-4" />
              Convite válido
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Criar sua conta
            </h2>
            <p className="text-gray-600">
              Você está criando uma conta para{" "}
              <strong>{convite?.email}</strong>
            </p>
          </div>

          <form onSubmit={handleCriarConta} className="space-y-4">
            {/* Email (somente leitura) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={convite?.email ?? ""}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Criar senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
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
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Confirmar senha
              </label>
              <input
                type={mostrarSenha ? "text" : "password"}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a senha"
                required
                minLength={8}
                disabled={carregando}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
              />
              {confirmarSenha && senha !== confirmarSenha && (
                <p className="mt-1 text-xs text-red-600">
                  As senhas não coincidem.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={
                carregando ||
                senha.length < 8 ||
                senha !== confirmarSenha
              }
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  Criar conta e acessar portal
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
              Já tenho conta — Fazer login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
