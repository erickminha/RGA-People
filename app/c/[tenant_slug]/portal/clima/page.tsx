import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheckCircle2, MessageSquareHeart, Inbox } from "lucide-react";
import ResponderClimaForm from "@/components/modules/clima/ResponderClimaForm";
import type { PerguntaClima } from "@/lib/schemas/clima.schema";

interface PageProps {
  params: { tenant_slug: string };
}

export const dynamic = "force-dynamic";

export default async function ClimaColaboradorPage({ params }: PageProps) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/c/${params.tenant_slug}/login`);

  // Pesquisas abertas da empresa (RLS garante o tenant)
  const { data: pesquisas } = await supabase
    .from("pesquisas_clima")
    .select("id, titulo, descricao, perguntas, status")
    .eq("status", "aberta")
    .order("criado_em", { ascending: false });

  const abertas = pesquisas ?? [];

  // Quais já foram respondidas por este usuário
  const { data: participacoes } = await supabase
    .from("controle_participacao_clima")
    .select("pesquisa_id")
    .eq("perfil_id", user.id);

  const respondidas = new Set(
    (participacoes ?? []).map((p) => p.pesquisa_id as string)
  );

  const pendente = abertas.find((p) => !respondidas.has(p.id));

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <div className="p-2.5 bg-rose-50 rounded-lg">
          <MessageSquareHeart className="w-6 h-6 text-rose-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Pesquisa de Clima
          </h1>
          <p className="text-sm text-gray-500">
            Sua opinião ajuda a construir um ambiente melhor.
          </p>
        </div>
      </header>

      {pendente ? (
        <ResponderClimaForm
          tenantSlug={params.tenant_slug}
          pesquisaId={pendente.id}
          titulo={pendente.titulo}
          descricao={pendente.descricao}
          perguntas={(pendente.perguntas ?? []) as PerguntaClima[]}
        />
      ) : abertas.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">
            Tudo respondido!
          </h2>
          <p className="text-gray-500 mt-1">
            Você já respondeu todas as pesquisas abertas. Obrigado pela
            participação.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">
            Nenhuma pesquisa aberta
          </h2>
          <p className="text-gray-500 mt-1">
            Quando o RH abrir uma nova pesquisa de clima, ela aparecerá aqui.
          </p>
        </div>
      )}
    </div>
  );
}
