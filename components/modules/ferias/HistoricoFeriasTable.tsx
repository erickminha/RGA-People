"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { X, Clock, CheckCircle2, XCircle, History } from "lucide-react";
import { cancelarSolicitacaoFerias } from "@/app/actions/ferias";

interface Solicitacao {
  id: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  criado_em: string;
}

interface Props {
  historico: Solicitacao[];
  tenantSlug: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; Icon: typeof Clock }
> = {
  pendente: {
    label: "Pendente",
    bg: "bg-amber-50",
    text: "text-amber-700",
    Icon: Clock,
  },
  aprovada: {
    label: "Aprovada",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    Icon: CheckCircle2,
  },
  rejeitada: {
    label: "Rejeitada",
    bg: "bg-red-50",
    text: "text-red-700",
    Icon: XCircle,
  },
  cancelada: {
    label: "Cancelada",
    bg: "bg-gray-100",
    text: "text-gray-600",
    Icon: X,
  },
};

function formatarData(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function calcularDias(inicio: string, fim: string) {
  return (
    Math.ceil(
      (new Date(fim).getTime() - new Date(inicio).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );
}

export default function HistoricoFeriasTable({ historico, tenantSlug }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleCancelar = (id: string) => {
    if (!confirm("Deseja realmente cancelar esta solicitação?")) return;

    startTransition(async () => {
      const r = await cancelarSolicitacaoFerias(tenantSlug, id);
      r.success ? toast.success(r.message) : toast.error(r.message);
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <History className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Histórico</h3>
        <span className="text-xs text-gray-500 ml-auto">
          {historico.length} registro(s)
        </span>
      </div>

      {historico.length === 0 ? (
        <div className="text-center py-12 px-4">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Você ainda não solicitou férias.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">
                  Período
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">
                  Dias
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-5 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historico.map((s) => {
                const cfg =
                  STATUS_CONFIG[s.status] ?? STATUS_CONFIG.pendente;
                return (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">
                        {formatarData(s.data_inicio)} →{" "}
                        {formatarData(s.data_fim)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Solicitado em {formatarData(s.criado_em)}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-700 font-medium">
                      {calcularDias(s.data_inicio, s.data_fim)} dias
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
                      >
                        <cfg.Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {s.status === "pendente" && (
                        <button
                          onClick={() => handleCancelar(s.id)}
                          disabled={isPending}
                          className="text-xs text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
