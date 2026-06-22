import { z } from "zod";

export const convidarColaboradorSchema = z.object({
  email: z
    .string({ required_error: "Email obrigatório" })
    .email("Email inválido")
    .toLowerCase(),
  nome_completo: z
    .string()
    .min(3, "Nome muito curto")
    .max(120, "Máximo 120 caracteres"),
  cargo_id: z
    .string({ required_error: "Selecione um cargo" })
    .uuid("Cargo inválido"),
});

export const editarColaboradorSchema = z.object({
  perfil_id: z.string().uuid(),
  nome_completo: z.string().min(3).max(120),
  cargo_id: z.string().uuid(),
  salario: z.coerce
    .number()
    .min(0, "Salário não pode ser negativo")
    .max(9999999, "Valor inválido")
    .optional()
    .nullable(),
});

export type ConvidarColaboradorInput = z.infer<typeof convidarColaboradorSchema>;
export type EditarColaboradorInput = z.infer<typeof editarColaboradorSchema>;
