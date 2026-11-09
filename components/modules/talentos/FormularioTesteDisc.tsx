"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { responderTesteDisc } from "@/app/actions/disc";
import { PERGUNTAS_DISC } from "@/lib/disc/perguntas";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";

interface Props {
  tenantSlug: string;
  token: string;
  status: string;
  empresaNome: string;
}

interface DadosPessoais {
  nome_completo: string;
  idade: string;
  nascimento: string;
  nome_mae: string;
  cpf: string;
  vaga: string;
  estado_civil: string;
  filhos: string;
  idade_filhos: string;
}

const vazio: DadosPessoais = {
  nome_completo: "",
  idade: "",
  nascimento: "",
  nome_mae: "",
  cpf: "",
  vaga: "",
  estado_civil: "",
  filhos: "",
  idade_filhos: "",
};

export default function FormularioTesteDisc({ tenantSlug, token, status, empresaNome }: Props) {
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [dados, setDados] = useState<DadosPessoais>(vazio);
  // respostas[perguntaId][opcao] = valor 1-4
  const [respostas, setRespostas] = useState<Record<string, Record<string, string>>>({});
  const [pendente, startTransition] = useTransition();
  const [ok, setOk] = useState(false);

  function atualizarDados(k: keyof DadosPessoais, v: string) {
    setDados((d) => ({ ...d, [k]: v }));
  }

  if (status !== "enviado") {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900">Teste já respondido</h1>
        <p className="text-gray-500 mt-2">Este teste já foi concluído. Obrigado pela participação!</p>
      </div>
    );
  }

  if (ok) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
        <Sparkles className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900">Teste concluído!</h1>
        <p className="text-gray-500 mt-2">Suas respostas foram registradas. Obrigado!</p>
      </div>
    );
  }

  function proximaEtapa(e: React.FormEvent) {
    e.preventDefault();
    if (!dados.nome_completo?.trim()) {
      toast.error("Informe o nome completo.");
      return;
    }
    setEtapa(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    // valida cada pergunta: todas as 4 opções com 4,3,2,1 sem repetir
    for (const pergunta of PERGUNTAS_DISC) {
      const resp = respostas[String(pergunta.id)] ?? {};
      const valores = pergunta.opcoes.map((o) => Number(resp[o.rotulo]));
      const preenchidos = valores.filter((v) => Number.isFinite(v) && v >= 1 && v <= 4);
      if (preenchidos.length !== 4) {
        toast.error(`Pergunta ${pergunta.id}: distribua os valores 4, 3, 2 e 1 entre as opções.`);
        return;
      }
      if (new Set(preenchidos).size !== 4) {
        toast.error(`Pergunta ${pergunta.id}: os valores 4, 3, 2 e 1 não podem se repetir.`);
        return;
      }
    }

    startTransition(async () => {
          // Converte valores string -> number
          const respostasNumericas = Object.fromEntries(
            Object.entries(respostas).map(([perguntaId, ops]) => [
              perguntaId,
              Object.fromEntries(
                Object.entries(ops).map(([opcao, valor]) => [opcao, Number(valor)])
              ),
            ])
          );
          const res = await responderTesteDisc(tenantSlug, {
            token,
            dados_pessoais: {
              nome_completo: dados.nome_completo,
              idade: dados.idade ? Number(dados.idade) : null,
              nascimento: dados.nascimento,
              nome_mae: dados.nome_mae,
              cpf: dados.cpf,
              vaga: dados.vaga,
              estado_civil: dados.estado_civil,
              filhos: dados.filhos,
              idade_filhos: dados.idade_filhos,
            },
            respostas: respostasNumericas,
          });
          if (res.success) {
            setOk(true);
          } else {
            toast.error(res.message ?? "Erro ao enviar.");
          }
        });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Teste DISC — {empresaNome}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Seção {etapa} de 2
        </p>
      </div>

      {etapa === 1 ? (
        /* =================== SEÇÃO 1: Dados pessoais =================== */
        <form onSubmit={proximaEtapa} className="p-6 space-y-4">
          <Campo label="Nome completo *" required>
            <input value={dados.nome_completo} onChange={(e) => atualizarDados("nome_completo", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Seu nome completo" />
          </Campo>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Idade">
              <input type="number" min={16} max={99} value={dados.idade} onChange={(e) => atualizarDados("idade", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </Campo>
            <Campo label="Data de nascimento">
              <input value={dados.nascimento} onChange={(e) => atualizarDados("nascimento", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Mês, dia, ano" />
            </Campo>
            <Campo label="Nome da mãe">
              <input value={dados.nome_mae} onChange={(e) => atualizarDados("nome_mae", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </Campo>
            <Campo label="CPF">
              <input value={dados.cpf} onChange={(e) => atualizarDados("cpf", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </Campo>
            <Campo label="Vaga">
              <input value={dados.vaga} onChange={(e) => atualizarDados("vaga", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </Campo>
            <Campo label="Estado civil">
              <select value={dados.estado_civil} onChange={(e) => atualizarDados("estado_civil", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="">Selecione</option>
                {["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Viúvo(a)"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Quantos filhos?">
              <select value={dados.filhos} onChange={(e) => atualizarDados("filhos", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="">Selecione</option>
                {["Nenhum", "1", "2", "3 ou mais"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Idade dos filhos (ex: 3, 7...)">
              <input value={dados.idade_filhos} onChange={(e) => atualizarDados("idade_filhos", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </Campo>
          </div>

          <button type="submit" className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors">
            Continuar para o teste DISC →
          </button>
        </form>
      ) : (
        /* =================== SEÇÃO 2: Teste DISC =================== */
        <form onSubmit={enviar} className="p-6 space-y-6">
          <p className="text-sm text-gray-600">
            Preencha as seções a seguir com números de <strong>4 (mais representativo)</strong> a{" "}
            <strong>1 (menos representativo)</strong>. Não repita os valores. Escolha o que você{" "}
            <strong>REALMENTE é</strong>, não o que gostaria de ser.
          </p>

          {PERGUNTAS_DISC.map((p) => (
            <BlocoPergunta
              key={p.id}
              perguntaId={p.id}
              opcoes={p.opcoes}
              valores={respostas[String(p.id)] ?? {}}
              onChange={(opcao, valor) => {
                setRespostas((prev) => ({
                  ...prev,
                  [String(p.id)]: { ...(prev[String(p.id)] ?? {}), [opcao]: valor },
                }));
              }}
            />
          ))}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEtapa(1)}
              className="px-4 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors"
            >
              ← Voltar
            </button>
            <button
              type="submit"
              disabled={pendente}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {pendente ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Enviar respostas
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Campo({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function BlocoPergunta({
  perguntaId,
  opcoes,
  valores,
  onChange,
}: {
  perguntaId: number;
  opcoes: { dimensao: string; rotulo: string }[];
  valores: Record<string, string>;
  onChange: (opcao: string, valor: string) => void;
}) {
  const usados = new Set(Object.values(valores).filter(Boolean));
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-gray-800 mb-3">Pergunta {perguntaId}</p>
      <div className="grid grid-cols-[1fr_repeat(4,3.2rem)] gap-2 items-center">
        <span aria-hidden="true" />
        {[4, 3, 2, 1].map((valor) => (
          <span key={valor} className="text-center text-xs font-semibold text-gray-500">
            {valor}
          </span>
        ))}
        {opcoes.map((op) => (
          <span key={op.rotulo} className="contents">
            <span className="text-sm text-gray-700">{op.rotulo}</span>
            {[4, 3, 2, 1].map((n) => (
              <label key={n} className="flex items-center justify-center">
                <input
                  type="radio"
                  name={`p${perguntaId}-opcao-${op.rotulo}`}
                  value={String(n)}
                  checked={valores[op.rotulo] === String(n)}
                  disabled={usados.has(String(n)) && valores[op.rotulo] !== String(n)}
                  onChange={() => onChange(op.rotulo, String(n))}
                  className="w-4 h-4 accent-indigo-600"
                />
              </label>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}