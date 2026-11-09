import { createClient } from "@/lib/supabase/server";
import { requireRhAdmin } from "@/lib/auth/guards";
import { BookOpen } from "lucide-react";
import EditorManual from "@/components/modules/manual/EditorManual";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ tenant_slug: string }>;
}

export default async function AdminManualPage(props: PageProps) {
  const params = await props.params;
  const guard = await requireRhAdmin(params.tenant_slug);
  const supabase = await createClient();

  const { data: manual } = await supabase
    .from("manuais")
    .select("titulo, conteudo")
    .eq("empresa_id", guard.empresaId)
    .maybeSingle();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 rounded-lg">
          <BookOpen className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Manual do Colaborador
          </h1>
          <p className="text-sm text-gray-500">
            Edite e publique o manual/código de conduta da empresa. O que for
            salvo é exibido no portal dos colaboradores.
          </p>
        </div>
      </header>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <EditorManual
          tenantSlug={params.tenant_slug}
          tituloInicial={manual?.titulo ?? "Manual do Colaborador"}
          conteudoInicial={manual?.conteudo ?? ""}
        />
      </div>
    </div>
  );
}