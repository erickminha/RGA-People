import { createClient } from "@/lib/supabase/server";
import { requireRhAdmin } from "@/lib/auth/guards";
import { Briefcase, BarChart3 } from "lucide-react";
import Link from "next/link";
import GestaoVagas, { type VagaUI } from "@/components/modules/talentos/GestaoVagas";
import PipelineCandidatos, { type CandidaturaPipe } from "@/components/modules/talentos/PipelineCandidatos";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ tenant_slug: string }>;
  searchParams: Promise<{ vaga?: string }>;
}

export default async function AdminTalentosPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const guard = await requireRhAdmin(params.tenant_slug);
  const supabase = await createClient();

  const vagaId = searchParams.vaga ?? null;

  const { data: vagas = [] } = await supabase
    .from("vagas")
    .select("id, titulo, departamento, localizacao, modalidade, descricao, requisitos, status")
    .eq("empresa_id", guard.empresaId)
    .order("criado_em", { ascending: false });

  const vagasUI: VagaUI[] = vagas as unknown as VagaUI[];
  const vagaAtual = vagasUI.find((v) => v.id === vagaId);

  let candidaturas: CandidaturaPipe[] = [];
  if (vagaAtual) {
    const { data } = await supabase
      .from("candidaturas")
      .select(
            `id, etapa, observacoes_rh, match_score, candidato:candidatos(id, nome, email, telefone, arquivo_nome)`
      )
      .eq("vaga_id", vagaAtual.id);
    candidaturas = (data ?? []) as unknown as CandidaturaPipe[];
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-50 rounded-lg">
          <Briefcase className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Banco de Talentos</h1>
          <p className="text-sm text-gray-500">
            Crie vagas, receba currículos e acompanhe o pipeline de cada
            recrutamento.
          </p>
        </div>
                <Link
                  href={`/c/${params.tenant_slug}/portal/admin/talentos/metricas`}
                  className="ml-auto inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <BarChart3 className="w-4 h-4" /> Métricas
                </Link>
              </header>

      <GestaoVagas
        vagas={vagasUI}
        tenantSlug={params.tenant_slug}
        baseHref={`/c/${params.tenant_slug}/portal/admin/talentos`}
        vagaSelecionada={vagaId}
        podeEditar
      />

      {vagaAtual && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Pipeline — {vagaAtual.titulo}
          </h2>
          <PipelineCandidatos
            candidaturas={candidaturas}
            tenantSlug={params.tenant_slug}
            podeEditar
          />
        </section>
      )}
    </div>
  );
}