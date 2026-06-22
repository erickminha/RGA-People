import { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function PortalLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { tenant_slug: string };
}) {
  const supabase = createClient();

  const { data: empresa, error } = await supabase
    .from("empresas")
    .select("nome, slug")
    .eq("slug", params.tenant_slug)
    .single();

  if (error || !empresa) {
    notFound();
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar tenantSlug={params.tenant_slug} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header empresaNome={empresa.nome} onMenuClick={() => {}} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
