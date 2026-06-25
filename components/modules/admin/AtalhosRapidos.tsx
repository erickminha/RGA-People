import Link from "next/link";
import { 
  Users, 
  Calendar, 
  FileText, 
  Heart, 
  MessageSquareHeart, 
  Building2,
  BookOpen,
  ArrowRight
} from "lucide-react";

export default function AtalhosRapidos({ tenantSlug, isSuperAdmin }: { tenantSlug: string, isSuperAdmin?: boolean }) {
  const atalhos = [
    { label: "Colaboradores", icon: Users, href: `/c/${tenantSlug}/portal/admin/colaboradores`, color: "bg-indigo-50 text-indigo-600" },
    { label: "Documentos", icon: BookOpen, href: `/c/${tenantSlug}/portal/admin/documentos`, color: "bg-blue-50 text-blue-600" },
    { label: "Clima", icon: MessageSquareHeart, href: `/c/${tenantSlug}/portal/admin/clima`, color: "bg-rose-50 text-rose-600" },
    { label: "Férias", icon: Calendar, href: `/c/${tenantSlug}/portal/admin/ferias`, color: "bg-amber-50 text-amber-600" },
    { label: "Contracheques", icon: FileText, href: `/c/${tenantSlug}/portal/admin/contracheques`, color: "bg-emerald-50 text-emerald-600" },
    { label: "Benefícios", icon: Heart, href: `/c/${tenantSlug}/portal/admin/beneficios`, color: "bg-pink-50 text-pink-600" },
  ];

  if (isSuperAdmin) {
    atalhos.push({ label: "Empresas", icon: Building2, href: `/c/${tenantSlug}/portal/admin/empresas`, color: "bg-gray-50 text-gray-600" });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {atalhos.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-indigo-100 transition-all group"
        >
          <div className={`p-3 rounded-lg ${a.color} mb-3 group-hover:scale-110 transition-transform`}>
            <a.icon className="w-6 h-6" />
          </div>
          <span className="text-sm font-semibold text-gray-700">{a.label}</span>
          <ArrowRight className="w-3 h-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      ))}
    </div>
  );
}
