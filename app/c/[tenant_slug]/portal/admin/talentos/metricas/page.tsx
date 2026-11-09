import { createClient } from "@/lib/supabase/server";
import { requireRhAdmin } from "@/lib/auth/guards";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import MetricasRecrutamento, { type MetricasRecrutamento as Metricas } from "@/components/modules/talentos/MetricasRecrutamento";
import { ETAPA_LABELS } from "@/lib/schemas/candidato.schema";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ tenant_slug: string }>;
}

export default async function MetricasTalentosPage(props: PageProps) {
  const params = await props.params;
  const guard = await requireRhAdmin(params.tenant_slug);
  const supabase = await createClient();

  const { data: vagasData } = await supabase
    .from("vagas")
    .select("id, titulo, status")
    .eq("empresa_id", guard.empresaId);
  const vagas = vagasData ?? [];

  const { data: candidaturasData } = await supabase
    .from("candidaturas")
    .select("id, etapa, criado_em, atualizado_em, vaga:vagas(titulo)")
    .eq("empresa_id", guard.empresaId);
  const candidaturas = candidaturasData ?? [];

  const { count: totalCandidatos } = await supabase
    .from("candidatos")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", guard.empresaId);

  // Candidaturas por vaga
  const porVagaMap = new Map<string, number>();
  for (const c of candidaturas) {
    const titulo = (c.vaga as any)?.titulo ?? "Sem vaga";
    porVagaMap.set(titulo, (porVagaMap.get(titulo) ?? 0) + 1);
  }

  // Candidaturas por etapa
  const porEtapaMap = new Map<string, number>();
  for (const c of candidaturas) {
    const etapa = c.etapa;
    porEtapaMap.set(etapa, (porEtapaMap.get(etapa) ?? 0) + 1);
  }

  // Tempo médio até contratação (dias) para contratados
  let somaDias = 0;
  let nContratados = 0;
  for (const c of candidaturas) {
    if (c.etapa === "contratado" && c.criado_em) {
      nContratados++;
      const inicio = new Date(c.criado_em).getTime();
      const fim = c.atualizado_em ? new Date(c.atualizado_em).getTime() : Date.now();
      somaDias += Math.max(0, (fim - inicio) / (1000 * 60 * 60 * 24));
    }
  }

  const dados: Metricas = {
    total_vagas: vagas.length,
    vagas_abertas: vagas.filter((v) => v.status === "aberta").length,
    total_candidatos: totalCandidatos ?? 0,
    total_candidaturas: candidaturas.length,
    contratados: nContratados,
    tempo_medio_dias: nContratados > 0 ? Math.round(somaDias / nContratados) : null,
    por_vaga: Array.from(porVagaMap.entries()).map(([name, value]) => ({ name, value })),
    por_etapa: Array.from(porEtapaMap.entries()).map(([name, value]) => ({
      name: ETAPA_LABELS[name as keyof typeof ETAPA_LABELS] ?? name,
      value,
    })),
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <div className="p-2.5 bg-purple-50 rounded-lg">
          <BarChart3 className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Métricas de Recrutamento</h1>
          <p className="text-sm text-gray-500">
            Indicadores de vagas, candidaturas e contratações.
          </p>
        </div>
        <Link
          href={`/c/${params.tenant_slug}/portal/admin/talentos`}
          className="ml-auto text-sm text-indigo-600 hover:underline"
        >
          ← Banco de Talentos
        </Link>
      </header>

      <MetricasRecrutamento dados={dados} />
    </div>
  );
}