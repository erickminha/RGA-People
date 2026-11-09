import { obterPerfil, comportamentoPorDimensao, type PerfilDiscDados } from "@/lib/disc/perfis";
import type { ScoresDisc } from "@/lib/disc/score";

/**
 * Geração do parecer DISC com IA (OpenRouter), com fallback local pelos
 * textos do banco de perfis. A chave vem de OPENROUTER_API_KEY (cofre) e
 * nunca é embutida no código.
 */

const MODELO = process.env.OPENROUTER_MODEL ?? "openrouter/auto";

async function chamarOpenRouter(prompt: string, maxTokens: number): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY não configurada. Cadastre a chave no cofre/secret do ambiente."
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODELO,
        messages: [
          {
            role: "system",
            content:
              "Você é um analista DISC experiente e especialista em recursos humanos. Forneça análises detalhadas, profissionais e em português.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    return content.trim() || null;
  } catch (e) {
    console.error("[disc-ia]", (e as Error).message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Comportamento esperado (até ~400 caracteres). SAÍDA IA com fallback local. */
export async function gerarComportamento(
  dominante: string,
  scores: ScoresDisc
): Promise<string> {
  const prompt = `Com base no perfil DISC:
- Dominância: ${scores.D}
- Influência: ${scores.I}
- Estabilidade: ${scores.S}
- Conformidade: ${scores.C}

Gere um COMPORTAMENTO ESPERADO de ATÉ 400 caracteres. Descreva como esta pessoa tende a se comportar no ambiente de trabalho. Seja direto, objetivo e detalhado.`;

  try {
    const resposta = await chamarOpenRouter(prompt, 150);
    if (resposta) return resposta.slice(0, 400);
  } catch {
    /* fallback abaixo */
  }
  return comportamentoPorDimensao(dominante) + " (Modo Manual - Fallback de API)";
}

/** Avaliação completa do perfil (IA) com fallback local por perfil combinado. */
export async function gerarAvaliacao(
  combinado: string,
  scores: ScoresDisc
): Promise<string> {
  const perfil = obterPerfil(combinado);

  const prompt = `Analise os scores DISC fornecidos e gere uma avaliação em português. Identifique o perfil predominante com base nas duas dimensões mais altas e adapte o conteúdo.

Scores DISC:
- Dominância: ${scores.D}
- Influência: ${scores.I}
- Estabilidade: ${scores.S}
- Conformidade: ${scores.C}

Use o seguinte formato EXATO:
O candidato apresenta um perfil [PERFIL] elevada, o que indica uma pessoa [CARACTERÍSTICAS] que valoriza [VALORES]. Tende a ser [COMPORTAMENTOS]. Prefere trabalhar em [AMBIENTE IDEAL].

Forças:
1. [FORÇA 1]
2. [FORÇA 2]
3. [FORÇA 3]

O perfil DISC do candidato revela um profissional [DESCRIÇÃO PROFISSIONAL] que valoriza [VALORES NO TRABALHO] no ambiente de trabalho.

Sua [CARACTERÍSTICA 1] e [CARACTERÍSTICA 2] o tornam ideal para [FUNÇÕES], onde a [HABILIDADES-CHAVE] são essenciais.`;

  try {
    const resposta = await chamarOpenRouter(prompt, 800);
    if (resposta) return resposta;
  } catch {
    /* fallback abaixo */
  }
  return montarAvaliacaoManual(perfil);
}

/** Monta a avaliação usando o banco local de perfis (fallback). */
export function montarAvaliacaoManual(perfil: PerfilDiscDados): string {
  let analise = `O candidato apresenta um perfil **${perfil.nome}** elevada, o que indica uma pessoa **${perfil.caracteristicas}**, que valoriza **${perfil.valores}**. Tende a ser **${perfil.comportamentos}**. Prefere trabalhar em **${perfil.ambiente}**.\n\n`;
  analise += "**Forças:**\n";
  perfil.forcas.forEach((f, i) => {
    analise += `${i + 1}. **${f}**\n`;
  });
  analise += `\nO perfil DISC do candidato revela um profissional **${perfil.descricaoProfissional}**, que valoriza **${perfil.valoresTrabalho}** no ambiente de trabalho.\n\n`;
  analise += `Sua **${perfil.caracteristica1}** e **${perfil.caracteristica2}** o tornam ideal para **${perfil.funcoes}**, onde a **${perfil.habilidadesChave}** são essenciais.`;
  return analise;
}