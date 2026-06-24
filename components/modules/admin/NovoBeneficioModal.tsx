"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { criarBeneficio } from "@/app/actions/admin-beneficios";

interface Props {
  tenantSlug: string;
}

export default function NovoBeneficioModal({ tenantSlug }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const dados = {
      nome: formData.get("nome") as string,
      descricao: formData.get("descricao") as string,
      url_parceiro: formData.get("url_parceiro") as string,
    };

    const res = await criarBeneficio(tenantSlug, dados);
    setLoading(false);
    if (res.success) {
      setIsOpen(false);
    } else {
      alert(res.message);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Novo Benefício
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Novo Benefício</h2>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Benefício</label>
            <input name="nome" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Plano de Saúde Bradesco" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea name="descricao" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Detalhes sobre o benefício..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL do Parceiro (opcional)</label>
            <input name="url_parceiro" type="url" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="https://..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
              {loading ? "Salvando..." : "Criar Benefício"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
