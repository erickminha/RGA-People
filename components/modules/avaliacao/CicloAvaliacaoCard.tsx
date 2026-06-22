import Link from "next/link";
import { Calendar, CheckCircle2, ArrowRight, Clock } from "lucide-react";

interface Ciclo {
  periodo: string;
  titulo: string;
  descricao: string;
  data_abertura: string;
  data_fechamento: string;
  ativo: boolean;
}

interface Props {
  ciclo: Ciclo;
  jaEnviado: boolean;
  tenantSlug: string;
  avaliacaoId: string | null;
}

export default function CicloAvaliacaoCard({
  ciclo,
  jaEnviado,
  tenantSlug,
}: Props) {
  const diasRestantes = Math.ceil(
    (new Date(ciclo.data_fechamento).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <article className="group bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-violet-300 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 bg-violet-50 rounded-lg">
          <Calendar className="w-5 h-5 text-violet-600" />
        </div>
        {jaEnviado ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Enviada
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {diasRestantes > 0 ? `${diasRestantes} dias` : "Encerrado"}
          </span>
        )}
      </div>

      <h3 className="font-semibold text-gray-900 text-lg mb-1">
        {ciclo.titulo}
      </h3>
      <p className="text-sm text-gray-600 mb-4">{ciclo.descricao}</p>

      <div className="text-xs text-gray-500 mb-4">
        <span className="font-medium">Período:</span>{" "}
        {new Date(ciclo.data_abertura).toLocaleDateString("pt-BR")} →{" "}
        {new Date(ciclo.data_fechamento).toLocaleDateString("pt-BR")}
      </div>

      <Link
        href={`/c/${tenantSlug}/portal/avaliacao/${encodeURIComponent(
          ciclo.periodo
        )}`}
        className={`inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          jaEnviado
            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
            : "bg-violet-600 text-white hover:bg-violet-700"
        }`}
      >
        {jaEnviado ? "Ver minha avaliação" : "Responder agora"}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </article>
  );
}
