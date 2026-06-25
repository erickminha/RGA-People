"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { salvarDocumento } from "@/app/actions/documentos";
import {
  TIPO_DOC_LABELS,
  type DocumentoCorpInput,
} from "@/lib/schemas/documento.schema";
import {
  Plus,
  Loader2,
  Edit2,
  Eye,
  ChevronDown,
  FileText,
} from "lucide-react";

interface Documento {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  versao: number;
  ativo: boolean;
  total_aceites: number;
}

interface Props {
  tenantSlug: string;
  documentos: Documento[];
}

export default function GerenciarDocumentos({ tenantSlug, documentos }: Props) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Form
  const [tipo, setTipo] = useState<keyof typeof TIPO_DOC_LABELS>(
    "manual_colaborador"
  );
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [exigirAceite, setExigirAceite] = useState(true);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const res = await salvarDocumento(tenantSlug, null, {
        tipo: tipo as any,
        titulo,
        descricao: descricao || null,
        conteudo_md: conteudo || null,
        arquivo_url: null,
        exigir_aceite: exigirAceite,
        ativo: true,
      });

      if (res.success) {
        toast.success(res.message);
        setCriando(false);
        setTitulo("");
        setDescricao("");
        setConteudo("");
        setTipo("manual_colaborador");
        setExigirAceite(true);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Erro ao salvar documento.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Botão criar */}
      <div className="flex justify-end">
        <button
          onClick={() => setCriando((v) => !v)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Novo documento
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              criando ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Form de criação */}
      {criando && (
        <form
          onSubmit={handleSalvar}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tipo de documento
              </label>
              <select
                value={tipo}
                onChange={(e) =>
                  setTipo(e.target.value as keyof typeof TIPO_DOC_LABELS)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(TIPO_DOC_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Título
              </label>
              <input
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Manual do Colaborador 2026"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descrição (opcional)
            </label>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Breve descrição do documento"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Conteúdo (Markdown)
            </label>
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Cole o conteúdo em Markdown aqui..."
              rows={8}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Suporta Markdown: **negrito**, *itálico*, # Título, - listas, etc.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={exigirAceite}
              onChange={(e) => setExigirAceite(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">
              Exigir aceite dos colaboradores
            </span>
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCriando(false)}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {salvando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Criar documento"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Lista de documentos */}
      {documentos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-500">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          Nenhum documento criado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {documentos.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{d.titulo}</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                      {TIPO_DOC_LABELS[d.tipo as keyof typeof TIPO_DOC_LABELS]}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      v{d.versao}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {d.descricao || "Sem descrição"}
                  </p>
                  <div className="text-xs text-gray-400 mt-2">
                    {d.total_aceites} aceites registrados
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/c/${tenantSlug}/portal/documentos/${d.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Visualizar
                  </a>
                  <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 px-3 py-1.5">
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
