import pdfMakeModule from "pdfmake/build/pdfmake";
import pdfFontsModule from "pdfmake/build/vfs_fonts";
import type { TVirtualFileSystem, TDocumentDefinitions } from "pdfmake/interfaces";

pdfMakeModule.addVirtualFileSystem(pdfFontsModule as TVirtualFileSystem);

export interface DadosParecerPdf {
  empresa: string;
  candidato: string;
  cargo: string;
  observacoesEntrevista: string;
  formacao: string;
  historicoProfissional: string;
  instrumentos: string[];
  analisePerfil: string;   // avaliação completa (texto IA/fallback)
  referenciaProfissional?: string;
  antecedentesCriminais?: string;
  conclusao: string;
}

function semAsteriscos(texto: string): string {
  return texto.replace(/\*\*/g, "");
}

/** Gera o PDF do parecer e retorna um Buffer. */
export async function gerarParecerPdf(dados: DadosParecerPdf): Promise<Buffer> {
  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40],
    content: [
      { text: "RGA Consultoria de RH", style: "tituloEmpresa" },
      { text: "Parecer de Candidato", style: "tituloDoc", margin: [0, 4, 0, 16] },
      {
        columns: [
          [
            { text: `Empresa: ${dados.empresa}` },
            { text: `Candidato: ${dados.candidato}` },
            { text: `Cargo: ${dados.cargo}` },
          ],
        ],
        style: "cabecalho",
      },

      { text: "Dados Pessoais e sobre a entrevista", style: "secao" },
      { text: semAsteriscos(dados.observacoesEntrevista), style: "corpo" },
      { text: `Formação acadêmica: ${dados.formacao || "Não informada"}`, style: "corpo" },

      { text: "Breve Histórico Profissional", style: "secao" },
      { text: dados.historicoProfissional || "Não informado.", style: "corpo" },

      { text: "Instrumentos de Avaliação Utilizados", style: "secao" },
      {
        ul: (
          dados.instrumentos.length
            ? dados.instrumentos
            : ["Entrevista Comportamental", "DISC - Teste de personalidade e perfil comportamental"]
        ).map((i) => ({ text: i })),
        style: "corpo",
      },

      { text: "Avaliação do perfil do candidato", style: "secao" },
      { text: semAsteriscos(dados.analisePerfil), style: "corpo" },

      { text: "Referência Profissional", style: "secao" },
      { text: dados.referenciaProfissional || "Não informada.", style: "corpo" },

      { text: "Antecedentes criminais", style: "secao" },
      { text: dados.antecedentesCriminais || "Não verificado nesta etapa.", style: "corpo" },

      { text: "Conclusão", style: "secao" },
      { text: semAsteriscos(dados.conclusao), style: "corpo" },

      { text: "RGA Consultoria de RH", style: "assinatura", margin: [0, 28, 0, 0] },
    ],
    styles: {
      tituloEmpresa: { fontSize: 18, bold: true, color: "#4f46e5" },
      tituloDoc: { fontSize: 20, bold: true, color: "#111827" },
      cabecalho: { fontSize: 11, margin: [0, 0, 0, 10] },
      secao: { fontSize: 13, bold: true, color: "#111827", margin: [0, 14, 0, 4] },
      corpo: { fontSize: 11, lineHeight: 1.4, margin: [0, 0, 0, 6] },
      assinatura: { fontSize: 11, bold: true, color: "#4f46e5" },
    },
  };

  const buffer = await pdfMakeModule.createPdf(docDefinition).getBuffer();
  return Buffer.from(buffer);
}