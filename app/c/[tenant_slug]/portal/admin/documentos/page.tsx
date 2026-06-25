import { createClient } from "@/lib/supabase/server";
import { requireRhAdmin } from "@/lib/auth/guards";
import { BookOpen } from "lucide-react";
import GerenciarDocumentos from "@/components/modules/documentos/GerenciarDocumentos";

interface PageProps {
  params: { tenant_slug: string };
}

export const dynamic = "force-dynamic";

export default async function AdminDocumentosPage({ params }: PageProps) {
  const guard = await requireRhAdmin(params.tenant_slug);
  const supabase = createClient();

  // Documentos da empresa com contagem de aceites
  const { data: documentos } = await supabase
    .from("documentos_corporativos")
    .select("id, tipo, titulo, descricao, versao, ativo")
    .eq("empresa_id", guard.empresaId)
    .order("criado_em", { ascending: false });

  // Contar aceites por documento
  const docsComAceites = await Promise.all(
    (documentos ?? []).map(async (d) => {
      const { count } = await supabase
        .from("aceites_documentos")
        .select("id", { count: "exact", head: true })
        .eq("documento_id", d.id);
      return { ...d, total_aceites: count ?? 0 };
    })
  );

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 rounded-lg">
          <BookOpen className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Documentos</h1>
          <p className="text-sm text-gray-500">
            Gerencie Manual, Código de Conduta, POPs, NR1 e outros documentos
            corporativos.
          </p>
        </div>
      </header>

      <GerenciarDocumentos
        tenantSlug={params.tenant_slug}
        documentos={docsComAceites}
      />
    </div>
  );
}
