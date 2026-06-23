"use client";

import { Check } from "lucide-react";

interface Step {
  label: string;
  description: string;
}

interface Props {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: Props) {
  return (
    <nav aria-label="Progresso" className="mb-8">
      <ol className="flex items-center justify-between gap-2">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <li
              key={step.label}
              className="flex-1 flex flex-col items-center relative"
            >
              {/* Linha conectora */}
              {idx > 0 && (
                <div
                  className={`absolute top-4 right-1/2 w-full h-0.5 -z-10 ${
                    isCompleted || isActive
                      ? "bg-violet-600"
                      : "bg-gray-200"
                  }`}
                />
              )}

              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  isCompleted
                    ? "bg-violet-600 text-white"
                    : isActive
                    ? "bg-violet-600 text-white ring-4 ring-violet-100"
                    : "bg-gray-100 text-gray-400 border border-gray-200"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={`text-xs font-semibold ${
                    isActive || isCompleted
                      ? "text-violet-700"
                      : "text-gray-500"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-gray-400 hidden md:block">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
