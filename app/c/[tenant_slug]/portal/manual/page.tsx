import { createClient } from "@/lib/supabase/server";
import { BookOpen } from "lucide-react";
import { redirect } from "next/navigation";

interface PageProps {
  params: { tenant_slug: string };
}

export const dynamic = "force-dynamic";

export default async function ManualPage({ params }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/c/${params.tenant_slug}/login`);

  const { data: manual } = await supabase
    .from("manuais")
    .select("*")
    .order("atualizado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <header className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-blue-50 rounded-lg">
          <BookOpen className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {manual?.titulo || "Manual do Colaborador"}
          </h1>
          <p className="text-sm text-gray-500">
            Guia de cultura, normas e procedimentos da empresa
          </p>
        </div>
      </header>

      <article className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm prose prose-blue max-w-none">
        {manual ? (
          <div dangerouslySetInnerHTML={{ __html: manual.conteudo }} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>O manual da empresa ainda não foi publicado.</p>
          </div>
        )}
      </article>
    </div>
  );
}
