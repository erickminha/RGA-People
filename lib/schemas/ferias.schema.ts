import { z } from "zod";

export const solicitacaoFeriasSchema = z
  .object({
    data_inicio: z
      .string({ required_error: "Data de início é obrigatória" })
      .min(1, "Data de início é obrigatória"),
    data_fim: z
      .string({ required_error: "Data de fim é obrigatória" })
      .min(1, "Data de fim é obrigatória"),
    abono_pecuniario: z.boolean().default(false),
    dias_abono: z.coerce
      .number()
      .int("Use um número inteiro")
      .min(0, "Mínimo 0 dias")
      .max(10, "Abono pecuniário: máximo 10 dias (1/3 do período)")
      .default(0),
    observacoes: z
      .string()
      .max(500, "Máximo 500 caracteres")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => new Date(data.data_fim) >= new Date(data.data_inicio),
    {
      message: "Data de fim deve ser igual ou posterior à data de início",
      path: ["data_fim"],
    }
  )
  .refine(
    (data) => {
      const inicio = new Date(data.data_inicio);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      // Antecedência mínima de 30 dias (CLT, Art. 135)
      const diff = (inicio.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 30;
    },
    {
      message: "Solicite com pelo menos 30 dias de antecedência (CLT Art. 135)",
      path: ["data_inicio"],
    }
  )
  .refine(
    (data) => {
      const inicio = new Date(data.data_inicio);
      const fim = new Date(data.data_fim);
      const dias =
        Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) +
        1;
      // CLT: cada período não pode ser menor que 5 dias corridos
      return dias >= 5;
    },
    {
      message: "Cada período de férias deve ter no mínimo 5 dias corridos",
      path: ["data_fim"],
    }
  );

export type SolicitacaoFeriasInput = z.infer<typeof solicitacaoFeriasSchema>;
