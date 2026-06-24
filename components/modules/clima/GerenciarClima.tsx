"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  criarPesquisaClima,
  alterarStatusPesquisa,
} from "@/app/actions/clima";
import {
  PERGUNTAS_CLIMA_PADRAO,
  type PerguntaClima,
} from "@/lib/schemas/clima.schema";
import {
  Plus,
  Play,
  Square,
  Trash2,
  Loader2,
  ClipboardList,
  ChevronDown,
} from "lucide-react";

interface PesquisaRow {
  id: string;
  titulo: string;
  descricao: string | null;
  status: "rascunho" | "aberta" | "encerrada";
  perguntas: PerguntaClima[];
  total_respostas: number;
}

interface Props {
  tenantSlug: string;
  pesquisas: PesquisaRow[];
  pesquisaSelecionadaId: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  rascunho: "bg-gray-100 text-gray-600",
  aberta: "bg-emerald-100 text-emerald-700",
  encerrada: "bg-slate-200 text-slate-600",
};

export default function GerenciarClima({
  tenantSlug,
  pesquisas,
  pesquisaSelecionadaId,
}: Props) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [acaoId, setAcaoId] = useState<string | null>(null);

  // Form de nova pesquisa
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [perguntas, setPerguntas] = useState<PerguntaClima[]>(
    PERGUNTAS_CLIMA_PADRAO
  );

  function addPergunta() {
    setPerguntas((p) => [
      ...p,
      {
        id: `q_${Date.now()}`,
        tipo: "escala",
        texto: "",
        dimensao: "",
      },
    ]);
  }

  function updatePergunta(idx: number, patch: Partial<PerguntaClima>) {
    setPerguntas((arr) =>
      arr.map((p, i) => (i === idx ? { ...p, ...patch } : p))
    );
  }

  function removePergunta(idx: number) {
    setPerguntas((arr) => arr.filter((_, i) => i !== idx));
  }

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const res = await criarPesquisaClima(tenantSlug, {
        titulo,
        descricao: descricao || null,
        data_abertura: null,
        data_fechamento: null,
        perguntas: perguntas.filter((p) => p.texto.trim().length >= 5),
      });
      if (res.success) {
        toast.success(res.message);
        setCriando(false);
        setTitulo("");
        setDescricao("");
        setPerguntas(PERGUNTAS_CLIMA_PADRAO);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Erro ao criar pesquisa.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleStatus(
    id: string,
    novo: "aberta" | "encerrada"
  ) {
    setAcaoId(id);
    try {
      const res = await alterarStatusPesquisa(tenantSlug, id, novo);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } finally {
      setAcaoId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Botão criar */}
      <div className="flex justify-end">
        <button
          onClick={() => setCriando((v) => !v)}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nova pesquisa
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
          onSubmit={handleCriar}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Título da pesquisa
            </label>
            <input
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Pesquisa de Clima — 1º Semestre"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descrição (opcional)
            </label>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Mensagem de abertura para o time"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Perguntas
              </label>
              <button
                type="button"
                onClick={addPergunta}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>

            <div className="space-y-2">
              {perguntas.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex gap-2 items-start bg-gray-50 rounded-lg p-3"
                >
                  <span className="text-xs text-gray-400 mt-2.5 w-5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 space-y-2">
                    <input
                      value={p.texto}
                      onChange={(e) =>
                        updatePergunta(idx, { texto: e.target.value })
                      }
                      placeholder="Texto da pergunta"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex gap-2">
                      <select
                        value={p.tipo}
                        onChange={(e) =>
                          updatePergunta(idx, {
                            tipo: e.target.value as "escala" | "texto",
                          })
                        }
                        className="px-2 py-1.5 border border-gray-300 rounded-md text-xs"
                      >
                        <option value="escala">Escala (1-5)</option>
                        <option value="texto">Texto aberto</option>
                      </select>
                      <input
                        value={p.dimensao ?? ""}
                        onChange={(e) =>
                          updatePergunta(idx, { dimensao: e.target.value })
                        }
                        placeholder="Dimensão (ex.: Liderança)"
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePergunta(idx)}
                    className="text-gray-400 hover:text-red-500 mt-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition"
          >
            {salvando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Criar pesquisa (rascunho)"
            )}
          </button>
        </form>
      )}

      {/* Lista de pesquisas */}
      {pesquisas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-500">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          Nenhuma pesquisa criada ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {pesquisas.map((p) => {
            const ativa = p.id === pesquisaSelecionadaId;
            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition ${
                  ativa ? "border-indigo-300 ring-1 ring-indigo-200" : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {p.titulo}
                      </h3>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${STATUS_BADGE[p.status]}`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {p.perguntas?.length ?? 0} perguntas ·{" "}
                      {p.total_respostas} respostas
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`?pesquisa=${p.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5"
                    >
                      Ver resultados
                    </a>
                    {p.status !== "aberta" && (
                      <button
                        onClick={() => handleStatus(p.id, "aberta")}
                        disabled={acaoId === p.id}
                        className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {acaoId === p.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        Abrir
                      </button>
                    )}
                    {p.status === "aberta" && (
                      <button
                        onClick={() => handleStatus(p.id, "encerrada")}
                        disabled={acaoId === p.id}
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {acaoId === p.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                        Encerrar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
