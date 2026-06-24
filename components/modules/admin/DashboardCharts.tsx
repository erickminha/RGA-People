"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, PieChart as PieIcon } from "lucide-react";

interface Props {
  // Distribuição de status de férias no ano
  statusFerias: { name: string; value: number }[];
  // Médias das últimas dimensões de clima (se houver pesquisa)
  climaDimensoes: { dimensao: string; media: number }[];
}

const CORES_PIE = ["#10b981", "#f59e0b", "#ef4444", "#6366f1"];

function corPorNota(nota: number) {
  if (nota >= 4) return "#10b981";
  if (nota >= 3) return "#f59e0b";
  return "#ef4444";
}

export default function DashboardCharts({
  statusFerias,
  climaDimensoes,
}: Props) {
  const temFerias = statusFerias.some((s) => s.value > 0);
  const temClima = climaDimensoes.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Clima por dimensão */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          <TrendingUp className="w-4 h-4" />
          Clima por dimensão
        </h3>
        {temClima ? (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={climaDimensoes} margin={{ left: -10 }}>
                <XAxis dataKey="dimensao" fontSize={11} />
                <YAxis domain={[0, 5]} tickCount={6} fontSize={11} />
                <Tooltip
                  formatter={(v: number) => [`${v} / 5`, "Média"]}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar dataKey="media" radius={[6, 6, 0, 0]} barSize={34}>
                  {climaDimensoes.map((d, i) => (
                    <Cell key={i} fill={corPorNota(d.media)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-sm text-gray-400 text-center">
            Sem dados de clima ainda.
            <br />
            Abra uma pesquisa para visualizar aqui.
          </div>
        )}
      </div>

      {/* Status de férias */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          <PieIcon className="w-4 h-4" />
          Solicitações de férias (ano)
        </h3>
        {temFerias ? (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusFerias.filter((s) => s.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {statusFerias.map((_, i) => (
                    <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  iconType="circle"
                  formatter={(v) => (
                    <span className="text-xs text-gray-600">{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
            Nenhuma solicitação de férias registrada.
          </div>
        )}
      </div>
    </div>
  );
}
