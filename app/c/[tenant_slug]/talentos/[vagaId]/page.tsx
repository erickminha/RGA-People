import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import FormularioCandidatura from "@/components/modules/talentos/FormularioCandidatura";
import { MapPin, Building2, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CandidaturaVagaPage(
  props: {
    params: Promise<{ tenant_slug: string; vagaId: string }>;
  }
) {
  const params = await props.params;
  const admin = createAdminClient();

  const { data: empresa } = await admin
    .from("empresas")
    .select("id, nome")
    .eq("slug", params.tenant_slug)
    .maybeSingle();
  if (!empresa) return notFound();

  const { data: vaga } = await admin
    .from("vagas")
    .select("id, titulo, departamento, localizacao, modalidade, descricao, requisitos, status")
    .eq("id", params.vagaId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (!vaga || vaga.status !== "aberta") return notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href={`/c/${params.tenant_slug}/talentos`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Ver todas as vagas
        </Link>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{vaga.titulo}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-2">
            {vaga.departamento && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-4 h-4" /> {vaga.departamento}
              </span>
            )}
            {vaga.localizacao && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {vaga.localizacao}
              </span>
            )}
            {vaga.modalidade && <span className="capitalize">{vaga.modalidade}</span>}
          </div>
          {vaga.descricao && (
            <p className="text-gray-600 text-sm mt-4 whitespace-pre-line">{vaga.descricao}</p>
          )}
          {vaga.requisitos && (
            <div className="mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
                Requisitos
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">{vaga.requisitos}</p>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Candidatar-se</h2>
          <FormularioCandidatura vagaId={vaga.id} />
        </div>
      </div>
    </div>
  );
}