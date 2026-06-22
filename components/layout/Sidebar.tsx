import Link from "next/link";
import { Home, User, Briefcase, DollarSign, Clock, BarChart, BookOpen } from "lucide-react";

interface SidebarProps {
  tenantSlug: string;
}

export default function Sidebar({ tenantSlug }: SidebarProps) {
  const navItems = [
    { href: `/c/${tenantSlug}/portal`, icon: Home, label: "Dashboard" },
    { href: `/c/${tenantSlug}/portal/perfil`, icon: User, label: "Meu Perfil" },
    { href: `/c/${tenantSlug}/portal/financeiro`, icon: DollarSign, label: "Financeiro" },
    { href: `/c/${tenantSlug}/portal/ponto`, icon: Clock, label: "Ponto e Ausências" },
    { href: `/c/${tenantSlug}/portal/carreira`, icon: Briefcase, label: "Carreira" },
    { href: `/c/${tenantSlug}/portal/treinamentos`, icon: BookOpen, label: "Treinamentos" },
    { href: `/c/${tenantSlug}/portal/rh-admin`, icon: BarChart, label: "Painel RH" },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col">
      <div className="text-2xl font-bold mb-8">Portal RGA</div>
      <nav className="flex-1">
        <ul>
          {navItems.map((item) => (
            <li key={item.href} className="mb-2">
              <Link href={item.href} className="flex items-center p-2 rounded-md hover:bg-gray-700">
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
