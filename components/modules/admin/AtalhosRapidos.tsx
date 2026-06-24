import Link from "next/link";
import {
  UserPlus,
  MessageSquareHeart,
  FileUp,
  Gift,
  Plane,
  ArrowRight,
} from "lucide-react";

interface Props {
  tenantSlug: string;
}

export default function AtalhosRapidos({ tenantSlug }: Props) {
  const atalhos = [
    {
      href: `/c/${tenantSlug}/portal/admin/colaboradores?novo=1`,
      Icon: UserPlus,
      label: "Convidar colaborador",
      desc: "Envie convite por email",
      cor: "bg-indigo-600 hover:bg-indigo-700",
    },
    {
      href: `/c/${tenantSlug}/portal/admin/contracheques`,
      Icon: FileUp,
      label: "Contracheques",
      desc: "Subir / gerenciar PDFs",
      cor: "bg-emerald-600 hover:bg-emerald-700",
    },
    {
      href: `/c/${tenantSlug}/portal/admin/beneficios`,
      Icon: Gift,
      label: "Benefícios",
      desc: "Cadastrar parceiros",
      cor: "bg-rose-600 hover:bg-rose-700",
    },
    {
      href: `/c/${tenantSlug}/portal/admin/ferias`,
      Icon: Plane,
      label: "Histórico de Férias",
      desc: "Ver todas as solicitações",
      cor: "bg-amber-600 hover:bg-amber-700",
    },
  ];

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
        Ações rápidas
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {atalhos.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`group flex items-center gap-3 p-4 rounded-xl text-white transition-all shadow-sm hover:shadow-md ${a.cor}`}
          >
            <div className="p-2 bg-white/20 rounded-lg">
              <a.Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{a.label}</div>
              <div className="text-xs text-white/80">{a.desc}</div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
          </Link>
        ))}
      </div>
    </section>
  );
}
