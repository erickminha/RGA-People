import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookOpen, FileText } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: { tenant_slug: string };
}

export const dynamic = "force-dynamic";

export default async function DocumentosPage({ params }: PageProps) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/c/${params.tenant_slug}/login`);

  // Documentos ativos da empresa
  const { data: documentos } = await supabase
    .from("documentos_corporativos")
    .select("id, tipo, titulo, descricao, exigir_aceite, versao")
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  // Quais já foram aceitos por este usuário
  const { data: aceites } = await supabase
    .from("aceites_documentos")
    .select("documento_id, versao_aceita")
    .eq("perfil_id", user.id);

  const aceitesMap = new Map(
    (aceites ?? []).map((a) => [a.documento_id, a.versao_aceita])
  );

  const docs = (documentos ?? []).map((d) => ({
    ...d,
    jaSolicitadoAceite:
      aceitesMap.has(d.id) && aceitesMap.get(d.id) === d.versao,
  }));

  const pendentes = docs.filter(
    (d) => d.exigir_aceite && !d.jaSolicitadoAceite
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 rounded-lg">
          <BookOpen className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Documentos</h1>
          <p className="text-sm text-gray-500">
            Manual do Colaborador, Código de Conduta, POPs e mais.
          </p>
        </div>
      </header>

      {/* Aviso de pendências */}
      {pendentes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-medium text-amber-900">
            Você tem{" "}
            <span className="font-bold">{pendentes.length}</span>{" "}
            {pendentes.length === 1 ? "documento" : "documentos"} pendente
            {pendentes.length === 1 ? "" : "s"} de aceite.
          </p>
        </div>
      )}

      {/* Lista de documentos */}
      {docs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-500">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          Nenhum documento disponível no momento.
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((d) => (
            <Link
              key={d.id}
              href={`/c/${params.tenant_slug}/portal/documentos/${d.id}`}
              className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-blue-50 rounded-lg shrink-0 mt-0.5">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{d.titulo}</h3>
                    {d.descricao && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {d.descricao}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <span>v{d.versao}</span>
                      {d.jaSolicitadoAceite && (
                        <span className="text-emerald-700 font-medium">
                          ✓ Aceito
                        </span>
                      )}
                      {d.exigir_aceite && !d.jaSolicitadoAceite && (
                        <span className="text-amber-700 font-medium">
                          ⚠ Pendente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-blue-600 text-sm font-medium shrink-0">
                  Abrir →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
