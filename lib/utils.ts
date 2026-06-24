import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes condicionais (clsx) e resolve conflitos do Tailwind
 * (tailwind-merge). Padrão de mercado para composição de UI com Tailwind.
 *
 * @example cn("px-2", condicao && "px-4") // => "px-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
