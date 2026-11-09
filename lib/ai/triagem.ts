/**
 * Triagem de currículo com IA via OpenRouter.
 *
 * A chave de API NUNCA é embutida no código: é lida de `OPENROUTER_API_KEY`
 * (variável de ambiente no cofre/secret do deploy). Sem ela, a função se
 * recusa a chamar o provedor.
 */

export interface ResultadoTriagem {
  score: number; // 0 a 100
  resumo: string;
}

const MODELO = process.env.OPENROUTER_MODEL ?? "openrouter/auto";

/**
 * Classifica o currículo em relação aos requisitos da vaga.
 * Retorna match de 0 a 100 e um breve resumo.
 */
export async function triarComIa(
  requisitos: string,
  textoCurriculo: string
): Promise<ResultadoTriagem | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY não configurada. Cadastre a chave no cofre/secret do ambiente."
    );
  }

  if (!textoCurriculo.trim() || !requisitos.trim()) {
    return null; // sem conteúdo suficiente para triar
  }

  const prompt = `Você é um recrutador sênior. Compare o currículo abaixo com os REQUISITOS da vaga e responda APENAS em JSON: {"score": number (0 a 100), "resumo": string (máx 2 frases em português)}.

REQUISITOS DA VAGA:
${requisitos.slice(0, 3000)}

CURRÍCULO DO CANDIDATO:
${textoCurriculo.slice(0, 12000)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODELO,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error("[triagem] openrouter http", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    const json = content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json);

    return {
      score: Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),
      resumo: typeof parsed.resumo === "string" ? parsed.resumo.slice(0, 500) : "",
    };
  } catch (e) {
    console.error("[triagem] openrouter:", (e as Error).message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}