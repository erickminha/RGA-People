"use client";

import { useState } from "react";
import { X, Loader2, Mail, User, Briefcase } from "lucide-react";
import { enviarConvite } from "@/app/actions/admin-convites";

interface ConvidarColaboradorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cargos: any[];
  tenantSlug: string;
}

export default function ConvidarColaboradorModal({
  isOpen,
  onClose,
  cargos,
  tenantSlug,
}: ConvidarColaboradorModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [cargoId, setCargoId] = useState("");
  const [mensagem, setMensagem] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !nomeCompleto || !cargoId) {
      setMensagem("❌ Preencha todos os campos obrigatórios");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("nomeCompleto", nomeCompleto);
      formData.append("cargoId", cargoId);
      formData.append("tenantSlug", tenantSlug);

      const resultado = await enviarConvite(formData);

      if (resultado.success) {
        setMensagem("✅ " + resultado.message);
        setTimeout(() => {
          setEmail("");
          setNomeCompleto("");
          setCargoId("");
          setMensagem("");
          onClose();
        }, 2000);
      } else {
        setMensagem("❌ " + resultado.error);
      }
    } catch (error) {
      setMensagem("❌ Erro ao enviar convite");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Convidar Colaborador</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colaborador@empresa.com"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Nome Completo
            </label>
            <input
              type="text"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              placeholder="João Silva"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Cargo
            </label>
            <select
              value={cargoId}
              onChange={(e) => setCargoId(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <option value="">Selecione um cargo</option>
              {cargos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {mensagem && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              mensagem.includes("✅") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}>
              {mensagem}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Convite"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
