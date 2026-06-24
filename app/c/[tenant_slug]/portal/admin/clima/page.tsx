import { createClient } from "@/lib/supabase/server";
import { requireRhAdmin } from "@/lib/auth/guards";
import { MessageSquareHeart } from "lucide-react";
import GerenciarClima from "@/components/modules/clima/GerenciarClima";
import ResultadosClima from "@/components/modules/clima/ResultadosClima";
import type { PerguntaClima } from "@/lib/schemas/clima.schema";

interface PageProps {
  params: { tenant_slug: string };
  searchParams: { pesquisa?: string };
}

export const dynamic = "force-dynamic";

export default async function AdminClimaPage({
  params,
  searchParams,
}: PageProps) {
  const guard = await requireRhAdmin(params.tenant_slug);
  const supabase = createClient();

  // Pesquisas da empresa
  const { data: pesquisasRaw } = await supabase
    .from("pesquisas_clima")
    .select("id, titulo, descricao, status, perguntas")
    .eq("empresa_id", guard.empresaId)
    .order("criado_em", { ascending: false });

  const pesquisas = pesquisasRaw ?? [];

  // Contagem de respostas por pesquisa (em paralelo)
  const contagens = await Promise.all(
    pesquisas.map((p) =>
      supabase
        .from("respostas_clima")
        .select("id", { count: "exact", head: true })
        .eq("pesquisa_id", p.id)
    )
  );

  const pesquisasComContagem = pesquisas.map((p, i) => ({
    ...p,
    perguntas: (p.perguntas ?? []) as PerguntaClima[],
    total_respostas: contagens[i]?.count ?? 0,
  }));

  // Pesquisa selecionada para exibir resultados
  const selecionadaId =
    searchParams.pesquisa ??
    pesquisasComContagem.find((p) => p.status === "aberta")?.id ??
    pesquisasComContagem[0]?.id ??
    null;

  const selecionada = pesquisasComContagem.find((p) => p.id === selecionadaId);

  let respostas: { respostas: Record<string, number | string>; departamento: string | null }[] =
    [];
  if (selecionada) {
    const { data } = await supabase
      .from("respostas_clima")
      .select("respostas, departamento")
      .eq("pesquisa_id", selecionada.id);
    respostas = (data ?? []) as typeof respostas;
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center gap-3">
        <div className="p-2.5 bg-rose-50 rounded-lg">
          <MessageSquareHeart className="w-6 h-6 text-rose-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Pesquisa de Clima
          </h1>
          <p className="text-sm text-gray-500">
            Crie pesquisas, abra para o time e acompanhe os resultados
            agregados (respostas anônimas).
          </p>
        </div>
      </header>

      <GerenciarClima
        tenantSlug={params.tenant_slug}
        pesquisas={pesquisasComContagem}
        pesquisaSelecionadaId={selecionadaId}
      />

      {selecionada && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Resultados — {selecionada.titulo}
          </h2>
          <ResultadosClima
            perguntas={selecionada.perguntas}
            respostas={respostas}
          />
        </section>
      )}
    </div>
  );
}
