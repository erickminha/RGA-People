import { requireSuperAdmin } from "@/lib/auth/guards";
import NovaEmpresaForm from "@/components/modules/admin/NovaEmpresaForm";

export default async function NovaEmpresaPage({
  params,
}: {
  params: { tenant_slug: string };
}) {
  await requireSuperAdmin(params.tenant_slug);

  return <NovaEmpresaForm tenantSlug={params.tenant_slug} />;
}
