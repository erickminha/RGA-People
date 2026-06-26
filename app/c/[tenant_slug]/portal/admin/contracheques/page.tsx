"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileText, Upload, Trash2, Loader2, Download } from "lucide-react";
import UploadContrachequesModal from "@/components/modules/admin/UploadContrachequesModal";
import toast from "react-hot-toast";

export default function AdminContrachequesPage({
  params,
}: {
  params: { tenant_slug: string };
}) {
  const [contracheques, setContracheques] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    setIsLoading(true);
    try {
      const [{ data: cc }, { data: colab }] = await Promise.all([
        supabase
          .from("contracheques")
          .select("*, perfil:perfis(nome_completo)")
          .order("mes_ano", { ascending: false }),
        supabase
          .from("perfis")
          .select("id, nome_completo")
          .eq("ativo", true)
          .order("nome_completo"),
      ]);
      setContracheques(cc || []);
      setColaboradores(colab || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeletar = async (id: string, urlDocumento: string) => {
    if (!confirm("Tem certeza que deseja excluir este contracheque?")) return;
    setDeletandoId(id);
    const supabase = createClient();
    try {
      // Remover do Storage
      const { error: storageError } = await supabase.storage
        .from("contracheques")
        .remove([urlDocumento]);
      if (storageError) {
        console.warn("Aviso ao remover arquivo:", storageError.message);
      }
      // Remover do banco
      const { error: dbError } = await supabase
        .from("contracheques")
        .delete()
        .eq("id", id);
      if (dbError) {
        toast.error("Erro ao excluir contracheque: " + dbError.message);
        return;
      }
      toast.success("Contracheque excluído com sucesso.");
      setContracheques((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error("Erro inesperado ao excluir.");
    } finally {
      setDeletandoId(null);
    }
  };

  const handleDownload = async (id: string, urlDocumento: string, nomeArquivo: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("contracheques")
      .createSignedUrl(urlDocumento, 60);
    if (error || !data?.signedUrl) {
      toast.error("Erro ao gerar link de download.");
      return;
    }
    const link = document.createElement("a");
    link.href = data.signedUrl;
    link.download = nomeArquivo;
    link.target = "_blank";
    link.click();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-lg">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Gestão de Contracheques</h1>
            <p className="text-sm text-gray-500">Suba arquivos PDF e vincule aos colaboradores</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Upload className="w-4 h-4" />
          Subir Novo
        </button>
      </header>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
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
              {contracheques.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{(c.perfil as any)?.nome_completo ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.mes_ano}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{c.url_documento?.split("/").pop()}</td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleDownload(c.id, c.url_documento, `contracheque_${c.mes_ano}.pdf`)}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Baixar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletar(c.id, c.url_documento)}
                      disabled={deletandoId === c.id}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Excluir"
                    >
                      {deletandoId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
              {contracheques.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                    Nenhum contracheque enviado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <UploadContrachequesModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); fetchData(); }}
        colaboradores={colaboradores}
        tenantSlug={params.tenant_slug}
      />
    </div>
  );
}
