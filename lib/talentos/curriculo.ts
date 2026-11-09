import {
  EXTENSOES_CURRICULO,
  MAX_CURRICULO_BYTES,
  MIME_CURRICULO,
} from "../schemas/candidato.schema";

export interface ValidacaoArquivo {
  ok: boolean;
  msg?: string;
}

export function extensaoDoArquivo(nome: string): string {
  return nome.split(".").pop()?.toLowerCase() ?? "";
}

export async function validarArquivoCurriculo(file: File | null): Promise<ValidacaoArquivo> {
  if (!file || file.size === 0) {
    return { ok: false, msg: "Envie um arquivo de currículo." };
  }
  if (file.size > MAX_CURRICULO_BYTES) {
    return { ok: false, msg: "Arquivo muito grande (máx. 8 MB)." };
  }

  const ext = extensaoDoArquivo(file.name);
  const mimeDoArquivo = MIME_CURRICULO[file.type];
  const extensaoOk = (EXTENSOES_CURRICULO as readonly string[]).includes(ext);
  const mimeOk = mimeDoArquivo === ext || (ext === "jpeg" && mimeDoArquivo === "jpg");
  if (!extensaoOk || !mimeOk) {
    return { ok: false, msg: "Formato inválido. Use PDF, DOC, DOCX ou JPEG." };
  }

  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const assinaturas: Record<string, number[]> = {
    pdf: [0x25, 0x50, 0x44, 0x46, 0x2d],
    doc: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
    docx: [0x50, 0x4b, 0x03, 0x04],
    jpeg: [0xff, 0xd8, 0xff],
    jpg: [0xff, 0xd8, 0xff],
  };
  const assinatura = assinaturas[ext];
  if (!assinatura || !assinatura.every((byte, index) => header[index] === byte)) {
    return { ok: false, msg: "O conteúdo do arquivo não corresponde ao formato informado." };
  }

  return { ok: true };
}
