import { createClient } from "@/lib/supabase/server";
import { requireRhAdmin } from "@/lib/auth/guards";
import { Users } from "lucide-react";
import ColaboradoresTable from "@/components/modules/admin/ColaboradoresTable";

interface PageProps {
  params: { tenant_slug: string };
  searchParams: { novo?: string; busca?: string };
}

export const dynamic = "force-dynamic";

export default async function ColaboradoresPage({
  params,
  searchParams,
}: PageProps) {
  const guard = await requireRhAdmin(params.tenant_slug);
  const supabase = createClient();

  const busca = searchParams.busca?.trim() ?? "";

  let query = supabase
    .from("perfis")
    .select(
      `
      id,
      nome_completo,
      email,
      avatar_url,
      ativo,
      criado_em,
      cargo:cargos!perfis_cargo_id_fkey (id, nome, nivel)
    `
    )
    .eq("empresa_id", guard.empresaId)
    .order("nome_completo", { ascending: true });

  if (busca) {
    query = query.or(`nome_completo.ilike.%${busca}%,email.ilike.%${busca}%`);
  }

  const [{ data: colaboradores }, { data: cargos }, { data: convitesPendentes }] =
    await Promise.all([
      query,
      supabase
        .from("cargos")
        .select("id, nome, nivel")
        .eq("empresa_id", guard.empresaId)
        .order("nome"),
      supabase
        .from("convites")
        .select("id, email, expira_em, criado_em")
        .eq("empresa_id", guard.empresaId)
        .eq("usado", false)
        .gt("expira_em", new Date().toISOString())
        .order("criado_em", { ascending: false }),
    ]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-indigo-50 rounded-lg">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Gestão de Colaboradores
            </h1>
            <p className="text-sm text-gray-500">
              Convide, edite cargos/salários e gerencie acessos da sua equipe
            </p>
          </div>
        </div>
      </header>

      <ColaboradoresTable
        colaboradores={(colaboradores ?? []) as any}
        cargos={(cargos ?? []) as any}
        convitesPendentes={(convitesPendentes ?? []) as any}
        tenantSlug={params.tenant_slug}
        buscaInicial={busca}
        abrirNovoAoCarregar={searchParams.novo === "1"}
      />
    </div>
  );
}
