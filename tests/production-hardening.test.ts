import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PDFParse } from "pdf-parse";
import { Markdown } from "../lib/markdown";
import { gerarParecerPdf } from "../lib/pdf/parecerDisc";
import { validarArquivoCurriculo } from "../lib/talentos/curriculo";
import { entrevistaSchema } from "../lib/schemas/candidato.schema";

test("curriculum upload requires a matching extension, MIME and file signature", async () => {
  const validPdf = new File(
    [Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37])],
    "resume.pdf",
    { type: "application/pdf" },
  );
  const spoofedPdf = new File(
    [Uint8Array.from([0x4d, 0x5a, 0x00, 0x00])],
    "resume.pdf",
    { type: "application/pdf" },
  );
  const mismatchedMime = new File(
    [Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d])],
    "resume.pdf",
    { type: "image/jpeg" },
  );

  assert.deepEqual(await validarArquivoCurriculo(validPdf), { ok: true });
  assert.equal((await validarArquivoCurriculo(spoofedPdf)).ok, false);
  assert.equal((await validarArquivoCurriculo(mismatchedMime)).ok, false);
});

test("interview schema rejects invalid dates and non-HTTP video links", () => {
  const base = {
    candidatura_id: "00000000-0000-4000-8000-000000000001",
    data_hora: "2026-02-28T15:00:00.000Z",
  };
  assert.equal(entrevistaSchema.safeParse(base).success, true);
  assert.equal(
    entrevistaSchema.safeParse({ ...base, data_hora: "not-a-date" }).success,
    false,
  );
  assert.equal(
    entrevistaSchema.safeParse({ ...base, data_hora: "2026-02-31T15:00:00.000Z" }).success,
    false,
  );
  assert.equal(
    entrevistaSchema.safeParse({ ...base, link_video: "javascript:alert(1)" }).success,
    false,
  );
});

test("Markdown rendering does not emit raw HTML or executable links", () => {
  const html = renderToStaticMarkup(
    createElement(Markdown, {
      content: '<script>alert("xss")</script>\n\n<img src=x onerror=alert(1)>\n\n[link](javascript:alert(1))',
    }),
  );

  assert.doesNotMatch(html, /<script|<img|onerror|javascript:/i);
});

test("DISC PDF generation resolves with a readable synthetic PDF", async () => {
  const buffer = await gerarParecerPdf({
    empresa: "Empresa Sintetica",
    candidato: "Pessoa Sintetica",
    cargo: "Vaga Sintetica",
    observacoesEntrevista: "Dados ficticios.",
    formacao: "Nao informada.",
    historicoProfissional: "Nao informado.",
    instrumentos: ["Questionario sintetico"],
    analisePerfil: "Texto ficticio para teste.",
    conclusao: "Este teste nao representa uma avaliacao real.",
  });

  assert.equal(buffer.subarray(0, 5).toString("ascii"), "%PDF-");
  assert(buffer.length > 1000);

  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const extracted = await parser.getText();
    assert.match(extracted.text, /Pessoa Sintetica/);
    assert.match(extracted.text, /Empresa Sintetica/);
    assert.match(extracted.text, /nao representa uma avaliacao real/i);
  } finally {
    await parser.destroy();
  }
});
