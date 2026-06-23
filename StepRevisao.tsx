import { createClient } from "@/lib/supabase/server";
import { requireRhAdmin } from "@/lib/auth/guards";
import { Shield, Users, Plane, FileText, Award } from "lucide-react";
import KpiCard from "@/components/modules/admin/KpiCard";
import AprovacoesFeriasPendentes from "@/components/modules/admin/AprovacoesFeriasPendentes";
import AtalhosRapidos from "@/components/modules/admin/AtalhosRapidos";

interface PageProps {
  params: { tenant_slug: string };
}

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({ params }: PageProps) {
  const guard = await requireRhAdmin(params.tenant_slug);
  const supabase = createClient();

  // KPIs em paralelo
  const [
    { count: totalColaboradores },
    { count: feriasPendentes },
    { count: contrachequesMes },
    { count: avaliacoesAbertas },
    { data: solicitacoesPendentes },
  ] = await Promise.all([
    supabase
      .from("perfis")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", guard.empresaId),
    supabase
      .from("ferias_solicitacoes")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", guard.empresaId)
      .eq("status", "pendente"),
    supabase
      .from("contracheques")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", guard.empresaId)
      .gte(
        "criado_em",
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      ),
    supabase
      .from("avaliacoes_desempenho")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", guard.empresaId)
      .is("feedback_gestor", null),
    supabase
      .from("ferias_solicitacoes")
      .select(
        `
        id, data_inicio, data_fim, criado_em,
        perfil:perfis!ferias_solicitacoes_perfil_id_fkey (
          id, nome_completo, email
        )
      `
      )
      .eq("empresa_id", guard.empresaId)
      .eq("status", "pendente")
      .order("criado_em", { ascending: true })
      .limit(10),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Cabeçalho */}
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-indigo-50 rounded-lg">
            <Shield className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Painel do RH
            </h1>
            <p className="text-sm text-gray-500">
              Olá, <strong>{guard.nomeCompleto}</strong> — visão executiva da
              gestão de pessoas
            </p>
          </div>
        </div>
      </header>

      {/* KPIs */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Colaboradores"
            valor={totalColaboradores ?? 0}
            Icon={Users}
            cor="indigo"
            hint="Total ativos na empresa"
          />
          <KpiCard
            label="Férias pendentes"
            valor={feriasPendentes ?? 0}
            Icon={Plane}
            cor="amber"
            hint="Aguardando sua aprovação"
            destaque={(feriasPendentes ?? 0) > 0}
          />
          <KpiCard
            label="Contracheques (mês)"
            valor={contrachequesMes ?? 0}
            Icon={FileText}
            cor="emerald"
            hint="Liberados este mês"
          />
          <KpiCard
            label="Avaliações em aberto"
            valor={avaliacoesAbertas ?? 0}
            Icon={Award}
            cor="violet"
            hint="Sem feedback do gestor"
          />
        </div>
      </section>

      {/* Atalhos */}
      <AtalhosRapidos tenantSlug={params.tenant_slug} />

      {/* Aprovações pendentes */}
      <AprovacoesFeriasPendentes
        solicitacoes={(solicitacoesPendentes ?? []) as any}
        tenantSlug={params.tenant_slug}
      />
    </div>
  );
}
