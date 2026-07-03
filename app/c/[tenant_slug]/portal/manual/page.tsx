import { redirect } from "next/navigation";

interface PageProps {
  params: { tenant_slug: string };
}

/**
 * Rota legada. O módulo "Manual do Colaborador" foi consolidado dentro de
 * "Documentos Corporativos" (que tem gestão completa pelo RH, incluindo
 * versionamento e aceite eletrônico). Mantemos esta rota apenas como
 * redirecionamento para não quebrar links/favoritos antigos.
 *
 * Ver: app/c/[tenant_slug]/portal/documentos/
 */
export default function ManualPageRedirect({ params }: PageProps) {
  redirect(`/c/${params.tenant_slug}/portal/documentos`);
}
