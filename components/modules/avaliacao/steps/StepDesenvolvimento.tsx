"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  desenvolvimentoSchema,
  type DesenvolvimentoInput,
} from "@/lib/schemas/avaliacao.schema";

interface Props {
  defaultValues: Partial<DesenvolvimentoInput>;
  onNext: (data: DesenvolvimentoInput) => void;
  onBack: () => void;
}

export default function StepDesenvolvimento({
  defaultValues,
  onNext,
  onBack,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DesenvolvimentoInput>({
    resolver: zodResolver(desenvolvimentoSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          3. Desenvolvimento e Carreira
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Pense no seu crescimento profissional.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pontos fortes
        </label>
        <textarea
          {...register("pontos_fortes")}
          rows={3}
          placeholder="O que você faz de melhor?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none"
        />
        {errors.pontos_fortes && (
          <p className="text-xs text-red-600 mt-1">
            {errors.pontos_fortes.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pontos de melhoria
        </label>
        <textarea
          {...register("pontos_melhoria")}
          rows={3}
          placeholder="Em que aspectos você quer evoluir?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none"
        />
        {errors.pontos_melhoria && (
          <p className="text-xs text-red-600 mt-1">
            {errors.pontos_melhoria.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Treinamentos desejados{" "}
          <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <textarea
          {...register("treinamentos_desejados")}
          rows={2}
          placeholder="Quais cursos/certificações te ajudariam?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Aspiração de carreira
        </label>
        <textarea
          {...register("aspiracao_carreira")}
          rows={3}
          placeholder="Onde você quer chegar nos próximos 1–3 anos?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none"
        />
        {errors.aspiracao_carreira && (
          <p className="text-xs text-red-600 mt-1">
            {errors.aspiracao_carreira.message}
          </p>
        )}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register("interesse_mudanca_area")}
            className="mt-0.5 w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">
              Tenho interesse em mudar de área/projeto
            </span>
            <p className="text-xs text-gray-500">
              Marcar isso sinalizará ao RH oportunidades de mobilidade
              interna.
            </p>
          </div>
        </label>
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
