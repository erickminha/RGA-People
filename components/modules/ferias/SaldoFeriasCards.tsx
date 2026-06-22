import { Calendar, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface SaldoFeriasCardsProps {
  saldo: {
    disponiveis: number;
    vencidos: number;
    usados: number;
    pendentes?: number;
    periodoAquisitivo: string;
  };
}

export default function SaldoFeriasCards({ saldo }: SaldoFeriasCardsProps) {
  const cards = [
    {
      label: "Dias Disponíveis",
      valor: saldo.disponiveis,
      Icon: Calendar,
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      hint: "Saldo livre para uso",
    },
    {
      label: "Dias Vencidos",
      valor: saldo.vencidos,
      Icon: AlertTriangle,
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      hint: saldo.vencidos > 0 ? "⚠️ Use o quanto antes" : "Tudo em dia",
    },
    {
      label: "Já Usufruídos",
      valor: saldo.usados,
      Icon: CheckCircle2,
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      hint: "Aprovados e consumidos",
    },
    {
      label: "Pendentes",
      valor: saldo.pendentes ?? 0,
      Icon: Clock,
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      hint: "Aguardando aprovação",
    },
  ];

  return (
    <section>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`p-5 rounded-xl border ${c.border} ${c.bg} transition-all hover:shadow-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <c.Icon className={`w-5 h-5 ${c.text}`} />
            </div>
            <div className={`text-3xl font-bold ${c.text}`}>{c.valor}</div>
            <div className="text-sm font-medium text-gray-700 mt-1">
              {c.label}
            </div>
            <div className="text-xs text-gray-500 mt-1">{c.hint}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Período aquisitivo atual:{" "}
        <span className="font-medium text-gray-700">
          {saldo.periodoAquisitivo}
        </span>
      </p>
    </section>
  );
}
