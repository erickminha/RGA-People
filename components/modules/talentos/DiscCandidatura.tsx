"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { criarTesteDisc, gerarParecerDisc, gerarPdfDisc } from "@/app/actions/disc";
import { Loader2, Send, FileText, Sparkles, Copy, Check, MessageCircle } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  enviado: "Aguardando resposta",
  respondido: "Respondido — gerar parecer",
  parecer_gerado: "Parecer gerado",
};

export default function DiscCandidatura({
  candidaturaId,
  tenantSlug,
  testeId: testeIdInicial,
  statusTeste: statusInicial,
  podeEditar,
}: {
  candidaturaId: string;
  tenantSlug: string;
  testeId: string | null;
  statusTeste: string | null;
  podeEditar: boolean;
}) {
  const [pendente, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [testeId, setTesteId] = useState<string | null>(testeIdInicial);
  const [status, setStatus] = useState<string | null>(statusInicial);
  const [pendenteParecer, setPendenteParecer] = useState(false);
  const [pendentePdf, setPendentePdf] = useState(false);

  function enviarTeste() {
    startTransition(async () => {
      const res = await criarTesteDisc(tenantSlug, candidaturaId);
      if (res.success) {
        if (res.url) setLink(res.url);
        if (res.testeId) setTesteId(res.testeId);
        setStatus("enviado");
        toast.success(res.message ?? "Teste gerado.");
      } else {
        toast.error(res.message ?? "Falha ao gerar o teste.");
      }
    });
  }

  async function gerarParecer() {
    if (!testeId) {
      toast.error("Gere o teste DISC primeiro.");
      return;
    }
    setPendenteParecer(true);
    const res = await gerarParecerDisc(tenantSlug, testeId);
    setPendenteParecer(false);
    if (res.success) {
      setStatus("parecer_gerado");
      toast.success("Parecer gerado com sucesso.");
    } else {
      toast.error(res.message ?? "Falha ao gerar o parecer.");
    }
  }

  async function gerarPdf() {
    if (!testeId) {
      toast.error("Gere o teste DISC primeiro.");
      return;
    }
    setPendentePdf(true);
    const res = await gerarPdfDisc(tenantSlug, testeId);
    setPendentePdf(false);
    if (res.success && res.url) {
      const a = document.createElement("a");
      a.href = res.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      toast.error(res.message ?? "Falha ao gerar o PDF.");
    }
  }

  function copiar() {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-500" /> Teste DISC
      </h3>

      {status && (
        <span className="inline-block text-[11px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-purple-50 text-purple-700">
          {STATUS_LABEL[status] ?? status}
        </span>
      )}

      {podeEditar && (
        <button
          onClick={enviarTeste}
          disabled={pendente}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {pendente ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {testeId ? "Gerar outro link DISC" : "Enviar DISC (WhatsApp)"}
        </button>
      )}

      {link && (
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
          <p className="text-xs text-gray-600 truncate flex-1" title={link}>
            {link}
          </p>
          <button
            onClick={copiar}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-white border hover:bg-gray-50 shrink-0"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiado ? "Copiado" : "Copiar"}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Olá! Enviei seu teste comportamental DISC para darmos continuidade ao processo seletivo: ${link}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-emerald-600 text-white hover:bg-emerald-700 shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </a>
        </div>
      )}

      {podeEditar && testeId && (status === "respondido" || status === "parecer_gerado") && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={gerarParecer}
            disabled={pendenteParecer}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
          >
            {pendenteParecer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Gerar parecer (IA)
          </button>
          <button
            onClick={gerarPdf}
            disabled={pendentePdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {pendentePdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            Baixar PDF
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Após a entrevista em que o candidato for aprovado, envie o link por
        WhatsApp para ele responder ao teste DISC.
      </p>
    </div>
  );
}