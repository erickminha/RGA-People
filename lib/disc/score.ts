import { PERGUNTAS_DISC, NOME_DIMENSAO, type DimensaoDisc } from "./perguntas";

/**
 * Respostas do teste: para cada pergunta, um mapa opcao -> valor (4..1).
 * Ex.: { "1": { "Direcionado": 4, "Influente": 3, "Estável": 2, "Cuidadoso": 1 } }
 */
export type RespostasDisc = Record<string, Record<string, number>>;

export interface ScoresDisc {
  D: number;
  I: number;
  S: number;
  C: number;
}

export interface TipoDiscResult {
  /** Dimensão de maior score. */
  dominante: DimensaoDisc;
  /** Nome completo da dimensão dominante. */
  dominanteNome: string;
  /** Duas dimensões mais altas, ex.: "D/I". */
  combinado: string;
  /** Nome do perfil combinado, no formato "Dominância/Influência". */
  combinadoNome: string;
}

/** Soma os scores de cada dimensão a partir das respostas. */
export function calcularScores(respostas: RespostasDisc): ScoresDisc {
  const scores: ScoresDisc = { D: 0, I: 0, S: 0, C: 0 };

  for (const pergunta of PERGUNTAS_DISC) {
    const resp = respostas[String(pergunta.id)] ?? {};
    for (const opcao of pergunta.opcoes) {
      const valor = Number(resp[opcao.rotulo]) || 0;
      scores[opcao.dimensao] += valor;
    }
  }

  return scores;
}

/** Validação: cada pergunta deve ter exatamente os valores 4,3,2,1 distribuídos. */
export function validarRespostas(respostas: RespostasDisc): boolean {
  const esperado = [4, 3, 2, 1];
  for (const pergunta of PERGUNTAS_DISC) {
    const resp = respostas[String(pergunta.id)];
    if (!resp) return false;
    const valores = pergunta.opcoes.map((o) => Number(resp[o.rotulo]));
    const ordenado = [...valores].sort((a, b) => b - a);
    if (JSON.stringify(ordenado) !== JSON.stringify(esperado)) return false;
    if (valores.some((v) => !Number.isFinite(v))) return false;
  }
  return true;
}

/** Deriva o tipo (dominante + combinado) a partir dos scores. */
export function obterTipoDisc(scores: ScoresDisc): TipoDiscResult {
  const entradas: Array<{ dim: DimensaoDisc; valor: number }> = [
    { dim: "D", valor: scores.D },
    { dim: "I", valor: scores.I },
    { dim: "S", valor: scores.S },
    { dim: "C", valor: scores.C },
  ];
  entradas.sort((a, b) => b.valor - a.valor);

  const dominante = entradas[0].dim;
  const combinado =
    entradas[0].dim + "/" + entradas[1].dim;

  return {
    dominante,
    dominanteNome: NOME_DIMENSAO[dominante],
    combinado,
    combinadoNome: `${NOME_DIMENSAO[entradas[0].dim]}/${NOME_DIMENSAO[entradas[1].dim]}`,
  };
}