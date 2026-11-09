"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  avancarEtapa,
  excluirCandidatura,
  baixarCurriculo,
  triarCandidatura,
} from "@/app/actions/talentos";
import { ETAPAS_CANDIDATURA, ETAPA_LABELS } from "@/lib/schemas/candidato.schema";
import { Download, Trash2, Loader2, Eye, ExternalLink, Sparkles } from "lucide-react";

export interface CandidaturaPipe {
  id: string;
  etapa: string;
  observacoes_rh: string | null;
  match_score: number | null;
  candidato: {
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
    arquivo_nome: string | null;
  } | null;
}

interface Props {
  candidaturas: CandidaturaPipe[];
  tenantSlug: string;
  /** true = RH/Super (pode avançar etapa e excluir) */
  podeEditar: boolean;
}

export default function PipelineCandidatos({
  candidaturas,
  tenantSlug,
  podeEditar,
}: Props) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
    const [triando, setTriando] = useState<string | null>(null);
    const [pendente, startTransition] = useTransition();

  const filtradas = useMemo(() => {
    const q = busca.toLowerCase();
    return candidaturas.filter((c) => {
      if (!q) return true;
      const nome = c.candidato?.nome ?? "";
      const email = c.candidato?.email ?? "";
      return nome.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    });
  }, [candidaturas, busca]);

  const colunas = useMemo(
    () =>
      ETAPAS_CANDIDATURA.map((etapa) => ({
        etapa,
        label: ETAPA_LABELS[etapa],
        cards: filtradas.filter((c) => c.etapa === etapa),
      })),
    [filtradas]
  );

  async function baixar(candidatoId: string) {
    setDownloading(candidatoId);
    const res = await baixarCurriculo(tenantSlug, candidatoId);
    setDownloading(null);
    if (res.success && res.url) {
      const a = document.createElement("a");
      a.href = res.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      toast.error(res.message ?? "Falha ao baixar currículo.");
    }
  }

  function mover(candidaturaId: string, etapa: string) {
    startTransition(async () => {
      const res = await avancarEtapa(tenantSlug, { candidatura_id: candidaturaId, etapa });
      if (res.success) toast.success("Etapa atualizada.");
      else toast.error(res.message ?? "Falha ao atualizar.");
    });
  }

  function excluir(candidaturaId: string, nome: string) {
    if (!window.confirm(`Remover a candidatura de "${nome}" desta vaga?`)) return;
    startTransition(async () => {
      const res = await excluirCandidatura(tenantSlug, candidaturaId);
      if (res.success) toast.success("Candidatura removida.");
      else toast.error(res.message ?? "Falha ao remover.");
    });
  }

    function triar(candidaturaId: string) {
      if (!window.confirm("Executar triagem por IA deste currículo?")) return;
      setTriando(candidaturaId);
      startTransition(async () => {
        const res = await triarCandidatura(tenantSlug, candidaturaId);
        setTriando(null);
        if (res.success) toast.success(res.message ?? "Triagem concluída.");
        else toast.error(res.message ?? "Falha na triagem.");
      });
    }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Filtrar candidatos..."
          className="w-full sm:max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
        />
        <span className="text-sm text-gray-500">
          {filtradas.length} candidatura{filtradas.length === 1 ? "" : "s"}
        </span>
      </div>

      {filtradas.length === 0 ? (
        <div className="text-center pt-16 pb-10 bg-white border border-gray-200 rounded-xl">
          <Eye className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma candidatura nesta vaga.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {colunas.map((col) => (
            <div key={col.etapa} className="bg-gray-100 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  {col.label}
                </h3>
                <span className="text-xs bg-white rounded-full px-2 py-0.5 font-semibold text-gray-600">
                  {col.cards.length}
                </span>
              </div>

              <div className="space-y-2">
                {col.cards.map((c) => (
                  <div key={c.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <p className="font-semibold text-gray-900 text-sm truncate">
                                          {c.candidato?.nome ?? "Sem nome"}
                                        </p>
                                        {typeof c.match_score === "number" && (
                                          <span
                                            className={`shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 ${
                                              c.match_score >= 70
                                                ? "bg-emerald-100 text-emerald-700"
                                                : c.match_score >= 40
                                                  ? "bg-amber-100 text-amber-700"
                                                  : "bg-red-100 text-red-700"
                                            }`}
                                            title="Match por IA"
                                          >
                                            {c.match_score}%
                                          </span>
                                        )}
                                      </div>
                                      {(c.candidato?.email || c.candidato?.telefone) && (
                                        <div className="text-xs text-gray-500 space-y-0.5">
                                          {c.candidato?.email && <p className="truncate">{c.candidato.email}</p>}
                                          {c.candidato?.telefone && <p>{c.candidato.telefone}</p>}
                                        </div>
                                      )}
                                      {c.observacoes_rh && (
                                        <p className="text-xs text-gray-400 italic line-clamp-2">{c.observacoes_rh}</p>
                                      )}

                    <div className="flex items-center gap-1 pt-1">
                      <button
                                            onClick={() => router.push(`/c/${tenantSlug}/portal/talentos/${c.id}`)}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                            title="Abrir detalhes / entrevistas / feedback"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" /> Abrir
                                          </button>
                                          <button
                                            onClick={() => c.candidato && baixar(c.candidato.id)}
                                            disabled={downloading === c.candidato?.id}
                                            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 transition-colors disabled:opacity-50"
                                            title="Baixar currículo"
                                          >
                                            {downloading === c.candidato?.id ? (
                                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                              <Download className="w-3.5 h-3.5" />
                                            )}
                                            Currículo
                                          </button>

                      {podeEditar && (
                        <select
                          value={c.etapa}
                          onChange={(e) => mover(c.id, e.target.value)}
                          disabled={pendente}
                          className="flex-1 ml-1 px-1.5 py-1 rounded-md text-xs border border-gray-200 bg-white text-gray-700 outline-none"
                        >
                          {ETAPAS_CANDIDATURA.map((e) => (
                            <option key={e} value={e}>
                              {ETAPA_LABELS[e]}
                            </option>
                          ))}
                        </select>
                      )}

                      {podeEditar && (
                        <button
                                                onClick={() => triar(c.id)}
                                                disabled={triando === c.id}
                                                className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[11px] bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50"
                                                title="Triagem por IA (OpenRouter)"
                        >
                                                {triando === c.id ? (
                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                  <Sparkles className="w-3 h-3" />
                                                )}
                                                Triar IA
                                              </button>
                                            )}

                                            {podeEditar && (
                                              <button
                                                onClick={() => excluir(c.id, c.candidato?.nome ?? "candidato")}
                                                disabled={pendente}
                                                className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                title="Excluir candidatura"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                    </div>
                  </div>
                ))}

                {col.cards.length === 0 && (
                  <div className="text-center text-xs text-gray-400 py-4 border border-dashed border-gray-200 rounded-lg">
                    Vazio
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}