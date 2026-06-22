"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { X, Loader2, Save } from "lucide-react";
import {
  editarColaboradorSchema,
  type EditarColaboradorInput,
} from "@/lib/schemas/colaborador.schema";
import { editarColaborador } from "@/app/actions/admin-colaboradores";

interface Cargo {
  id: string;
  nome: string;
  nivel: string | null;
}

interface Colaborador {
  id: string;
  nome_completo: string;
  email: string;
  cargo: { id: string; nome: string } | null;
}

interface Props {
  colaborador: Colaborador;
  cargos: Cargo[];
  tenantSlug: string;
  onClose: () => void;
}

export default function EditarColaboradorModal({
  colaborador,
  cargos,
  tenantSlug,
  onClose,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditarColaboradorInput>({
    resolver: zodResolver(editarColaboradorSchema),
    defaultValues: {
      perfil_id: colaborador.id,
      nome_completo: colaborador.nome_completo,
      cargo_id: colaborador.cargo?.id ?? "",
      salario: null,
    },
  });

  const onSubmit = (data: EditarColaboradorInput) => {
    startTransition(async () => {
      const r = await editarColaborador(tenantSlug, data);
      if (r.success) {
        toast.success(r.message);
        onClose();
      } else {
        toast.error(r.message);
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Editar colaborador</h2>
            <p className="text-xs text-gray-500">{colaborador.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <input type="hidden" {...register("perfil_id")} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <input
              type="text"
              {...register("nome_completo")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {errors.nome_completo && (
              <p className="text-xs text-red-600 mt-1">
                {errors.nome_completo.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cargo
            </label>
            <select
              {...register("cargo_id")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              {cargos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.nivel ? `— ${c.nivel}` : ""}
                </option>
              ))}
            </select>
            {errors.cargo_id && (
              <p className="text-xs text-red-600 mt-1">
                {errors.cargo_id.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salário base (R$){" "}
              <span className="text-xs text-gray-400 font-normal">
                (opcional)
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              {...register("salario")}
              placeholder="0,00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {errors.salario && (
              <p className="text-xs text-red-600 mt-1">
                {errors.salario.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
