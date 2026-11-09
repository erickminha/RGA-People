import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import FormularioTesteDisc from "@/components/modules/talentos/FormularioTesteDisc";

export const dynamic = "force-dynamic";

export default async function TesteDiscPage(
  props: {
    params: Promise<{ tenant_slug: string; token: string }>;
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

  const { data: teste } = await admin
    .from("testes_disc")
    .select("id, token, status, empresa_id, candidatura_id, expira_em, revogado_em")
    .eq("token", params.token)
    .maybeSingle();

  if (
    !teste ||
    teste.empresa_id !== empresa.id ||
    teste.revogado_em ||
    new Date(teste.expira_em).getTime() <= Date.now()
  ) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <FormularioTesteDisc
          tenantSlug={params.tenant_slug}
          token={teste.token}
          status={teste.status}
          empresaNome={empresa.nome}
        />
      </div>
    </div>
  );
}