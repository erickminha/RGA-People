import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import DetalheCandidatura, { type DetalheCandidatura as TipoDetalhe } from "@/components/modules/talentos/DetalheCandidatura";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ tenant_slug: string; candidaturaId: string }>;
}

export default async function DetalheCandidaturaPage(props: PageProps) {
  const params = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/c/${params.tenant_slug}/login`);

  const { data: perf } = await supabase
    .from("perfis")
    .select("empresa_id, cargo:cargos!perfis_cargo_id_fkey(permissoes)")
    .eq("id", user.id)
    .single();

  const p = (perf?.cargo as any)?.permissoes ?? {};
  const isRh = p.rh_admin === true;
  const isSuper = p.super_admin === true;
  const isGestor = p.gestor === true;

  if (!perf || (!isRh && !isSuper && !isGestor)) {
    redirect(`/c/${params.tenant_slug}/portal`);
  }

  const empresaId = perf.empresa_id;
  const podeEditar = isRh || isSuper;
  const podeDarFeedback = podeEditar || isGestor;

  // Candidatura + vaga + candidato
  const { data: cand } = await supabase
    .from("candidaturas")
    .select(
      `id, etapa, observacoes_rh,
       vaga:vagas(titulo),
       candidato:candidatos(id, nome, email, telefone, arquivo_nome)`
    )
    .eq("id", params.candidaturaId)
    .eq("empresa_id", empresaId)
    .single();

  if (!cand) return notFound();

  // Busca o teste DISC vinculado à candidatura
  const { data: testeDisc } = await supabase
    .from("testes_disc")
    .select("id, status")
    .eq("candidatura_id", cand.id)
    .eq("empresa_id", empresaId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [entrRes, fbRes] = await Promise.all([
  supabase
    .from("entrevistas")
    .select("id, titulo, tipo, data_hora, localizacao, link_video, status, observacoes")
    .eq("candidatura_id", cand.id)
    .order("data_hora", { ascending: true }),
  supabase
    .from("feedbacks_candidatura")
      .select("id, nota, comentario, etapa_referencia, criado_em, autor_id")
    .eq("candidatura_id", cand.id)
    .order("criado_em", { ascending: false }),
]);

  // Busca nomes dos autores de feedbacks
  const autoresIds = [...new Set(((fbRes.data ?? []) as any[]).map((f: any) => f.autor_id))];
  let nomes: Record<string, string> = {};
  if (autoresIds.length > 0) {
    const { data } = await supabase
      .from("perfis")
      .select("id, nome_completo")
      .in("id", autoresIds);
    nomes = Object.fromEntries((data ?? []).map((a: any) => [a.id, a.nome_completo]));
  }

  const dados: TipoDetalhe = {
    candidatura_id: cand.id,
    etapa: cand.etapa,
    vaga_titulo: (cand.vaga as any)?.titulo ?? "Vaga",
    candidato_nome: (cand.candidato as any)?.nome ?? "Candidato",
    candidato_email: (cand.candidato as any)?.email ?? null,
    candidato_telefone: (cand.candidato as any)?.telefone ?? null,
    arquivo_nome: (cand.candidato as any)?.arquivo_nome ?? null,
    entrevistas: (entrRes.data ?? []).map((e: any) => ({
      id: e.id,
      titulo: e.titulo,
      tipo: e.tipo,
      data_hora: e.data_hora,
      localizacao: e.localizacao,
      link_video: e.link_video,
      status: e.status,
      observacoes: e.observacoes,
    })),
    feedbacks: (fbRes.data ?? []).map((f: any) => ({
      id: f.id,
      nota: f.nota,
      comentario: f.comentario,
      etapa_referencia: f.etapa_referencia,
          autor_nome: nomes[f.autor_id as string] ?? null,
      criado_em: f.criado_em,
    })),
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <DetalheCandidatura
        dados={dados}
        tenantSlug={params.tenant_slug}
        voltaHref={`/c/${params.tenant_slug}/portal/talentos`}
        podeEditar={podeEditar}
        podeDarFeedback={podeDarFeedback}
              testeId={(testeDisc as any)?.id ?? null}
              statusTeste={(testeDisc as any)?.status ?? null}
            />
    </div>
  );
}