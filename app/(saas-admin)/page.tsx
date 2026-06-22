import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SaasAdminDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login'); // Login genérico da RGA
  }

  // Validação de Role - Apenas Super Admin pode acessar
  const { data: perfil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (perfil?.role !== 'Super_Admin') {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        Acesso Negado. Esta área é restrita à administração da RGA Consultoria.
      </div>
    );
  }

  // Busca todas as empresas clientes para listagem
  const { data: empresas } = await supabase
    .from('empresas')
    .select('*')
    .order('criado_em', { ascending: false });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Painel RGA - Gestão de Clientes SaaS</h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Empresas Cadastradas</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Novo Cliente
          </button>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {empresas?.map((empresa) => (
              <tr key={empresa.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{empresa.nome}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">/c/{empresa.slug}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${empresa.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {empresa.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href={`/saas-admin/empresas/${empresa.id}`} className="text-blue-600 hover:text-blue-900">Editar</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
