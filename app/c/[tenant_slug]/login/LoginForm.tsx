import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const FormSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

type FormSchemaType = z.infer<typeof FormSchema>;

export default function LoginForm({ tenantSlug }: { tenantSlug: string }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = async (data: FormSchemaType) => {
    setLoading(true);
    setMessage(null);

    // Em um cenário real, o fluxo de convite seria mais complexo, envolvendo
    // a verificação do token/magic link e o cadastro inicial.
    // Aqui, simulamos o envio de um magic link.
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: `${window.location.origin}/c/${tenantSlug}/portal`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Verifique seu e-mail para o link de acesso!" });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Endereço de E-mail
        </label>
        <div className="mt-1">
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            {...register("email")}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? "Enviando..." : "Acessar com Magic Link"}
        </button>
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded-md text-sm ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}
    </form>
  );
}
