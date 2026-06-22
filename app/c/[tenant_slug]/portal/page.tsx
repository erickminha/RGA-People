import { createClient } from "@/lib/supabase/server";

export default async function PortalDashboard({
  params,
}: {
  params: { tenant_slug: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome_completo")
    .eq("id", user?.id)
    .single();

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Widget de Boas-vindas */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Bem-vindo(a), {perfil?.nome_completo || user?.email}!</h2>
        <p className="text-gray-600">Aqui você encontra as principais informações e novidades da sua empresa.</p>
      </div>

      {/* Feed de Notícias Corporativas */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Notícias Corporativas</h2>
        <p className="text-gray-600">Nenhuma notícia disponível no momento.</p>
        {/* Futuramente, aqui será listado o feed de notícias isolado por empresa */}
      </div>
    </div>
  );
}
