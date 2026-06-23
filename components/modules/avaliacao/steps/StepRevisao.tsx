"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import {
  revisaoSchema,
  type RevisaoInput,
} from "@/lib/schemas/avaliacao.schema";

interface Props {
  dadosCompletos: Record<string, any>;
  onSubmit: (data: RevisaoInput) => void;
  onBack: () => void;
  isPending: boolean;
}

export default function StepRevisao({
  dadosCompletos,
  onSubmit,
  onBack,
  isPending,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RevisaoInput>({
    resolver: zodResolver(revisaoSchema),
    defaultValues: { nota_auto_avaliacao: 7, confirmacao: false as unknown as true },
  });

  const nota = watch("nota_auto_avaliacao");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          4. Revisão Final
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Confira suas respostas e atribua sua nota final.
        </p>
      </div>

      {/* Resumo */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-72 overflow-y-auto text-sm space-y-2">
        <p className="font-semibold text-gray-700">📋 Resumo</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>Comunicação: <strong>{dadosCompletos.comunicacao}/5</strong></div>
          <div>Equipe: <strong>{dadosCompletos.trabalho_equipe}/5</strong></div>
          <div>Proatividade: <strong>{dadosCompletos.proatividade}/5</strong></div>
          <div>Qualidade: <strong>{dadosCompletos.qualidade_entrega}/5</strong></div>
          <div>Técnico: <strong>{dadosCompletos.conhecimento_tecnico}/5</strong></div>
          <div>Metas: <strong>{dadosCompletos.metas_atingidas}</strong></div>
        </div>
      </div>

      {/* Nota final */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sua nota geral (1 a 10)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={10}
            {...register("nota_auto_avaliacao")}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
          />
          <div className="w-16 h-16 flex items-center justify-center bg-violet-600 text-white text-2xl font-bold rounded-xl">
            {nota}
          </div>
        </div>
        {errors.nota_auto_avaliacao && (
          <p className="text-xs text-red-600 mt-1">
            {errors.nota_auto_avaliacao.message}
          </p>
        )}
      </div>

      {/* Confirmação */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register("confirmacao")}
            className="mt-0.5 w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
          />
          <span className="text-sm text-amber-900">
            Confirmo que as informações são verdadeiras e que após o envio
            <strong> não poderei editar</strong> esta avaliação.
          </span>
        </label>
        {errors.confirmacao && (
          <p className="text-xs text-red-600 mt-1">
            {errors.confirmacao.message}
          </p>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          ← Voltar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 disabled:bg-gray-300 transition-colors"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar avaliação
            </>
          )}
        </button>
      </div>
    </form>
  );
}
