import { createClient } from "@/lib/supabase/server";
import { requireRhAdmin } from "@/lib/auth/guards";
import { Plane } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AprovacoesFeriasPendentes from "@/components/modules/admin/AprovacoesFeriasPendentes";

interface PageProps {
  params: { tenant_slug: string };
}

export const dynamic = "force-dynamic";

export default async function AdminFeriasPage({ params }: PageProps) {
  const guard = await requireRhAdmin(params.tenant_slug);
  const supabase = createClient();

  // Solicitações pendentes para aprovação
  const { data: pendentes } = await supabase
    .from("ferias_solicitacoes")
    .select(`
      id,
      data_inicio,
      data_fim,
      criado_em,
      perfil:perfis!ferias_solicitacoes_perfil_id_fkey(nome_completo, email)
    `)
    .eq("empresa_id", guard.empresaId)
    .eq("status", "pendente")
    .order("criado_em", { ascending: true });

  // Histórico completo
  const { data: solicitacoes } = await supabase
    .from("ferias_solicitacoes")
    .select(`
      *,
      perfil:perfis!ferias_solicitacoes_perfil_id_fkey(nome_completo, email)
    `)
    .eq("empresa_id", guard.empresaId)
    .order("criado_em", { ascending: false });

  const solicitacoesPendentes = (pendentes ?? []).map((s) => ({
    id: s.id as string,
    data_inicio: s.data_inicio as string,
    data_fim: s.data_fim as string,
    criado_em: s.criado_em as string,
    perfil: (Array.isArray(s.perfil) ? s.perfil[0] : s.perfil) as { id: string; nome_completo: string; email: string },
  }));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-lg">
            <Plane className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Gestão de Férias
            </h1>
            <p className="text-sm text-gray-500">
              Aprove solicitações pendentes e visualize o histórico da equipe
            </p>
          </div>
        </div>
      </header>

      {/* Aprovações Pendentes */}
      <AprovacoesFeriasPendentes
        solicitacoes={solicitacoesPendentes}
        tenantSlug={params.tenant_slug}
      />

      {/* Histórico Completo */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Histórico Completo</h2>
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
            {(solicitacoes ?? []).map((s) => (
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
            )            )}
            {(!solicitacoes || solicitacoes.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                  Nenhuma solicitação de férias encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </section>
    </div>
  );
}
