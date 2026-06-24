import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  Stethoscope,
  Utensils,
  GraduationCap,
  Gift,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface PageProps {
  params: { tenant_slug: string };
}

interface Beneficio {
  id: string;
  nome: string;
  descricao: string | null;
  url_parceiro: string | null;
}

export const dynamic = "force-dynamic";

// Mapeia categorias de benefício para ícone + cor
function getIconePorNome(nome: string) {
  const n = nome.toLowerCase();
  if (n.includes("saúde") || n.includes("saude"))
    return { Icon: Heart, bg: "bg-rose-50", text: "text-rose-600" };
  if (n.includes("odonto"))
    return { Icon: Stethoscope, bg: "bg-cyan-50", text: "text-cyan-600" };
  if (n.includes("refeição") || n.includes("refeicao") || n.includes("vr") || n.includes("va"))
    return { Icon: Utensils, bg: "bg-amber-50", text: "text-amber-600" };
  if (n.includes("educação") || n.includes("educacao") || n.includes("curso"))
    return { Icon: GraduationCap, bg: "bg-indigo-50", text: "text-indigo-600" };
  return { Icon: Gift, bg: "bg-emerald-50", text: "text-emerald-600" };
}

export default async function BeneficiosPage({ params }: PageProps) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/c/${params.tenant_slug}/login`);
  }

  const { data: beneficios } = await supabase
    .from("beneficios")
    .select("id, nome, descricao, url_parceiro")
    .order("nome", { ascending: true });

  const lista = (beneficios ?? []) as Beneficio[];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-emerald-50 rounded-lg">
            <Sparkles className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Meus Benefícios
            </h1>
            <p className="text-sm text-gray-500">
              Tudo o que sua empresa oferece para o seu bem-estar
            </p>
          </div>
        </div>
      </header>

      {/* Estado vazio */}
      {lista.length === 0 && (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">
            Nenhum benefício cadastrado ainda
          </p>
          <p className="text-sm text-gray-500 mt-1">
            O RH cadastrará os benefícios em breve.
          </p>
        </div>
      )}

      {/* Grid de cards */}
      {lista.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {lista.map((b) => {
            const { Icon, bg, text } = getIconePorNome(b.nome);
            return (
              <article
                key={b.id}
                className="group bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${bg}`}>
                    <Icon className={`w-6 h-6 ${text}`} />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-700 rounded-full">
                    Ativo
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 text-lg mb-1.5">
                  {b.nome}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
                  {b.descricao ?? "Sem descrição disponível."}
                </p>

                {b.url_parceiro ? (
                  <Link
                    href={b.url_parceiro}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Acessar portal do parceiro
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="text-xs text-gray-400">
                    Sem link de parceiro
                  </span>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
