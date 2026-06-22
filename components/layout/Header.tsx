import { Menu } from "lucide-react";
import UserNav from "./UserNav";

interface HeaderProps {
  empresaNome: string;
  onMenuClick: () => void;
}

export default function Header({ empresaNome, onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm p-4 flex items-center justify-between">
      <div className="flex items-center">
        <button onClick={onMenuClick} className="text-gray-600 mr-4 lg:hidden">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">{empresaNome}</h1>
      </div>
      <UserNav />
    </header>
  );
}
