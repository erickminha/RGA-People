"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { criarVaga, atualizarVaga, excluirVaga } from "@/app/actions/talentos";
import { Plus, Pencil, Trash2, Loader2, MapPin, Building2, Save } from "lucide-react";

export interface VagaUI {
  id: string;
  titulo: string;
  departamento: string | null;
  localizacao: string | null;
  modalidade: string | null;
  descricao: string | null;
  requisitos: string | null;
  status: string;
}

interface Props {
  vagas: VagaUI[];
  tenantSlug: string;
  /** Rota base para navegar com a vaga selecionada via query string. */
  baseHref: string;
  vagaSelecionada: string | null;
  podeEditar: boolean;
}

interface FormVaga {
  titulo: string;
  departamento: string;
  localizacao: string;
  modalidade: string;
  descricao: string;
  requisitos: string;
}

const formVazio: FormVaga = {
  titulo: "",
  departamento: "",
  localizacao: "",
  modalidade: "",
  descricao: "",
  requisitos: "",
};

export default function GestaoVagas({
  vagas,
  tenantSlug,
  baseHref,
  vagaSelecionada,
  podeEditar,
}: Props) {
  const router = useRouter();
  const [novaAberta, setNovaAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormVaga>(formVazio);
  const [pendente, startTransition] = useTransition();

  function preencher(v: VagaUI) {
    setForm({
      titulo: v.titulo,
      departamento: v.departamento ?? "",
      localizacao: v.localizacao ?? "",
      modalidade: v.modalidade ?? "",
      descricao: v.descricao ?? "",
      requisitos: v.requisitos ?? "",
    });
  }

  function salvarNova() {
    if (!form.titulo.trim()) {
      toast.error("Informe o título da vaga.");
      return;
    }
    startTransition(async () => {
      const res = await criarVaga(tenantSlug, {
        titulo: form.titulo,
        departamento: form.departamento,
        localizacao: form.localizacao,
        modalidade: form.modalidade,
        descricao: form.descricao,
        requisitos: form.requisitos,
        status: "aberta",
      });
      if (res.success) {
        toast.success(res.message ?? "Vaga criada.");
        setNovaAberta(false);
        setForm(formVazio);
      } else {
        toast.error(res.message ?? "Falha ao criar.");
      }
    });
  }

  function salvarEdicao(vagaId: string) {
    if (!form.titulo.trim()) {
      toast.error("Informe o título da vaga.");
      return;
    }
    const v = vagas.find((x) => x.id === vagaId);
    startTransition(async () => {
      const res = await atualizarVaga(tenantSlug, vagaId, {
        titulo: form.titulo,
        departamento: form.departamento,
        localizacao: form.localizacao,
        modalidade: form.modalidade,
        descricao: form.descricao,
        requisitos: form.requisitos,
        status: v?.status ?? "aberta",
      });
      if (res.success) {
        toast.success("Vaga atualizada.");
        setEditandoId(null);
      } else {
        toast.error(res.message ?? "Falha ao atualizar.");
      }
    });
  }

  function excluir(v: VagaUI) {
    if (!window.confirm(`Excluir a vaga "${v.titulo}" e suas candidaturas?`)) return;
    startTransition(async () => {
      const res = await excluirVaga(tenantSlug, v.id);
      if (res.success) toast.success("Vaga excluída.");
      else toast.error(res.message ?? "Falha ao excluir.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {podeEditar && (
          <button
            onClick={() => {
              setNovaAberta(true);
              setEditandoId(null);
              setForm(formVazio);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            {pendente ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Nova Vaga
          </button>
        )}
      </div>

      {/* Formulário de nova vaga */}
      {novaAberta && podeEditar && (
        <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">Nova vaga</h3>
          <InputsVaga form={form} setForm={setForm} />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setNovaAberta(false); setForm(formVazio); }}
              className="px-3 py-1.5 text-sm border rounded-lg text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={salvarNova}
              disabled={pendente}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Criar
            </button>
          </div>
        </div>
      )}

      {/* Lista de vagas */}
      {vagas.length === 0 ? (
        <div className="text-center py-10 bg-white border border-gray-200 rounded-xl">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma vaga cadastrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vagas.map((v) => {
            const aberta = v.status === "aberta";
            const selecionada = vagaSelecionada === v.id;
            return (
              <div
                key={v.id}
                className={`bg-white border rounded-xl p-4 cursor-pointer transition-colors ${
                  selecionada ? "border-indigo-400 ring-2 ring-indigo-100" : "border-gray-200 hover:border-indigo-200"
                }`}
                onClick={() => router.push(`${baseHref}?vaga=${v.id}`)}
                onKeyDown={(e) => e.key === "Enter" && router.push(`${baseHref}?vaga=${v.id}`)}
                tabIndex={0}
              >
                {editandoId === v.id && podeEditar ? (
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <InputsVaga form={form} setForm={setForm} />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditandoId(null)}
                        className="px-3 py-1.5 text-sm border rounded-lg text-gray-600 hover:bg-gray-100"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => salvarEdicao(v.id)}
                        disabled={pendente}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" /> Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{v.titulo}</p>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 ${
                            aberta ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {aberta ? "Aberta" : "Fechada"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                        {v.departamento && (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" /> {v.departamento}
                          </span>
                        )}
                        {v.localizacao && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {v.localizacao}
                          </span>
                        )}
                        {v.modalidade && (
                          <span className="capitalize">{v.modalidade}</span>
                        )}
                      </div>
                    </div>

                    {podeEditar && (
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { preencher(v); setEditandoId(v.id); setNovaAberta(false); }}
                          className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => excluir(v)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Excluir vaga"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InputsVaga({
  form,
  setForm,
}: {
  form: FormVaga;
  setForm: React.Dispatch<React.SetStateAction<FormVaga>>;
}) {
  const u = (k: keyof FormVaga) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
        <input value={form.titulo} onChange={u("titulo")} placeholder="Ex: Analista de RH" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Departamento</label>
        <input value={form.departamento} onChange={u("departamento")} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Modalidade</label>
        <select value={form.modalidade} onChange={u("modalidade")} className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">—</option>
          <option value="presencial">Presencial</option>
          <option value="hibrido">Híbrido</option>
          <option value="remoto">Remoto</option>
        </select>
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-gray-600 mb-1">Localização</label>
        <input value={form.localizacao} onChange={u("localizacao")} placeholder="Cidade/UF" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
        <textarea value={form.descricao} onChange={u("descricao")} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Requisitos (usados na triagem — Fase IA)</label>
        <textarea value={form.requisitos} onChange={u("requisitos")} rows={2} placeholder="Ex: 3+ anos, SQL, Power BI..." className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
      </div>
    </div>
  );
}