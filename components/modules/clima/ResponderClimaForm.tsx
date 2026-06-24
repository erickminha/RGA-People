"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { responderPesquisaClima } from "@/app/actions/clima";
import type { PerguntaClima } from "@/lib/schemas/clima.schema";
import { Loader2, ShieldCheck, Send } from "lucide-react";

interface Props {
  tenantSlug: string;
  pesquisaId: string;
  titulo: string;
  descricao: string | null;
  perguntas: PerguntaClima[];
}

const ESCALA = [
  { valor: 1, label: "Muito ruim" },
  { valor: 2, label: "Ruim" },
  { valor: 3, label: "Neutro" },
  { valor: 4, label: "Bom" },
  { valor: 5, label: "Excelente" },
];

export default function ResponderClimaForm({
  tenantSlug,
  pesquisaId,
  titulo,
  descricao,
  perguntas,
}: Props) {
  const router = useRouter();
  const [respostas, setRespostas] = useState<Record<string, number | string>>(
    {}
  );
  const [departamento, setDepartamento] = useState("");
  const [enviando, setEnviando] = useState(false);

  function setResposta(id: string, valor: number | string) {
    setRespostas((r) => ({ ...r, [id]: valor }));
  }

  const escalas = perguntas.filter((p) => p.tipo === "escala");
  const respondidasEscala = escalas.filter(
    (p) => respostas[p.id] !== undefined
  ).length;
  const progresso = escalas.length
    ? Math.round((respondidasEscala / escalas.length) * 100)
    : 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const faltando = escalas.find((p) => respostas[p.id] === undefined);
    if (faltando) {
      toast.error("Responda todas as perguntas de escala antes de enviar.");
      return;
    }

    setEnviando(true);
    try {
      const res = await responderPesquisaClima(tenantSlug, {
        pesquisa_id: pesquisaId,
        departamento: departamento || null,
        respostas,
      });

      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
        {descricao && <p className="text-gray-600 mt-2">{descricao}</p>}
        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          Suas respostas são <strong>anônimas</strong>. O RH vê apenas
          resultados agregados.
        </div>

        {/* Barra de progresso */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progresso</span>
            <span>{progresso}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      </div>

      {/* Departamento (opcional) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Sua área / departamento{" "}
          <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <input
          type="text"
          value={departamento}
          onChange={(e) => setDepartamento(e.target.value)}
          placeholder="Ex.: Contábil, Comercial, Administrativo..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-400 mt-1.5">
          Usado apenas para análise por área. Não identifica você.
        </p>
      </div>

      {/* Perguntas */}
      {perguntas.map((p, idx) => (
        <div
          key={p.id}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <div className="flex items-start gap-3 mb-4">
            <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold">
              {idx + 1}
            </span>
            <div>
              <p className="font-medium text-gray-900">{p.texto}</p>
              {p.dimensao && (
                <span className="text-xs text-gray-400">{p.dimensao}</span>
              )}
            </div>
          </div>

          {p.tipo === "escala" ? (
            <div className="grid grid-cols-5 gap-2">
              {ESCALA.map((opt) => {
                const ativo = respostas[p.id] === opt.valor;
                return (
                  <button
                    key={opt.valor}
                    type="button"
                    onClick={() => setResposta(p.id, opt.valor)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-center transition-all ${
                      ativo
                        ? "border-indigo-600 bg-indigo-600 text-white shadow"
                        : "border-gray-200 hover:border-indigo-300 text-gray-600"
                    }`}
                  >
                    <span className="text-lg font-bold">{opt.valor}</span>
                    <span className="text-[10px] leading-tight">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <textarea
              rows={3}
              value={(respostas[p.id] as string) ?? ""}
              onChange={(e) => setResposta(p.id, e.target.value)}
              placeholder="Escreva aqui (opcional)..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={enviando}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition shadow-sm"
      >
        {enviando ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Send className="w-4 h-4" />
            Enviar respostas anônimas
          </>
        )}
      </button>
    </form>
  );
}
