import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BarChart3, Briefcase } from "lucide-react";
import GestaoVagas, { type VagaUI } from "@/components/modules/talentos/GestaoVagas";
import PipelineCandidatos, { type CandidaturaPipe } from "@/components/modules/talentos/PipelineCandidatos";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ tenant_slug: string }>;
  searchParams: Promise<{ vaga?: string }>;
}

export default async function PanelTalentosPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/c/${params.tenant_slug}/login`);

  const { data: perfil } = await supabase
    .from("perfis")
    .select("id, empresa_id, cargo:cargos!perfis_cargo_id_fkey(permissoes)")
    .eq("id", user.id)
    .single();

  const p = (perfil?.cargo as any)?.permissoes ?? {};
  const isRh = p.rh_admin === true;
  const isSuper = p.super_admin === true;
  const isGestor = p.gestor === true;

  // Apenas RH, Super ou Gestor acessam o painel de recrutamento.
  if (!perfil || (!isRh && !isSuper && !isGestor)) {
    redirect(`/c/${params.tenant_slug}/portal`);
  }

  const empresaId = perfil.empresa_id;
  const podeEditar = isRh || isSuper;
  const vagaId = searchParams.vaga ?? null;

  const { data: vagas = [] } = await supabase
    .from("vagas")
    .select("id, titulo, departamento, localizacao, modalidade, descricao, requisitos, status")
    .eq("empresa_id", empresaId)
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
        <div className="p-2.5 bg-emerald-50 rounded-lg">
          <BarChart3 className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Recrutamento em andamento
          </h1>
          <p className="text-sm text-gray-500">
            {podeEditar
              ? "Acompanhe e gerencie as candidaturas por vaga."
              : "Acompanhe em transparência as candidaturas por vaga."}
          </p>
        </div>
      </header>

      <GestaoVagas
        vagas={vagasUI}
        tenantSlug={params.tenant_slug}
        baseHref={`/c/${params.tenant_slug}/portal/talentos`}
        vagaSelecionada={vagaId}
        podeEditar={podeEditar}
      />

      {vagaAtual && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            <Briefcase className="inline w-5 h-5 mr-1 text-gray-400" />
            Pipeline — {vagaAtual.titulo}
          </h2>
          <PipelineCandidatos
            candidaturas={candidaturas}
            tenantSlug={params.tenant_slug}
            podeEditar={podeEditar}
          />
        </section>
      )}
    </div>
  );
}