import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Briefcase, MapPin, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TalentosPublicoPage(
  props: {
    params: Promise<{ tenant_slug: string }>;
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

  const { data } = await admin
    .from("vagas")
    .select("id, titulo, departamento, localizacao, modalidade, descricao")
    .eq("empresa_id", empresa.id)
    .eq("status", "aberta")
    .order("criado_em", { ascending: false });

  const vagas = data ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Trabalhe conosco — {empresa.nome}
          </h1>
          <p className="mt-2 text-gray-500">
            Envie seu currículo para as vagas abertas. Acompanhamos seu processo
            por aqui.
          </p>
        </header>

        {vagas.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              No momento não há vagas abertas. Volte em breve!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {vagas.map((v) => (
              <Link
                key={v.id}
                href={`/c/${params.tenant_slug}/talentos/${v.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-gray-900 text-lg">{v.titulo}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                      {v.departamento && <span>{v.departamento}</span>}
                      {v.localizacao && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {v.localizacao}
                        </span>
                      )}
                      {v.modalidade && <span className="capitalize">{v.modalidade}</span>}
                    </div>
                    {v.descricao && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{v.descricao}</p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-indigo-600 font-medium text-sm shrink-0 mt-1">
                    Candidatar-se <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}