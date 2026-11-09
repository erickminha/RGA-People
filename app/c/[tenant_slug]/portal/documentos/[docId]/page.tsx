import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import VisualizadorDocumento from "@/components/modules/documentos/VisualizadorDocumento";

interface PageProps {
  params: Promise<{ tenant_slug: string; docId: string }>;
}

export const dynamic = "force-dynamic";

export default async function DocumentoPage(props: PageProps) {
  const params = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/c/${params.tenant_slug}/login`);

  // Busca o documento
  const { data: documento } = await supabase
    .from("documentos_corporativos")
    .select("id, titulo, descricao, conteudo_md, arquivo_url, versao, exigir_aceite")
    .eq("id", params.docId)
    .eq("ativo", true)
    .maybeSingle();

  if (!documento) notFound();

  // Verifica se já aceitou esta versão
  const { data: aceite } = await supabase
    .from("aceites_documentos")
    .select("id")
    .eq("documento_id", params.docId)
    .eq("perfil_id", user.id)
    .eq("versao_aceita", documento.versao)
    .maybeSingle();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <VisualizadorDocumento
        tenantSlug={params.tenant_slug}
        documento={documento}
        jaSolicitadoAceite={!!aceite}
      />
    </div>
  );
}
