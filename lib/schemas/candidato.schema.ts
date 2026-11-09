import { z } from "zod";

/**
 * Schemas de validação para o módulo de Recrutamento e Seleção (ATS).
 * Modelo inspirado no Recrut.ai: vagas, perfil de candidato e candidaturas
 * com pipeline, adaptado ao multi-tenant do portal.
 */

// ------------------------------------------------------------
// Etapas do pipeline (por candidatura)
// ------------------------------------------------------------
export const ETAPAS_CANDIDATURA = [
  "nova",
  "triado",
  "entrevista_rh",
  "entrevista_gestor",
  "proposta",
  "contratado",
  "recusado",
] as const;

export type EtapaCandidatura = (typeof ETAPAS_CANDIDATURA)[number];

export const ETAPA_LABELS: Record<EtapaCandidatura, string> = {
  nova: "Nova",
  triado: "Triado",
  entrevista_rh: "Entrevista RH",
  entrevista_gestor: "Entrevista Gestor",
  proposta: "Proposta",
  contratado: "Contratado",
  recusado: "Recusado",
};

export const STATUS_VAGA = ["aberta", "fechada"] as const;
export type StatusVaga = (typeof STATUS_VAGA)[number];

// ------------------------------------------------------------
// Arquivo de currículo
// ------------------------------------------------------------
export const EXTENSOES_CURRICULO = ["pdf", "doc", "docx", "jpeg", "jpg"] as const;
export const MIME_CURRICULO: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/jpeg": "jpg",
};
export const MAX_CURRICULO_BYTES = 8 * 1024 * 1024; // 8 MB

// ------------------------------------------------------------
// Vaga (CRUD RH)
// ------------------------------------------------------------
export const vagaSchema = z.object({
  titulo: z
    .string({ error: "Título obrigatório" })
    .min(3, "Título muito curto")
    .max(150),
  departamento: z.string().max(100).optional().nullable(),
  localizacao: z.string().max(120).optional().nullable(),
  modalidade: z
    .enum(["presencial", "hibrido", "remoto", ""])
    .optional()
    .transform((v) => (v ? v : null)),
  descricao: z.string().max(5000).optional().nullable(),
  requisitos: z.string().max(3000).optional().nullable(),
  status: z.enum(STATUS_VAGA).default("aberta"),
});
export type VagaInput = z.infer<typeof vagaSchema>;

// ------------------------------------------------------------
// Perfil do candidato (submissão pública, SEM login)
// ------------------------------------------------------------
export const candidatoSchema = z.object({
  nome: z
    .string({ error: "Informe seu nome" })
    .min(3, "Nome muito curto")
    .max(120),
  email: z
    .string()
    .email("E-mail inválido")
    .max(160)
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v ? v.toLowerCase() : null)),
  telefone: z.string().max(25).optional().nullable().or(z.literal("")).transform((v) => (v ? v : null)),
});
export type CandidatoInput = z.infer<typeof candidatoSchema>;

// ------------------------------------------------------------
// Candidatura (candidato -> vaga)
// ------------------------------------------------------------
export const candidaturaSchema = z.object({
  vaga_id: z.string({ error: "Selecione uma vaga" }).uuid("Vaga inválida"),
  nome: z.string().min(3).max(120),
  email: z
    .string()
    .email("E-mail inválido")
    .max(160)
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v ? v.toLowerCase() : null)),
  telefone: z.string().max(25).optional().nullable().or(z.literal("")).transform((v) => (v ? v : null)),
  observacoes: z.string().max(1000).optional().nullable().or(z.literal("")).transform((v) => (v ? v : null)),
});
export type CandidaturaInput = z.infer<typeof candidaturaSchema>;

// ------------------------------------------------------------
// Avanço de etapa no pipeline (Server Action RH)
// ------------------------------------------------------------
export const avancarEtapaSchema = z.object({
  candidatura_id: z.string().uuid(),
  etapa: z.enum(ETAPAS_CANDIDATURA),
});
export type AvancarEtapaInput = z.infer<typeof avancarEtapaSchema>;

// ------------------------------------------------------------
// Entrevistas (Fase 2)
// ------------------------------------------------------------
export const STATUS_ENTREVISTA = [
  "agendada",
  "confirmada",
  "realizada",
  "cancelada",
  "nao_compareceu",
] as const;
export type StatusEntrevista = (typeof STATUS_ENTREVISTA)[number];

export const STATUS_ENTREVISTA_LABELS: Record<StatusEntrevista, string> = {
  agendada: "Agendada",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  nao_compareceu: "Não compareceu",
};

export const TIPOS_ENTREVISTA = [
  "rh",
  "gestor",
  "tecnica",
  "admissional",
  "cultura",
  "outro",
] as const;
export type TipoEntrevista = (typeof TIPOS_ENTREVISTA)[number];

export const TIPO_ENTREVISTA_LABELS: Record<TipoEntrevista, string> = {
  rh: "RH",
  gestor: "Gestor",
  tecnica: "Técnica",
  admissional: "Admissional",
  cultura: "Cultura",
  outro: "Outro",
};

export const entrevistaSchema = z.object({
  candidatura_id: z.string().uuid(),
  titulo: z.string().max(150).optional().nullable(),
  tipo: z.enum(TIPOS_ENTREVISTA).default("rh"),
  data_hora: z
    .string()
    .datetime({ offset: true, message: "Informe uma data e hora válidas." })
    .refine((value) => {
      const match = /^(\d{4})-(\d{2})-(\d{2})T/.exec(value);
      if (!match) return false;
      const [, ano, mes, dia] = match;
      const data = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
      return (
        data.getUTCFullYear() === Number(ano) &&
        data.getUTCMonth() === Number(mes) - 1 &&
        data.getUTCDate() === Number(dia)
      );
    }, "Informe uma data de calendário válida."),
  localizacao: z.string().max(160).optional().nullable(),
  link_video: z
    .string()
    .url("Link inválido")
    .refine((value) => ["http:", "https:"].includes(new URL(value).protocol), "O link deve usar HTTP ou HTTPS.")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  entrevistador_id: z.string().uuid().optional().nullable(),
  observacoes: z.string().max(1000).optional().nullable(),
});
export type EntrevistaInput = z.infer<typeof entrevistaSchema>;

export const alterarStatusEntrevistaSchema = z.object({
  entrevista_id: z.string().uuid(),
  status: z.enum(STATUS_ENTREVISTA),
});
export type AlterarStatusEntrevistaInput = z.infer<typeof alterarStatusEntrevistaSchema>;

// ------------------------------------------------------------
// Feedback interno (Fase 2)
// ------------------------------------------------------------
export const feedbackSchema = z.object({
  candidatura_id: z.string().uuid(),
  nota: z.coerce.number().int().min(1).max(5),
  comentario: z.string().min(3, "Comentário muito curto").max(2000),
  etapa_referencia: z.string().max(50).optional().nullable(),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;