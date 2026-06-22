import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm'; // Componente client-side com React Hook Form
import Image from 'next/image';

export default async function TenantLoginPage({
  params
}: {
  params: { tenant_slug: string }
}) {
  const supabase = createClient();
  
  // Verifica se já está logado para evitar re-login
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    redirect(`/c/${params.tenant_slug}/portal`);
  }

  // Busca logo da empresa para exibir na tela de login
  const { data: empresa } = await supabase
    .from('empresas')
    .select('nome, logo_url')
    .eq('slug', params.tenant_slug)
    .single();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {empresa?.logo_url ? (
          <Image 
            src={empresa.logo_url} 
            alt={`Logo ${empresa.nome}`} 
            width={150} 
            height={50} 
            className="mx-auto"
          />
        ) : (
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {empresa?.nome || 'Portal do Colaborador'}
          </h2>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm tenantSlug={params.tenant_slug} />
        </div>
      </div>
    </div>
  );
}
