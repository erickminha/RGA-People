"use client";

import { useState } from "react";
import { Shield, Users, Eye, EyeOff } from "lucide-react";

type ViewMode = "super_admin" | "rh" | "colaborador";

interface ViewModeSelectorProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  isSuperAdmin: boolean;
}

export default function ViewModeSelector({
  currentMode,
  onModeChange,
  isSuperAdmin,
}: ViewModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isSuperAdmin) return null;

  const modes = [
    { id: "super_admin", label: "Visão Super Admin", icon: Shield, color: "text-purple-600" },
    { id: "rh", label: "Visão RH", icon: Users, color: "text-blue-600" },
    { id: "colaborador", label: "Visão Colaborador", icon: Eye, color: "text-green-600" },
  ] as const;

  const selectedMode = modes.find((m) => m.id === currentMode);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {selectedMode && <selectedMode.icon className={`w-4 h-4 ${selectedMode.color}`} />}
        <span>{selectedMode?.label}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Modo de Visualização
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Simule diferentes perfis para validar a experiência
            </p>
          </div>

          <div className="p-2 space-y-1">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  onModeChange(mode.id);
                  setIsOpen(false);
                  // Salvar preferência em localStorage
                  localStorage.setItem("viewMode", mode.id);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  currentMode === mode.id
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <mode.icon className={`w-4 h-4 ${mode.color}`} />
                <div>
                  <p className="text-sm font-medium">{mode.label}</p>
                  <p className="text-xs text-gray-400">
                    {mode.id === "super_admin" && "Acesso total ao sistema"}
                    {mode.id === "rh" && "Gestão de pessoas e dados"}
                    {mode.id === "colaborador" && "Visão pessoal apenas"}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-gray-100 bg-amber-50">
            <p className="text-xs text-amber-700 flex items-start gap-2">
              <EyeOff className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Modo de visualização é apenas para você. Outros usuários não são afetados.</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
