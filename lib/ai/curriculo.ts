import { PDFParse } from "pdf-parse";
import * as mammoth from "mammoth";

/**
 * Extração de texto de currículos (PDF / DOC / DOCX) para triagem.
 * JPEG não possui texto embutido — retorna string vazia.
 */

/** Extrai texto de um arquivo de currículo em Buffer. */
export async function extrairTextoCurriculo(
  buffer: Buffer,
  mime: string | null,
  nome: string
): Promise<string> {
  const lower = nome.toLowerCase();

  if (mime === "application/pdf" || lower.endsWith(".pdf")) {
    return extrairTextoPdf(buffer);
  }

  if (
    mime?.includes("wordprocessingml") ||
    mime === "application/msword" ||
    lower.endsWith(".doc") ||
    lower.endsWith(".docx")
  ) {
    return extrairTextoDocx(buffer);
  }

  // JPEG: sem texto nativo
  return "";
}

async function extrairTextoPdf(buffer: Buffer): Promise<string> {
  try {
    const pdf = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await pdf.getText();
    const texto = (result.text ?? "").trim();
    // Libera recursos do worker apenas se o método existir
    if (typeof (pdf as any).destroy === "function") {
      await (pdf as any).destroy();
    }
    return texto.slice(0, 20000);
  } catch (e) {
    console.error("[curriculo] pdf:", (e as Error).message);
    return "";
  }
}

async function extrairTextoDocx(buffer: Buffer): Promise<string> {
  try {
    const { value } = await mammoth.extractRawText({ buffer });
    return (value ?? "").slice(0, 20000);
  } catch (e) {
    console.error("[curriculo] docx:", (e as Error).message);
    return "";
  }
}