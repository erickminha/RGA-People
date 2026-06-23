import { type LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  valor: number | string;
  Icon: LucideIcon;
  cor: "indigo" | "amber" | "emerald" | "violet" | "rose";
  hint?: string;
  destaque?: boolean;
}

const COR_MAP = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  violet: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

export default function KpiCard({
  label,
  valor,
  Icon,
  cor,
  hint,
  destaque,
}: KpiCardProps) {
  const c = COR_MAP[cor];
  return (
    <div
      className={`p-5 rounded-xl border ${c.border} ${c.bg} transition-all ${
        destaque ? "ring-2 ring-offset-2 ring-amber-400 animate-pulse-slow" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-5 h-5 ${c.text}`} />
        {destaque && (
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
            AÇÃO
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold ${c.text}`}>{valor}</div>
      <div className="text-sm font-medium text-gray-700 mt-1">{label}</div>
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
    </div>
  );
}
