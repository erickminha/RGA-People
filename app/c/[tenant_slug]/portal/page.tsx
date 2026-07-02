import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { 
  LayoutDashboard, 
  Plane, 
  FileText, 
  Award, 
  Gift, 
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: { tenant_slug: string };
}

export const dynamic = "force-dynamic";

export default async function PortalDashboardPage({ params }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/c/${params.tenant_slug}/login`);
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome_completo, cargo:cargos(nome)")
    .eq("id", user.id)
    .single();

  // Buscar resumos para o dashboard
  const [{ count: feriasPendentes }, { data: ultimoContracheque }] = await Promise.all([
    supabase
      .from("ferias_solicitacoes")
      .select("*", { count: "exact", head: true })
      .eq("perfil_id", user.id)
      .eq("status", "pendente"),
    supabase
      .from("contracheques")
      .select("mes_ano")
      .eq("perfil_id", user.id)
      .order("mes_ano", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const saudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  };

  const cards = [
    {
      title: "Férias",
      desc: feriasPendentes ? `${feriasPendentes} solicitação pendente` : "Tudo em dia",
      icon: Plane,
      href: "/portal/ferias",
      color: "text-sky-600",
      bg: "bg-sky-50"
    },
    {
      title: "Contracheques",
      desc: ultimoContracheque ? `Último: ${ultimoContracheque.mes_ano}` : "Nenhum disponível",
      icon: FileText,
      href: "/portal/contracheques",
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "Avaliações",
      desc: "Ciclo 2026 em breve",
      icon: Award,
      href: "/portal/avaliacao",
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      title: "Benefícios",
      desc: "Confira seus planos",
      icon: Gift,
      href: "/portal/beneficios",
      color: "text-rose-600",
      bg: "bg-rose-50"
    }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">
          {saudacao()}, {perfil?.nome_completo?.split(" ")[0]}!
        </h1>
        <p className="text-gray-500 mt-1">
          {(perfil?.cargo as any)?.nome || "Colaborador"} — Bem-vindo ao seu portal de RH.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link 
            key={card.title} 
            href={`/c/${params.tenant_slug}${card.href}`}
            className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
          >
            <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center mb-4`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {card.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Próximos Eventos / Avisos */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            Comunicados e Avisos
          </h2>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Novo Manual do Colaborador</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Atualizamos nossas políticas internas e código de conduta. Não deixe de ler!
                </p>
                <Link 
                  href={`/c/${params.tenant_slug}/portal/documentos`}
                  className="inline-block mt-3 text-sm font-medium text-blue-600 hover:underline"
                >
                  Ler agora →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Simples */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Atividade Recente
          </h2>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex gap-3">
              <div className="mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Login realizado</p>
                <p className="text-xs text-gray-500">Hoje às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-1">
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Ciclo de avaliações</p>
                <p className="text-xs text-gray-500">Inicia em 15 dias</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
