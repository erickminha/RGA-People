"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  XCircle,
  Plane,
  Clock,
  Loader2,
} from "lucide-react";
import {
  aprovarSolicitacaoFerias,
  rejeitarSolicitacaoFerias,
} from "@/app/actions/admin-ferias";

interface Solicitacao {
  id: string;
  data_inicio: string;
  data_fim: string;
  criado_em: string;
  perfil: {
    id: string;
    nome_completo: string;
    email: string;
  };
}

interface Props {
  solicitacoes: Solicitacao[];
  tenantSlug: string;
}

export default function AprovacoesFeriasPendentes({
  solicitacoes,
  tenantSlug,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [rejeitandoId, setRejeitandoId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  const handleAprovar = (id: string) => {
    setProcessandoId(id);
    startTransition(async () => {
      const r = await aprovarSolicitacaoFerias(tenantSlug, id);
      r.success ? toast.success(r.message) : toast.error(r.message);
      setProcessandoId(null);
    });
  };

  const handleConfirmarRejeicao = (id: string) => {
    if (motivo.trim().length < 5) {
      toast.error("Informe um motivo (mín. 5 caracteres).");
      return;
    }
    setProcessandoId(id);
    startTransition(async () => {
      const r = await rejeitarSolicitacaoFerias(tenantSlug, id, motivo);
      r.success ? toast.success(r.message) : toast.error(r.message);
      setProcessandoId(null);
      setRejeitandoId(null);
      setMotivo("");
    });
  };

  const calcularDias = (i: string, f: string) =>
    Math.ceil(
      (new Date(f).getTime() - new Date(i).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

  const formatar = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <header className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Plane className="w-5 h-5 text-amber-600" />
        <h3 className="font-semibold text-gray-900">
          Aprovações de Férias Pendentes
        </h3>
        <span className="ml-auto text-xs font-medium px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
          {solicitacoes.length}
        </span>
      </header>

      {solicitacoes.length === 0 ? (
        <div className="text-center py-10">
          <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">
            Nenhuma solicitação pendente 🎉
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Você está em dia com as aprovações.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {solicitacoes.map((s) => {
            const isProc = processandoId === s.id && isPending;
            const isRej = rejeitandoId === s.id;
            return (
              <li key={s.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {s.perfil.nome_completo}
                    </div>
                    <div className="text-xs text-gray-500">
                      {s.perfil.email}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {formatar(s.data_inicio)} → {formatar(s.data_fim)}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full font-medium">
                        {calcularDias(s.data_inicio, s.data_fim)} dias
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                      Solicitado em {formatar(s.criado_em)}
                    </div>
                  </div>

                  {!isRej ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAprovar(s.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 transition-colors"
                      >
                        {isProc ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Aprovar
                      </button>
                      <button
                        onClick={() => setRejeitandoId(s.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-700 bg-white text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeitar
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 md:items-end">
                      <input
                        type="text"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Motivo da rejeição..."
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-full md:w-72 focus:ring-2 focus:ring-red-500 outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConfirmarRejeicao(s.id)}
                          disabled={isPending}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300"
                        >
                          {isProc ? "Enviando..." : "Confirmar"}
                        </button>
                        <button
                          onClick={() => {
                            setRejeitandoId(null);
                            setMotivo("");
                          }}
                          className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
