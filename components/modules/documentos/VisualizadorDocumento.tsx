"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { registrarAceiteDocumento } from "@/app/actions/documentos";
import { Markdown } from "@/lib/markdown";
import {
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Download,
} from "lucide-react";

interface Props {
  tenantSlug: string;
  documento: {
    id: string;
    titulo: string;
    descricao: string | null;
    conteudo_md: string | null;
    arquivo_url: string | null;
    versao: number;
    exigir_aceite: boolean;
  };
  jaSolicitadoAceite: boolean;
}

export default function VisualizadorDocumento({
  tenantSlug,
  documento,
  jaSolicitadoAceite,
}: Props) {
  const router = useRouter();
  const [aceitar, setAceitar] = useState(false);
  const [aceitando, setAceitando] = useState(false);

  async function handleAceitar() {
    setAceitando(true);
    try {
      const res = await registrarAceiteDocumento(tenantSlug, {
        documento_id: documento.id,
        versao: documento.versao,
      });

      if (res.success) {
        toast.success(res.message);
        setAceitar(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Erro ao registrar aceite.");
    } finally {
      setAceitando(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg shrink-0">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {documento.titulo}
              </h1>
              {documento.descricao && (
                <p className="text-gray-600 mt-1">{documento.descricao}</p>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <span>Versão {documento.versao}</span>
                {jaSolicitadoAceite && (
                  <span className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Você já aceitou
                  </span>
                )}
              </div>
            </div>
          </div>

          {documento.arquivo_url && (
            <a
              href={documento.arquivo_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shrink-0"
            >
              <Download className="w-4 h-4" />
              Baixar PDF
            </a>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      {documento.conteudo_md && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 prose prose-sm max-w-none">
          <Markdown content={documento.conteudo_md} />
        </div>
      )}

      {documento.arquivo_url && !documento.conteudo_md && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">
            Este documento está disponível como arquivo PDF.
          </p>
          <a
            href={documento.arquivo_url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="w-4 h-4" />
            Abrir / Baixar
          </a>
        </div>
      )}

      {/* Fluxo de aceite */}
      {documento.exigir_aceite && !jaSolicitadoAceite && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">
                Confirme que você leu e concorda
              </h3>
              <p className="text-sm text-amber-800 mt-1">
                Para continuar, você precisa confirmar que leu e concorda com o
                conteúdo deste documento. Seu aceite será registrado com data e
                hora para fins de conformidade.
              </p>

              {!aceitar ? (
                <button
                  onClick={() => setAceitar(true)}
                  className="mt-4 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition"
                >
                  Li e concordo
                </button>
              ) : (
                <div className="mt-4 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-amber-600"
                    />
                    <span className="text-sm text-amber-900">
                      Confirmo que li e concordo com o conteúdo acima. Entendo
                      que meu aceite será registrado e poderá ser solicitado
                      como comprovante de conformidade.
                    </span>
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAceitar(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAceitar}
                      disabled={aceitando}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition"
                    >
                      {aceitando ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Confirmar aceite
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
