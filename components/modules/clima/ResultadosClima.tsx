"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { MessageSquare, Users, Gauge } from "lucide-react";
import type { PerguntaClima } from "@/lib/schemas/clima.schema";

interface RespostaRow {
  respostas: Record<string, number | string>;
  departamento: string | null;
}

interface Props {
  perguntas: PerguntaClima[];
  respostas: RespostaRow[];
}

function corPorNota(nota: number) {
  if (nota >= 4) return "#10b981"; // emerald
  if (nota >= 3) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

export default function ResultadosClima({ perguntas, respostas }: Props) {
  const total = respostas.length;
  const escalas = perguntas.filter((p) => p.tipo === "escala");
  const abertas = perguntas.filter((p) => p.tipo === "texto");

  // Média por pergunta de escala
  const mediasPorPergunta = escalas.map((p) => {
    const valores = respostas
      .map((r) => Number(r.respostas?.[p.id]))
      .filter((v) => !Number.isNaN(v) && v > 0);
    const media = valores.length
      ? valores.reduce((a, b) => a + b, 0) / valores.length
      : 0;
    return {
      pergunta: p.texto.length > 32 ? p.texto.slice(0, 30) + "…" : p.texto,
      dimensao: p.dimensao ?? "",
      media: Number(media.toFixed(2)),
    };
  });

  // Índice geral de clima (média das médias, normalizado para 0-100)
  const mediaGeral = mediasPorPergunta.length
    ? mediasPorPergunta.reduce((a, b) => a + b.media, 0) /
      mediasPorPergunta.length
    : 0;
  const indiceClima = Math.round((mediaGeral / 5) * 100);

  // Comentários abertos
  const comentarios = abertas.flatMap((p) =>
    respostas
      .map((r) => r.respostas?.[p.id])
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
  );

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-500">
        Ainda não há respostas para esta pesquisa.
      </div>
    );
  }

  const dadosGauge = [{ name: "Clima", valor: indiceClima }];

  return (
    <div className="space-y-6">
      {/* KPIs topo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{total}</div>
            <div className="text-sm text-gray-500">Respostas recebidas</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl">
            <Gauge className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {mediaGeral.toFixed(2)}
              <span className="text-base text-gray-400">/5</span>
            </div>
            <div className="text-sm text-gray-500">Média geral</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-20 h-20 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={dadosGauge}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  tick={false}
                />
                <RadialBar
                  dataKey="valor"
                  cornerRadius={20}
                  fill={corPorNota(mediaGeral)}
                  background={{ fill: "#f1f5f9" }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {indiceClima}
              <span className="text-base text-gray-400">%</span>
            </div>
            <div className="text-sm text-gray-500">Índice de clima</div>
          </div>
        </div>
      </div>

      {/* Gráfico de médias por pergunta */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          Média por dimensão (escala 1 a 5)
        </h3>
        <div style={{ width: "100%", height: Math.max(220, escalas.length * 48) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mediasPorPergunta}
              layout="vertical"
              margin={{ left: 8, right: 24 }}
            >
              <XAxis type="number" domain={[0, 5]} tickCount={6} fontSize={12} />
              <YAxis
                type="category"
                dataKey="pergunta"
                width={180}
                fontSize={12}
              />
              <Tooltip
                formatter={(v: number) => [`${v} / 5`, "Média"]}
                cursor={{ fill: "#f8fafc" }}
              />
              <Bar dataKey="media" radius={[0, 6, 6, 0]} barSize={22}>
                {mediasPorPergunta.map((d, i) => (
                  <Cell key={i} fill={corPorNota(d.media)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comentários abertos */}
      {comentarios.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
            <MessageSquare className="w-4 h-4" />
            Comentários ({comentarios.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-auto pr-2">
            {comentarios.map((c, i) => (
              <blockquote
                key={i}
                className="border-l-4 border-indigo-200 bg-gray-50 rounded-r-lg px-4 py-3 text-sm text-gray-700"
              >
                “{c}”
              </blockquote>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
