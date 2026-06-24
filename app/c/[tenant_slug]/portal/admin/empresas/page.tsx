import { createClient } from "@/lib/supabase/server";
import { requireRhAdmin } from "@/lib/auth/guards";
import { Building2, Plus, Globe, CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GestaoEmpresasPage({
  params,
}: {
  params: { tenant_slug: string };
}) {
  // Apenas Super Admin pode acessar esta página específica de gestão global
  const guard = await requireRhAdmin(params.tenant_slug);
  const supabase = createClient();

  const { data: empresas } = await supabase
    .from("empresas")
    .select("*")
    .order("nome");

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-lg">
            <Building2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Gestão de Empresas</h1>
            <p className="text-sm text-gray-500">Administre todos os tenants cadastrados no sistema</p>
          </div>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm">
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {empresas?.map((empresa) => (
          <div key={empresa.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="p-2 bg-gray-50 rounded-lg">
                <Building2 className="w-5 h-5 text-gray-400" />
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                empresa.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {empresa.ativo ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {empresa.ativo ? 'Ativa' : 'Inativa'}
              </span>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{empresa.nome}</h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                <Globe className="w-3.5 h-3.5" />
                <span>slug: <strong>{empresa.slug}</strong></span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
              <div className="text-[11px] text-gray-400">
                ID: {empresa.id.substring(0, 8)}...
              </div>
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Editar Configurações
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <div className="text-amber-600 font-bold text-lg">!</div>
        <p className="text-sm text-amber-800">
          <strong>Nota de Super Admin:</strong> Esta página é restrita. A criação de novas empresas via interface está em modo de visualização. Atualmente, novos tenants devem ser configurados via script de inicialização para garantir a correta aplicação das políticas de RLS.
        </p>
      </div>
    </div>
  );
}
