import React from "react";

import { cn } from "@acme/ui";

interface OnboardingStepperProps {
  currentStep: string;
}

const steps = [
  { id: "name", label: "Location" },
  { id: "location", label: "Story" },
  { id: "story", label: "Photo" },
  { id: "image", label: "Complete" },
];

export function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
  // Find the current step index
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  // For "complete" step, we want to show all steps as completed
  const activeStepIndex =
    currentStep === "complete" ? steps.length - 1 : currentStepIndex;

  // Calculate completed steps (including initial step)
  const completedSteps = activeStepIndex + 1;
  const totalSteps = 5; // Including the initial step that was removed from display

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-4">
      {/* Top row with corner text */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-muted-foreground">go through the door</span>
        <span className="text-muted-foreground">
          {completedSteps}/{totalSteps} complete
        </span>
      </div>

      {/* Progress lines */}
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isActive = index <= activeStepIndex;

          return (
            <div
              key={step.id}
              className={cn(
                "h-[2px] flex-1 transition-all duration-300",
                isActive ? "bg-primary" : "bg-muted",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
