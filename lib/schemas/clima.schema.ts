import { z } from "zod";

/**
 * Schemas de validação do módulo de Pesquisa de Clima.
 */

// Uma pergunta de pesquisa (escala 1-5 ou texto aberto), com dimensão temática.
export const perguntaClimaSchema = z.object({
  id: z.string().min(1),
  tipo: z.enum(["escala", "texto"]),
  texto: z.string().min(5, "Pergunta muito curta").max(280),
  dimensao: z.string().max(60).optional().nullable(),
});

export type PerguntaClima = z.infer<typeof perguntaClimaSchema>;

// Criação/edição de uma pesquisa pelo RH.
export const pesquisaClimaSchema = z.object({
  titulo: z.string().min(5, "Informe um título (mín. 5 caracteres)").max(140),
  descricao: z.string().max(500).optional().nullable(),
  data_abertura: z.string().optional().nullable(),
  data_fechamento: z.string().optional().nullable(),
  perguntas: z
    .array(perguntaClimaSchema)
    .min(1, "Adicione ao menos uma pergunta")
    .max(30, "Máximo de 30 perguntas"),
});

export type PesquisaClimaInput = z.infer<typeof pesquisaClimaSchema>;

// Envio de respostas (anônimo). Mapa pergunta_id -> valor.
export const respostaClimaSchema = z.object({
  pesquisa_id: z.string().uuid(),
  departamento: z.string().max(80).optional().nullable(),
  respostas: z.record(z.string(), z.union([z.number(), z.string()])),
});

export type RespostaClimaInput = z.infer<typeof respostaClimaSchema>;

// Conjunto de perguntas padrão (baseado nos formulários reais da RGA).
export const PERGUNTAS_CLIMA_PADRAO: PerguntaClima[] = [
  { id: "satisfacao", tipo: "escala", texto: "Qual seu nível de satisfação com o trabalho?", dimensao: "Satisfação" },
  { id: "comunicacao", tipo: "escala", texto: "Como avalia a comunicação com a liderança?", dimensao: "Liderança" },
  { id: "apoio", tipo: "escala", texto: "Qual o nível de apoio que você recebe?", dimensao: "Suporte" },
  { id: "carga", tipo: "escala", texto: "Como avalia o equilíbrio da sua carga de trabalho?", dimensao: "Equilíbrio" },
  { id: "reconhecimento", tipo: "escala", texto: "Você se sente reconhecido(a) pelo seu trabalho?", dimensao: "Reconhecimento" },
  { id: "crescimento", tipo: "escala", texto: "Você enxerga oportunidades de crescimento na empresa?", dimensao: "Carreira" },
  { id: "sugestoes", tipo: "texto", texto: "O que a empresa poderia melhorar para o seu dia a dia?", dimensao: "Aberta" },
];
