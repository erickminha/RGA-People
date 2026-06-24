import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
  params: { tenant_slug: string };
}

export default async function TenantLayout({ children, params }: LayoutProps) {
  const supabase = createClient();

  // Valida se a empresa existe pelo slug
  const { data: empresa, error } = await supabase
    .from("empresas")
    .select("id, nome, ativo")
    .eq("slug", params.tenant_slug)
    .single();

  if (error || !empresa || !empresa.ativo) {
    console.error(`Empresa não encontrada ou inativa: ${params.tenant_slug}`);
    notFound();
  }

  return <>{children}</>;
}
