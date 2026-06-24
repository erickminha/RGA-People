import { createClient } from "@/lib/supabase/server";
import { requireRhAdmin } from "@/lib/auth/guards";
import { BarChart3, Plus, Calendar, CheckCircle2, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPesquisasPage({
  params,
}: {
  params: { tenant_slug: string };
}) {
  const guard = await requireRhAdmin(params.tenant_slug);
  const supabase = createClient();

  const { data: pesquisas } = await supabase
    .from("pesquisas_clima")
    .select("*")
    .eq("empresa_id", guard.empresaId)
    .order("criado_em", { ascending: false });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-lg">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Pesquisas de Clima</h1>
            <p className="text-sm text-gray-500">Crie pesquisas e acompanhe o engajamento da equipe</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          Nova Pesquisa
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pesquisas?.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-start">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                p.ativa ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {p.ativa ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {p.ativa ? 'Ativa' : 'Encerrada'}
              </span>
              <button className="text-xs text-indigo-600 font-semibold hover:underline">
                Ver Resultados
              </button>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 leading-tight">{p.titulo}</h3>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{p.descricao}</p>
            </div>

            <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Expira: {new Date(p.expira_em).toLocaleDateString('pt-BR')}</span>
              </div>
              <div>{p.anonima ? 'Anônima' : 'Identificada'}</div>
            </div>
          </div>
        ))}

        {(!pesquisas || pesquisas.length === 0) && (
          <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma pesquisa cadastrada.</p>
            <button className="mt-4 text-indigo-600 font-medium hover:text-indigo-700">
              Criar minha primeira pesquisa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
