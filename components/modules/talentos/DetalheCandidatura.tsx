"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  avancarEtapa,
  agendarEntrevista,
  alterarStatusEntrevista,
  excluirEntrevista,
  adicionarFeedback,
} from "@/app/actions/talentos";
import {
  ETAPAS_CANDIDATURA,
  ETAPA_LABELS,
  STATUS_ENTREVISTA,
  STATUS_ENTREVISTA_LABELS,
  TIPOS_ENTREVISTA,
  TIPO_ENTREVISTA_LABELS,
} from "@/lib/schemas/candidato.schema";
import {
  CalendarDays,
  ChevronLeft,
  Star,
  Plus,
  Trash2,
  Loader2,
  Video,
  MapPin,
  Building2,
} from "lucide-react";
import DiscCandidatura from "./DiscCandidatura";

export interface DetalheCandidatura {
  candidatura_id: string;
  etapa: string;
  vaga_titulo: string;
  candidato_nome: string;
  candidato_email: string | null;
  candidato_telefone: string | null;
  arquivo_nome: string | null;
  entrevistas: Array<{
    id: string;
    titulo: string | null;
    tipo: string;
    data_hora: string;
    localizacao: string | null;
    link_video: string | null;
    status: string;
    observacoes: string | null;
  }>;
  feedbacks: Array<{
    id: string;
    nota: number;
    comentario: string;
    etapa_referencia: string | null;
    autor_nome: string | null;
    criado_em: string | null;
  }>;
}

interface Props {
  dados: DetalheCandidatura;
  tenantSlug: string;
  voltaHref: string;
  podeEditar: boolean;
  podeDarFeedback: boolean;
  /** Teste DISC vinculado à candidatura (se houver). */
  testeId?: string | null;
  statusTeste?: string | null;
}

export default function DetalheCandidatura({
  dados,
  tenantSlug,
  voltaHref,
  podeEditar,
  podeDarFeedback,
  testeId = null,
  statusTeste = null,
}: Props) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();

  // formulário de entrevista
  const [abrirNovoEntr, setAbrirNovoEntr] = useState(false);
  const [entr, setEntr] = useState({
    tipo: "rh",
    data_hora: "",
    localizacao: "",
    link_video: "",
    observacoes: "",
  });

  // formulário de feedback
  const [nota, setNota] = useState(3);
  const [comentario, setComentario] = useState("");

  function moverEtapa(etapa: string) {
    startTransition(async () => {
      const res = await avancarEtapa(tenantSlug, {
        candidatura_id: dados.candidatura_id,
        etapa,
      });
      if (res.success) toast.success("Etapa atualizada.");
      else toast.error(res.message ?? "Falha ao atualizar.");
    });
  }

  function salvarEntrevista(e: React.FormEvent) {
    e.preventDefault();
    if (!entr.data_hora) {
      toast.error("Informe a data/hora.");
      return;
    }
    const dataHora = new Date(entr.data_hora);
    if (Number.isNaN(dataHora.getTime())) {
      toast.error("Informe uma data e hora válidas.");
      return;
    }
    startTransition(async () => {
      const res = await agendarEntrevista(tenantSlug, {
        candidatura_id: dados.candidatura_id,
        tipo: entr.tipo,
        data_hora: dataHora.toISOString(),
        localizacao: entr.localizacao,
        link_video: entr.link_video,
        observacoes: entr.observacoes,
      });
      if (res.success) {
        toast.success("Entrevista agendada.");
        setAbrirNovoEntr(false);
        setEntr({ tipo: "rh", data_hora: "", localizacao: "", link_video: "", observacoes: "" });
      } else {
        toast.error(res.message ?? "Falha ao agendar.");
      }
    });
  }

  function mudarStatusEntrevista(id: string, status: string) {
    startTransition(async () => {
      const res = await alterarStatusEntrevista(tenantSlug, {
        entrevista_id: id,
        status,
      });
      if (res.success) toast.success("Status atualizado.");
      else toast.error(res.message ?? "Falha.");
    });
  }

  function removerEntrevista(id: string) {
    if (!window.confirm("Excluir esta entrevista?")) return;
    startTransition(async () => {
      const res = await excluirEntrevista(tenantSlug, id);
      if (res.success) toast.success("Entrevista excluída.");
      else toast.error(res.message ?? "Falha.");
    });
  }

  function salvarFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (comentario.trim().length < 3) {
      toast.error("Escreva um comentário.");
      return;
    }
    startTransition(async () => {
      const res = await adicionarFeedback(tenantSlug, {
        candidatura_id: dados.candidatura_id,
        nota,
        comentario,
        etapa_referencia: dados.etapa,
      });
      if (res.success) {
        toast.success("Feedback registrado.");
        setComentario("");
        setNota(3);
      } else {
        toast.error(res.message ?? "Falha ao registrar.");
      }
    });
  }

  const mediaNota =
    dados.feedbacks.length > 0
      ? (dados.feedbacks.reduce((s, f) => s + f.nota, 0) / dados.feedbacks.length).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push(voltaHref)}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar ao pipeline
        </button>
      </div>

      {/* Cabeçalho do candidato */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="text-sm text-indigo-600 font-medium flex items-center gap-1">
              <Building2 className="w-4 h-4" /> {dados.vaga_titulo}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{dados.candidato_nome}</h1>
            <div className="text-sm text-gray-500 mt-1 space-y-0.5">
              {dados.candidato_email && <p>{dados.candidato_email}</p>}
              {dados.candidato_telefone && <p>{dados.candidato_telefone}</p>}
            </div>
            {mediaNota && (
              <p className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-amber-600">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {mediaNota} / 5
                <span className="text-gray-400 font-normal">({dados.feedbacks.length} feedbacks)</span>
              </p>
            )}
          </div>

          {podeEditar && (
            <div className="shrink-0">
              <label className="block text-xs font-medium text-gray-500 mb-1">Etapa do pipeline</label>
              <select
                value={dados.etapa}
                onChange={(e) => moverEtapa(e.target.value)}
                disabled={pendente}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white outline-none"
              >
                {ETAPAS_CANDIDATURA.map((et) => (
                  <option key={et} value={et}>
                    {ETAPA_LABELS[et]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Entrevistas */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-gray-400" /> Entrevistas
          </h2>
          {podeDarFeedback && (
            <button
              onClick={() => setAbrirNovoEntr((v) => !v)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" /> Agendar
            </button>
          )}
        </div>

        {abrirNovoEntr && podeEditar && (
          <form onSubmit={salvarEntrevista} className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                <select
                  value={entr.tipo}
                  onChange={(e) => setEntr((f) => ({ ...f, tipo: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none"
                >
                  {TIPOS_ENTREVISTA.map((t) => (
                    <option key={t} value={t}>
                      {TIPO_ENTREVISTA_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data e hora *</label>
                <input
                  type="datetime-local"
                  value={entr.data_hora}
                  onChange={(e) => setEntr((f) => ({ ...f, data_hora: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Local / Cidade</label>
                <input
                  value={entr.localizacao}
                  onChange={(e) => setEntr((f) => ({ ...f, localizacao: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Link de vídeo</label>
                <input
                  value={entr.link_video}
                  onChange={(e) => setEntr((f) => ({ ...f, link_video: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                />
              </div>
            </div>
            <textarea
              value={entr.observacoes}
              onChange={(e) => setEntr((f) => ({ ...f, observacoes: e.target.value }))}
              rows={2}
              placeholder="Observações"
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAbrirNovoEntr(false)}
                className="px-3 py-1.5 text-sm border rounded-lg text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pendente}
                className="inline-flex items-center gap-1 px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {pendente ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Agendar
              </button>
            </div>
          </form>
        )}

        {dados.entrevistas.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma entrevista agendada.</p>
        ) : (
          <div className="space-y-2">
            {dados.entrevistas
              .slice()
              .sort((a, b) => a.data_hora.localeCompare(b.data_hora))
              .map((ent) => (
                <div key={ent.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm">
                          {TIPO_ENTREVISTA_LABELS[ent.tipo as keyof typeof TIPO_ENTREVISTA_LABELS] ?? ent.tipo}
                        </p>
                        <span className="text-[10px] font-bold uppercase rounded-full px-2 py-0.5 bg-gray-100 text-gray-600">
                          {STATUS_ENTREVISTA_LABELS[ent.status as keyof typeof STATUS_ENTREVISTA_LABELS] ?? ent.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(ent.data_hora).toLocaleString("pt-BR")}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                        {ent.localizacao && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {ent.localizacao}
                          </span>
                        )}
                        {ent.link_video && (
                          <a
                            href={ent.link_video}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                          >
                            <Video className="w-3.5 h-3.5" /> Entrar
                          </a>
                        )}
                      </div>
                      {ent.observacoes && <p className="text-xs text-gray-400 mt-1">{ent.observacoes}</p>}
                    </div>
                    {podeEditar && (
                      <div className="flex items-center gap-1 shrink-0">
                        <select
                          value={ent.status}
                          onChange={(e) => mudarStatusEntrevista(ent.id, e.target.value)}
                          disabled={pendente}
                          className="px-1.5 py-1 rounded-md text-xs border border-gray-200 bg-white outline-none"
                        >
                          {STATUS_ENTREVISTA.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_ENTREVISTA_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => removerEntrevista(ent.id)}
                          className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

                {/* Teste DISC */}
                <section className="bg-white border border-gray-200 rounded-xl p-5">
                  <DiscCandidatura
                    candidaturaId={dados.candidatura_id}
                    tenantSlug={tenantSlug}
                    testeId={testeId}
                    statusTeste={statusTeste}
                    podeEditar={podeEditar}
                  />
                </section>

                {/* Feedback */}
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-gray-900">Avaliações internas</h2>

        {podeEditar && (
          <form onSubmit={salvarFeedback} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Nota:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNota(n)}
                    className="text-2xl focus:outline-none"
                    title={`${n} estrela(s)`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        n <= nota ? "fill-amber-500 text-amber-500" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              placeholder="Deixe seu feedback sobre o candidato..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pendente}
                className="inline-flex items-center gap-1 px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {pendente ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Registrar avaliação
              </button>
            </div>
          </form>
        )}

        {dados.feedbacks.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma avaliação registrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {dados.feedbacks
              .slice()
              .sort((a, b) => (b.criado_em ?? "").localeCompare(a.criado_em ?? ""))
              .map((f) => (
                <div key={f.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < f.nota ? "fill-amber-500 text-amber-500" : "text-gray-200"}`}
                        />
                      ))}
                    </span>
                    <span className="text-xs text-gray-400">{f.autor_nome ?? "Avaliador"}</span>
                  </div>
                  <p className="text-sm text-gray-700">{f.comentario}</p>
                  {f.etapa_referencia && (
                    <p className="text-xs text-gray-400 mt-1">Etapa: {ETAPA_LABELS[f.etapa_referencia as keyof typeof ETAPA_LABELS] ?? f.etapa_referencia}</p>
                  )}
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}