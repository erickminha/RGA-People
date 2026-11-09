import assert from "node:assert/strict";
import { test } from "node:test";
import { PERGUNTAS_DISC } from "../lib/disc/perguntas";
import { calcularScores, validarRespostas } from "../lib/disc/score";

function permutations(values: number[]): number[][] {
  if (values.length === 0) return [[]];
  return values.flatMap((value, index) =>
    permutations(values.filter((_, itemIndex) => itemIndex !== index)).map((tail) => [
      value,
      ...tail,
    ]),
  );
}

test("every valid ranking assigns 100 points across the four dimensions", () => {
  const rankedOptions = permutations([1, 2, 3, 4]);
  assert.equal(rankedOptions.length, 24);

  for (const ranking of rankedOptions) {
    const answers = Object.fromEntries(
      PERGUNTAS_DISC.map((question) => [
        String(question.id),
        Object.fromEntries(
          question.opcoes.map((option, index) => [option.rotulo, ranking[index]]),
        ),
      ]),
    );

    assert.equal(validarRespostas(answers), true);
    const scores = calcularScores(answers);
    assert.equal(Object.values(scores).reduce((sum, score) => sum + score, 0), 100);
    assert(Object.values(scores).every((score) => score >= 10 && score <= 40));
  }
});

test("invalid or incomplete DISC answer sets are rejected", () => {
  assert.equal(validarRespostas({}), false);

  const answers = Object.fromEntries(
    PERGUNTAS_DISC.map((question) => [
      String(question.id),
      Object.fromEntries(question.opcoes.map((option, index) => [option.rotulo, 4 - index])),
    ]),
  );
  const firstQuestion = PERGUNTAS_DISC[0];
  answers[String(firstQuestion.id)][firstQuestion.opcoes[1].rotulo] = 4;

  assert.equal(validarRespostas(answers), false);
});
