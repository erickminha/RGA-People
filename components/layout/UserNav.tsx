import { createClient } from "@/lib/supabase/client";
import { User, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserNav() {
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className="flex items-center space-x-4">
      <Link href="/profile" className="flex items-center text-gray-600 hover:text-gray-900">
        <User className="w-5 h-5 mr-2" />
        <span>Meu Perfil</span>
      </Link>
      <button onClick={handleSignOut} className="flex items-center text-red-600 hover:text-red-800">
        <LogOut className="w-5 h-5 mr-2" />
        <span>Sair</span>
      </button>
    </div>
  );
}
