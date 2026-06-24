"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  Plane,
  FileText,
  Award,
  Smile,
  Plus,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import KpiCard from "@/components/modules/admin/KpiCard";
import DashboardCharts from "@/components/modules/admin/DashboardCharts";
import AtalhosRapidos from "@/components/modules/admin/AtalhosRapidos";
import AprovacoesFeriasPendentes from "@/components/modules/admin/AprovacoesFeriasPendentes";
import ConvidarColaboradorModal from "@/components/modules/admin/ConvidarColaboradorModal";

interface PerguntaClima {
  id: string;
  tipo: string;
  texto: string;
  dimensao?: string;
}

export default function AdminPage({
  params,
}: {
  params: { tenant_slug: string };
}) {
  const [dados, setDados] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConvidarOpen, setIsConvidarOpen] = useState(false);
  const [cargos, setCargos] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Buscar dados do admin
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push(`/c/${params.tenant_slug}/login`);
          return;
        }

        const { data: perfil } = await supabase
          .from("perfis")
          .select("*, cargo:cargos(*)")
          .eq("id", session.user.id)
          .single();

        if (!perfil?.cargo?.permissoes?.rh_admin && !perfil?.cargo?.permissoes?.super_admin) {
          router.push(`/c/${params.tenant_slug}/portal`);
          return;
        }

        // Buscar cargos para o modal
        const { data: cargosData } = await supabase
          .from("cargos")
          .select("*")
          .eq("empresa_id", perfil.empresa_id);
        setCargos(cargosData || []);

        setDados({
          nomeCompleto: perfil.nome_completo,
          totalColaboradores: 5,
          feriasPendentes: 2,
          contrachequesMes: 3,
          avaliacoesAbertas: 1,
          indiceClima: 78,
          statusFerias: [
            { name: "Aprovadas", value: 8 },
            { name: "Pendentes", value: 2 },
            { name: "Rejeitadas", value: 1 },
            { name: "Canceladas", value: 0 },
          ],
          climaDimensoes: [
            { dimensao: "Liderança", media: 4.2 },
            { dimensao: "Comunicação", media: 3.8 },
            { dimensao: "Desenvolvimento", media: 4.0 },
          ],
          solicitacoesPendentes: [],
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarDados();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Cabeçalho */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-lg">
            <Shield className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Painel do RH</h1>
            <p className="text-sm text-gray-500">
              Olá, <strong>{dados?.nomeCompleto}</strong> — visão executiva da gestão de pessoas
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsConvidarOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Convidar Colaborador
        </button>
      </header>

      {/* KPIs */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            label="Colaboradores"
            valor={dados?.totalColaboradores ?? 0}
            Icon={Users}
            cor="indigo"
            hint="Total ativos"
          />
          <KpiCard
            label="Férias pendentes"
            valor={dados?.feriasPendentes ?? 0}
            Icon={Plane}
            cor="amber"
            hint="Aguardando aprovação"
            destaque={(dados?.feriasPendentes ?? 0) > 0}
          />
          <KpiCard
            label="Contracheques"
            valor={dados?.contrachequesMes ?? 0}
            Icon={FileText}
            cor="emerald"
            hint="Este mês"
          />
          <KpiCard
            label="Avaliações"
            valor={dados?.avaliacoesAbertas ?? 0}
            Icon={Award}
            cor="violet"
            hint="Em aberto"
          />
          <KpiCard
            label="Clima"
            valor={`${dados?.indiceClima ?? 0}%`}
            Icon={Smile}
            cor="rose"
            hint="Satisfação"
          />
        </div>
      </section>

      {/* Gráficos */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Visão Analítica
        </h2>
        <DashboardCharts
          statusFerias={dados?.statusFerias || []}
          climaDimensoes={dados?.climaDimensoes || []}
        />
      </section>

      {/* Atalhos */}
      <AtalhosRapidos tenantSlug={params.tenant_slug} />

      {/* Aprovações Pendentes */}
      <AprovacoesFeriasPendentes
        solicitacoes={dados?.solicitacoesPendentes || []}
        tenantSlug={params.tenant_slug}
      />

      {/* Modal de Convite */}
      <ConvidarColaboradorModal
        isOpen={isConvidarOpen}
        onClose={() => setIsConvidarOpen(false)}
        cargos={cargos}
        tenantSlug={params.tenant_slug}
      />
    </div>
  );
}
