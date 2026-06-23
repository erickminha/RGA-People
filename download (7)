"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  competenciasSchema,
  type CompetenciasInput,
} from "@/lib/schemas/avaliacao.schema";

interface Props {
  defaultValues: Partial<CompetenciasInput>;
  onNext: (data: CompetenciasInput) => void;
}

const COMPETENCIAS = [
  { key: "comunicacao", label: "Comunicação" },
  { key: "trabalho_equipe", label: "Trabalho em Equipe" },
  { key: "proatividade", label: "Proatividade" },
  { key: "qualidade_entrega", label: "Qualidade das Entregas" },
  { key: "conhecimento_tecnico", label: "Conhecimento Técnico" },
] as const;

const ESCALA = [
  { valor: 1, label: "Muito abaixo" },
  { valor: 2, label: "Abaixo" },
  { valor: 3, label: "Atende" },
  { valor: 4, label: "Acima" },
  { valor: 5, label: "Muito acima" },
];

export default function StepCompetencias({ defaultValues, onNext }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CompetenciasInput>({
    resolver: zodResolver(competenciasSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          1. Competências Comportamentais
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Avalie cada competência em uma escala de 1 (muito abaixo) a 5 (muito
          acima do esperado).
        </p>

        <div className="space-y-5">
          {COMPETENCIAS.map((comp) => {
            const valor = watch(comp.key);
            return (
              <div key={comp.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {comp.label}
                </label>
                <div className="flex items-center gap-2">
                  {ESCALA.map((e) => (
                    <label
                      key={e.valor}
                      className={`flex-1 flex flex-col items-center gap-1 p-2 border-2 rounded-lg cursor-pointer transition-all ${
                        Number(valor) === e.valor
                          ? "border-violet-500 bg-violet-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        value={e.valor}
                        {...register(comp.key)}
                        className="sr-only"
                      />
                      <span
                        className={`text-lg font-bold ${
                          Number(valor) === e.valor
                            ? "text-violet-700"
                            : "text-gray-400"
                        }`}
                      >
                        {e.valor}
                      </span>
                      <span className="text-[10px] text-gray-500 text-center leading-tight">
                        {e.label}
                      </span>
                    </label>
                  ))}
                </div>
                {errors[comp.key] && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors[comp.key]?.message as string}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Comente sobre as suas competências
        </label>
        <textarea
          {...register("comentario_competencias")}
          rows={4}
          placeholder="Descreva exemplos concretos que justifiquem suas notas..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none"
        />
        {errors.comentario_competencias && (
          <p className="text-xs text-red-600 mt-1">
            {errors.comentario_competencias.message}
          </p>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          type="submit"
          className="px-5 py-2.5 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors"
        >
          Próximo →
        </button>
      </div>
    </form>
  );
}
