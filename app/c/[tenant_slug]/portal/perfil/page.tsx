import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PerfilPage({
  params,
}: {
  params: { tenant_slug: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/c/${params.tenant_slug}/login`);
  }

  const { data: perfil, error } = await supabase
    .from("perfis")
    .select("nome_completo, email, avatar_url, cargos(nome)")
    .eq("id", user.id)
    .single();

  if (error || !perfil) {
    // Tratar erro ou perfil não encontrado
    return <div className="text-red-500">Erro ao carregar perfil.</div>;
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Meu Perfil</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          {perfil.avatar_url ? (
            <img
              src={perfil.avatar_url}
              alt="Avatar do Usuário"
              className="w-24 h-24 rounded-full mr-4 object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full mr-4 bg-gray-300 flex items-center justify-center text-gray-600 text-4xl font-bold">
              {perfil.nome_completo ? perfil.nome_completo[0] : "U"}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-semibold text-gray-700">{perfil.nome_completo}</h2>
            <p className="text-gray-600">{perfil.email}</p>
            <p className="text-gray-600">Cargo: {perfil.cargos?.nome || "Não Definido"}</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-3">Dados Pessoais</h3>
          <p className="text-gray-600">**Nome Completo:** {perfil.nome_completo}</p>
          <p className="text-gray-600">**E-mail:** {perfil.email}</p>
          {/* Adicionar mais campos de dados pessoais e um formulário de edição */}
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Editar Perfil
          </button>
        </div>
      </div>
    </div>
  );
}
