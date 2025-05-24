"use client";

import { useState } from "react";
import { Check, Crown, Sparkles, X } from "lucide-react";

import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: "pro" | "pro_exclusive") => Promise<void>;
  currentMembership?: "standard" | "pro" | "pro_exclusive";
}

export function UpgradeModal({
  isOpen,
  onClose,
  onUpgrade,
  currentMembership = "standard",
}: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: "pro" | "pro_exclusive") => {
    setIsLoading(plan);
    try {
      await onUpgrade(plan);
    } catch (error) {
      console.error("Upgrade failed:", error);
    } finally {
      setIsLoading(null);
    }
  };

  const plans = [
    {
      id: "pro" as const,
      name: "Pro",
      price: "$20",
      period: "/month",
      description:
        "Perfect for individuals who want to get more out of their searches",
      icon: <Crown className="h-5 w-5" />,
      features: [
        "Unlimited searches",
        "More visibility",
        "Advanced analytics",
        "Priority support",
      ],
      popular: true,
      disabled:
        currentMembership === "pro" || currentMembership === "pro_exclusive",
    },
    {
      id: "pro_exclusive" as const,
      name: "Pro Exclusive",
      price: "$69",
      period: "/month",
      description: "69 plan",
      icon: <Sparkles className="h-5 w-5" />,
      features: [
        "Unlimited searches",
        "More visibility",
        "Advanced analytics",
        "Priority support",
        "White-label options",
        "Dedicated account manager",
        "Notebook",
      ],
      popular: false,
      disabled: currentMembership === "pro_exclusive",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                Upgrade Your Plan
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                Choose the plan that fits your needs
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg border p-4 ${
                plan.popular ? "border-2" : "border"
              } ${plan.disabled ? "opacity-60" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-2 left-4">
                  <span className="rounded bg-foreground px-2 py-0.5 text-xs font-medium text-background">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-3 flex items-center gap-2">
                {plan.icon}
                <h3 className="font-semibold">{plan.name}</h3>
              </div>

              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">
                    {plan.period}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <Button
                onClick={() => handleUpgrade(plan.id)}
                disabled={plan.disabled || isLoading !== null}
                variant={plan.disabled ? "outline" : undefined}
                className="mb-4 w-full"
              >
                {isLoading === plan.id ? (
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                    Processing...
                  </div>
                ) : plan.disabled ? (
                  currentMembership === plan.id ? (
                    "Current Plan"
                  ) : (
                    "Not Available"
                  )
                ) : (
                  `Upgrade to ${plan.name}`
                )}
              </Button>

              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-3 w-3 flex-shrink-0" />
                    <span className="text-xs">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            30-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
