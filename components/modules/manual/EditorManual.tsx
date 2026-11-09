"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { salvarManual } from "@/app/actions/admin-manual";
import { Markdown } from "@/lib/markdown";
import { Loader2, Save, Eye, Pencil } from "lucide-react";

export default function EditorManual({
  tenantSlug,
  tituloInicial,
  conteudoInicial,
}: {
  tenantSlug: string;
  tituloInicial: string;
  conteudoInicial: string;
}) {
  const [titulo, setTitulo] = useState(tituloInicial);
  const [conteudo, setConteudo] = useState(conteudoInicial);
  const [aba, setAba] = useState<"editar" | "preview">("editar");
  const [pendente, startTransition] = useTransition();

  function salvar() {
    if (!conteudo.trim()) {
      toast.error("O conteúdo não pode ser vazio.");
      return;
    }
    startTransition(async () => {
      const res = await salvarManual(tenantSlug, {
        titulo: titulo.trim() || "Manual do Colaborador",
        conteudo,
      });
      if (res.success) toast.success(res.message ?? "Manual salvo!");
      else toast.error(res.message ?? "Falha ao salvar.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Título</label>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => setAba("editar")}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              aba === "editar" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Pencil className="w-4 h-4" /> Editar
          </button>
          <button
            type="button"
            onClick={() => setAba("preview")}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              aba === "preview" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Eye className="w-4 h-4" /> Visualizar
          </button>
        </div>

        {aba === "editar" ? (
          <textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={20}
            placeholder="# Título&#10;&#10;Escreva aqui o conteúdo do manual em **Markdown**..."
            className="w-full px-3 py-3 border border-gray-300 rounded-lg font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        ) : (
          <div className="border border-gray-200 rounded-lg p-6 bg-white min-h-[320px]">
            {conteudo.trim() ? (
              <Markdown content={conteudo} />
            ) : (
              <p className="text-gray-400 text-sm">Nada para visualizar ainda.</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Suporta Markdown (títulos, listas, negrito, tabelas).</p>
        <button
          onClick={salvar}
          disabled={pendente}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50"
        >
          {pendente ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar e publicar
        </button>
      </div>
    </div>
  );
}