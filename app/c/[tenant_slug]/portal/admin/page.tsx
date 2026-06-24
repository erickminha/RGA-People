import { createClient } from "@/lib/supabase/server";
import { requireRhAdmin } from "@/lib/auth/guards";
import { Shield, Users, Plane, FileText, Award, Smile } from "lucide-react";
import KpiCard from "@/components/modules/admin/KpiCard";
import AprovacoesFeriasPendentes from "@/components/modules/admin/AprovacoesFeriasPendentes";
import AtalhosRapidos from "@/components/modules/admin/AtalhosRapidos";
import DashboardCharts from "@/components/modules/admin/DashboardCharts";
import type { PerguntaClima } from "@/lib/schemas/clima.schema";

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
      .eq("empresa_id", guard.empresaId)
      .eq("ativo", true),
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

  // ---- Dados para gráficos ----
  const inicioAno = new Date(new Date().getFullYear(), 0, 1).toISOString();

  const [{ data: feriasAno }, { data: pesquisaAberta }] = await Promise.all([
    supabase
      .from("ferias_solicitacoes")
      .select("status")
      .eq("empresa_id", guard.empresaId)
      .gte("criado_em", inicioAno),
    supabase
      .from("pesquisas_clima")
      .select("id, perguntas, criado_em")
      .eq("empresa_id", guard.empresaId)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // Distribuição de status de férias
  const mapaStatus: Record<string, number> = {
    aprovada: 0,
    pendente: 0,
    rejeitada: 0,
    cancelada: 0,
  };
  (feriasAno ?? []).forEach((f: { status: string }) => {
    if (f.status in mapaStatus) mapaStatus[f.status] += 1;
  });
  const statusFerias = [
    { name: "Aprovadas", value: mapaStatus.aprovada },
    { name: "Pendentes", value: mapaStatus.pendente },
    { name: "Rejeitadas", value: mapaStatus.rejeitada },
    { name: "Canceladas", value: mapaStatus.cancelada },
  ];

  // Médias de clima por dimensão (da pesquisa mais recente)
  let climaDimensoes: { dimensao: string; media: number }[] = [];
  let indiceClima = 0;
  if (pesquisaAberta?.id) {
    const perguntas = (pesquisaAberta.perguntas ?? []) as PerguntaClima[];
    const escalas = perguntas.filter((p) => p.tipo === "escala");
    const { data: respostasClima } = await supabase
      .from("respostas_clima")
      .select("respostas")
      .eq("pesquisa_id", pesquisaAberta.id);

    const linhas = (respostasClima ?? []) as {
      respostas: Record<string, number | string>;
    }[];

    climaDimensoes = escalas.map((p) => {
      const valores = linhas
        .map((r) => Number(r.respostas?.[p.id]))
        .filter((v) => !Number.isNaN(v) && v > 0);
      const media = valores.length
        ? valores.reduce((a, b) => a + b, 0) / valores.length
        : 0;
      return {
        dimensao: p.dimensao || p.texto.slice(0, 12),
        media: Number(media.toFixed(2)),
      };
    });

    const validas = climaDimensoes.filter((d) => d.media > 0);
    const mediaGeral = validas.length
      ? validas.reduce((a, b) => a + b.media, 0) / validas.length
      : 0;
    indiceClima = Math.round((mediaGeral / 5) * 100);
  }

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
          <KpiCard
            label="Índice de clima"
            valor={indiceClima > 0 ? `${indiceClima}%` : "—"}
            Icon={Smile}
            cor="rose"
            hint="Pesquisa mais recente"
          />
        </div>
      </section>

      {/* Gráficos */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Visão analítica
        </h2>
        <DashboardCharts
          statusFerias={statusFerias}
          climaDimensoes={climaDimensoes}
        />
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
