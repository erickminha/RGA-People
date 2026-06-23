"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import StepIndicator from "./steps/StepIndicator";
import StepCompetencias from "./steps/StepCompetencias";
import StepMetas from "./steps/StepMetas";
import StepDesenvolvimento from "./steps/StepDesenvolvimento";
import StepRevisao from "./steps/StepRevisao";
import { enviarAutoAvaliacao } from "@/app/actions/avaliacao";
import type {
  CompetenciasInput,
  MetasInput,
  DesenvolvimentoInput,
  RevisaoInput,
} from "@/lib/schemas/avaliacao.schema";

interface Props {
  tenantSlug: string;
  periodo: string;
}

const STEPS = [
  { label: "Competências", description: "Comportamentos" },
  { label: "Metas", description: "Resultados" },
  { label: "Carreira", description: "Desenvolvimento" },
  { label: "Revisão", description: "Envio final" },
];

type FormData = Partial<
  CompetenciasInput & MetasInput & DesenvolvimentoInput & { nota_auto_avaliacao: number }
>;

export default function AutoAvaliacaoForm({ tenantSlug, periodo }: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [isPending, startTransition] = useTransition();
  const storageKey = `auto-avaliacao-${tenantSlug}-${periodo}`;

  // Hidrata rascunho ao montar
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed.data ?? {});
        setCurrentStep(parsed.step ?? 0);
        toast("📝 Rascunho restaurado", { duration: 2500 });
      } catch {
        /* ignore */
      }
    }
  }, [storageKey]);

  // Persiste a cada mudança
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ data: formData, step: currentStep })
      );
    }
  }, [formData, currentStep, storageKey]);

  const handleStep1 = (data: CompetenciasInput) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(1);
  };

  const handleStep2 = (data: MetasInput) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleStep3 = (data: DesenvolvimentoInput) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const handleSubmitFinal = (data: RevisaoInput) => {
    const payload = {
      ...formData,
      nota_auto_avaliacao: data.nota_auto_avaliacao,
    } as any;

    startTransition(async () => {
      const result = await enviarAutoAvaliacao(tenantSlug, periodo, payload);

      if (result.success) {
        localStorage.removeItem(storageKey);
        toast.success(result.message);
        router.push(`/c/${tenantSlug}/portal/avaliacao`);
        router.refresh();
      } else {
        toast.error(result.message);
        if (result.fieldErrors) {
          console.warn("Erros server-side:", result.fieldErrors);
        }
      }
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8">
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {currentStep === 0 && (
        <StepCompetencias
          defaultValues={formData as CompetenciasInput}
          onNext={handleStep1}
        />
      )}

      {currentStep === 1 && (
        <StepMetas
          defaultValues={formData as MetasInput}
          onNext={handleStep2}
          onBack={() => setCurrentStep(0)}
        />
      )}

      {currentStep === 2 && (
        <StepDesenvolvimento
          defaultValues={formData as DesenvolvimentoInput}
          onNext={handleStep3}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 3 && (
        <StepRevisao
          dadosCompletos={formData}
          onSubmit={handleSubmitFinal}
          onBack={() => setCurrentStep(2)}
          isPending={isPending}
        />
      )}

      {/* Indicador de auto-save */}
      <p className="text-[10px] text-gray-400 text-center mt-6 pt-4 border-t border-gray-100">
        💾 Seu progresso é salvo automaticamente no navegador
      </p>
    </div>
  );
}
