import { requireRhAdmin } from "@/lib/auth/guards";
import { Building2, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";

export default async function NovaEmpresaPage({
  params,
}: {
  params: { tenant_slug: string };
}) {
  await requireRhAdmin(params.tenant_slug);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
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
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nome da Empresa</label>
              <input 
                type="text" 
                placeholder="Ex: RGA Consultoria"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Slug (URL)</label>
              <input 
                type="text" 
                placeholder="ex: rga"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-[10px] text-gray-400 italic">O slug será usado na URL: /c/slug/portal</p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              <strong>Importante:</strong> Ao criar uma nova empresa, o sistema configurará automaticamente as tabelas e políticas de segurança necessárias para o novo tenant.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Link
              href={`/c/${params.tenant_slug}/portal/admin/empresas`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </Link>
            <button 
              type="button"
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
