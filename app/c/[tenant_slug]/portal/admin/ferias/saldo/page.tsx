"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Users, AlertCircle, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Colaborador {
  id: string;
  nome_completo: string;
  cargo: { nome: string };
  saldo_ferias: number;
}

export default function SaldoFeriasPage() {
  const params = useParams();
  const tenantSlug = params.tenant_slug as string;
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [saldos, setSaldos] = useState<Record<string, number>>({});

  useEffect(() => {
    carregarColaboradores();
  }, []);

  async function carregarColaboradores() {
    try {
      const supabase = createClient();
      const { data: empresa } = await supabase
        .from("empresas")
        .select("id")
        .eq("slug", tenantSlug)
        .single();

      if (!empresa) {
        toast.error("Empresa não encontrada");
        return;
      }

      const { data, error } = await supabase
        .from("perfis")
        .select("id, nome_completo, saldo_ferias, cargo:cargos(nome)")
        .eq("empresa_id", empresa.id);

      if (error) throw error;

      setColaboradores(data || []);
      const saldosIniciais: Record<string, number> = {};
      (data || []).forEach((col) => {
        saldosIniciais[col.id] = col.saldo_ferias || 0;
      });
      setSaldos(saldosIniciais);
    } catch (error) {
      toast.error("Erro ao carregar colaboradores");
    } finally {
      setCarregando(false);
    }
  }

  async function salvarSaldos() {
    setSalvando(true);
    try {
      const supabase = createClient();
      
      for (const [colaboradorId, saldo] of Object.entries(saldos)) {
        await supabase
          .from("perfis")
          .update({ saldo_ferias: saldo })
          .eq("id", colaboradorId);
      }

      toast.success("Saldos de férias atualizados com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar saldos");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-indigo-600" />
          Saldo de Férias
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie os dias de férias disponíveis para cada colaborador
        </p>
      </header>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Como funciona:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Defina o número de dias de férias disponíveis para cada colaborador</li>
            <li>Os dias são decrementados automaticamente quando uma solicitação é aprovada</li>
            <li>Você pode ajustar manualmente conforme necessário</li>
          </ul>
        </div>
      </div>

      {colaboradores.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum colaborador encontrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Colaborador
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Cargo
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                  Dias Disponíveis
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {colaboradores.map((col) => (
                <tr key={col.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {col.nome_completo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {col.cargo?.nome || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={saldos[col.id] || 0}
                      onChange={(e) =>
                        setSaldos({
                          ...saldos,
                          [col.id]: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={salvarSaldos}
          disabled={salvando}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {salvando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar Saldos
            </>
          )}
        </button>
      </div>
    </div>
  );
}
