/**
 * Dados fixos do Teste DISC.
 *
 * São 10 perguntas; em cada uma o candidato distribui os valores 4, 3, 2, 1
 * (4 = mais representativo, 1 = menos representativo) entre as 4 opções,
 * SEM repetir. A ordem das opções mapeia a dimensão: 1=D, 2=I, 3=S, 4=C.
 */

export type DimensaoDisc = "D" | "I" | "S" | "C";

export interface OpcaoDisc {
  dimensao: DimensaoDisc;
  rotulo: string;
}

export interface PerguntaDisc {
  id: number;
  opcoes: OpcaoDisc[]; // sempre 4, na ordem D, I, S, C
}

export const PERGUNTAS_DISC: PerguntaDisc[] = [
  { id: 1, opcoes: [
    { dimensao: "D", rotulo: "Direcionado" },
    { dimensao: "I", rotulo: "Influente" },
    { dimensao: "S", rotulo: "Estável" },
    { dimensao: "C", rotulo: "Cuidadoso" },
  ]},
  { id: 2, opcoes: [
    { dimensao: "D", rotulo: "Confiante em si" },
    { dimensao: "I", rotulo: "Otimista" },
    { dimensao: "S", rotulo: "Deliberado" },
    { dimensao: "C", rotulo: "Contido" },
  ]},
  { id: 3, opcoes: [
    { dimensao: "D", rotulo: "Aventureiro" },
    { dimensao: "I", rotulo: "Entusiasmado" },
    { dimensao: "S", rotulo: "Previsível" },
    { dimensao: "C", rotulo: "Lógico" },
  ]},
  { id: 4, opcoes: [
    { dimensao: "D", rotulo: "Decisivo" },
    { dimensao: "I", rotulo: "Aberto" },
    { dimensao: "S", rotulo: "Paciente" },
    { dimensao: "C", rotulo: "Analítico" },
  ]},
  { id: 5, opcoes: [
    { dimensao: "D", rotulo: "Desafiador" },
    { dimensao: "I", rotulo: "Impulsivo" },
    { dimensao: "S", rotulo: "Equilibrado" },
    { dimensao: "C", rotulo: "Preciso" },
  ]},
  { id: 6, opcoes: [
    { dimensao: "D", rotulo: "Incansável" },
    { dimensao: "I", rotulo: "Emotivo" },
    { dimensao: "S", rotulo: "Protetor" },
    { dimensao: "C", rotulo: "Contestador" },
  ]},
  { id: 7, opcoes: [
    { dimensao: "D", rotulo: "Competitivo" },
    { dimensao: "I", rotulo: "Persuasivo" },
    { dimensao: "S", rotulo: "Acomodado" },
    { dimensao: "C", rotulo: "Curioso" },
  ]},
  { id: 8, opcoes: [
    { dimensao: "D", rotulo: "Assertivo" },
    { dimensao: "I", rotulo: "Falador" },
    { dimensao: "S", rotulo: "Modesto" },
    { dimensao: "C", rotulo: "Educado" },
  ]},
  { id: 9, opcoes: [
    { dimensao: "D", rotulo: "Experimentador" },
    { dimensao: "I", rotulo: "Sedutor" },
    { dimensao: "S", rotulo: "Fácil de conviver" },
    { dimensao: "C", rotulo: "Consistente" },
  ]},
  { id: 10, opcoes: [
    { dimensao: "D", rotulo: "Rigoroso" },
    { dimensao: "I", rotulo: "Sensível" },
    { dimensao: "S", rotulo: "Sincero" },
    { dimensao: "C", rotulo: "Perfeccionista" },
  ]},
];

export const NOME_DIMENSAO: Record<DimensaoDisc, string> = {
  D: "Dominância",
  I: "Influência",
  S: "Estabilidade",
  C: "Conformidade",
};