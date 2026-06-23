import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";
import CicloAvaliacaoCard from "@/components/modules/avaliacao/CicloAvaliacaoCard";

interface PageProps {
  params: { tenant_slug: string };
}

export const dynamic = "force-dynamic";

/**
 * Gera ciclos do ano corrente (semestrais).
 * Em produção, substituir por tabela `ciclos_avaliacao` configurável pelo RH.
 */
function gerarCiclosAtivos() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const semestre = hoje.getMonth() < 6 ? 1 : 2;

  return [
    {
      periodo: `${ano}-S${semestre}`,
      titulo: `Ciclo ${semestre}º Semestre/${ano}`,
      descricao: "Avaliação semestral de desempenho e desenvolvimento",
      data_abertura: new Date(ano, semestre === 1 ? 0 : 6, 1).toISOString(),
      data_fechamento: new Date(
        ano,
        semestre === 1 ? 5 : 11,
        30
      ).toISOString(),
      ativo: true,
    },
  ];
}

export default async function AvaliacaoPage({ params }: PageProps) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/c/${params.tenant_slug}/login`);

  const ciclos = gerarCiclosAtivos();

  // Busca avaliações já registradas do usuário
  const { data: avaliacoes } = await supabase
    .from("avaliacoes_desempenho")
    .select("id, periodo, auto_avaliacao, feedback_gestor, nota_final, criado_em")
    .eq("avaliado_id", user.id)
    .order("criado_em", { ascending: false });

  const avaliacoesMap = new Map(
    (avaliacoes ?? []).map((a) => [a.periodo, a])
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-violet-50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Avaliação de Desempenho
            </h1>
            <p className="text-sm text-gray-500">
              Ciclos abertos e histórico das suas avaliações
            </p>
          </div>
        </div>
      </header>

      {/* Ciclos ativos */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          Ciclos Abertos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ciclos.map((ciclo) => {
            const registro = avaliacoesMap.get(ciclo.periodo);
            return (
              <CicloAvaliacaoCard
                key={ciclo.periodo}
                ciclo={ciclo}
                jaEnviado={!!registro?.auto_avaliacao}
                tenantSlug={params.tenant_slug}
                avaliacaoId={registro?.id ?? null}
              />
            );
          })}
        </div>
      </section>

      {/* Histórico */}
      {avaliacoes && avaliacoes.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
            Histórico
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 text-xs uppercase">
                    Período
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 text-xs uppercase">
                    Auto-nota
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 text-xs uppercase">
                    Feedback Gestor
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 text-xs uppercase">
                    Enviado em
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {avaliacoes.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {a.periodo}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {a.nota_final ?? "—"} / 10
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {a.feedback_gestor ? (
                        <span className="text-emerald-600 font-medium">
                          Recebido
                        </span>
                      ) : (
                        <span className="text-gray-400">Aguardando</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(a.criado_em).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
