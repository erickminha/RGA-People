import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FileText, AlertCircle } from "lucide-react";
import ContrachequeList from "@/components/modules/contracheques/ContrachequeList";

interface PageProps {
  params: { tenant_slug: string };
}

export const dynamic = "force-dynamic";

export default async function ContrachequesPage({ params }: PageProps) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/c/${params.tenant_slug}/login`);
  }

  const { data: contracheques, error } = await supabase
    .from("contracheques")
    .select("id, mes_ano, url_documento, criado_em")
    .eq("perfil_id", user.id)
    .order("mes_ano", { ascending: false });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-50 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Meus Contracheques
            </h1>
            <p className="text-sm text-gray-500">
              Histórico completo dos seus holerites mensais
            </p>
          </div>
        </div>
      </header>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">
            Erro ao carregar contracheques. Tente novamente em instantes.
          </p>
        </div>
      )}

      {/* Estado vazio */}
      {!error && (!contracheques || contracheques.length === 0) && (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">
            Nenhum contracheque disponível
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Assim que o RH liberar, ele aparecerá aqui.
          </p>
        </div>
      )}

      {/* Lista */}
      {contracheques && contracheques.length > 0 && (
        <ContrachequeList
          contracheques={contracheques}
          tenantSlug={params.tenant_slug}
        />
      )}
    </div>
  );
}
