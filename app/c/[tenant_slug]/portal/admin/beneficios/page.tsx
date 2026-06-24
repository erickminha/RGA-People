import { createClient } from "@/lib/supabase/server";
import { requireRhAdmin } from "@/lib/auth/guards";
import { Gift, Trash2, ExternalLink } from "lucide-react";
import { excluirBeneficio } from "@/app/actions/admin-beneficios";
import NovoBeneficioModal from "@/components/modules/admin/NovoBeneficioModal";

interface PageProps {
  params: { tenant_slug: string };
}

export const dynamic = "force-dynamic";

export default async function AdminBeneficiosPage({ params }: PageProps) {
  const guard = await requireRhAdmin(params.tenant_slug);
  const supabase = createClient();

  const { data: beneficios } = await supabase
    .from("beneficios")
    .select("*")
    .eq("empresa_id", guard.empresaId)
    .order("nome", { ascending: true });

  async function handleDelete(id: string) {
    "use server";
    await excluirBeneficio(params.tenant_slug, id);
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-lg">
            <Gift className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Gestão de Benefícios
            </h1>
            <p className="text-sm text-gray-500">
              Cadastre e gerencie os benefícios oferecidos aos colaboradores
            </p>
          </div>
        </div>
        <NovoBeneficioModal tenantSlug={params.tenant_slug} />
      </header>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Benefício</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Link</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {beneficios?.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{b.nome}</td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{b.descricao || "—"}</td>
                <td className="px-6 py-4">
                  {b.url_parceiro ? (
                    <a href={b.url_parceiro} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm">
                      Ver link <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : "—"}
                </td>
                <td className="px-6 py-4 text-right">
                  <form action={handleDelete.bind(null, b.id)}>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!beneficios || beneficios.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                  Nenhum benefício cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
