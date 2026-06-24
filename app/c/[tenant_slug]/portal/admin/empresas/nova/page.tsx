import { requireRhAdmin } from "@/lib/auth/guards";
import { criarEmpresa } from "@/app/actions/admin-empresas";
import { ArrowLeft, Info, Building2 } from "lucide-react";
import Link from "next/link";

export default async function NovaEmpresaPage({
  params,
}: {
  params: { tenant_slug: string };
}) {
  await requireRhAdmin(params.tenant_slug);

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
        <form action={criarEmpresa} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Nome da Empresa *
            </label>
            <input 
              type="text" 
              name="nome"
              placeholder="Ex: RGA Consultoria"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-xs text-gray-400">O slug será gerado automaticamente a partir do nome</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Descrição (Opcional)</label>
            <textarea 
              name="descricao"
              placeholder="Descrição breve sobre a empresa..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Ao criar uma nova empresa:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>O sistema configurará automaticamente as tabelas necessárias</li>
                <li>As políticas de segurança (RLS) serão aplicadas</li>
                <li>Você poderá começar a convidar colaboradores imediatamente</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Link
              href={`/c/${params.tenant_slug}/portal/admin/empresas`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </Link>
            <button 
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
            >
              Criar Empresa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
