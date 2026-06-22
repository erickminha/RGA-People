"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  UserPlus,
  Search,
  Pencil,
  UserX,
  UserCheck,
  Mail,
  Loader2,
} from "lucide-react";
import ConvidarColaboradorModal from "./ConvidarColaboradorModal";
import EditarColaboradorModal from "./EditarColaboradorModal";
import {
  inativarColaborador,
  reativarColaborador,
} from "@/app/actions/admin-colaboradores";

interface Colaborador {
  id: string;
  nome_completo: string;
  email: string;
  avatar_url: string | null;
  ativo: boolean;
  criado_em: string;
  cargo: { id: string; nome: string; nivel: string | null } | null;
}

interface Cargo {
  id: string;
  nome: string;
  nivel: string | null;
}

interface ConvitePendente {
  id: string;
  email: string;
  expira_em: string;
  criado_em: string;
}

interface Props {
  colaboradores: Colaborador[];
  cargos: Cargo[];
  convitesPendentes: ConvitePendente[];
  tenantSlug: string;
  buscaInicial: string;
  abrirNovoAoCarregar: boolean;
}

export default function ColaboradoresTable({
  colaboradores,
  cargos,
  convitesPendentes,
  tenantSlug,
  buscaInicial,
  abrirNovoAoCarregar,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [busca, setBusca] = useState(buscaInicial);
  const [convidarOpen, setConvidarOpen] = useState(abrirNovoAoCarregar);
  const [editando, setEditando] = useState<Colaborador | null>(null);
  const [isPending, startTransition] = useTransition();
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  // Debounce de busca
  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams(params.toString());
      busca ? qs.set("busca", busca) : qs.delete("busca");
      router.push(`?${qs.toString()}`);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const toggleAtivo = (colab: Colaborador) => {
    const acao = colab.ativo ? "inativar" : "reativar";
    if (!confirm(`Deseja ${acao} ${colab.nome_completo}?`)) return;

    setProcessandoId(colab.id);
    startTransition(async () => {
      const fn = colab.ativo ? inativarColaborador : reativarColaborador;
      const r = await fn(tenantSlug, colab.id);
      r.success ? toast.success(r.message) : toast.error(r.message);
      setProcessandoId(null);
    });
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>
        <button
          onClick={() => setConvidarOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Convidar colaborador
        </button>
      </div>

      {/* Convites pendentes */}
      {convitesPendentes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            {convitesPendentes.length} convite(s) pendente(s)
          </h3>
          <ul className="text-xs text-amber-800 space-y-1">
            {convitesPendentes.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <span>{c.email}</span>
                <span className="text-amber-600">
                  expira em{" "}
                  {new Date(c.expira_em).toLocaleDateString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">
                  Cargo
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">
                  Desde
                </th>
                <th className="text-right px-5 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {colaboradores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : (
                colaboradores.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
                          {c.nome_completo.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {c.nome_completo}
                          </div>
                          <div className="text-xs text-gray-500">
                            {c.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {c.cargo?.nome ?? "—"}
                      {c.cargo?.nivel && (
                        <span className="block text-xs text-gray-400">
                          {c.cargo.nivel}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          c.ativo
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.ativo ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                        />
                        {c.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {new Date(c.criado_em).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setEditando(c)}
                          disabled={isPending}
                          title="Editar"
                          className="p-1.5 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleAtivo(c)}
                          disabled={isPending}
                          title={c.ativo ? "Inativar" : "Reativar"}
                          className={`p-1.5 rounded-lg disabled:opacity-50 transition-colors ${
                            c.ativo
                              ? "text-gray-600 hover:bg-red-50 hover:text-red-700"
                              : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                          }`}
                        >
                          {processandoId === c.id && isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : c.ativo ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
          Total:{" "}
          <strong className="text-gray-700">{colaboradores.length}</strong>{" "}
          colaborador(es)
        </div>
      </div>

      {/* Modais */}
      {convidarOpen && (
        <ConvidarColaboradorModal
          cargos={cargos}
          tenantSlug={tenantSlug}
          onClose={() => setConvidarOpen(false)}
        />
      )}
      {editando && (
        <EditarColaboradorModal
          colaborador={editando}
          cargos={cargos}
          tenantSlug={tenantSlug}
          onClose={() => setEditando(null)}
        />
      )}
    </>
  );
}
