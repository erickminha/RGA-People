"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarEmpresa } from "@/app/actions/admin-empresas";
import { ArrowLeft, Building2, Info, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NovaEmpresaPage({
  params,
}: {
  params: { tenant_slug: string };
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("nome", nome);
      formData.append("descricao", descricao);

      await criarEmpresa(formData);
      
      // Se chegou aqui, foi redirecionado automaticamente
    } catch (error: any) {
      setMensagem(`❌ ${error.message || "Erro ao criar empresa"}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <header className="flex items-center gap-4">
        <Link 
          href={`/c/${params.tenant_slug}/portal/admin/empresas`}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Nova Empresa</h1>
          <p className="text-sm text-gray-500">Cadastre um novo tenant no sistema</p>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Nome da Empresa *
            </label>
            <input 
              type="text" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: RGA Consultoria"
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
            />
            <p className="text-xs text-gray-400">O slug será gerado automaticamente a partir do nome</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Descrição (Opcional)</label>
            <textarea 
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição breve sobre a empresa..."
              rows={3}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none disabled:opacity-50"
            />
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Ao criar uma nova empresa:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>O sistema configurará automaticamente as tabelas necessárias</li>
                <li>Os cargos padrão serão criados (Super Admin, RH, Gestor, Colaborador)</li>
                <li>Você poderá começar a convidar colaboradores imediatamente</li>
              </ul>
            </div>
          </div>

          {mensagem && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              mensagem.includes("✅") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}>
              {mensagem}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Link
              href={`/c/${params.tenant_slug}/portal/admin/empresas`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancelar
            </Link>
            <button 
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Empresa"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
