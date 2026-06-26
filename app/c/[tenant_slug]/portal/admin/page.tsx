"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  Plane,
  FileText,
  Award,
  Smile,
  Plus,
} from "lucide-react";
import KpiCard from "@/components/modules/admin/KpiCard";
import DashboardCharts from "@/components/modules/admin/DashboardCharts";
import AtalhosRapidos from "@/components/modules/admin/AtalhosRapidos";
import AprovacoesFeriasPendentes from "@/components/modules/admin/AprovacoesFeriasPendentes";
import ConvidarColaboradorModal from "@/components/modules/admin/ConvidarColaboradorModal";

export default function AdminPage({
  params,
}: {
  params: { tenant_slug: string };
}) {
  const [dados, setDados] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConvidarOpen, setIsConvidarOpen] = useState(false);
  const [cargos, setCargos] = useState<any[]>([]);
  const router = useRouter();

  const carregarDados = useCallback(async () => {
    const supabase = createClient();
    try {
      // Verificar sessão
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/c/${params.tenant_slug}/login`);
        return;
      }

      // Buscar perfil do admin
      const { data: perfil } = await supabase
        .from("perfis")
        .select("*, cargo:cargos(*)")
        .eq("id", session.user.id)
        .single();

      if (
        !perfil?.cargo?.permissoes?.rh_admin &&
        !perfil?.cargo?.permissoes?.super_admin
      ) {
        router.push(`/c/${params.tenant_slug}/portal`);
        return;
      }

      const empresaId = perfil.empresa_id;

      // Buscar todos os dados em paralelo
      const [
        { count: totalColaboradores },
        { count: feriasPendentes },
        { count: contrachequesMes },
        { count: avaliacoesAbertas },
        { data: cargosData },
        { data: solicitacoesPendentes },
        { data: statusFeriasData },
        { data: climaData },
      ] = await Promise.all([
        // Total de colaboradores ativos
        supabase
          .from("perfis")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", empresaId)
          .eq("ativo", true),

        // Férias pendentes
        supabase
          .from("ferias_solicitacoes")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", empresaId)
          .eq("status", "pendente"),

        // Contracheques do mês atual
        supabase
          .from("contracheques")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", empresaId)
          .gte(
            "criado_em",
            new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ).toISOString()
          ),

        // Avaliações abertas
        supabase
          .from("avaliacoes_desempenho")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", empresaId)
          .eq("status", "aberta"),

        // Cargos para o modal de convite
        supabase
          .from("cargos")
          .select("*")
          .eq("empresa_id", empresaId)
          .order("nome"),

        // Solicitações de férias pendentes com dados do colaborador
        supabase
          .from("ferias_solicitacoes")
          .select(
            `
            id,
            data_inicio,
            data_fim,
            criado_em,
            perfil:perfis!ferias_solicitacoes_perfil_id_fkey (
              id,
              nome_completo,
              email
            )
          `
          )
          .eq("empresa_id", empresaId)
          .eq("status", "pendente")
          .order("criado_em", { ascending: true })
          .limit(20),

        // Status de férias para gráfico
        supabase
          .from("ferias_solicitacoes")
          .select("status")
          .eq("empresa_id", empresaId),

        // Dados de clima para gráfico
        supabase
          .from("respostas_clima")
          .select("dimensao, nota")
          .eq("empresa_id", empresaId)
          .not("dimensao", "is", null)
          .limit(500),
      ]);

      // Processar status de férias para o gráfico
      const contagem: Record<string, number> = {
        aprovada: 0,
        pendente: 0,
        rejeitada: 0,
        cancelada: 0,
      };
      (statusFeriasData ?? []).forEach((s: any) => {
        if (s.status in contagem) contagem[s.status]++;
      });
      const statusFerias = [
        { name: "Aprovadas", value: contagem.aprovada },
        { name: "Pendentes", value: contagem.pendente },
        { name: "Rejeitadas", value: contagem.rejeitada },
        { name: "Canceladas", value: contagem.cancelada },
      ];

      // Processar dimensões de clima para o gráfico
      const dimensoesMap: Record<string, { soma: number; qtd: number }> = {};
      (climaData ?? []).forEach((r: any) => {
        if (!r.dimensao || r.nota == null) return;
        if (!dimensoesMap[r.dimensao]) {
          dimensoesMap[r.dimensao] = { soma: 0, qtd: 0 };
        }
        dimensoesMap[r.dimensao].soma += Number(r.nota);
        dimensoesMap[r.dimensao].qtd++;
      });
      const climaDimensoes = Object.entries(dimensoesMap).map(
        ([dimensao, { soma, qtd }]) => ({
          dimensao,
          media: Math.round((soma / qtd) * 10) / 10,
        })
      );

      // Calcular índice de clima (média geral)
      const todasNotas = (climaData ?? []).map((r: any) => Number(r.nota)).filter(Boolean);
      const indiceClima =
        todasNotas.length > 0
          ? Math.round(
              (todasNotas.reduce((a: number, b: number) => a + b, 0) /
                todasNotas.length /
                5) *
                100
            )
          : 0;

      setCargos(cargosData ?? []);
      setDados({
        nomeCompleto: perfil.nome_completo,
        totalColaboradores: totalColaboradores ?? 0,
        feriasPendentes: feriasPendentes ?? 0,
        contrachequesMes: contrachequesMes ?? 0,
        avaliacoesAbertas: avaliacoesAbertas ?? 0,
        indiceClima,
        statusFerias,
        climaDimensoes,
        solicitacoesPendentes: solicitacoesPendentes ?? [],
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.tenant_slug, router]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Cabeçalho */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-lg">
            <Shield className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Painel do RH
            </h1>
            <p className="text-sm text-gray-500">
              Olá, <strong>{dados?.nomeCompleto}</strong> — visão executiva da
              gestão de pessoas
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsConvidarOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Convidar Colaborador
        </button>
      </header>

      {/* KPIs */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            label="Colaboradores"
            valor={dados?.totalColaboradores ?? 0}
            Icon={Users}
            cor="indigo"
            hint="Total ativos"
          />
          <KpiCard
            label="Férias pendentes"
            valor={dados?.feriasPendentes ?? 0}
            Icon={Plane}
            cor="amber"
            hint="Aguardando aprovação"
            destaque={(dados?.feriasPendentes ?? 0) > 0}
          />
          <KpiCard
            label="Contracheques"
            valor={dados?.contrachequesMes ?? 0}
            Icon={FileText}
            cor="emerald"
            hint="Este mês"
          />
          <KpiCard
            label="Avaliações"
            valor={dados?.avaliacoesAbertas ?? 0}
            Icon={Award}
            cor="violet"
            hint="Em aberto"
          />
          <KpiCard
            label="Clima"
            valor={`${dados?.indiceClima ?? 0}%`}
            Icon={Smile}
            cor="rose"
            hint="Satisfação"
          />
        </div>
      </section>

      {/* Gráficos */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Visão Analítica
        </h2>
        <DashboardCharts
          statusFerias={dados?.statusFerias || []}
          climaDimensoes={dados?.climaDimensoes || []}
        />
      </section>

      {/* Atalhos */}
      <AtalhosRapidos tenantSlug={params.tenant_slug} />

      {/* Aprovações Pendentes */}
      <AprovacoesFeriasPendentes
        solicitacoes={dados?.solicitacoesPendentes || []}
        tenantSlug={params.tenant_slug}
      />

      {/* Modal de Convite */}
      <ConvidarColaboradorModal
        isOpen={isConvidarOpen}
        onClose={() => {
          setIsConvidarOpen(false);
          carregarDados(); // Recarregar após convidar
        }}
        cargos={cargos}
        tenantSlug={params.tenant_slug}
      />
    </div>
  );
}
