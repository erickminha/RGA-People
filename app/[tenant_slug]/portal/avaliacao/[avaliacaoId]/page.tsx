import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AutoAvaliacaoForm from "@/components/modules/avaliacao/AutoAvaliacaoForm";

interface PageProps {
  params: { tenant_slug: string; avaliacaoId: string };
}

export const dynamic = "force-dynamic";

export default async function AvaliacaoFormularioPage({ params }: PageProps) {
  const supabase = createClient();
  const periodo = decodeURIComponent(params.avaliacaoId);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/c/${params.tenant_slug}/login`);

  // Verifica se já enviou
  const { data: avaliacao } = await supabase
    .from("avaliacoes_desempenho")
    .select("auto_avaliacao, feedback_gestor, nota_final")
    .eq("avaliado_id", user.id)
    .eq("periodo", periodo)
    .maybeSingle();

  const jaEnviada = !!avaliacao?.auto_avaliacao;
  const dadosEnviados = jaEnviada
    ? JSON.parse(avaliacao!.auto_avaliacao as string)
    : null;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <Link
        href={`/c/${params.tenant_slug}/portal/avaliacao`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para ciclos
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Auto-Avaliação — {periodo}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Responda com sinceridade. Seu gestor terá acesso ao final do ciclo.
        </p>
      </header>

      {jaEnviada ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <h2 className="font-semibold text-emerald-900 mb-2">
            ✓ Auto-avaliação enviada
          </h2>
          <p className="text-sm text-emerald-700 mb-4">
            Você atribuiu a nota{" "}
            <strong>{dadosEnviados.nota_auto_avaliacao}/10</strong>.
          </p>
          {avaliacao?.feedback_gestor ? (
            <div className="mt-4 p-4 bg-white border border-emerald-200 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Feedback do gestor
              </p>
              <p className="text-sm text-gray-800">
                {avaliacao.feedback_gestor}
              </p>
            </div>
          ) : (
            <p className="text-xs text-emerald-600 italic">
              Aguardando feedback do gestor.
            </p>
          )}
        </div>
      ) : (
        <AutoAvaliacaoForm
          tenantSlug={params.tenant_slug}
          periodo={periodo}
        />
      )}
    </div>
  );
}
