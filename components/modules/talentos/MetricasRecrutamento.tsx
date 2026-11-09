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
import { TrendingUp, PieChart as PieIcon, Briefcase, Users, CheckCircle2 } from "lucide-react";

export interface MetricasRecrutamento {
  total_vagas: number;
  vagas_abertas: number;
  total_candidatos: number;
  total_candidaturas: number;
  contratados: number;
  tempo_medio_dias: number | null;
  por_vaga: { name: string; value: number }[];
  por_etapa: { name: string; value: number }[];
}

const CORES_PIE = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#14b8a6"];

const CORES_ETAPA: Record<string, string> = {
  nova: "#94a3b8",
  triado: "#64748b",
  entrevista_rh: "#f59e0b",
  entrevista_gestor: "#3b82f6",
  proposta: "#8b5cf6",
  contratado: "#10b981",
  recusado: "#ef4444",
};

export default function MetricasRecrutamento({ dados }: { dados: MetricasRecrutamento }) {
  const cards = [
    { label: "Vagas abertas", value: dados.vagas_abertas, icon: Briefcase, cor: "text-indigo-600 bg-indigo-50" },
    { label: "Candidatos", value: dados.total_candidatos, icon: Users, cor: "text-emerald-600 bg-emerald-50" },
    { label: "Candidaturas", value: dados.total_candidaturas, icon: Users, cor: "text-sky-600 bg-sky-50" },
    { label: "Contratados", value: dados.contratados, icon: CheckCircle2, cor: "text-green-600 bg-green-50" },
  ];

  const temVagas = dados.por_vaga.some((v) => v.value > 0);
  const temEtapas = dados.por_etapa.some((e) => e.value > 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${c.cor}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900">{c.value}</p>
            <p className="text-sm text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      {dados.tempo_medio_dias != null && (
        <p className="text-sm text-gray-500">
          ⏱ Tempo médio até a contratação: <span className="font-semibold text-gray-700">{dados.tempo_medio_dias} dias</span>
        </p>
      )}

      {/* Candidaturas por vaga */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          <TrendingUp className="w-4 h-4" />
          Candidaturas por vaga
        </h3>
        {temVagas ? (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados.por_vaga} margin={{ left: -10 }}>
                <XAxis dataKey="name" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="value" name="Candidaturas" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
            Sem candidaturas registradas.
          </div>
        )}
      </div>

      {/* Distribuição por etapa */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          <PieIcon className="w-4 h-4" />
          Distribuição por etapa
        </h3>
        {temEtapas ? (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dados.por_etapa.filter((e) => e.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {dados.por_etapa.map((e, i) => (
                    <Cell key={i} fill={CORES_ETAPA[e.name.toLowerCase()] ?? CORES_PIE[i % CORES_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  iconType="circle"
                  formatter={(v) => <span className="text-xs text-gray-600">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
            Sem candidaturas registradas.
          </div>
        )}
      </div>
    </div>
  );
}