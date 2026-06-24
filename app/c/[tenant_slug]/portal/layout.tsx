"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plane,
  FileText,
  Award,
  Gift,
  ShieldCheck,
  LogOut,
  MessageSquareHeart,
  BookOpen,
} from "lucide-react";

const navItems = [
  { href: "/portal", label: "Início", icon: LayoutDashboard },
  { href: "/portal/clima", label: "Pesquisa de Clima", icon: MessageSquareHeart },
  { href: "/portal/ferias", label: "Férias", icon: Plane },
  { href: "/portal/contracheques", label: "Contracheques", icon: FileText },
  { href: "/portal/avaliacao", label: "Avaliações", icon: Award },
  { href: "/portal/beneficios", label: "Benefícios", icon: Gift },
  { href: "/portal/manual", label: "Manual / Cultura", icon: BookOpen },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const slug = params?.tenant_slug as string;
  const base = `/c/${slug}`;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col py-6 px-4 shrink-0 shadow-sm">
        <div className="px-2 mb-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">RGA People</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Menu Principal
          </div>
          {navItems.map(({ href, label, icon: Icon }) => {
            const fullHref = `${base}${href}`;
            const active =
              href === "/portal"
                ? pathname === fullHref
                : pathname.startsWith(fullHref);

            return (
              <Link
                key={href}
                href={fullHref}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? "text-blue-600" : "text-gray-400"}`} />
                {label}
              </Link>
            );
          })}

          <div className="mt-8">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Administração
            </div>
            <Link
              href={`${base}/portal/admin`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname.includes('/admin')
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <ShieldCheck className={`w-4 h-4 shrink-0 ${pathname.includes('/admin') ? "text-indigo-600" : "text-gray-400"}`} />
              Painel do RH
            </Link>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100">
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sair
              </button>
            </form>
          </div>
        </nav>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-auto bg-gray-50/50">
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
