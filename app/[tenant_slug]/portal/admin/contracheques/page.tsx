import { createClient } from "@/lib/supabase/server";
import { requireRhAdmin } from "@/lib/auth/guards";
import { FileText, Upload, Trash2 } from "lucide-react";

interface PageProps {
  params: { tenant_slug: string };
}

export const dynamic = "force-dynamic";

export default async function AdminContrachequesPage({ params }: PageProps) {
  const guard = await requireRhAdmin(params.tenant_slug);
  const supabase = createClient();

  const { data: contracheques } = await supabase
    .from("contracheques")
    .select(`
      *,
      perfil:perfis(nome_completo)
    `)
    .eq("empresa_id", guard.empresaId)
    .order("mes_ano", { ascending: false });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-lg">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Gestão de Contracheques
            </h1>
            <p className="text-sm text-gray-500">
              Suba arquivos PDF e vincule aos colaboradores
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
          <Upload className="w-4 h-4" />
          Subir Novo
        </button>
      </header>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Colaborador</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mês/Ano</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Arquivo</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {contracheques?.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{(c.perfil as any)?.nome_completo}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.mes_ano}</td>
                <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{c.url_documento}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {(!contracheques || contracheques.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                  Nenhum contracheque enviado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
