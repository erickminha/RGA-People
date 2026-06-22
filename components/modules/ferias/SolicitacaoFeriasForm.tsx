"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Send, Loader2, CalendarDays, Info } from "lucide-react";
import {
  solicitacaoFeriasSchema,
  type SolicitacaoFeriasInput,
} from "@/lib/schemas/ferias.schema";
import { criarSolicitacaoFerias } from "@/app/actions/ferias";

interface Props {
  tenantSlug: string;
  diasDisponiveis: number;
}

export default function SolicitacaoFeriasForm({
  tenantSlug,
  diasDisponiveis,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [serverErrors, setServerErrors] = useState<
    Record<string, string[]> | null
  >(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<SolicitacaoFeriasInput>({
    resolver: zodResolver(solicitacaoFeriasSchema),
    defaultValues: {
      data_inicio: "",
      data_fim: "",
      abono_pecuniario: false,
      dias_abono: 0,
      observacoes: "",
    },
  });

  const dataInicio = watch("data_inicio");
  const dataFim = watch("data_fim");
  const abono = watch("abono_pecuniario");

  const diasSolicitados =
    dataInicio && dataFim
      ? Math.max(
          0,
          Math.ceil(
            (new Date(dataFim).getTime() - new Date(dataInicio).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        )
      : 0;

  const excedeSaldo = diasSolicitados > diasDisponiveis;

  const onSubmit = (data: SolicitacaoFeriasInput) => {
    if (excedeSaldo) {
      toast.error(
        `Período excede seu saldo (${diasDisponiveis} dias disponíveis).`
      );
      return;
    }

    setServerErrors(null);

    startTransition(async () => {
      const result = await criarSolicitacaoFerias(tenantSlug, data);

      if (result.success) {
        toast.success(result.message);
        reset();
      } else {
        toast.error(result.message);
        if (result.fieldErrors) setServerErrors(result.fieldErrors);
      }
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          Solicitar Férias
        </h3>
        <p className="text-sky-100 text-xs mt-1">
          Saldo disponível:{" "}
          <span className="font-bold">{diasDisponiveis} dias</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
        {/* Data Início */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Início <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register("data_inicio")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
          />
          {errors.data_inicio && (
            <p className="text-xs text-red-600 mt-1">
              {errors.data_inicio.message}
            </p>
          )}
          {serverErrors?.data_inicio && (
            <p className="text-xs text-red-600 mt-1">
              {serverErrors.data_inicio[0]}
            </p>
          )}
        </div>

        {/* Data Fim */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Fim <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register("data_fim")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
          />
          {errors.data_fim && (
            <p className="text-xs text-red-600 mt-1">
              {errors.data_fim.message}
            </p>
          )}
        </div>

        {/* Indicador de dias */}
        {diasSolicitados > 0 && (
          <div
            className={`flex items-center justify-between p-3 rounded-lg text-sm ${
              excedeSaldo
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-sky-50 text-sky-700 border border-sky-200"
            }`}
          >
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Período de{" "}
              <strong>
                {diasSolicitados} dia{diasSolicitados > 1 ? "s" : ""}
              </strong>
            </span>
            {excedeSaldo && (
              <span className="text-xs font-medium">Excede saldo!</span>
            )}
          </div>
        )}

        {/* Abono pecuniário */}
        <div className="pt-2 border-t border-gray-100">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("abono_pecuniario")}
              className="mt-0.5 w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                Solicitar abono pecuniário
              </span>
              <p className="text-xs text-gray-500">
                Vender até 1/3 das férias (máx. 10 dias) — CLT Art. 143
              </p>
            </div>
          </label>

          {abono && (
            <div className="mt-3 ml-6">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Dias a vender
              </label>
              <input
                type="number"
                min={0}
                max={10}
                {...register("dias_abono")}
                className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
              {errors.dias_abono && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.dias_abono.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações
          </label>
          <textarea
            {...register("observacoes")}
            rows={3}
            placeholder="Algo relevante para o gestor?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition resize-none"
          />
          {errors.observacoes && (
            <p className="text-xs text-red-600 mt-1">
              {errors.observacoes.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || excedeSaldo}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar solicitação
            </>
          )}
        </button>
      </form>
    </div>
  );
}
