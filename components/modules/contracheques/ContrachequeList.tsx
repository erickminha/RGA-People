"use client";

import { useState, useTransition } from "react";
import { Download, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { gerarDownloadContracheque } from "@/app/actions/contracheques";

interface Contracheque {
  id: string;
  mes_ano: string; // formato esperado: "2026-06"
  url_documento: string;
  criado_em: string;
}

interface ContrachequeListProps {
  contracheques: Contracheque[];
  tenantSlug: string;
}

const MESES_PT: Record<string, string> = {
  "01": "Janeiro",
  "02": "Fevereiro",
  "03": "Março",
  "04": "Abril",
  "05": "Maio",
  "06": "Junho",
  "07": "Julho",
  "08": "Agosto",
  "09": "Setembro",
  "10": "Outubro",
  "11": "Novembro",
  "12": "Dezembro",
};

function formatarMesAno(mesAno: string): string {
  const [ano, mes] = mesAno.split("-");
  return `${MESES_PT[mes] ?? mes}/${ano}`;
}

export default function ContrachequeList({
  contracheques,
  tenantSlug,
}: ContrachequeListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDownload = (contrachequeId: string, mesAno: string) => {
    setDownloadingId(contrachequeId);

    startTransition(async () => {
      const result = await gerarDownloadContracheque({
        contrachequeId,
        tenantSlug,
      });

      if (result.success && result.url) {
        // Abre o PDF em nova aba (browser decide se baixa ou exibe)
        window.open(result.url, "_blank", "noopener,noreferrer");
        toast.success(`Contracheque de ${formatarMesAno(mesAno)} liberado!`, {
          icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
        });
      } else {
        toast.error(result.message ?? "Erro ao baixar contracheque.");
      }

      setDownloadingId(null);
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-600 uppercase text-xs tracking-wider">
                Competência
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-600 uppercase text-xs tracking-wider">
                Disponibilizado em
              </th>
              <th className="text-right px-6 py-3 font-medium text-gray-600 uppercase text-xs tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contracheques.map((cc) => {
              const isLoading = downloadingId === cc.id && isPending;
              return (
                <tr
                  key={cc.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {formatarMesAno(cc.mes_ano)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Holerite mensal
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(cc.criado_em).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDownload(cc.id, cc.mes_ano)}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Baixar PDF
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
        Cada download é auditado conforme a LGPD. Total:{" "}
        <span className="font-medium text-gray-700">
          {contracheques.length} contracheque(s)
        </span>
      </div>
    </div>
  );
}
