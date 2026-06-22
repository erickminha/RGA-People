import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';

export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { tenant_slug: string };
}) {
  const supabase = createClient();

  // Buscar os dados da empresa (branding) no Supabase
  const { data: empresa, error } = await supabase
    .from('empresas')
    .select('nome, slug, logo_url, cor_primaria, cor_secundaria, ativo')
    .eq('slug', params.tenant_slug)
    .single();

  if (error || !empresa) {
    notFound(); // Redireciona para página 404 se a empresa não existir
  }

  if (!empresa.ativo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Acesso Suspenso</h1>
          <p className="mt-2 text-gray-600">Entre em contato com o administrador do sistema.</p>
        </div>
      </div>
    );
  }

  // Injeção de variáveis CSS para o White-label
  // Usamos as cores hexadecimal vindas do banco e injetamos como variáveis globais
  const customStyles = `
    :root {
      --tenant-primary: ${empresa.cor_primaria || '#0f172a'};
      --tenant-secondary: ${empresa.cor_secundaria || '#334155'};
    }
  `;

  return (
    <div className="min-h-screen bg-slate-50 font-sans" data-tenant={empresa.slug}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      {/* Aqui os componentes filhos renderizam o Login ou o Dashboard do Portal */}
      {children}
    </div>
  );
}
