"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { metasSchema, type MetasInput } from "@/lib/schemas/avaliacao.schema";

interface Props {
  defaultValues: Partial<MetasInput>;
  onNext: (data: MetasInput) => void;
  onBack: () => void;
}

const OPCOES_METAS = [
  { value: "todas", label: "Atingi todas", color: "emerald" },
  { value: "maioria", label: "A maioria", color: "sky" },
  { value: "parcialmente", label: "Parcialmente", color: "amber" },
  { value: "nao_atingi", label: "Não atingi", color: "red" },
] as const;

export default function StepMetas({ defaultValues, onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MetasInput>({
    resolver: zodResolver(metasSchema),
    defaultValues,
  });

  const metaSelecionada = watch("metas_atingidas");

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          2. Metas e Resultados
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Reflita sobre o que foi entregue no período.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Principais entregas do período
        </label>
        <textarea
          {...register("principais_entregas")}
          rows={5}
          placeholder="Liste projetos, resultados e marcos importantes..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none"
        />
        {errors.principais_entregas && (
          <p className="text-xs text-red-600 mt-1">
            {errors.principais_entregas.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Como avalia o atingimento das suas metas?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {OPCOES_METAS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                metaSelecionada === opt.value
                  ? "border-violet-500 bg-violet-50 text-violet-700 font-medium"
                  : "border-gray-200 hover:border-gray-300 text-gray-600"
              }`}
            >
              <input
                type="radio"
                value={opt.value}
                {...register("metas_atingidas")}
                className="sr-only"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
        {errors.metas_atingidas && (
          <p className="text-xs text-red-600 mt-1">
            {errors.metas_atingidas.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Desafios enfrentados
        </label>
        <textarea
          {...register("desafios_enfrentados")}
          rows={4}
          placeholder="Quais obstáculos você encontrou e como lidou com eles?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none"
        />
        {errors.desafios_enfrentados && (
          <p className="text-xs text-red-600 mt-1">
            {errors.desafios_enfrentados.message}
          </p>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Voltar
        </button>
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
