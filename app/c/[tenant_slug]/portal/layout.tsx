import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Heart, 
  BookOpen, 
  ShieldCheck, 
  Building2,
  LogOut 
} from "lucide-react";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant_slug: string };
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/c/${params.tenant_slug}/login`);
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("*, cargo:cargos(*)")
    .eq("id", session.user.id)
    .single();

  const isRhAdmin = perfil?.cargo?.permissoes?.rh_admin || perfil?.cargo?.permissoes?.super_admin;
  const isSuperAdmin = perfil?.cargo?.permissoes?.super_admin;

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: `/c/${params.tenant_slug}/portal` },
    { label: "Minhas Férias", icon: Calendar, href: `/c/${params.tenant_slug}/portal/ferias` },
    { label: "Contracheques", icon: FileText, href: `/c/${params.tenant_slug}/portal/contracheques` },
    { label: "Benefícios", icon: Heart, href: `/c/${params.tenant_slug}/portal/beneficios` },
    { label: "Manual do Colaborador", icon: BookOpen, href: `/c/${params.tenant_slug}/portal/manual` },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-indigo-600">RGA People</h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">
            {params.tenant_slug}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
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

          {isRhAdmin && (
            <div className="pt-4 mt-4 border-t border-gray-100">
              <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Administração RH
              </p>
              <Link
                href={`/c/${params.tenant_slug}/portal/admin`}
                className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors group"
              >
                <ShieldCheck className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                <span className="font-medium">Painel do RH</span>
              </Link>
            </div>
          )}

          {isSuperAdmin && (
            <div className="pt-2">
              <Link
                href={`/c/${params.tenant_slug}/portal/admin/empresas`}
                className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors group"
              >
                <Building2 className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                <span className="font-medium">Gestão de Empresas</span>
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
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
