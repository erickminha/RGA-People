"use client";

import { useState } from "react";
import { Upload, X, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface UploadContrachequesModalProps {
  isOpen: boolean;
  onClose: () => void;
  colaboradores: Array<{ id: string; nome_completo: string }>;
  tenantSlug: string;
}

export default function UploadContrachequesModal({
  isOpen,
  onClose,
  colaboradores,
  tenantSlug,
}: UploadContrachequesModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedColaborador, setSelectedColaborador] = useState("");
  const [mesAno, setMesAno] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Apenas arquivos PDF são aceitos.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("O arquivo deve ter no máximo 10MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedColaborador || !mesAno) {
      toast.error("Preencha todos os campos e selecione um arquivo.");
      return;
    }
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: perfil } = await supabase
        .from("perfis")
        .select("empresa_id")
        .eq("id", selectedColaborador)
        .single();
      if (!perfil) {
        toast.error("Colaborador não encontrado.");
        setIsLoading(false);
        return;
      }
      const mesAnoFormatado = mesAno.replace("-", "_");
      const filePath = `${selectedColaborador}/${mesAnoFormatado}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("contracheques")
        .upload(filePath, selectedFile, { upsert: true, contentType: "application/pdf" });
      if (uploadError) {
        toast.error("Erro ao fazer upload: " + uploadError.message);
        setIsLoading(false);
        return;
      }
      const { data: existente } = await supabase
        .from("contracheques")
        .select("id")
        .eq("perfil_id", selectedColaborador)
        .eq("mes_ano", mesAno)
        .maybeSingle();
      if (existente) {
        await supabase.from("contracheques").update({ url_documento: filePath }).eq("id", existente.id);
      } else {
        await supabase.from("contracheques").insert({
          perfil_id: selectedColaborador,
          empresa_id: perfil.empresa_id,
          mes_ano: mesAno,
          url_documento: filePath,
        });
      }
      toast.success("Contracheque enviado com sucesso!");
      setSelectedFile(null);
      setSelectedColaborador("");
      setMesAno("");
      onClose();
    } catch (error) {
      toast.error("Erro inesperado ao enviar contracheque.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedFile(null);
      setSelectedColaborador("");
      setMesAno("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Enviar Contracheque</h2>
          <button onClick={handleClose} disabled={isLoading} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Colaborador</label>
            <select value={selectedColaborador} onChange={(e) => setSelectedColaborador(e.target.value)} required disabled={isLoading} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
              <option value="">Selecione um colaborador</option>
              {colaboradores.map((c) => (<option key={c.id} value={c.id}>{c.nome_completo}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mês/Ano de Referência</label>
            <input type="month" value={mesAno} onChange={(e) => setMesAno(e.target.value)} required disabled={isLoading} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Arquivo PDF</label>
            <label className={`flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${selectedFile ? "border-emerald-400 bg-emerald-50" : "border-gray-300 hover:border-indigo-400"} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}>
              <div className="flex flex-col items-center justify-center">
                {selectedFile ? (
                  <><CheckCircle2 className="w-6 h-6 text-emerald-600 mb-2" /><span className="text-sm font-medium text-emerald-700">{selectedFile.name}</span><span className="text-xs text-emerald-600 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span></>
                ) : (
                  <><Upload className="w-6 h-6 text-gray-400 mb-2" /><span className="text-sm text-gray-600">Clique para selecionar o PDF</span><span className="text-xs text-gray-400 mt-1">Máximo 10MB</span></>
                )}
              </div>
              <input type="file" accept=".pdf,application/pdf" onChange={handleFileChange} disabled={isLoading} className="hidden" />
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleClose} disabled={isLoading} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={isLoading || !selectedFile || !selectedColaborador || !mesAno} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" />Enviando...</>) : (<><FileText className="w-4 h-4" />Enviar</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
