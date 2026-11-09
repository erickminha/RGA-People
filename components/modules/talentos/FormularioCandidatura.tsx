"use client";

import { useState, useTransition } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { submitCandidatura } from "@/app/actions/talentos";
import { MAX_CURRICULO_BYTES, MIME_CURRICULO, EXTENSOES_CURRICULO } from "@/lib/schemas/candidato.schema";
import { Upload, CheckCircle2, Loader2, FileText } from "lucide-react";

export default function FormularioCandidatura({ vagaId }: { vagaId: string }) {
  const params = useParams();
  const tenantSlug = params?.tenant_slug as string;

  const [pendente, startTransition] = useTransition();
  const [ok, setOk] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);

  function validarArquivoLocal(file: File): string | null {
    if (file.size > MAX_CURRICULO_BYTES) return "Arquivo muito grande (máx. 8 MB).";
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    const mimeOk = MIME_CURRICULO[file.type] !== undefined;
    const extOk = (EXTENSOES_CURRICULO as readonly string[]).includes(ext);
    if (!mimeOk && !extOk) return "Formato inválido. Use PDF, DOC, DOCX ou JPEG.";
    return null;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pendente) return;
    if (!arquivo) {
      toast.error("Envie um arquivo de currículo.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("vaga_id", vagaId);

    startTransition(async () => {
      const res = await submitCandidatura(tenantSlug, formData);
      if (res.success) {
        setOk(true);
        toast.success(res.message ?? "Candidatura recebida!");
      } else {
        toast.error(res.message ?? "Erro ao enviar. Tente novamente.");
      }
    });
  }

  if (ok) {
    return (
      <div className="text-center py-10">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Currículo recebido!</h2>
        <p className="text-gray-500">
          Sua candidatura foi registrada. Nossa equipe irá analisar e entrará em
          contato caso haja interesse.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Nome completo *</label>
        <input
          name="nome"
          required
          minLength={3}
          maxLength={120}
          placeholder="Seu nome"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">E-mail</label>
          <input
            name="email"
            type="email"
            placeholder="voce@email.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Telefone</label>
          <input
            name="telefone"
            maxLength={25}
            placeholder="(11) 99999-9999"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Observações</label>
        <textarea
          name="observacoes"
          rows={3}
          maxLength={1000}
          placeholder="Experiência, disponibilidade..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Currículo (PDF, DOC, DOCX ou JPEG) *</label>
        <label className="flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-lg p-6 cursor-pointer transition-colors bg-gray-50">
          <input
            type="file"
            name="curriculo"
            accept=".pdf,.doc,.docx,.jpeg,.jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f) {
                const erro = validarArquivoLocal(f);
                if (erro) {
                  toast.error(erro);
                  e.target.value = "";
                  setArquivo(null);
                } else {
                  setArquivo(f);
                }
              }
            }}
          />
          {arquivo ? (
            <div className="flex items-center gap-2 text-indigo-600">
              <FileText className="w-6 h-6" />
              <span className="font-medium text-sm truncate max-w-[220px]">{arquivo.name}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-gray-500">
              <Upload className="w-7 h-7" />
              <span className="text-sm font-medium">Clique para selecionar o arquivo</span>
              <span className="text-xs text-gray-400">PDF, DOC, DOCX ou JPEG · até 8 MB</span>
            </div>
          )}
        </label>
      </div>

      <button
        type="submit"
        disabled={pendente}
        className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {pendente ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
          </>
        ) : (
          "Candidatar-se"
        )}
      </button>
    </form>
  );
}