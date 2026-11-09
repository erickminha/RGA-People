import { z } from "zod";

/**
 * Schemas de validação do módulo de Teste DISC.
 */

export const STATUS_TESTE = ["enviado", "respondido", "parecer_gerado"] as const;
export type StatusTeste = (typeof STATUS_TESTE)[number];

/** Dados pessoais coletados antes do teste (seção 1). */
export const dadosPessoaisDiscSchema = z.object({
  nome_completo: z.string({ error: "Informe seu nome" }).min(3).max(160),
  idade: z.coerce.number().int().min(16).max(99).optional().nullable(),
  nascimento: z.string().optional().nullable(),
  nome_mae: z.string().max(160).optional().nullable(),
  cpf: z.string().max(20).optional().nullable(),
  vaga: z.string().max(160).optional().nullable(),
  estado_civil: z.string().max(30).optional().nullable(),
    filhos: z.string().optional().nullable().transform((v) => (v ? v : null)),
  idade_filhos: z.string().max(40).optional().nullable(),
});
export type DadosPessoaisDiscInput = z.infer<typeof dadosPessoaisDiscSchema>;

/**
 * Respostas do teste DISC.
 * respostas: { "<pergunta_id>": { "<opcao>": valor } }
 * Como o objeto é dinâmico (chaves por pergunta), validamos manualmente na
 * Server Action com o auxílio de lib/disc/score (validarRespostas).
 */
export const respostaTesteDiscSchema = z.object({
  token: z.string({ error: "Token ausente" }).min(16),
  dados_pessoais: dadosPessoaisDiscSchema,
  respostas: z.record(z.string(), z.record(z.string(), z.coerce.number())),
});
export type RespostaTesteDiscInput = z.infer<typeof respostaTesteDiscSchema>;