"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Heart, 
  BookOpen, 
  ShieldCheck, 
  Building2,
  Users,
  BarChart3,
  LogOut 
} from "lucide-react";
import ViewModeSelector from "@/components/modules/admin/ViewModeSelector";

type ViewMode = "super_admin" | "rh" | "colaborador";

export default function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant_slug: string };
}) {
  const [perfil, setPerfil] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("super_admin");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/c/${params.tenant_slug}/login`);
        return;
      }

      const { data } = await supabase
        .from("perfis")
        .select("*, cargo:cargos(*)")
        .eq("id", session.user.id)
        .single();

      setPerfil(data);

      // Carregar modo de visualização salvo
      const savedMode = localStorage.getItem("viewMode") as ViewMode | null;
      if (savedMode && data?.cargo?.permissoes?.super_admin) {
        setViewMode(savedMode);
      }
      setIsLoading(false);
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = perfil?.cargo?.permissoes?.super_admin;
  const isRhAdmin = perfil?.cargo?.permissoes?.rh_admin || isSuperAdmin;

  // Determinar se deve mostrar menu de RH baseado no modo de visualização
  const showRhMenu = viewMode === "super_admin" ? isSuperAdmin : viewMode === "rh" ? isRhAdmin : false;
  const showAdminMenu = viewMode === "super_admin" ? isSuperAdmin : false;

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: `/c/${params.tenant_slug}/portal` },
    { label: "Minhas Férias", icon: Calendar, href: `/c/${params.tenant_slug}/portal/ferias` },
    { label: "Contracheques", icon: FileText, href: `/c/${params.tenant_slug}/portal/contracheques` },
    { label: "Benefícios", icon: Heart, href: `/c/${params.tenant_slug}/portal/beneficios` },
    { label: "Manual do Colaborador", icon: BookOpen, href: `/c/${params.tenant_slug}/portal/manual` },
  ];

  const adminItems = [
    { label: "Painel do RH", icon: ShieldCheck, href: `/c/${params.tenant_slug}/portal/admin` },
    { label: "Colaboradores", icon: Users, href: `/c/${params.tenant_slug}/portal/admin/colaboradores` },
    { label: "Férias (Gestão)", icon: Calendar, href: `/c/${params.tenant_slug}/portal/admin/ferias` },
    { label: "Contracheques (Upload)", icon: FileText, href: `/c/${params.tenant_slug}/portal/admin/contracheques` },
    { label: "Benefícios (Gestão)", icon: Heart, href: `/c/${params.tenant_slug}/portal/admin/beneficios` },
    { label: "Pesquisas de Clima", icon: BarChart3, href: `/c/${params.tenant_slug}/portal/admin/pesquisas` },
    { label: "Manuais (Edição)", icon: BookOpen, href: `/c/${params.tenant_slug}/portal/admin/manual` },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-indigo-600">RGA People</h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">
            {params.tenant_slug}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Meu Portal
          </p>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors group"
            >
              <item.icon className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}

          {showRhMenu && (
            <div className="pt-4 mt-4 border-t border-gray-100 space-y-1">
              <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Administração RH
              </p>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors group"
                >
                  <item.icon className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {showAdminMenu && (
            <div className="pt-4 mt-4 border-t border-gray-100">
              <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Gestão Global
              </p>
              <Link
                href={`/c/${params.tenant_slug}/portal/admin/empresas`}
                className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors group"
              >
                <Building2 className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                <span className="font-medium">Empresas (Tenants)</span>
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0 space-y-2">
          {isSuperAdmin && (
            <ViewModeSelector
              currentMode={viewMode}
              onModeChange={setViewMode}
              isSuperAdmin={isSuperAdmin}
            />
          )}
          
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              {perfil?.nome_completo?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {perfil?.nome_completo}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {perfil?.cargo?.nome}
              </p>
            </div>
          </div>
          
          <form action="/auth/signout" method="post">
            <button className="flex items-center gap-3 w-full px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors group">
              <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
              <span className="font-medium">Sair</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
