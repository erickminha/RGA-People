import { createClient } from "@/lib/supabase/server";
import { requireRhAdmin } from "@/lib/auth/guards";
import { Plane, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PageProps {
  params: { tenant_slug: string };
  searchParams: { busca?: string };
}

export const dynamic = "force-dynamic";

export default async function AdminFeriasPage({ params, searchParams }: PageProps) {
  const guard = await requireRhAdmin(params.tenant_slug);
  const supabase = createClient();
  const busca = searchParams.busca || "";

  let query = supabase
    .from("ferias_solicitacoes")
    .select(`
      *,
      perfil:perfis(nome_completo, email)
    `)
    .eq("empresa_id", guard.empresaId)
    .order("criado_em", { ascending: false });

  const { data: solicitacoes } = await query;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-lg">
            <Plane className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Histórico de Férias
            </h1>
            <p className="text-sm text-gray-500">
              Visualize todas as solicitações de férias da empresa
            </p>
          </div>
        </div>
      </header>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Colaborador</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Período</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Solicitado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {solicitacoes?.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{(s.perfil as any)?.nome_completo}</div>
                  <div className="text-xs text-gray-500">{(s.perfil as any)?.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {format(new Date(s.data_inicio), "dd/MM/yyyy")} até {format(new Date(s.data_fim), "dd/MM/yyyy")}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    s.status === 'aprovada' ? 'bg-green-100 text-green-700' :
                    s.status === 'pendente' ? 'bg-amber-100 text-amber-700' :
                    s.status === 'rejeitada' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {s.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {format(new Date(s.criado_em), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
