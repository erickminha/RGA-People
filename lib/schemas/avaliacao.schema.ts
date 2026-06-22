import { z } from "zod";

// ============ STEP 1 — Competências (notas 1-5) ============
export const competenciasSchema = z.object({
  comunicacao: z.coerce.number().min(1, "Avalie de 1 a 5").max(5),
  trabalho_equipe: z.coerce.number().min(1).max(5),
  proatividade: z.coerce.number().min(1).max(5),
  qualidade_entrega: z.coerce.number().min(1).max(5),
  conhecimento_tecnico: z.coerce.number().min(1).max(5),
  comentario_competencias: z
    .string()
    .min(20, "Descreva com pelo menos 20 caracteres")
    .max(1000, "Máximo 1000 caracteres"),
});

// ============ STEP 2 — Metas e Resultados ============
export const metasSchema = z.object({
  principais_entregas: z
    .string()
    .min(30, "Liste suas principais entregas (mín. 30 caracteres)")
    .max(2000),
  metas_atingidas: z.enum(["todas", "maioria", "parcialmente", "nao_atingi"], {
    errorMap: () => ({ message: "Selecione uma opção" }),
  }),
  desafios_enfrentados: z
    .string()
    .min(20, "Descreva os desafios (mín. 20 caracteres)")
    .max(1000),
});

// ============ STEP 3 — Desenvolvimento e Carreira ============
export const desenvolvimentoSchema = z.object({
  pontos_fortes: z
    .string()
    .min(20, "Liste seus pontos fortes (mín. 20 caracteres)")
    .max(1000),
  pontos_melhoria: z
    .string()
    .min(20, "Identifique pontos de melhoria (mín. 20 caracteres)")
    .max(1000),
  treinamentos_desejados: z
    .string()
    .max(500)
    .optional()
    .nullable(),
  aspiracao_carreira: z
    .string()
    .min(20, "Conte sua aspiração (mín. 20 caracteres)")
    .max(1000),
  interesse_mudanca_area: z.boolean().default(false),
});

// ============ STEP 4 — Auto-nota final ============
export const revisaoSchema = z.object({
  nota_auto_avaliacao: z.coerce
    .number()
    .min(1, "Dê uma nota de 1 a 10")
    .max(10, "Nota máxima é 10"),
  confirmacao: z.literal(true, {
    errorMap: () => ({
      message: "Confirme que as informações estão corretas",
    }),
  }),
});

// ============ Schema completo ============
export const autoAvaliacaoCompletaSchema = competenciasSchema
  .merge(metasSchema)
  .merge(desenvolvimentoSchema)
  .merge(revisaoSchema.omit({ confirmacao: true }));

export type CompetenciasInput = z.infer<typeof competenciasSchema>;
export type MetasInput = z.infer<typeof metasSchema>;
export type DesenvolvimentoInput = z.infer<typeof desenvolvimentoSchema>;
export type RevisaoInput = z.infer<typeof revisaoSchema>;
export type AutoAvaliacaoCompleta = z.infer<typeof autoAvaliacaoCompletaSchema>;
