"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plane,
  FileText,
  Award,
  Gift,
  Users,
  LogOut,
  MessageSquareHeart,
} from "lucide-react";

const navItems = [
  { href: "/portal", label: "Início", icon: LayoutDashboard },
  { href: "/portal/clima", label: "Pesquisa de Clima", icon: MessageSquareHeart },
  { href: "/portal/ferias", label: "Férias", icon: Plane },
  { href: "/portal/contracheques", label: "Contracheques", icon: FileText },
  { href: "/portal/avaliacao", label: "Avaliações", icon: Award },
  { href: "/portal/beneficios", label: "Benefícios", icon: Gift },
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
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col py-6 px-3 shrink-0">
        <div className="px-3 mb-8">
          <span className="text-xl font-bold text-gray-900">RGA People</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}

          <div className="mt-auto pt-4 border-t border-gray-100">
            <Link
              href={`${base}/admin`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <Users className="w-4 h-4 shrink-0" />
              Admin RH
            </Link>
            <form action={`/api/auth/signout`} method="post">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sair
              </button>
            </form>
          </div>
        </nav>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
