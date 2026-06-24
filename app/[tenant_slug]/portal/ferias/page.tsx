import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Plane } from "lucide-react";
import SaldoFeriasCards from "@/components/modules/ferias/SaldoFeriasCards";
import HistoricoFeriasTable from "@/components/modules/ferias/HistoricoFeriasTable";
import SolicitacaoFeriasForm from "@/components/modules/ferias/SolicitacaoFeriasForm";

interface PageProps {
  params: { tenant_slug: string };
}

export const dynamic = "force-dynamic";

interface SolicitacaoRow {
  id: string;
  data_inicio: string;
  data_fim: string;
  status: "pendente" | "aprovada" | "rejeitada" | "cancelada" | string;
  criado_em: string;
}

/**
 * Cálculo simplificado de saldo:
 * - 30 dias adquiridos por período aquisitivo de 12 meses desde a admissão.
 * - Vencidos: períodos com mais de 12 meses do vencimento concessivo.
 * - Em produção, integrar com módulo de admissão (data_admissao em `perfis`).
 */
function calcularSaldo(
  dataAdmissao: Date | null,
  solicitacoes: SolicitacaoRow[]
) {
  if (!dataAdmissao) {
    return { disponiveis: 0, vencidos: 0, usados: 0, periodoAquisitivo: "—" };
  }

  const hoje = new Date();
  const mesesTrabalhados = Math.floor(
    (hoje.getTime() - dataAdmissao.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );
  const periodosAdquiridos = Math.floor(mesesTrabalhados / 12);
  const totalAdquirido = periodosAdquiridos * 30;

  const usados = solicitacoes
    .filter((s) => s.status === "aprovada")
    .reduce((acc, s) => {
      const dias =
        Math.ceil(
          (new Date(s.data_fim).getTime() -
            new Date(s.data_inicio).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;
      return acc + dias;
    }, 0);

  const pendentes = solicitacoes
    .filter((s) => s.status === "pendente")
    .reduce((acc, s) => {
      const dias =
        Math.ceil(
          (new Date(s.data_fim).getTime() -
            new Date(s.data_inicio).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;
      return acc + dias;
    }, 0);

  const disponiveis = Math.max(0, totalAdquirido - usados - pendentes);

  // Vencidos: períodos adquiridos há mais de 24 meses não usufruídos
  const periodosVencidos = Math.max(0, periodosAdquiridos - 2);
  const vencidos = Math.max(0, periodosVencidos * 30 - usados);

  const inicioPeriodo = new Date(dataAdmissao);
  inicioPeriodo.setFullYear(
    dataAdmissao.getFullYear() + periodosAdquiridos
  );
  const fimPeriodo = new Date(inicioPeriodo);
  fimPeriodo.setFullYear(inicioPeriodo.getFullYear() + 1);

  return {
    disponiveis,
    vencidos: Math.min(vencidos, disponiveis),
    usados,
    pendentes,
    periodoAquisitivo: `${inicioPeriodo.toLocaleDateString(
      "pt-BR"
    )} a ${fimPeriodo.toLocaleDateString("pt-BR")}`,
  };
}

export default async function FeriasPage({ params }: PageProps) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/c/${params.tenant_slug}/login`);

  // Perfil (para data de admissão — assumindo coluna existente ou criado_em como fallback)
  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome_completo, criado_em")
    .eq("id", user.id)
    .single();

  // Histórico
  const { data: solicitacoes } = await supabase
    .from("ferias_solicitacoes")
    .select("id, data_inicio, data_fim, status, criado_em")
    .eq("perfil_id", user.id)
    .order("data_inicio", { ascending: false });

  const historico = (solicitacoes ?? []) as SolicitacaoRow[];
  const dataAdmissao = perfil?.criado_em ? new Date(perfil.criado_em) : null;
  const saldo = calcularSaldo(dataAdmissao, historico);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Cabeçalho */}
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-sky-50 rounded-lg">
            <Plane className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Minhas Férias
            </h1>
            <p className="text-sm text-gray-500">
              Saldo, solicitações e histórico de períodos
            </p>
          </div>
        </div>
      </header>

      {/* Saldo */}
      <SaldoFeriasCards saldo={saldo} />

      {/* Grid: Formulário + Histórico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SolicitacaoFeriasForm
            tenantSlug={params.tenant_slug}
            diasDisponiveis={saldo.disponiveis}
          />
        </div>
        <div className="lg:col-span-2">
          <HistoricoFeriasTable
            historico={historico}
            tenantSlug={params.tenant_slug}
          />
        </div>
      </div>
    </div>
  );
}
