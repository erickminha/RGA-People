import { z } from "zod";

/**
 * Schemas de validação para o módulo de Documentos Corporativos.
 */

export const TIPO_DOC_LABELS: Record<string, string> = {
  manual_colaborador: "Manual do Colaborador",
  codigo_conduta: "Código de Conduta",
  pop_rh: "POP do RH",
  nr1: "NR1",
  plano_carreira: "Plano de Carreira",
  outros: "Outros Documentos",
};

export const documentoCorpSchema = z.object({
  tipo: z.enum([
    "manual_colaborador",
    "codigo_conduta",
    "pop_rh",
    "nr1",
    "plano_carreira",
    "outros",
  ]),
  titulo: z.string().min(3, "Título muito curto").max(100),
  descricao: z.string().max(255).optional().nullable(),
  conteudo_md: z.string().optional().nullable(),
  arquivo_url: z.string().url("URL inválida").optional().nullable(),
  exigir_aceite: z.boolean().default(true),
  ativo: z.boolean().default(true),
});

export type DocumentoCorpInput = z.infer<typeof documentoCorpSchema>;

export const aceiteDocSchema = z.object({
  documento_id: z.string().uuid(),
  versao: z.number().int(),
});

export type AceiteDocInput = z.infer<typeof aceiteDocSchema>;
